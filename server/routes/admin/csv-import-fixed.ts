import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import fs from 'fs';
import { db } from '../../../db';
import { findBestTeamMatch, generateMatchWarnings } from '../../utils/teamMatching';
import { games, teams, fields, complexes, eventAgeGroups, eventBrackets, gameTimeSlots } from '../../../db/schema';
import { eq, and, sql, ilike } from 'drizzle-orm';
// Removed isAdmin import - CSV import should work with existing admin session

const router = Router();

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'CSV Import router is working!', timestamp: new Date().toISOString() });
});

// Test endpoint to debug transformation function
router.post('/test-transform', (req, res) => {
  const { divisions } = req.body;
  const results = divisions.map(div => ({
    division: div,
    transformed: transformDivisionToAgeGroup(div),
    parsed: parseDivisionCode(div)
  }));
  res.json({ results });
});

// Helper function to parse division codes like G2014, B2012, etc.
function parseDivisionCode(division: string): { gender: string, birthYear: number, ageGroup: string, divisionCode: string } {
  const match = division.match(/^([GB])(\d{4})$/i);
  if (!match) {
    // Handle non-standard division codes
    return { 
      gender: 'Mixed', 
      birthYear: 2010, 
      ageGroup: division,
      divisionCode: division
    };
  }
  
  const genderCode = match[1].toUpperCase();
  const birthYear = parseInt(match[2]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  
  const gender = genderCode === 'G' ? 'Girls' : 'Boys';
  const ageGroup = `U${age + 1} ${gender}`; // U15 Boys, U12 Girls, etc.
  
  return { 
    gender, 
    birthYear, 
    ageGroup, 
    divisionCode: division 
  };
}



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
  // Basic game fields (legacy support)
  Date: string;
  Time: string;
  'Home Team': string;
  'Away Team': string;
  'Age Group': string;
  Field: string;
  Status: string;
  
  // Enhanced tournament fields
  'GM#'?: string;
  Division?: string;
  Flight?: string;
  'Home Team Coach ID'?: string;
  'Home Head Coach'?: string;
  'Away Team Coach ID'?: string;
  'Away Head Coach'?: string;
  'Away Conflict'?: string;
  'Home Conflict'?: string;
  Type?: string;
  Complex?: string;
  Venue?: string;
  
  // Alternative field mappings for flexibility
  'Game Number'?: string;
  'Game #'?: string;
  'Home Coach ID'?: string;
  'Away Coach ID'?: string;
  'Home Coach'?: string;
  'Away Coach'?: string;
  'Game Type'?: string;
  'Match Type'?: string;
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

// Enhanced date/time validation functions
const isValidDateFormat = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const cleaned = dateStr.trim();
  
  // Support multiple date formats
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // M/D/YYYY or MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/,           // MM-DD-YYYY (like 08-16-2025)
    /^\d{1,2}-\d{1,2}-\d{4}$/,       // M-D-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,     // M/D/YY
    /^\d{2}\/\d{2}\/\d{4}$/,         // MM/DD/YYYY
  ];
  
  return dateFormats.some(format => format.test(cleaned));
};

const isValidTimeFormat = (timeStr: string): boolean => {
  if (!timeStr) return false;
  const cleaned = timeStr.trim().toUpperCase();
  
  // Support multiple time formats
  const timeFormats = [
    /^\d{1,2}:\d{2}$/,                    // H:MM or HH:MM
    /^\d{1,2}:\d{2}\s?(AM|PM)$/,          // H:MM AM/PM
    /^\d{1,2}:\d{2}:\d{2}$/,              // H:MM:SS
    /^\d{1,2}:\d{2}:\d{2}\s?(AM|PM)$/,    // H:MM:SS AM/PM
  ];
  
  return timeFormats.some(format => format.test(cleaned));
};

// Enhanced team name parsing functions
const parseTeamName = (fullTeamName: string) => {
  const trimmed = fullTeamName.trim();
  
  // Handle "Club Name - Team Name" format
  const dashIndex = trimmed.indexOf(' - ');
  if (dashIndex > 0) {
    const clubName = trimmed.substring(0, dashIndex).trim();
    const teamName = trimmed.substring(dashIndex + 3).trim();
    return { clubName, teamName, fullName: trimmed };
  }
  
  // Fallback: treat entire string as team name
  return { clubName: '', teamName: trimmed, fullName: trimmed };
};

const calculateTeamMatchConfidence = (csvTeam: string, dbTeam: { id: number; name: string | null; clubName?: string | null }) => {
  const parsed = parseTeamName(csvTeam);
  const dbName = dbTeam.name?.toLowerCase() || '';
  const dbClubName = dbTeam.clubName?.toLowerCase() || '';
  
  // Exact full name match - highest confidence
  if (parsed.fullName.toLowerCase() === dbName) {
    return { confidence: 1.0, matchType: 'exact_full' };
  }
  
  // Exact team name match
  if (parsed.teamName.toLowerCase() === dbName) {
    return { confidence: 0.95, matchType: 'exact_team' };
  }
  
  // Club name match + partial team match
  if (parsed.clubName && dbClubName && parsed.clubName.toLowerCase() === dbClubName) {
    const teamSimilarity = getStringSimilarity(parsed.teamName.toLowerCase(), dbName);
    return { confidence: 0.8 + (teamSimilarity * 0.15), matchType: 'club_plus_team' };
  }
  
  // Strong partial matching (contains significant words)
  const csvWords = parsed.teamName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const dbWords = dbName.split(/\s+/).filter(w => w.length > 2);
  
  if (csvWords.length > 0 && dbWords.length > 0) {
    const matchingWords = csvWords.filter(csvWord => 
      dbWords.some(dbWord => 
        dbWord.includes(csvWord) || csvWord.includes(dbWord) ||
        getStringSimilarity(csvWord, dbWord) > 0.8
      )
    );
    
    const wordMatchRatio = matchingWords.length / Math.max(csvWords.length, dbWords.length);
    if (wordMatchRatio > 0.6) {
      return { confidence: 0.6 + (wordMatchRatio * 0.3), matchType: 'partial_words' };
    }
  }
  
  // Fuzzy string similarity
  const similarity = getStringSimilarity(parsed.teamName.toLowerCase(), dbName);
  if (similarity > 0.7) {
    return { confidence: similarity * 0.8, matchType: 'fuzzy' };
  }
  
  return { confidence: 0, matchType: 'no_match' };
};

const getStringSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Simple Levenshtein-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator   // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

const findBestTeamMatch = (csvTeamName: string, existingTeams: any[], minConfidence = 0.6) => {
  const matches = existingTeams.map(team => {
    const result = calculateTeamMatchConfidence(csvTeamName, team);
    return {
      team,
      confidence: result.confidence,
      matchType: result.matchType,
      suggestion: result.confidence > 0.8 ? 'auto_match' : result.confidence > 0.6 ? 'review_match' : 'manual_match'
    };
  })
  .filter(match => match.confidence >= minConfidence)
  .sort((a, b) => b.confidence - a.confidence);
  
  return matches;
};

const generateMatchWarnings = (csvTeamName: string, matches: any[]) => {
  const warnings: string[] = [];
  
  if (matches.length === 0) {
    warnings.push(`No matching team found for "${csvTeamName}"`);
  } else if (matches.length === 1 && matches[0].confidence < 0.8) {
    warnings.push(`Low confidence match for "${csvTeamName}" -> "${matches[0].team.name}" (${(matches[0].confidence * 100).toFixed(0)}%)`);
  } else if (matches.length > 1 && matches[0].confidence - matches[1].confidence < 0.1) {
    warnings.push(`Ambiguous match for "${csvTeamName}" - multiple similar teams found`);
  }
  
  return warnings;
};

// Extract coach information from CSV data
const extractCoachInformation = (csvData: any[]) => {
  const coaches = new Map();
  
  csvData.forEach((row) => {
    // Extract home coach info
    const homeCoachId = row['Home Team Coach ID'] || row['Home Coach ID'];
    const homeCoachName = row['Home Head Coach'] || row['Home Coach'];
    if (homeCoachId && homeCoachName) {
      coaches.set(homeCoachId, {
        id: homeCoachId,
        name: homeCoachName,
        type: 'coach'
      });
    }
    
    // Extract away coach info  
    const awayCoachId = row['Away Team Coach ID'] || row['Away Coach ID'];
    const awayCoachName = row['Away Head Coach'] || row['Away Coach'];
    if (awayCoachId && awayCoachName) {
      coaches.set(awayCoachId, {
        id: awayCoachId,
        name: awayCoachName,
        type: 'coach'
      });
    }
  });
  
  return {
    totalCoaches: coaches.size,
    coaches: Array.from(coaches.values()),
    hasCoachData: coaches.size > 0
  };
};

// Analyze age group structure with division parsing
const analyzeAgeGroupStructure = async (csvData: any[], eventId: number) => {
  const divisions = new Set();
  const flights = new Set();
  const ageGroupPattern = new Set();
  const parsedDivisions = new Map();
  
  csvData.forEach(row => {
    if (row.Division) {
      divisions.add(row.Division);
      // Parse each division to extract age group info
      const parsed = parseDivisionCode(row.Division);
      parsedDivisions.set(row.Division, parsed);
      ageGroupPattern.add(parsed.ageGroup);
    }
    if (row.Flight) flights.add(row.Flight);
  });
  
  return {
    csvDivisions: Array.from(divisions),
    csvFlights: Array.from(flights), 
    csvAgePatterns: Array.from(ageGroupPattern),
    parsedDivisions: Object.fromEntries(parsedDivisions),
    needsAgeGroupMapping: divisions.size > 0,
    hasStandardDivisionCodes: Array.from(divisions).some(div => /^[GB]\d{4}$/i.test(div as string))
  };
};



// CSV Import Preview Endpoint - No additional auth needed if already accessing admin panel
router.post('/preview', upload.single('csvFile'), async (req, res) => {
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

    // Validate required fields - flexible field detection
    const requiredFields = ['Date', 'Time', 'Home Team', 'Away Team'];
    
    // Detect CSV format and adjust required fields
    const csvHeaders = Object.keys(csvData[0] || {});
    console.log(`📋 Detected CSV Headers:`, csvHeaders);
    
    // Enhanced tournament format detection
    const hasTournamentFormat = csvHeaders.some(h => 
      ['GM#', 'Game Number', 'Division', 'Flight', 'Complex', 'Venue'].includes(h)
    );
    
    // Flexible field requirements based on format
    if (hasTournamentFormat) {
      console.log(`🏆 Detected Tournament Format CSV with enhanced fields`);
      // Tournament format can use Division instead of Age Group, Venue instead of Field
      if (!csvHeaders.includes('Age Group') && csvHeaders.includes('Division')) {
        requiredFields.push('Division');
      } else {
        requiredFields.push('Age Group');
      }
      
      if (!csvHeaders.includes('Field') && (csvHeaders.includes('Venue') || csvHeaders.includes('Complex'))) {
        requiredFields.push('Venue');
      } else {
        requiredFields.push('Field');
      }
    } else {
      console.log(`📊 Detected Basic Format CSV`);
      requiredFields.push('Age Group', 'Field');
    }
    
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

      // Enhanced date validation - accept multiple formats
      if (row.Date) {
        const dateStr = row.Date.trim();
        const isValidDate = isValidDateFormat(dateStr);
        if (!isValidDate) {
          errors.push({
            row: index + 1,
            field: 'Date',
            value: dateStr,
            message: 'Date format not recognized. Accepted: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY'
          });
        }
      }

      // Enhanced time validation - accept multiple formats including AM/PM
      if (row.Time) {
        const timeStr = row.Time.trim();
        const isValidTime = isValidTimeFormat(timeStr);
        if (!isValidTime) {
          errors.push({
            row: index + 1,
            field: 'Time',
            value: timeStr,
            message: 'Time format not recognized. Accepted: HH:MM, H:MM AM/PM'
          });
        }
      }
    });

    // Get existing field mappings with enhanced venue/complex support
    const existingFields = await db
      .select({ 
        id: fields.id, 
        name: fields.name, 
        complexName: complexes.name,
        fieldSize: fields.fieldSize 
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id));
    
    const fieldMappings: { [key: string]: { exists: boolean; fieldId?: number; complexName?: string } } = {};
    const missingFields: string[] = [];
    
    // Extract field/venue information from CSV - handle both formats
    const uniqueFieldsSet = new Set();
    csvData.forEach(row => {
      // Try multiple field extraction strategies
      const fieldIdentifiers = [
        row.Field?.trim(),
        row.Venue?.trim(), 
        row['Venue']?.trim(),
        // Extract field from venue strings like "Field 9B 9v9"
        row.Venue?.includes('Field') ? row.Venue?.trim() : null
      ].filter(Boolean);
      
      fieldIdentifiers.forEach(field => {
        if (field) uniqueFieldsSet.add(field);
      });
    });
    
    const uniqueFields = Array.from(uniqueFieldsSet) as string[];
    console.log(`🏟️ Processing ${uniqueFields.length} unique field/venue identifiers:`, uniqueFields.slice(0, 5));
    
    uniqueFields.forEach(fieldName => {
      // Enhanced field matching - handle complex venue names like "Field 9B 9v9"
      const existingField = existingFields.find(f => {
        const fieldFullName = f.complexName ? `${f.complexName} ${f.name}` : f.name;
        const lowerFieldName = fieldName.toLowerCase();
        const lowerDbName = f.name?.toLowerCase() || '';
        const lowerFullName = fieldFullName?.toLowerCase() || '';
        
        return (
          lowerDbName.includes(lowerFieldName) ||
          lowerFieldName.includes(lowerDbName) ||
          lowerFullName.includes(lowerFieldName) ||
          lowerFieldName.includes(lowerFullName) ||
          // Handle cases like "Field 9B" matching "Field 9B 9v9"
          lowerFieldName.includes(lowerDbName.replace(/\s+/g, '')) ||
          // Handle field size extraction
          (f.fieldSize && lowerFieldName.includes(f.fieldSize.toLowerCase()))
        );
      });
      
      if (existingField) {
        fieldMappings[fieldName] = {
          exists: true,
          fieldId: existingField.id,
          complexName: existingField.complexName || undefined
        };
      } else {
        fieldMappings[fieldName] = { exists: false };
        missingFields.push(fieldName);
      }
    });

    // Get existing team mappings with club information
    const existingTeams = await db
      .select({ id: teams.id, name: teams.name, clubName: teams.clubName })
      .from(teams)
      .where(eq(teams.eventId, eventId.toString()));
    
    const teamMappings: { [key: string]: { exists: boolean; teamId?: number; name: string } } = {};
    const missingTeams: string[] = [];
    const uniqueTeamNamesSet = new Set([
      ...csvData.map(row => row['Home Team']?.trim()).filter(Boolean),
      ...csvData.map(row => row['Away Team']?.trim()).filter(Boolean)
    ]);
    const uniqueTeamNames = Array.from(uniqueTeamNamesSet);

    // Enhanced team matching with fuzzy logic and validation warnings
    const teamMatches: any[] = [];
    const matchingWarnings: string[] = [];
    
    uniqueTeamNames.forEach(teamName => {
      try {
        const matches = findBestTeamMatch(teamName, existingTeams, 0.6);
        const warnings = generateMatchWarnings(teamName, matches);
        
        teamMatches.push({
          csvName: teamName,
          matches: matches.map(m => ({
            teamId: m.team.id,
            teamName: m.team.name,
            confidence: m.confidence,
            matchType: m.matchType,
            suggestion: m.suggestion
          })),
          warnings,
          selected: matches.length > 0 ? matches[0].team.id : undefined
        });
        
        // Add warnings to global collection
        warnings.forEach(warning => matchingWarnings.push(warning));
        
        // Traditional mapping for backward compatibility
        const bestMatch = matches[0];
        if (bestMatch && bestMatch.confidence > 0.7) {
          teamMappings[teamName] = {
            exists: true,
            teamId: bestMatch.team.id,
            name: teamName
          };
        } else {
          teamMappings[teamName] = {
            exists: false,
            name: teamName
          };
          missingTeams.push(teamName);
        }
        
      } catch (error) {
        console.error(`Error matching team "${teamName}":`, error);
        teamMappings[teamName] = {
          exists: false,
          name: teamName
        };
        missingTeams.push(teamName);
        matchingWarnings.push(`Failed to process team name: ${teamName}`);
      }
    });

    // Extract coach information for preview
    const coachInfo = extractCoachInformation(csvData);
    
    // Analyze age group/division mappings  
    const ageGroupAnalysis = analyzeAgeGroupStructure(csvData, eventId);
    
    // Transform preview data to include parsed Age Group and Field information
    const transformedPreview = csvData.slice(0, 10).map(row => {
      const transformed = { ...row };
      
      // Parse Division into Age Group if not already present
      if (row.Division && !row['Age Group']) {
        const parsed = parseDivisionCode(row.Division);
        transformed['Age Group'] = parsed.ageGroup;
      }
      
      // Map Venue to Field if not already present
      if (row.Venue && !row.Field) {
        transformed.Field = row.Venue;
      }
      
      return transformed;
    });

    // Create preview response with enhanced tournament data
    const preview: any = {
      totalRows: csvData.length,
      validRows: csvData.length - errors.length,
      errors,
      preview: transformedPreview, // Use transformed data for preview
      fieldMappings,
      teamMappings,
      teamMatches,
      missingFields,
      missingTeams,
      matchingWarnings,
      csvFormat: hasTournamentFormat ? 'tournament' : 'basic',
      csvHeaders,
      coachInfo,
      ageGroupAnalysis: await ageGroupAnalysis,
      gameMetadata: {
        totalGames: csvData.length,
        gameTypes: Array.from(new Set(csvData.map(r => r.Type || 'Unknown').filter(Boolean))),
        statuses: Array.from(new Set(csvData.map(r => r.Status).filter(Boolean))),
        complexes: Array.from(new Set(csvData.map(r => r.Complex).filter(Boolean))),
        flights: Array.from(new Set(csvData.map(r => r.Flight).filter(Boolean))),
        divisions: Array.from(new Set(csvData.map(r => r.Division).filter(Boolean)))
      }
    };

    console.log(`✅ Import Preview: ${preview.validRows}/${preview.totalRows} valid rows, ${errors.length} errors, ${missingFields.length} missing fields, ${missingTeams.length} missing teams`);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(preview);

  } catch (error) {
    console.error('❌ CSV Import Preview Error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CSV Import Execution Endpoint - No additional auth needed if already accessing admin panel
router.post('/execute', upload.single('csvFile'), async (req, res) => {
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
    console.log(`📋 Request body parameters:`, { 
      createMissingFields: req.body.createMissingFields, 
      createMissingTeams: req.body.createMissingTeams,
      eventId: req.body.eventId 
    });

    // Parse CSV file
    const csvData: CSVRow[] = [];
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    await new Promise<void>((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err);
        else {
          // Transform CSV data to include parsed Age Group and Field information (same as preview)
          records.forEach((record: any) => {
            const transformed = { ...record };
            
            // Parse Division into Age Group if not already present
            if (record.Division && !record['Age Group']) {
              const parsed = parseDivisionCode(record.Division);
              transformed['Age Group'] = parsed.ageGroup;
            }
            
            // Map Venue to Field if not already present
            if (record.Venue && !record.Field) {
              transformed.Field = record.Venue;
            }
            
            csvData.push(transformed);
          });
          resolve();
        }
      });
    });
    
    console.log(`📊 Transformed CSV data - sample row:`, csvData[0]);

    const importResults = {
      gamesImported: 0,
      fieldsCreated: 0,
      teamsCreated: 0,
      ageGroupsCreated: 0,
      errors: [] as string[]
    };

    // Enhanced helper functions for flexible date/time parsing
    const normalizeDate = (dateStr: string): string => {
      if (!dateStr) return '';
      
      const cleaned = dateStr.trim();
      
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return cleaned;
      }
      
      // Handle MM/DD/YYYY or M/D/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
        const [month, day, year] = cleaned.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle MM-DD-YYYY or M-D-YYYY format
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
        const [month, day, year] = cleaned.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle MM/DD/YY format
      if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(cleaned)) {
        const [month, day, year] = cleaned.split('/');
        const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return cleaned; // Return as-is if can't parse
    };

    const normalizeTime = (timeStr: string): string => {
      if (!timeStr) return '';
      
      const cleaned = timeStr.trim().toUpperCase();
      
      // Already in HH:MM format
      if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
        const [hours, minutes] = cleaned.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      // Handle AM/PM format
      if (/^\d{1,2}:\d{2}\s?(AM|PM)$/.test(cleaned)) {
        const match = cleaned.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
        if (match) {
          let [, hours, minutes, period] = match;
          let hour24 = parseInt(hours);
          
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          return `${hour24.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      
      return cleaned; // Return as-is if can't parse
    };

    // Create missing fields if enabled
    const fieldIdMap: { [key: string]: number } = {};
    if (createMissingFields) {
      // Extract fields from both Field and Venue columns (tournament format compatibility)
      const uniqueFieldsSet = new Set();
      csvData.forEach(row => {
        const fieldIdentifiers = [
          row.Field?.trim(),
          row.Venue?.trim(), 
          row['Venue']?.trim()
        ].filter(Boolean);
        
        fieldIdentifiers.forEach(field => {
          if (field) uniqueFieldsSet.add(field);
        });
      });
      const uniqueFields = Array.from(uniqueFieldsSet) as string[];
      console.log(`🏟️ FIELD CREATION: Found ${uniqueFields.length} unique fields to process:`, uniqueFields);
      
      for (const fieldName of uniqueFields) {
        const existingField = await db.query.fields.findFirst({
          where: ilike(fields.name, `%${fieldName}%`)
        });
        
        if (existingField) {
          fieldIdMap[fieldName] = existingField.id;
          console.log(`🏟️ Found existing field: ${fieldName} (ID: ${existingField.id})`);
        } else {
          // Create new field (requires a complex)
          console.log(`🏗️ Creating new field: ${fieldName}`);
          const firstComplex = await db.query.complexes.findFirst();
          if (!firstComplex) {
            console.error(`❌ Cannot create field '${fieldName}' - no complexes available`);
            importResults.errors.push(`Cannot create field '${fieldName}' - no complexes available`);
            continue;
          }
          console.log(`🏢 Using complex: ${firstComplex.name} (ID: ${firstComplex.id})`);

          // Determine field size based on field name
          let fieldSize = '11v11'; // Default
          if (fieldName.includes('9v9')) {
            fieldSize = '9v9';
          } else if (fieldName.includes('7v7')) {
            fieldSize = '7v7';
          } else if (fieldName.includes('5v5')) {
            fieldSize = '5v5';
          }

          const [newField] = await db.insert(fields).values({
            name: fieldName,
            complexId: firstComplex.id,
            fieldSize: fieldSize,
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
    
    // Get or create age groups first - transform division codes to age groups
    const uniqueAgeGroupsSet = new Set();
    csvData.forEach(row => {
      // Get age group from existing field or parse from Division
      let ageGroup = row['Age Group']?.trim();
      if (!ageGroup && row.Division) {
        const parsed = parseDivisionCode(row.Division);
        ageGroup = parsed.ageGroup;
      }
      if (ageGroup) uniqueAgeGroupsSet.add(ageGroup);
    });
    const uniqueAgeGroups = Array.from(uniqueAgeGroupsSet) as string[];
    console.log(`🏆 AGE GROUP CREATION: Found ${uniqueAgeGroups.length} unique age groups:`, uniqueAgeGroups);
    
    for (const ageGroupName of uniqueAgeGroups) {
      const existingAgeGroup = await db.query.eventAgeGroups.findFirst({
        where: eq(eventAgeGroups.ageGroup, ageGroupName)
      });
      
      if (existingAgeGroup) {
        ageGroupIdMap[ageGroupName] = existingAgeGroup.id;
      } else {
        // Parse division code if it follows the standard format (G2014, B2012, etc.)
        // The ageGroupName is already processed (e.g., "U11 Boys"), but we need original division data
        // Find a row with this age group to get the original division code
        const sampleRow = csvData.find(row => {
          let ageGroup = row['Age Group']?.trim();
          if (!ageGroup && row.Division) {
            const parsed = parseDivisionCode(row.Division);
            ageGroup = parsed.ageGroup;
          }
          return ageGroup === ageGroupName;
        });
        
        let parsedDivision;
        if (sampleRow && sampleRow.Division) {
          parsedDivision = parseDivisionCode(sampleRow.Division);
        } else {
          // Fallback: parse from age group name itself
          const match = ageGroupName.match(/^U(\d+)\s+(Boys|Girls)$/i);
          if (match) {
            const age = parseInt(match[1]);
            const gender = match[2];
            const birthYear = new Date().getFullYear() - age + 1;
            parsedDivision = {
              gender: gender,
              birthYear: birthYear,
              ageGroup: ageGroupName,
              divisionCode: ageGroupName
            };
          } else {
            parsedDivision = {
              gender: 'Boys', // Default fallback
              birthYear: 2010,
              ageGroup: ageGroupName,
              divisionCode: ageGroupName
            };
          }
        }
        
        const insertData = {
          eventId: eventId.toString(),
          ageGroup: parsedDivision.ageGroup,
          gender: parsedDivision.gender === 'Mixed' ? 'Boys' : parsedDivision.gender, // Fix Mixed gender issue
          birthYear: parsedDivision.birthYear,
          fieldSize: parsedDivision.birthYear >= 2012 ? '9v9' : '11v11',
          projectedTeams: 8,
          divisionCode: parsedDivision.divisionCode,
          isEligible: true,
          createdAt: new Date().toISOString() // Add required created_at field
        };
        console.log(`🏆 Creating age group with data:`, insertData);
        const [newAgeGroup] = await db.insert(eventAgeGroups).values(insertData).returning();
        
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
      console.log(`👥 TEAM CREATION: Found ${uniqueTeamNames.length} unique teams to process`);

      for (const teamName of uniqueTeamNames) {
        const existingTeam = await db.query.teams.findFirst({
          where: ilike(teams.name, teamName)
        });
        
        if (existingTeam) {
          teamIdMap[teamName] = existingTeam.id;
        } else {
          // Find age group for this team based on the games they appear in
          const gameWithTeam = csvData.find(row => 
            row['Home Team']?.trim() === teamName || row['Away Team']?.trim() === teamName
          );
          
          if (gameWithTeam) {
            // Get age group from existing field or parse from Division
            let ageGroup = gameWithTeam['Age Group']?.trim();
            if (!ageGroup && gameWithTeam.Division) {
              const parsed = parseDivisionCode(gameWithTeam.Division);
              ageGroup = parsed.ageGroup;
            }
            
            const ageGroupId = ageGroup ? ageGroupIdMap[ageGroup] : null;
            
            if (ageGroupId) {
              console.log(`👥 Creating team: ${teamName} (Age Group: ${ageGroup}, ID: ${ageGroupId})`);
              const [newTeam] = await db.insert(teams).values({
                eventId: eventId.toString(),
                name: teamName, // Use 'name' field instead of 'teamName'
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
            } else {
              console.log(`❌ Cannot create team ${teamName}: Age group ${ageGroup} not found`);
            }
          }
        }
      }
    }

    // Import games
    for (let index = 0; index < csvData.length; index++) {
      const row = csvData[index];
      
      try {
        // Get field ID - enhanced venue/field matching (same logic as creation)
        const fieldIdentifiers = [
          row.Field?.trim(),
          row.Venue?.trim(), 
          row['Venue']?.trim()
        ].filter(Boolean);
        
        const fieldName = fieldIdentifiers[0]; // Use first available field identifier
        let fieldId = fieldIdMap[fieldName];
        
        if (!fieldId) {
          // Try enhanced field matching for tournament format
          const existingField = await db.query.fields.findFirst({
            where: ilike(fields.name, `%${fieldName}%`)
          });
          fieldId = existingField?.id;
          
          // If still not found, try extracting field name from venue string
          if (!fieldId && fieldName?.includes('Field')) {
            const fieldMatch = fieldName.match(/Field\s*(\w+)/i);
            if (fieldMatch) {
              const extractedFieldName = `Field ${fieldMatch[1]}`;
              const extractedField = await db.query.fields.findFirst({
                where: ilike(fields.name, `%${extractedFieldName}%`)
              });
              fieldId = extractedField?.id;
            }
          }
        }

        if (!fieldId) {
          importResults.errors.push(`Row ${index + 1}: Field '${fieldName}' not found and not created`);
          continue;
        }

        // Get team IDs
        const homeTeamName = row['Home Team']?.trim();
        const awayTeamName = row['Away Team']?.trim();
        
        const homeTeamId = teamIdMap[homeTeamName] ||
          (await db.query.teams.findFirst({
            where: ilike(teams.name, homeTeamName)
          }))?.id;

        const awayTeamId = teamIdMap[awayTeamName] ||
          (await db.query.teams.findFirst({
            where: ilike(teams.name, awayTeamName)
          }))?.id;

        if (!homeTeamId) {
          importResults.errors.push(`Row ${index + 1}: Home team '${homeTeamName}' not found`);
          continue;
        }

        if (!awayTeamId) {
          importResults.errors.push(`Row ${index + 1}: Away team '${awayTeamName}' not found`);
          continue;
        }

        // Get age group ID - handle both Division and Age Group formats
        let ageGroupName = row['Age Group']?.trim();
        let ageGroupId = null;
        
        // If no Age Group, try using Division for tournament format
        if (!ageGroupName && row.Division) {
          ageGroupName = transformDivisionToAgeGroup(row.Division.trim());
        }
        
        // Look up age group ID using the transformed name
        if (ageGroupName) {
          // First try the map cache
          ageGroupId = ageGroupIdMap[ageGroupName];
          

          
          // If not in cache, try database lookup
          if (!ageGroupId) {
            const existingAgeGroup = await db.query.eventAgeGroups.findFirst({
              where: and(
                eq(eventAgeGroups.eventId, eventId.toString()),
                eq(eventAgeGroups.ageGroup, ageGroupName)
              )
            });
            ageGroupId = existingAgeGroup?.id;
            

            
            // Update the cache for future lookups
            if (ageGroupId) {
              ageGroupIdMap[ageGroupName] = ageGroupId;
            }
          }
        }

        if (!ageGroupId) {
          importResults.errors.push(`Row ${index + 1}: Age group '${ageGroupName}' not found (from Division: '${row.Division}')`);
          continue;
        }

        // Parse date and time with error handling
        const normalizedDate = normalizeDate(row.Date.trim());
        const normalizedTime = normalizeTime(row.Time.trim());
        const gameDateTime = new Date(`${normalizedDate}T${normalizedTime}:00`);
        const gameEndTime = new Date(gameDateTime.getTime() + 90 * 60000); // 90 minutes default

        // Validate date parsing
        if (isNaN(gameDateTime.getTime())) {
          importResults.errors.push(`Row ${index + 1}: Invalid date/time format - Date: '${row.Date}', Time: '${row.Time}'`);
          continue;
        }

        // Calculate day index (0-based from tournament start)
        const tournamentStartDate = new Date('2025-08-16'); // Tournament start date
        const gameDate = new Date(gameDateTime);
        const dayIndex = Math.floor((gameDate.getTime() - tournamentStartDate.getTime()) / (1000 * 60 * 60 * 24));

        // Create time slot
        const [timeSlot] = await db.insert(gameTimeSlots).values({
          eventId: eventId.toString(),
          fieldId: fieldId!,
          startTime: gameDateTime.toISOString(),
          endTime: gameEndTime.toISOString(),
          dayIndex: dayIndex >= 0 ? dayIndex : 0, // Ensure non-negative day index
          isAvailable: false
        }).returning();

        // Extract enhanced game metadata from tournament format
        const gameNumber = row['GM#'] || row['Game Number'] || row['Game #'] || (index + 1).toString();
        const gameType = row.Type || row['Game Type'] || row['Match Type'] || 'Pool Play';
        const gameStatus = row.Status || 'Scheduled';
        const flight = row.Flight || 'Default';
        
        // Extract field size from venue if available
        let fieldSize = '11v11'; // default
        if (row.Venue?.includes('9v9')) fieldSize = '9v9';
        else if (row.Venue?.includes('7v7')) fieldSize = '7v7';
        else if (row.Venue?.includes('11v11')) fieldSize = '11v11';
        
        // Build comprehensive notes with all tournament data
        const tournamentNotes = [
          row.Status && `Status: ${row.Status}`,
          row.Flight && `Flight: ${row.Flight}`,
          row.Complex && `Complex: ${row.Complex}`,
          row.Type && `Type: ${row.Type}`,
          row['Home Conflict'] === 'yes' && 'Home team has conflict',
          row['Away Conflict'] === 'yes' && 'Away team has conflict',
          row['Home Head Coach'] && `Home Coach: ${row['Home Head Coach']}`,
          row['Away Head Coach'] && `Away Coach: ${row['Away Head Coach']}`,
          `Imported from CSV: ${req.file?.originalname}`
        ].filter(Boolean).join(' | ');
        
        // Create game with enhanced tournament data
        const [newGame] = await db.insert(games).values({
          eventId: eventId.toString(),
          ageGroupId: ageGroupId!,
          homeTeamId,
          awayTeamId,
          fieldId: fieldId!,
          timeSlotId: timeSlot.id,
          status: gameStatus.toLowerCase() === 'on time' ? 'scheduled' : 'postponed',
          round: 1,
          matchNumber: parseInt(gameNumber) || (index + 1),
          duration: fieldSize === '7v7' ? 60 : (fieldSize === '9v9' ? 80 : 90),
          breakTime: 15,
          scheduledDate: normalizedDate,
          scheduledTime: normalizedTime,
          scoreNotes: '',
          homeScore: null, // Ready for scoring
          awayScore: null, // Ready for scoring
          notes: tournamentNotes,
          // Store coach IDs in notes for now (could add dedicated fields later)
          homeTeamRefId: row['Home Team Coach ID'] || undefined,
          awayTeamRefId: row['Away Team Coach ID'] || undefined
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
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    res.status(500).json({ 
      error: 'Failed to import CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;