import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { db } from '../../../db';
import { games, teams, fields, complexes, eventAgeGroups, eventBrackets, gameTimeSlots } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

interface CSVRow {
  game_id?: string;
  date: string;
  time: string;
  field_name: string;
  home_team_id: string;
  home_team_name: string;
  away_team_id: string;
  away_team_name: string;
  age_group: string;
  flight: string;
  round?: string;
  duration?: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ImportPreview {
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  preview: any[];
  fieldMappings: { [key: string]: number };
  teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } };
}

interface ConflictCheck {
  gameId: string;
  conflicts: {
    type: 'field_overlap' | 'team_overlap';
    conflictWith: string;
    details: string;
  }[];
}

// CSV Import Preview Endpoint
router.post('/events/:eventId/import-games/preview', isAdmin, upload.single('csvFile'), async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    console.log(`📂 CSV Import Preview: Processing file ${req.file.originalname} for event ${eventId}`);

    // Parse CSV file
    const csvData: CSVRow[] = [];
    const errors: ValidationError[] = [];
    
    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    await new Promise<void>((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err);
        else {
          records.forEach((record: any, index: number) => csvData.push(record));
          resolve();
        }
      });
    });

    console.log(`📊 Parsed ${csvData.length} rows from CSV`);

    // Validate required fields and data
    const requiredFields = ['date', 'time', 'field_name', 'home_team_id', 'home_team_name', 'away_team_id', 'away_team_name', 'age_group', 'flight'];
    
    csvData.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field as keyof CSVRow] || String(row[field as keyof CSVRow]).trim() === '') {
          errors.push({
            row: index + 1,
            field,
            value: String(row[field as keyof CSVRow] || ''),
            message: `Required field '${field}' is missing or empty`
          });
        }
      });

      // Validate date format
      if (row.date && !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        errors.push({
          row: index + 1,
          field: 'date',
          value: row.date,
          message: 'Date must be in YYYY-MM-DD format'
        });
      }

      // Validate time format
      if (row.time && !/^\d{2}:\d{2}$/.test(row.time)) {
        errors.push({
          row: index + 1,
          field: 'time',
          value: row.time,
          message: 'Time must be in HH:MM format (24-hour)'
        });
      }
    });

    // Get existing field mappings
    const existingFields = await db
      .select({ id: fields.id, name: fields.name })
      .from(fields)
      .where(eq(fields.isOpen, true));
    
    const fieldMappings: { [key: string]: number } = {};
    const uniqueFieldsSet = new Set(csvData.map(row => row.field_name));
    const uniqueFields = Array.from(uniqueFieldsSet);
    
    uniqueFields.forEach(fieldName => {
      const existingField = existingFields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
      if (existingField) {
        fieldMappings[fieldName] = existingField.id;
      } else {
        fieldMappings[fieldName] = -1; // Needs to be created
      }
    });

    // Get existing team mappings
    const existingTeams = await db
      .select({ id: teams.id, name: teams.name, teamReferenceId: teams.teamReferenceId })
      .from(teams)
      .where(eq(teams.eventId, eventId.toString()));
    
    const teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } } = {};
    const uniqueTeamIdsSet = new Set([
      ...csvData.map(row => row.home_team_id),
      ...csvData.map(row => row.away_team_id)
    ]);
    const uniqueTeamIds = Array.from(uniqueTeamIdsSet);

    uniqueTeamIds.forEach(teamId => {
      const teamName = csvData.find(row => row.home_team_id === teamId || row.away_team_id === teamId);
      const displayName = teamId === (teamName?.home_team_id || teamName?.away_team_id) 
        ? (teamName?.home_team_name || teamName?.away_team_name || '')
        : '';

      const existingTeam = existingTeams.find(t => t.teamReferenceId === teamId);
      
      teamMappings[teamId] = {
        exists: !!existingTeam,
        teamId: existingTeam?.id,
        name: displayName
      };
    });

    // Create preview response
    const preview: ImportPreview = {
      totalRows: csvData.length,
      validRows: csvData.length - errors.filter(e => requiredFields.includes(e.field)).length,
      errors,
      preview: csvData.slice(0, 10), // First 10 rows for preview
      fieldMappings,
      teamMappings
    };

    console.log(`✅ Import Preview: ${preview.validRows}/${preview.totalRows} valid rows, ${errors.length} errors`);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(preview);

  } catch (error) {
    console.error('❌ CSV Import Preview Error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      const fs = require('fs');
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CSV Import Execution Endpoint
router.post('/events/:eventId/import-games/execute', isAdmin, upload.single('csvFile'), async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { 
      conflictCheckEnabled = true, 
      createMissingFields = false,
      createMissingTeams = false,
      teamMappings = {},
      fieldMappings = {} 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    console.log(`🚀 CSV Import Execute: Processing file ${req.file.originalname} for event ${eventId}`);
    console.log(`⚙️ Options: conflicts=${conflictCheckEnabled}, fields=${createMissingFields}, teams=${createMissingTeams}`);

    // Parse CSV file
    const csvData: CSVRow[] = [];
    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    await new Promise<void>((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err);
        else {
          records.forEach((record: any) => csvData.push(record));
          resolve();
        }
      });
    });

    const importResults = {
      gamesImported: 0,
      fieldsCreated: 0,
      teamsCreated: 0,
      conflicts: [] as ConflictCheck[],
      errors: [] as string[]
    };

    // Create missing fields if enabled
    const fieldIdMap: { [key: string]: number } = {};
    if (createMissingFields) {
      const uniqueFieldsSet = new Set(csvData.map(row => row.field_name));
      const uniqueFields = Array.from(uniqueFieldsSet);
      
      for (const fieldName of uniqueFields) {
        const existingField = await db.query.fields.findFirst({
          where: sql`LOWER(${fields.name}) = LOWER(${fieldName})`
        });
        
        if (existingField) {
          fieldIdMap[fieldName] = existingField.id;
        } else {
          // Create new field (requires a complex, so we'll use the first available)
          const firstComplex = await db.query.complexes.findFirst();
          if (!firstComplex) {
            importResults.errors.push(`Cannot create field '${fieldName}' - no complexes available`);
            continue;
          }

          const [newField] = await db.insert(fields).values({
            name: fieldName,
            complexId: firstComplex.id,
            fieldSize: '11v11', // Default size
            isOpen: true,
            hasLights: false
          }).returning();

          fieldIdMap[fieldName] = newField.id;
          importResults.fieldsCreated++;
          console.log(`✅ Created new field: ${fieldName} (ID: ${newField.id})`);
        }
      }
    }

    // Create missing teams if enabled
    const teamIdMap: { [key: string]: number } = {};
    if (createMissingTeams) {
      const uniqueTeamIdsSet = new Set([
        ...csvData.map(row => row.home_team_id),
        ...csvData.map(row => row.away_team_id)
      ]);
      const uniqueTeamIds = Array.from(uniqueTeamIdsSet);

      // Get or create age groups first
      const ageGroupMap: { [key: string]: number } = {};
      const uniqueAgeGroupsSet = new Set(csvData.map(row => row.age_group));
      const uniqueAgeGroups = Array.from(uniqueAgeGroupsSet);
      
      for (const ageGroup of uniqueAgeGroups) {
        const existingAgeGroup = await db.query.eventAgeGroups.findFirst({
          where: and(
            eq(eventAgeGroups.eventId, eventId.toString()),
            eq(eventAgeGroups.ageGroup, ageGroup)
          )
        });

        if (existingAgeGroup) {
          ageGroupMap[ageGroup] = existingAgeGroup.id;
        } else {
          const [newAgeGroup] = await db.insert(eventAgeGroups).values({
            eventId: eventId.toString(),
            ageGroup,
            gender: 'Mixed', // Default
            maxTeams: 16,
            registrationFee: 0
          }).returning();
          
          ageGroupMap[ageGroup] = newAgeGroup.id;
          console.log(`✅ Created new age group: ${ageGroup} (ID: ${newAgeGroup.id})`);
        }
      }

      for (const teamId of uniqueTeamIds) {
        const existingTeam = await db.query.teams.findFirst({
          where: and(
            eq(teams.eventId, eventId.toString()),
            eq(teams.teamReferenceId, teamId)
          )
        });

        if (existingTeam) {
          teamIdMap[teamId] = existingTeam.id;
        } else {
          const teamData = csvData.find(row => row.home_team_id === teamId || row.away_team_id === teamId);
          if (!teamData) {
            importResults.errors.push(`Cannot create team '${teamId}' - team data not found in CSV`);
            continue;
          }
          const teamName = teamId === teamData.home_team_id ? teamData.home_team_name : teamData.away_team_name;
          const ageGroupId = ageGroupMap[teamData.age_group || ''];

          if (!ageGroupId) {
            importResults.errors.push(`Cannot create team '${teamName}' - age group not found`);
            continue;
          }

          const [newTeam] = await db.insert(teams).values({
            eventId: eventId.toString(),
            ageGroupId,
            name: teamName || `Team ${teamId}`,
            status: 'approved',
            teamReferenceId: teamId,
            isPlaceholder: true // Mark as imported
          }).returning();

          teamIdMap[teamId] = newTeam.id;
          importResults.teamsCreated++;
          console.log(`✅ Created new team: ${teamName} (ID: ${newTeam.id})`);
        }
      }
    }

    // Import games
    for (let index = 0; index < csvData.length; index++) {
      const row = csvData[index];
      try {
        // Get field ID
        const fieldId = fieldIdMap[row.field_name];
        if (!fieldId) {
          importResults.errors.push(`Row ${index + 1}: Field '${row.field_name}' not found and creation disabled`);
          continue;
        }

        // Get team IDs
        const homeTeamId = teamIdMap[row.home_team_id];
        const awayTeamId = teamIdMap[row.away_team_id];
        
        if (!homeTeamId || !awayTeamId) {
          importResults.errors.push(`Row ${index + 1}: Team mapping failed for teams ${row.home_team_id}/${row.away_team_id}`);
          continue;
        }

        // Create game datetime
        const gameDateTime = new Date(`${row.date}T${row.time}:00`);
        const duration = row.duration ? parseInt(row.duration) : 90;
        const gameEndTime = new Date(gameDateTime.getTime() + (duration * 60 * 1000));

        // Check for conflicts if enabled
        if (conflictCheckEnabled) {
          const conflicts = await checkGameConflicts(eventId, {
            fieldId,
            homeTeamId,
            awayTeamId,
            startTime: gameDateTime,
            endTime: gameEndTime
          });

          if (conflicts.length > 0) {
            importResults.conflicts.push({
              gameId: row.game_id || `Row ${index + 1}`,
              conflicts
            });
          }
        }

        // Create time slot
        const [timeSlot] = await db.insert(gameTimeSlots).values({
          eventId: eventId.toString(),
          fieldId,
          startTime: gameDateTime.toISOString(),
          endTime: gameEndTime.toISOString(),
          dayIndex: Math.floor((gameDateTime.getTime() - new Date(row.date + 'T00:00:00').getTime()) / (24 * 60 * 60 * 1000)),
          isAvailable: false
        }).returning();

        // Create game
        await db.insert(games).values({
          eventId: eventId.toString(),
          ageGroupId: (await db.query.teams.findFirst({ where: eq(teams.id, homeTeamId) }))?.ageGroupId || 0,
          homeTeamId,
          awayTeamId,
          fieldId,
          timeSlotId: timeSlot.id,
          status: 'scheduled',
          round: row.round ? parseInt(row.round) : 1,
          matchNumber: index + 1,
          duration,
          breakTime: 15,
          scheduledDate: row.date,
          scheduledTime: row.time,
          scoreNotes: `Imported from CSV: ${req.file?.originalname}`
        });

        importResults.gamesImported++;
        console.log(`✅ Imported game ${index + 1}: ${row.home_team_name} vs ${row.away_team_name}`);

      } catch (error) {
        importResults.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`❌ Failed to import row ${index + 1}:`, error);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`🎉 Import Complete: ${importResults.gamesImported} games, ${importResults.fieldsCreated} fields, ${importResults.teamsCreated} teams created`);

    res.json({
      success: true,
      ...importResults,
      message: `Successfully imported ${importResults.gamesImported} games`
    });

  } catch (error) {
    console.error('❌ CSV Import Execute Error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      const fs = require('fs');
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    res.status(500).json({ 
      error: 'Failed to import CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Conflict checking helper function
async function checkGameConflicts(eventId: number, gameData: {
  fieldId: number;
  homeTeamId: number;
  awayTeamId: number;
  startTime: Date;
  endTime: Date;
}) {
  const conflicts: { type: 'field_overlap' | 'team_overlap'; conflictWith: string; details: string }[] = [];

  // Check field conflicts
  const fieldConflicts = await db
    .select({
      id: games.id,
      homeTeamName: sql<string>`ht.name`.as('homeTeamName'),
      awayTeamName: sql<string>`at.name`.as('awayTeamName'),
      startTime: gameTimeSlots.startTime,
      endTime: gameTimeSlots.endTime
    })
    .from(games)
    .leftJoin(sql`teams ht`, sql`ht.id = ${games.homeTeamId}`)
    .leftJoin(sql`teams at`, sql`at.id = ${games.awayTeamId}`)
    .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
    .where(and(
      eq(games.eventId, eventId.toString()),
      eq(games.fieldId, gameData.fieldId),
      sql`${gameTimeSlots.startTime}::timestamp < ${gameData.endTime.toISOString()}::timestamp`,
      sql`${gameTimeSlots.endTime}::timestamp > ${gameData.startTime.toISOString()}::timestamp`
    ));

  fieldConflicts.forEach(conflict => {
    conflicts.push({
      type: 'field_overlap',
      conflictWith: `${conflict.homeTeamName} vs ${conflict.awayTeamName}`,
      details: `Field overlap from ${conflict.startTime} to ${conflict.endTime}`
    });
  });

  // Check team conflicts (both home and away teams)
  const teamConflicts = await db
    .select({
      id: games.id,
      homeTeamName: sql<string>`ht.name`.as('homeTeamName'),
      awayTeamName: sql<string>`at.name`.as('awayTeamName'),
      startTime: gameTimeSlots.startTime,
      endTime: gameTimeSlots.endTime
    })
    .from(games)
    .leftJoin(sql`teams ht`, sql`ht.id = ${games.homeTeamId}`)
    .leftJoin(sql`teams at`, sql`at.id = ${games.awayTeamId}`)
    .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
    .where(and(
      eq(games.eventId, eventId.toString()),
      sql`(${games.homeTeamId} IN (${gameData.homeTeamId}, ${gameData.awayTeamId}) OR ${games.awayTeamId} IN (${gameData.homeTeamId}, ${gameData.awayTeamId}))`,
      sql`${gameTimeSlots.startTime}::timestamp < ${gameData.endTime.toISOString()}::timestamp`,
      sql`${gameTimeSlots.endTime}::timestamp > ${gameData.startTime.toISOString()}::timestamp`
    ));

  teamConflicts.forEach(conflict => {
    conflicts.push({
      type: 'team_overlap',
      conflictWith: `${conflict.homeTeamName} vs ${conflict.awayTeamName}`,
      details: `Team overlap from ${conflict.startTime} to ${conflict.endTime}`
    });
  });

  return conflicts;
}

export default router;