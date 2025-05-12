import { Router } from "express";
import { db } from "@db";
import { players, teams, insertPlayerSchema, selectPlayerSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Input validation schema for player data
const playerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  jerseyNumber: z.string().optional(),
  position: z.string().optional(),
  medicalNotes: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().optional(),
  parentGuardianPhone: z.string().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  isActive: z.boolean().default(true),
});

// GET /api/admin/teams/:teamId/players - Get all players for a team
router.get('/:teamId/players', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get players for the team
    const playersList = await db.query.players.findMany({
      where: eq(players.teamId, teamId)
    });
    
    return res.json(playersList);
  } catch (error) {
    console.error('Error fetching players:', error);
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// POST /api/admin/teams/:teamId/players - Add a player to a team
router.post('/:teamId/players', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerData = req.body;
    
    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Validate player data
    try {
      playerSchema.parse(playerData);
    } catch (error: any) {
      return res.status(400).json({ error: error.errors || 'Invalid player data' });
    }
    
    // Process jersey number - convert to number or null if empty
    const processedPlayerData = {
      ...playerData,
      // Convert jersey number to integer if it's a non-empty string, otherwise set to null
      jerseyNumber: playerData.jerseyNumber && playerData.jerseyNumber !== '' 
        ? parseInt(playerData.jerseyNumber) 
        : null
    };
    
    // Insert the player
    const newPlayer = await db.insert(players).values({
      ...processedPlayerData,
      teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    
    return res.status(201).json(newPlayer[0]);
  } catch (error) {
    console.error('Error adding player:', error);
    return res.status(500).json({ error: 'Failed to add player' });
  }
});

// PUT /api/admin/teams/:teamId/players/:playerId - Update a player
router.put('/:teamId/players/:playerId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    const playerData = req.body;
    
    // Verify team exists and player belongs to team
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId)
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.teamId !== teamId) {
      return res.status(403).json({ error: 'Player does not belong to this team' });
    }
    
    // Validate player data
    try {
      playerSchema.parse(playerData);
    } catch (error: any) {
      return res.status(400).json({ error: error.errors || 'Invalid player data' });
    }
    
    // Process jersey number - convert to number or null if empty
    const processedPlayerData = {
      ...playerData,
      // Convert jersey number to integer if it's a non-empty string, otherwise set to null
      jerseyNumber: playerData.jerseyNumber && playerData.jerseyNumber !== '' 
        ? parseInt(playerData.jerseyNumber) 
        : null
    };
    
    // Update the player
    const updatedPlayer = await db.update(players)
      .set({
        ...processedPlayerData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(players.id, playerId))
      .returning();
    
    return res.json(updatedPlayer[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    return res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE /api/admin/teams/:teamId/players/:playerId - Delete a player
router.delete('/:teamId/players/:playerId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    
    // Verify player exists and belongs to team
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId)
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.teamId !== teamId) {
      return res.status(403).json({ error: 'Player does not belong to this team' });
    }
    
    // Delete the player
    await db.delete(players).where(eq(players.id, playerId));
    
    return res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;