/**
 * CSV Upload Routes
 * Handles file uploads for importing player data from CSV files
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';
import { players } from '../../db/schema';

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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jerseyNumber: z.string().regex(/^\d{1,2}$/, "Jersey number must be 1-2 digits").optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  position: z.string().optional(),
  medicalNotes: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().email("Invalid email").optional(),
  parentGuardianPhone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
});

type PlayerData = z.infer<typeof playerSchema>;

// Route for downloading player roster template
router.get('/template', (req: Request, res: Response) => {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'player-roster-template.csv');
    const fileContent = fs.readFileSync(templatePath, 'utf8');
    
    // Set proper headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="player-roster-template.csv"');
    
    // Send the file content
    res.send(fileContent);
  } catch (error) {
    console.error('Error serving CSV template:', error);
    res.status(500).send('Failed to generate CSV template');
  }
});

// Route for uploading player roster CSV
router.post('/players', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
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

    // Map CSV field names to our schema field names
    const mappedRecords = records.map(record => {
      // Map from CSV headers to our player schema
      return {
        id: uuidv4(), // Generate a unique ID for each player
        firstName: record['First Name'],
        lastName: record['Last Name'],
        jerseyNumber: record['Jersey Number'] || undefined,
        dateOfBirth: record['Date of Birth'],
        position: record['Position'] || undefined,
        medicalNotes: record['Medical Notes'] || undefined,
        parentGuardianName: record['Parent/Guardian Name'] || undefined,
        parentGuardianEmail: record['Parent/Guardian Email'] || undefined,
        parentGuardianPhone: record['Parent/Guardian Phone'] || undefined,
        emergencyContactName: record['Emergency Contact Name'],
        emergencyContactPhone: record['Emergency Contact Phone'],
      };
    });

    // Validate each player record
    const validPlayers: PlayerData[] = [];
    const invalidRecords: { index: number; record: any; errors: string[] }[] = [];

    mappedRecords.forEach((record, index) => {
      const result = playerSchema.safeParse(record);
      if (result.success) {
        validPlayers.push({ 
          ...result.data,
          id: record.id // Keep the UUID we generated
        });
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

    // If all records are valid, return the valid players
    return res.status(200).json({
      message: 'CSV file processed successfully',
      players: validPlayers,
      count: validPlayers.length,
    });
  } catch (error: any) {
    console.error('Error processing CSV upload:', error);
    return res.status(500).json({
      error: 'Failed to process CSV file',
      details: error.message,
    });
  }
});

// Route for admin CSV upload (for team player import)
router.post('/csv-admin', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { teamId } = req.body;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
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

    // Transform records to player objects for database insert
    const playersToInsert = records.map((record) => {
      // Map CSV fields to database fields
      return {
        teamId: parseInt(teamId),
        firstName: record.firstName || record['First Name'] || '',
        lastName: record.lastName || record['Last Name'] || '',
        dateOfBirth: record.dateOfBirth || record['Date of Birth'] || '',
        jerseyNumber: record.jerseyNumber || record['Jersey Number'] 
          ? parseInt(record.jerseyNumber || record['Jersey Number']) 
          : null,
        position: record.position || record['Position'] || '',
        medicalNotes: record.notes || record['Notes'] || '',
        emergencyContactName: record.emergencyContactName || record['Emergency Contact Name'] || 'Not Provided',
        emergencyContactPhone: record.emergencyContactPhone || record['Emergency Contact Phone'] || 'Not Provided',
        parentGuardianName: record.parentGuardianName || record['Parent/Guardian Name'] || '',
        parentGuardianEmail: record.parentGuardianEmail || record['Parent/Guardian Email'] || '',
        parentGuardianPhone: record.parentGuardianPhone || record['Parent/Guardian Phone'] || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Delete any existing players for this team first to avoid duplicates
    await db.delete(players).where(({ teamId: dbTeamId }) => dbTeamId.eq(parseInt(teamId)));
    
    console.log(`Deleted existing players for team ${teamId}`);
    
    // Insert the new players into the database
    const insertedPlayers = await db.insert(players).values(playersToInsert).returning();
    
    console.log(`Inserted ${insertedPlayers.length} players for team ${teamId}`);

    return res.status(200).json({
      message: 'CSV file processed successfully',
      players: insertedPlayers,
      count: insertedPlayers.length,
    });
  } catch (error: any) {
    console.error('Error processing admin CSV upload:', error);
    return res.status(500).json({
      error: 'Failed to process CSV file',
      details: error.message,
    });
  }
});

export default router;