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
import { teams, eventAgeGroups, events, eventSettings } from '../../db/schema';
import * as schema from '../../db/schema';
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
router.get('/template', async (req: Request, res: Response) => {
  try {
    // Check if eventId is provided as query parameter to customize the template
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : null;
    
    if (eventId) {
      // Fetch age groups for this event to help users fill out the CSV correctly
      const eventAgeGroupsData = await db
        .select()
        .from(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, String(eventId)));
      
      if (eventAgeGroupsData.length === 0) {
        return res.status(400).json({ error: 'No age groups found for this event' });
      }
      
      // Create a dynamic CSV template with available age groups in the examples
      const headers = 'Team Name,Head Coach Name,Head Coach Email,Head Coach Phone,Manager Name,Manager Email,Manager Phone,Club Name,Age Group,Submitter Name,Submitter Email';
      
      // Create examples using the actual age groups from the event
      const example1 = `Sample Team 1,John Doe,coach@example.com,555-123-4567,Jane Smith,manager@example.com,555-987-6543,FC United,${eventAgeGroupsData[0].ageGroup} ${eventAgeGroupsData[0].gender},Admin User,admin@example.com`;
      
      // Use another age group for the second example if available
      const ageGroup2 = eventAgeGroupsData.length > 1 ? eventAgeGroupsData[1] : eventAgeGroupsData[0];
      const example2 = `Sample Team 2,Mary Johnson,mjohnson@example.com,555-333-2222,Bob Williams,bwilliams@example.com,555-444-1111,Soccer Stars,${ageGroup2.ageGroup} ${ageGroup2.gender},Admin User,admin@example.com`;
      
      // Create the CSV content
      const csvContent = `${headers}\n${example1}\n${example2}`;
      
      // Set proper headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="team-import-template.csv"');
      
      // Send the dynamic CSV content
      return res.send(csvContent);
    }
    
    // If no eventId provided, send the static template
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

    // First get the event to determine its seasonal scope ID
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, Number(eventId)))
      .limit(1);
    
    if (!eventData) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get the seasonal scope ID from event settings
    let seasonalScopeId = null;
    const [seasonalScopeSetting] = await db
      .select()
      .from(eventSettings)
      .where(
        and(
          eq(eventSettings.eventId, String(eventId)),
          eq(eventSettings.settingKey, 'seasonalScopeId')
        )
      )
      .limit(1);
    
    if (seasonalScopeSetting) {
      seasonalScopeId = parseInt(seasonalScopeSetting.settingValue);
      console.log(`Using seasonal scope ID ${seasonalScopeId} for event ${eventId}`);
    } else {
      console.log(`No seasonal scope found for event ${eventId}`);
    }
    
    // Get age groups for this event to validate age group names
    const eventAgeGroupsData = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, String(eventId)));

    if (eventAgeGroupsData.length === 0) {
      return res.status(400).json({ error: 'No age groups found for this event' });
    }
    
    // Create a mapping of age group objects 
    const ageGroups: { [key: string]: { id: number, divisionCode?: string, birthYear?: number } } = {};
    
    // Get division codes and birth years from the seasonal scope if available
    let ageGroupSettings = [];
    if (seasonalScopeId) {
      ageGroupSettings = await db
        .select()
        .from(schema.ageGroupSettings)
        .where(eq(schema.ageGroupSettings.seasonalScopeId, seasonalScopeId));
      
      console.log(`Found ${ageGroupSettings.length} age group settings in the seasonal scope`);
    }
    
    // Create a mapping of seasonal scope age groups to division codes and birth years
    const scopeSettings: { [key: string]: { divisionCode: string, birthYear: number } } = {};
    ageGroupSettings.forEach(setting => {
      const key = `${setting.ageGroup} ${setting.gender}`;
      scopeSettings[key] = {
        divisionCode: setting.divisionCode,
        birthYear: setting.birthYear
      };
    });
    
    // Create the final age group mapping
    eventAgeGroupsData.forEach(group => {
      // Store the age group with the combined format that includes gender ("U8 Boys")
      const fullAgeGroupName = `${group.ageGroup} ${group.gender}`;
      ageGroups[fullAgeGroupName] = { 
        id: group.id,
        divisionCode: group.divisionCode || undefined,
        birthYear: group.birthYear || undefined
      };
      
      // If seasonal scope settings exist for this age group, use them
      if (scopeSettings[fullAgeGroupName]) {
        ageGroups[fullAgeGroupName].divisionCode = scopeSettings[fullAgeGroupName].divisionCode;
        ageGroups[fullAgeGroupName].birthYear = scopeSettings[fullAgeGroupName].birthYear;
      }
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
      // Check if the age group exists in our mapping
      if (!ageGroups[team.ageGroup]) {
        invalidAgeGroups.push({ 
          record: team, 
          error: `Age group "${team.ageGroup}" does not exist in this event` 
        });
        continue;
      }

      const ageGroupInfo = ageGroups[team.ageGroup];
      
      // Define the type of our team data with optional fields
      type TeamInsertData = {
        eventId: string | number;
        ageGroupId: number;
        name: string;
        coach: string;
        managerName: string | null;
        managerEmail: string | null;
        managerPhone: string | null;
        clubName: string | null;
        submitterName: string | null;
        submitterEmail: string | null;
        status: string;
        createdAt: string;
        divisionCode?: string;
        birthYear?: number;
      };
      
      // Prepare team data for insertion with proper typing
      const teamData: TeamInsertData = {
        eventId,
        ageGroupId: ageGroupInfo.id,
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
      };
      
      // Add division code and birth year if available from the seasonal scope
      if (ageGroupInfo.divisionCode) {
        teamData.divisionCode = ageGroupInfo.divisionCode;
        console.log(`Using division code ${ageGroupInfo.divisionCode} for team ${team.name}`);
      }
      
      if (ageGroupInfo.birthYear) {
        teamData.birthYear = ageGroupInfo.birthYear;
        console.log(`Using birth year ${ageGroupInfo.birthYear} for team ${team.name}`);
      }
      
      teamsToInsert.push(teamData);
    }

    if (invalidAgeGroups.length > 0) {
      // Create a message with all available age groups to help the user
      const availableAgeGroups = Object.keys(ageGroups).join(', ');
      
      return res.status(400).json({
        error: `Some records contain invalid age groups. Valid age groups for this event are: ${availableAgeGroups}`,
        invalidAgeGroups,
        validCount: teamsToInsert.length,
        totalCount: validTeams.length,
        availableAgeGroups: Object.keys(ageGroups)
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