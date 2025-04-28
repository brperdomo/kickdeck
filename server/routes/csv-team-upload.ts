/**
 * CSV Team Upload Routes
 * Handles file uploads for importing team data from CSV files
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import * as z from 'zod';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';
import { teams, eventAgeGroups } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

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

// Define the team schema to validate CSV data
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  headCoachName: z.string().min(1, "Head coach name is required"),
  headCoachEmail: z.string().email("Valid head coach email is required"),
  headCoachPhone: z.string().min(1, "Head coach phone is required"),
  managerName: z.string().optional(),
  managerEmail: z.string().email("Valid manager email is required").optional(),
  managerPhone: z.string().optional(),
  clubName: z.string().optional(),
  ageGroup: z.string().min(1, "Age group is required"),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email("Valid submitter email is required").optional(),
});

type TeamData = z.infer<typeof teamSchema>;

// Route for downloading team import template
router.get('/template', (req: Request, res: Response) => {
  try {
    // Using direct file path for template
    const templatePath = path.join(process.cwd(), 'public', 'team-import-template.csv');
    
    // Set proper headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="team-import-template.csv"');
    
    // Send the file directly using fs.createReadStream to avoid any text encoding issues
    const fileStream = fs.createReadStream(templatePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving team CSV template:', error);
    res.status(500).send('Failed to generate team CSV template');
  }
});

// Route for uploading team CSV
router.post('/teams', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Get age groups for this event to validate age group names
    const eventAgeGroupsData = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    if (eventAgeGroupsData.length === 0) {
      return res.status(400).json({ error: 'No age groups found for this event' });
    }

    // Create a mapping of age group names to IDs
    const ageGroupMapping: { [key: string]: number } = {};
    eventAgeGroupsData.forEach(group => {
      ageGroupMapping[group.ageGroup] = group.id;
    });

    // Parse the CSV file
    const records: any[] = [];
    const parser = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const record of parser) {
      // Transform column names to match our schema
      const transformedRecord = {
        name: record['Team Name'],
        headCoachName: record['Head Coach Name'],
        headCoachEmail: record['Head Coach Email'],
        headCoachPhone: record['Head Coach Phone'],
        managerName: record['Manager Name'],
        managerEmail: record['Manager Email'],
        managerPhone: record['Manager Phone'],
        clubName: record['Club Name'],
        ageGroup: record['Age Group'],
        submitterName: record['Submitter Name'],
        submitterEmail: record['Submitter Email'],
      };
      records.push(transformedRecord);
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has invalid format' });
    }

    // Validate each record against our schema
    const validTeams: TeamData[] = [];
    const invalidRecords: { record: any; errors: string[] }[] = [];

    for (const record of records) {
      try {
        const validatedTeam = teamSchema.parse(record);
        validTeams.push(validatedTeam);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          invalidRecords.push({ record, errors: errorMessages });
        } else {
          throw error;
        }
      }
    }

    // If there are any validation errors, return them to the client
    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: 'Some records failed validation',
        invalidRecords,
        validCount: validTeams.length,
        totalCount: records.length,
      });
    }

    // Validate age groups
    const invalidAgeGroups: { record: any; error: string }[] = [];
    const teamsToInsert = [];

    for (const team of validTeams) {
      if (!ageGroupMapping[team.ageGroup]) {
        invalidAgeGroups.push({ 
          record: team, 
          error: `Age group "${team.ageGroup}" does not exist in this event` 
        });
        continue;
      }

      const ageGroupId = ageGroupMapping[team.ageGroup];
      
      // Prepare team data for insertion
      teamsToInsert.push({
        eventId,
        ageGroupId,
        name: team.name,
        coach: JSON.stringify({
          name: team.headCoachName,
          email: team.headCoachEmail,
          phone: team.headCoachPhone
        }),
        managerName: team.managerName || null,
        managerEmail: team.managerEmail || null,
        managerPhone: team.managerPhone || null,
        clubName: team.clubName || null,
        submitterName: team.submitterName || null,
        submitterEmail: team.submitterEmail || null,
        status: "registered",
        createdAt: new Date().toISOString(),
      });
    }

    if (invalidAgeGroups.length > 0) {
      return res.status(400).json({
        error: 'Some records contain invalid age groups',
        invalidAgeGroups,
        validCount: teamsToInsert.length,
        totalCount: validTeams.length,
      });
    }

    if (teamsToInsert.length === 0) {
      return res.status(400).json({ error: 'No valid teams to insert' });
    }

    // Insert the teams into the database
    const insertedTeams = await db.insert(teams).values(teamsToInsert).returning();
    
    console.log(`Inserted ${insertedTeams.length} teams for event ${eventId}`);

    return res.status(200).json({
      message: 'CSV file processed successfully',
      teams: insertedTeams,
      count: insertedTeams.length,
    });
  } catch (error: any) {
    console.error('Error processing team CSV upload:', error);
    return res.status(500).json({
      error: 'Failed to process CSV file',
      details: error.message,
    });
  }
});

export default router;