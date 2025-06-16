/**
 * Member Roster Upload Routes
 * Handles roster uploads for teams that were registered with "add roster later" option
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import { players, teams } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { validateAuth } from '../middleware/auth';

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Create a router
const router = Router();

// Define the player schema to validate CSV data
const playerSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jerseyNumber: z.coerce.number().int().min(0).max(99).optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  medicalNotes: z.string().optional(),
  emergencyContactFirstName: z.string().min(1, "Emergency contact first name is required"),
  emergencyContactLastName: z.string().min(1, "Emergency contact last name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
});

type PlayerData = z.infer<typeof playerSchema>;

// Get teams that belong to the current user and need rosters
router.get('/my-teams', validateAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    
    // Find teams that either:
    // 1. Were registered with addRosterLater = true and don't have rosters yet
    // 2. Have no players but were registered by this user (based on email)
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        eventId: teams.eventId,
        ageGroupId: teams.ageGroupId,
        addRosterLater: teams.addRosterLater,
        initialRosterComplete: teams.initialRosterComplete,
        rosterUploadedAt: teams.rosterUploadedAt,
        rosterUploadMethod: teams.rosterUploadMethod,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .where(
        and(
          eq(teams.submitterEmail, userEmail),
          eq(teams.addRosterLater, true)
        )
      );

    // Get player counts for each team
    const teamsWithPlayerCounts = await Promise.all(
      userTeams.map(async (team) => {
        const playerCount = await db
          .select({ count: players.id })
          .from(players)
          .where(eq(players.teamId, team.id));
          
        return {
          ...team,
          playerCount: playerCount.length,
          needsRoster: !team.initialRosterComplete || playerCount.length === 0
        };
      })
    );

    return res.status(200).json({
      teams: teamsWithPlayerCounts.filter(team => team.needsRoster)
    });
  } catch (error: any) {
    console.error('Error fetching user teams:', error);
    return res.status(500).json({
      error: 'Failed to fetch teams',
      details: error.message,
    });
  }
});

// Upload roster for a specific team
router.post('/teams/:teamId/roster', validateAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { teamId } = req.params;
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Verify the team belongs to the user and needs a roster
    const [team] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.submitterEmail, userEmail)
        )
      )
      .limit(1);

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    if (!team.addRosterLater) {
      return res.status(400).json({ error: 'This team was not registered for later roster upload' });
    }

    // Parse the CSV file
    const records: any[] = [];
    const parser = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const record of parser) {
      records.push(record);
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has invalid format' });
    }

    // Map CSV field names to our schema field names
    const mappedRecords = records.map(record => {
      return {
        id: uuidv4(),
        firstName: record['First Name'],
        lastName: record['Last Name'],
        jerseyNumber: record['Jersey Number'] || undefined,
        dateOfBirth: record['Date of Birth'],
        medicalNotes: record['Notes'] || undefined,
        emergencyContactFirstName: record['Emergency Contact First Name'],
        emergencyContactLastName: record['Emergency Contact Last Name'],
        emergencyContactPhone: record['Emergency Contact Phone'],
      };
    });

    // Validate each player record
    const validPlayers: PlayerData[] = [];
    const invalidRecords: { index: number; record: any; errors: string[] }[] = [];

    mappedRecords.forEach((record, index) => {
      const result = playerSchema.safeParse(record);
      if (result.success) {
        validPlayers.push(result.data);
      } else {
        invalidRecords.push({
          index,
          record,
          errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        });
      }
    });

    // If there are any validation errors, return them to the client
    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: 'Some records failed validation',
        invalidRecords,
        validCount: validPlayers.length,
        totalCount: records.length,
      });
    }

    // Convert player data to database format and insert
    const playersToInsert = validPlayers.map(player => ({
      teamId: parseInt(teamId),
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber,
      dateOfBirth: player.dateOfBirth,
      medicalNotes: player.medicalNotes,
      emergencyContactFirstName: player.emergencyContactFirstName,
      emergencyContactLastName: player.emergencyContactLastName,
      emergencyContactPhone: player.emergencyContactPhone,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    console.log(`Adding ${playersToInsert.length} players to team ${teamId} via member upload`);
    
    // Insert the new players and update team roster tracking
    const insertedPlayers = await db.transaction(async (tx) => {
      // Insert players
      const players = await tx.insert(players).values(playersToInsert).returning();
      
      // Update team roster tracking
      await tx
        .update(teams)
        .set({
          initialRosterComplete: true,
          rosterUploadedAt: new Date(),
          rosterUploadMethod: 'csv_upload'
        })
        .where(eq(teams.id, parseInt(teamId)));
      
      return players;
    });
    
    console.log(`Successfully uploaded roster for team ${teamId}: ${insertedPlayers.length} players`);

    return res.status(200).json({
      message: 'Roster uploaded successfully',
      players: insertedPlayers,
      count: insertedPlayers.length,
    });
  } catch (error: any) {
    console.error('Error processing member roster upload:', error);
    return res.status(500).json({
      error: 'Failed to process roster upload',
      details: error.message,
    });
  }
});

// Add individual player to team
router.post('/teams/:teamId/players', validateAuth, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    
    // Verify the team belongs to the user
    const [team] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.submitterEmail, userEmail)
        )
      )
      .limit(1);

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    if (!team.addRosterLater) {
      return res.status(400).json({ error: 'This team was not registered for later roster upload' });
    }

    // Validate player data
    const playerData = req.body;
    const result = playerSchema.safeParse({
      id: uuidv4(),
      ...playerData
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid player data',
        details: result.error.errors
      });
    }

    // Insert the player
    const newPlayer = await db.transaction(async (tx) => {
      const [player] = await tx
        .insert(players)
        .values({
          teamId: parseInt(teamId),
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          jerseyNumber: result.data.jerseyNumber,
          dateOfBirth: result.data.dateOfBirth,
          medicalNotes: result.data.medicalNotes,
          emergencyContactFirstName: result.data.emergencyContactFirstName,
          emergencyContactLastName: result.data.emergencyContactLastName,
          emergencyContactPhone: result.data.emergencyContactPhone,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
        .returning();

      // Update team roster tracking if this is the first player
      const playerCount = await tx
        .select({ count: players.id })
        .from(players)
        .where(eq(players.teamId, parseInt(teamId)));

      if (playerCount.length === 1 && !team.initialRosterComplete) {
        await tx
          .update(teams)
          .set({
            initialRosterComplete: true,
            rosterUploadedAt: new Date(),
            rosterUploadMethod: 'manual_entry'
          })
          .where(eq(teams.id, parseInt(teamId)));
      }

      return player;
    });

    return res.status(201).json({
      message: 'Player added successfully',
      player: newPlayer
    });
  } catch (error: any) {
    console.error('Error adding player:', error);
    return res.status(500).json({
      error: 'Failed to add player',
      details: error.message,
    });
  }
});

// Get players for a specific team
router.get('/teams/:teamId/players', validateAuth, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userEmail = req.user!.email;
    
    // Verify the team belongs to the user
    const [team] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.submitterEmail, userEmail)
        )
      )
      .limit(1);

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Get all players for this team
    const teamPlayers = await db
      .select()
      .from(players)
      .where(eq(players.teamId, parseInt(teamId)));

    return res.status(200).json({
      players: teamPlayers
    });
  } catch (error: any) {
    console.error('Error fetching team players:', error);
    return res.status(500).json({
      error: 'Failed to fetch players',
      details: error.message,
    });
  }
});

export default router;