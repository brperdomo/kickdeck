import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { db } from '../../../db';
import { games, teams, fields, complexes, eventAgeGroups, eventBrackets, gameTimeSlots } from '../../../db/schema';
import { eq, and, sql, ilike } from 'drizzle-orm';
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
  Date: string;
  Time: string;
  'Home Team': string;
  'Away Team': string;
  'Age Group': string;
  Field: string;
  Status: string;
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
  fieldMappings: { [key: string]: { exists: boolean; fieldId?: number } };
  teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } };
  missingFields: string[];
  missingTeams: string[];
}

// CSV Import Preview Endpoint
router.post('/csv-import/preview', isAdmin, upload.single('csvFile'), async (req, res) => {
  try {
    const eventId = parseInt(req.body.eventId);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
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
          records.forEach((record: any) => csvData.push(record));
          resolve();
        }
      });
    });

    console.log(`📊 Parsed ${csvData.length} rows from CSV`);

    // Validate required fields
    const requiredFields = ['Date', 'Time', 'Home Team', 'Away Team', 'Age Group', 'Field'];
    
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

      // Validate date format (accept various formats)
      if (row.Date) {
        const dateStr = row.Date.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr) && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          errors.push({
            row: index + 1,
            field: 'Date',
            value: dateStr,
            message: 'Date must be in YYYY-MM-DD or MM/DD/YYYY format'
          });
        }
      }

      // Validate time format
      if (row.Time) {
        const timeStr = row.Time.trim();
        if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
          errors.push({
            row: index + 1,
            field: 'Time',
            value: timeStr,
            message: 'Time must be in HH:MM format'
          });
        }
      }
    });

    // Get existing field mappings
    const existingFields = await db
      .select({ id: fields.id, name: fields.name })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id));
    
    const fieldMappings: { [key: string]: { exists: boolean; fieldId?: number } } = {};
    const missingFields: string[] = [];
    const uniqueFieldsSet = new Set(csvData.map(row => row.Field?.trim()).filter(Boolean));
    const uniqueFields = Array.from(uniqueFieldsSet);
    
    uniqueFields.forEach(fieldName => {
      const existingField = existingFields.find(f => 
        f.name?.toLowerCase().includes(fieldName.toLowerCase()) ||
        fieldName.toLowerCase().includes(f.name?.toLowerCase() || '')
      );
      
      if (existingField) {
        fieldMappings[fieldName] = {
          exists: true,
          fieldId: existingField.id
        };
      } else {
        fieldMappings[fieldName] = { exists: false };
        missingFields.push(fieldName);
      }
    });

    // Get existing team mappings
    const existingTeams = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.eventId, eventId.toString()));
    
    const teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } } = {};
    const missingTeams: string[] = [];
    const uniqueTeamNamesSet = new Set([
      ...csvData.map(row => row['Home Team']?.trim()).filter(Boolean),
      ...csvData.map(row => row['Away Team']?.trim()).filter(Boolean)
    ]);
    const uniqueTeamNames = Array.from(uniqueTeamNamesSet);

    uniqueTeamNames.forEach(teamName => {
      const existingTeam = existingTeams.find(t => 
        t.name?.toLowerCase() === teamName.toLowerCase() ||
        t.name?.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(t.name?.toLowerCase() || '')
      );
      
      if (existingTeam) {
        teamMappings[teamName] = {
          exists: true,
          teamId: existingTeam.id,
          name: teamName
        };
      } else {
        teamMappings[teamName] = {
          exists: false,
          name: teamName
        };
        missingTeams.push(teamName);
      }
    });

    // Create preview response
    const preview: ImportPreview = {
      totalRows: csvData.length,
      validRows: csvData.length - errors.length,
      errors,
      preview: csvData.slice(0, 10), // First 10 rows for preview
      fieldMappings,
      teamMappings,
      missingFields,
      missingTeams
    };

    console.log(`✅ Import Preview: ${preview.validRows}/${preview.totalRows} valid rows, ${errors.length} errors, ${missingFields.length} missing fields, ${missingTeams.length} missing teams`);

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
router.post('/csv-import/execute', isAdmin, upload.single('csvFile'), async (req, res) => {
  try {
    const eventId = parseInt(req.body.eventId);
    const { 
      createMissingFields = false,
      createMissingTeams = false,
      teamMappings = {},
      fieldMappings = {} 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    console.log(`🚀 CSV Import Execute: Processing file ${req.file.originalname} for event ${eventId}`);
    console.log(`⚙️ Options: fields=${createMissingFields}, teams=${createMissingTeams}`);

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
      ageGroupsCreated: 0,
      errors: [] as string[]
    };

    // Helper functions
    const normalizeDate = (dateStr: string): string => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Already in correct format
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      throw new Error(`Invalid date format: ${dateStr}`);
    };

    const normalizeTime = (timeStr: string): string => {
      const [hours, minutes] = timeStr.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    };

    // Create missing fields if enabled
    const fieldIdMap: { [key: string]: number } = {};
    if (createMissingFields) {
      const uniqueFieldsSet = new Set(csvData.map(row => row.Field?.trim()).filter(Boolean));
      const uniqueFields = Array.from(uniqueFieldsSet);
      
      for (const fieldName of uniqueFields) {
        const existingField = await db.query.fields.findFirst({
          where: ilike(fields.name, `%${fieldName}%`)
        });
        
        if (existingField) {
          fieldIdMap[fieldName] = existingField.id;
        } else {
          // Create new field (requires a complex)
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

    // Create missing age groups and teams
    const teamIdMap: { [key: string]: number } = {};
    const ageGroupIdMap: { [key: string]: number } = {};
    
    // Get or create age groups first
    const uniqueAgeGroupsSet = new Set(csvData.map(row => row['Age Group']?.trim()).filter(Boolean));
    const uniqueAgeGroups = Array.from(uniqueAgeGroupsSet);
    
    for (const ageGroupName of uniqueAgeGroups) {
      const existingAgeGroup = await db.query.eventAgeGroups.findFirst({
        where: and(
          eq(eventAgeGroups.eventId, eventId.toString()),
          eq(eventAgeGroups.ageGroup, ageGroupName)
        )
      });
      
      if (existingAgeGroup) {
        ageGroupIdMap[ageGroupName] = existingAgeGroup.id;
      } else {
        const [newAgeGroup] = await db.insert(eventAgeGroups).values({
          eventId: eventId.toString(),
          ageGroup: ageGroupName,
          gender: 'Mixed',
          minAge: 10,
          maxAge: 18,
          divisionCode: ageGroupName.replace(/\s+/g, ''),
          fieldSize: '11v11'
        }).returning();
        
        ageGroupIdMap[ageGroupName] = newAgeGroup.id;
        importResults.ageGroupsCreated++;
        console.log(`✅ Created new age group: ${ageGroupName} (ID: ${newAgeGroup.id})`);
      }
    }

    // Create missing teams if enabled
    if (createMissingTeams) {
      const uniqueTeamNamesSet = new Set([
        ...csvData.map(row => row['Home Team']?.trim()).filter(Boolean),
        ...csvData.map(row => row['Away Team']?.trim()).filter(Boolean)
      ]);
      const uniqueTeamNames = Array.from(uniqueTeamNamesSet);

      for (const teamName of uniqueTeamNames) {
        const existingTeam = await db.query.teams.findFirst({
          where: and(
            eq(teams.eventId, eventId.toString()),
            ilike(teams.name, teamName)
          )
        });
        
        if (existingTeam) {
          teamIdMap[teamName] = existingTeam.id;
        } else {
          // Find age group for this team based on the games they appear in
          const gameWithTeam = csvData.find(row => 
            row['Home Team']?.trim() === teamName || row['Away Team']?.trim() === teamName
          );
          
          if (gameWithTeam && gameWithTeam['Age Group']) {
            const ageGroupId = ageGroupIdMap[gameWithTeam['Age Group'].trim()];
            
            if (ageGroupId) {
              const [newTeam] = await db.insert(teams).values({
                name: teamName,
                eventId: eventId.toString(),
                ageGroupId,
                status: 'approved',
                paymentStatus: 'paid',
                submitterEmail: 'imported@tournament.com',
                managerName: 'Imported Team',
                managerEmail: 'imported@tournament.com',
                notes: `Imported from CSV: ${req.file?.originalname}`
              }).returning();

              teamIdMap[teamName] = newTeam.id;
              importResults.teamsCreated++;
              console.log(`✅ Created new team: ${teamName} (ID: ${newTeam.id})`);
            }
          }
        }
      }
    }

    // Import games
    for (let index = 0; index < csvData.length; index++) {
      const row = csvData[index];
      
      try {
        // Get field ID
        const fieldName = row.Field?.trim();
        const fieldId = fieldIdMap[fieldName] || 
          (await db.query.fields.findFirst({
            where: ilike(fields.name, `%${fieldName}%`)
          }))?.id;

        if (!fieldId) {
          importResults.errors.push(`Row ${index + 1}: Field '${fieldName}' not found and not created`);
          continue;
        }

        // Get team IDs
        const homeTeamName = row['Home Team']?.trim();
        const awayTeamName = row['Away Team']?.trim();
        
        const homeTeamId = teamIdMap[homeTeamName] ||
          (await db.query.teams.findFirst({
            where: and(
              eq(teams.eventId, eventId.toString()),
              ilike(teams.name, homeTeamName)
            )
          }))?.id;

        const awayTeamId = teamIdMap[awayTeamName] ||
          (await db.query.teams.findFirst({
            where: and(
              eq(teams.eventId, eventId.toString()),
              ilike(teams.name, awayTeamName)
            )
          }))?.id;

        if (!homeTeamId) {
          importResults.errors.push(`Row ${index + 1}: Home team '${homeTeamName}' not found`);
          continue;
        }

        if (!awayTeamId) {
          importResults.errors.push(`Row ${index + 1}: Away team '${awayTeamName}' not found`);
          continue;
        }

        // Get age group ID
        const ageGroupName = row['Age Group']?.trim();
        const ageGroupId = ageGroupIdMap[ageGroupName] ||
          (await db.query.eventAgeGroups.findFirst({
            where: and(
              eq(eventAgeGroups.eventId, eventId.toString()),
              eq(eventAgeGroups.ageGroup, ageGroupName)
            )
          }))?.id;

        if (!ageGroupId) {
          importResults.errors.push(`Row ${index + 1}: Age group '${ageGroupName}' not found`);
          continue;
        }

        // Parse date and time
        const normalizedDate = normalizeDate(row.Date.trim());
        const normalizedTime = normalizeTime(row.Time.trim());
        const gameDateTime = new Date(`${normalizedDate}T${normalizedTime}:00`);
        const gameEndTime = new Date(gameDateTime.getTime() + 90 * 60000); // 90 minutes default

        // Create time slot
        const [timeSlot] = await db.insert(gameTimeSlots).values({
          eventId: eventId.toString(),
          dayIndex: 0, // Will be calculated properly
          startTime: gameDateTime.toISOString(),
          endTime: gameEndTime.toISOString(),
          isAvailable: false
        }).returning();

        // Create game with proper scoring setup
        const [newGame] = await db.insert(games).values({
          eventId: eventId.toString(),
          ageGroupId,
          homeTeamId,
          awayTeamId,
          fieldId,
          timeSlotId: timeSlot.id,
          status: 'scheduled',
          round: 1,
          matchNumber: index + 1,
          duration: 90,
          breakTime: 15,
          scheduledDate: normalizedDate,
          scheduledTime: normalizedTime,
          scoreNotes: `Imported from CSV: ${req.file?.originalname}`,
          homeScore: null, // Ready for scoring
          awayScore: null, // Ready for scoring
          notes: row.Status || 'Imported game'
        }).returning();

        importResults.gamesImported++;
        console.log(`✅ Imported game ${index + 1}: ${homeTeamName} vs ${awayTeamName} (Game ID: ${newGame.id})`);

      } catch (error) {
        importResults.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`❌ Failed to import row ${index + 1}:`, error);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`🎉 Import Complete: ${importResults.gamesImported} games, ${importResults.fieldsCreated} fields, ${importResults.teamsCreated} teams, ${importResults.ageGroupsCreated} age groups created`);

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

export default router;