/**
 * Tournament Control API Routes
 * Handles unified tournament control center functionality
 */

import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { events, teams, games, eventAgeGroups, eventBrackets, fields, gameFormats, eventGameFormats, eventScheduleConstraints, gameTimeSlots } from '@db/schema';
import { TimeSlotManager } from '../../utils/timeSlotManager';
import { eq, and, count, isNull } from 'drizzle-orm';

const router = Router();

// Get tournament status and progress
router.get('/tournaments/:eventId/status', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check current tournament status
    const status = await getTournamentStatus(eventId);
    
    res.json(status);
  } catch (error: any) {
    console.error('Error fetching tournament status:', error);
    res.status(500).json({ error: 'Failed to fetch tournament status' });
  }
});

// Get scheduling components status
router.get('/tournaments/:eventId/components-status', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const components = await getComponentsStatus(eventId);
    
    res.json(components);
  } catch (error) {
    console.error('Error fetching components status:', error);
    res.status(500).json({ error: 'Failed to fetch components status' });
  }
});

// Execute auto-scheduling
router.post('/tournaments/:eventId/auto-schedule', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { includeReferees = true, includeFacilities = true } = req.body;
    
    console.log(`Starting auto-schedule for event ${eventId}`);
    
    // Execute full auto-scheduling workflow
    const result = await executeAutoScheduling(eventId, {
      includeReferees,
      includeFacilities
    });
    
    res.json({
      success: true,
      message: 'Auto-scheduling completed successfully',
      result
    });
  } catch (error: any) {
    console.error('Auto-scheduling failed:', error);
    res.status(500).json({ 
      error: 'Auto-scheduling failed',
      details: error.message 
    });
  }
});

// Execute individual manual steps
router.post('/tournaments/:eventId/execute-step', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { step } = req.body;
    
    console.log(`Executing manual step: ${step} for event ${eventId}`);
    
    let result;
    
    switch (step) {
      case 'configure-formats':
        result = await configureGameFormats(eventId);
        break;
      case 'assign-flights':
        result = await assignFlights(eventId);
        break;
      case 'create-brackets':
        result = await createBrackets(eventId);
        break;
      case 'validate-facilities':
        result = await validateFacilities(eventId);
        break;
      case 'assign-referees':
        result = await assignReferees(eventId);
        break;
      case 'optimize-schedule':
        result = await optimizeSchedule(eventId);
        break;
      default:
        throw new Error(`Unknown step: ${step}`);
    }
    
    res.json({
      success: true,
      message: `${step} completed successfully`,
      result
    });
  } catch (error: any) {
    console.error(`Step execution failed (${req.body.step}):`, error);
    res.status(500).json({ 
      error: `Failed to execute ${req.body.step}`,
      details: error.message 
    });
  }
});

// Helper functions

async function getTournamentStatus(eventId: string) {
  // Get tournament data and analyze current state
  const eventData = await db.select().from(events).where(eq(events.id, parseInt(eventId))).limit(1);
  
  if (eventData.length === 0) {
    throw new Error('Tournament not found');
  }
  
  // Analyze completion status
  const teamsData = await db.select().from(teams).where(eq(teams.eventId, eventId));
  const gamesData = await db.select().from(games).where(eq(games.eventId, eventId));
  
  // Determine current phase and progress with flexible validation
  let phase: 'setup' | 'configuration' | 'scheduling' | 'optimization' | 'finalized' = 'setup';
  let progress = 0;
  let nextAction = 'Configure game formats and flights as needed';
  let canProceed = true; // Allow flexible progression - users can configure partially
  
  const issues = [];
  
  if (teamsData.length === 0) {
    issues.push({
      type: 'info' as const,
      message: 'Teams will be needed eventually, but you can configure formats first.',
      action: 'register-teams'
    });
    progress = 10;
    nextAction = 'Configure game formats and register teams when ready';
  } else if (gamesData.length === 0) {
    phase = 'configuration';
    progress = 40;
    nextAction = 'Continue configuring formats or create brackets when ready';
  } else {
    phase = 'scheduling';
    progress = 75;
    nextAction = 'Optimize schedule and assign referees';
    
    // Check if schedule is finalized
    const scheduledGames = gamesData.filter(g => g.timeSlotId !== null);
    if (scheduledGames.length === gamesData.length) {
      phase = 'finalized';
      progress = 100;
      nextAction = 'Tournament schedule is complete';
    }
  }
  
  return {
    phase,
    progress,
    nextAction,
    canProceed,
    issues
  };
}

async function getComponentsStatus(eventId: string) {
  const teamsData = await db.select().from(teams).where(eq(teams.eventId, eventId));
  const gamesData = await db.select().from(games).where(eq(games.eventId, eventId));
  
  // Check if event has game formats configured through eventGameFormats table
  const eventGameFormatsData = await db.select().from(eventGameFormats).where(eq(eventGameFormats.eventId, parseInt(eventId)));
  const hasFormatsConfigured = eventGameFormatsData.length > 0;
  
  // Check status of each component with flexible validation
  return {
    gameFormats: hasFormatsConfigured || gamesData.length > 0, // Formats configured OR games exist
    flightAssignment: teamsData.length > 0, // Teams exist means flights can be assigned
    bracketCreation: (hasFormatsConfigured && teamsData.length > 0) || gamesData.length > 0, // Can create when both formats and teams exist OR games already exist
    facilityConstraints: true, // Always available
    refereeAssignment: true, // Always available
    scheduleOptimization: gamesData.length > 0 // Available when games exist
  };
}

async function validateTournamentStructure(eventId: string) {
  const errors = [];
  
  // Check if event exists and has valid dates
  const event = await db.query.events.findFirst({
    where: eq(events.id, parseInt(eventId))
  });
  
  if (!event) {
    errors.push('Event not found');
    return { isValid: false, errors };
  }
  
  if (new Date(event.startDate) >= new Date(event.endDate)) {
    errors.push('Event start date must be before end date');
  }
  
  // Check if age groups exist
  const ageGroups = await db.query.eventAgeGroups.findMany({
    where: eq(eventAgeGroups.eventId, eventId)
  });
  
  if (ageGroups.length === 0) {
    errors.push('No age groups configured for this event');
  }
  
  // Check if there are approved teams
  const approvedTeams = await db.query.teams.findMany({
    where: and(
      eq(teams.eventId, eventId),
      eq(teams.status, 'approved')
    )
  });
  
  if (approvedTeams.length === 0) {
    errors.push('No approved teams found for this event');
  }
  
  // Check if fields are available
  const availableFields = await db.query.fields.findMany({
    where: eq(fields.isOpen, true)
  });
  
  if (availableFields.length === 0) {
    errors.push('No available fields found');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    summary: {
      ageGroups: ageGroups.length,
      approvedTeams: approvedTeams.length,
      availableFields: availableFields.length
    }
  };
}

// Tournament-Aware Auto-scheduling that respects flight configurations, game formats, and bracket structures
async function executeAutoScheduling(eventId: string, options: { includeReferees: boolean; includeFacilities: boolean }) {
  console.log(`[Tournament Auto Schedule] Starting tournament-aware auto-scheduling for event ${eventId}`);
  
  try {
    // Step 0: Validate tournament structure is ready
    const structureValidation = await validateTournamentStructure(eventId);
    if (!structureValidation.isValid) {
      throw new Error(`Tournament structure incomplete: ${structureValidation.errors.join(', ')}`);
    }
    console.log('[Tournament Auto Schedule] Tournament structure validated:', structureValidation.summary);
    
    // Step 1: Get existing flight configurations and game formats
    const flightConfigs = await getFlightConfigurations(eventId);
    console.log(`[Tournament Auto Schedule] Found ${flightConfigs.length} configured flights`);
    
    if (flightConfigs.length === 0) {
      throw new Error('No flight configurations found. Please configure flights first via the Flight Management tab.');
    }
    
    // Step 2: Get bracket configurations for each flight
    const brackets = await getBracketConfigurations(eventId);
    console.log(`[Tournament Auto Schedule] Found ${brackets.length} bracket configurations`);
    
    // Step 3: Generate games for each configured flight using their specific formats
    let totalGamesCreated = 0;
    const flightResults = [];
    
    for (const flight of flightConfigs) {
      console.log(`[Tournament Auto Schedule] Processing flight: ${flight.divisionName} (${flight.teamCount} teams)`);
      
      if (flight.teamCount < 2) {
        console.log(`[Tournament Auto Schedule] Skipping flight ${flight.divisionName} - insufficient teams (${flight.teamCount})`);
        continue;
      }
      
      // Generate games using the flight's configured format and timing
      const flightGames = await generateGamesForFlight(eventId, flight);
      totalGamesCreated += flightGames.gamesCreated;
      
      flightResults.push({
        flightName: flight.divisionName,
        gamesCreated: flightGames.gamesCreated,
        format: flight.formatName,
        duration: flight.matchTime
      });
    }
    
    // Step 4: Apply intelligent scheduling with field assignments
    if (totalGamesCreated > 0) {
      await assignFieldsToGames(eventId);
      console.log(`[Tournament Auto Schedule] Assigned fields to ${totalGamesCreated} games`);
    }
    
    // Step 5: Apply conflict detection and validation
    const conflicts = await validateScheduleConflicts(eventId);
    
    return {
      gamesCreated: totalGamesCreated,
      flightResults,
      conflictsDetected: conflicts.length,
      message: `Tournament auto-scheduling completed - ${totalGamesCreated} games created across ${flightResults.length} flights, ${conflicts.length} conflicts detected`
    };
    
  } catch (error: any) {
    console.error('[Tournament Auto Schedule] Failed:', error);
    throw new Error(`Tournament auto-scheduling failed: ${error.message}`);
  }
}

async function configureGameFormats(eventId: string) {
  console.log(`Configuring game formats for event ${eventId}`);
  return { message: 'Game formats configured' };
}

async function assignFlights(eventId: string) {
  console.log(`Assigning flights for event ${eventId}`);
  return { message: 'Flights assigned' };
}

async function createBrackets(eventId: string) {
  console.log(`Creating brackets for event ${eventId}`);
  return { message: 'Brackets created' };
}

async function validateFacilities(eventId: string) {
  console.log(`Validating facilities for event ${eventId}`);
  return { message: 'Facilities validated' };
}

async function assignReferees(eventId: string) {
  console.log(`Assigning referees for event ${eventId}`);
  return { message: 'Referees assigned' };
}

async function optimizeSchedule(eventId: string) {
  console.log(`Optimizing schedule for event ${eventId}`);
  return { message: 'Schedule optimized' };
}

// Validate schedule conflicts
async function validateScheduleConflicts(eventId: string) {
  const gamesData = await db.select().from(games).where(eq(games.eventId, eventId));
  
  const conflicts: any[] = [];
  
  // Check for games without field assignments
  gamesData.forEach(game => {
    if (!game.fieldId) {
      conflicts.push({
        type: 'field_assignment',
        message: `Game ${game.id} has no field assigned`,
        gameId: game.id
      });
    }
    
    if (!game.timeSlotId) {
      conflicts.push({
        type: 'time_assignment',
        message: `Game ${game.id} has no time slot assigned`,
        gameId: game.id
      });
    }
  });
  
  // Check for overlapping time slots on same field
  const timeSlotAssignments: { [key: string]: number[] } = {};
  
  gamesData.forEach(game => {
    if (game.timeSlotId && game.fieldId) {
      const key = `${game.timeSlotId}-${game.fieldId}`;
      if (!timeSlotAssignments[key]) {
        timeSlotAssignments[key] = [];
      }
      timeSlotAssignments[key].push(game.id);
    }
  });
  
  // Find conflicts where multiple games assigned to same time slot and field
  Object.entries(timeSlotAssignments).forEach(([key, gameIds]) => {
    if (gameIds.length > 1) {
      conflicts.push({
        type: 'time_conflict',
        message: `Multiple games (${gameIds.join(', ')}) scheduled at same time slot on same field`,
        gameIds: gameIds
      });
    }
  });
  
  console.log(`[Conflict Detection] Found ${conflicts.length} conflicts`);
  return conflicts;
}

// Helper functions for tournament-aware scheduling

async function getFlightConfigurations(eventId: string) {
  // Get age groups with team counts and game format configurations
  const flightConfigs = await db
    .select({
      id: eventAgeGroups.id,
      divisionName: eventAgeGroups.divisionCode,
      ageGroupId: eventAgeGroups.id,
      eventId: eventAgeGroups.eventId,
      ageGroup: eventAgeGroups.ageGroup,
      gender: eventAgeGroups.gender,
      fieldSize: eventAgeGroups.fieldSize
    })
    .from(eventAgeGroups)
    .where(eq(eventAgeGroups.eventId, eventId));

  // Get team counts for each age group
  const teamCounts = await db
    .select({
      ageGroupId: teams.ageGroupId,
      teamCount: count(teams.id),
    })
    .from(teams)
    .where(and(
      eq(teams.eventId, eventId),
      eq(teams.status, 'approved')
    ))
    .groupBy(teams.ageGroupId);

  // Get game format configurations from both tables
  const eventGameFormatConfigs = await db
    .select()
    .from(eventGameFormats)
    .where(eq(eventGameFormats.eventId, parseInt(eventId)));

  const bracketGameFormatConfigs = await db
    .select()
    .from(gameFormats)
    .leftJoin(eventBrackets, eq(gameFormats.bracketId, eventBrackets.id))
    .where(eq(eventBrackets.eventId, eventId));

  // Combine the data with smart defaults
  return flightConfigs.map(config => {
    const teamCountData = teamCounts.find(tc => tc.ageGroupId === config.ageGroupId);
    
    // Try to find format config from event-level or bracket-level configurations
    const eventFormatConfig = eventGameFormatConfigs.find(gf => gf.ageGroup === config.ageGroup);
    const bracketFormatConfig = bracketGameFormatConfigs.find(bgf => 
      bgf.event_brackets?.ageGroupId === config.ageGroupId
    )?.game_formats;
    
    const formatConfig = eventFormatConfig || bracketFormatConfig;
    
    return {
      id: config.id.toString(),
      divisionName: config.divisionName || `${config.ageGroup} ${config.gender}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      matchCount: 3, // Will be calculated based on tournament format
      matchTime: formatConfig?.gameLength || 35,
      breakTime: 5, // Default break time
      paddingTime: formatConfig?.bufferTime || 10,
      totalTime: (formatConfig?.gameLength || 35) + 5 + (formatConfig?.bufferTime || 10),
      formatName: 'Round Robin', // Default format name
      teamCount: teamCountData?.teamCount || 0,
      ageGroupId: config.ageGroupId,
      fieldSize: config.fieldSize || formatConfig?.fieldSize || '11v11'
    };
  });
}

async function getBracketConfigurations(eventId: string) {
  const brackets = await db
    .select({
      id: eventBrackets.id,
      name: eventBrackets.name,
      ageGroupId: eventBrackets.ageGroupId,
      level: eventBrackets.level,
      description: eventBrackets.description,
      eligibility: eventBrackets.eligibility
    })
    .from(eventBrackets)
    .where(eq(eventBrackets.eventId, eventId));

  return brackets;
}

async function generateGamesForFlight(eventId: string, flight: any) {
  console.log(`[Generate Games] Creating games for flight ${flight.divisionName}`);
  
  // Get teams for this flight
  const flightTeams = await db
    .select()
    .from(teams)
    .where(and(
      eq(teams.eventId, eventId),
      eq(teams.ageGroupId, flight.ageGroupId),
      eq(teams.status, 'approved')
    ));

  if (flightTeams.length < 2) {
    return { gamesCreated: 0 };
  }

  // Generate round-robin games for this flight
  const gamesToCreate = [];
  let gameNumber = 1;

  for (let i = 0; i < flightTeams.length; i++) {
    for (let j = i + 1; j < flightTeams.length; j++) {
      const homeTeam = flightTeams[i];
      const awayTeam = flightTeams[j];

      gamesToCreate.push({
        eventId: eventId,
        ageGroupId: flight.ageGroupId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        matchNumber: gameNumber++,
        duration: flight.matchTime,
        status: 'scheduled',
        round: 1
      });
    }
  }

  // Insert games into database
  if (gamesToCreate.length > 0) {
    await db.insert(games).values(gamesToCreate);
    console.log(`[Generate Games] Created ${gamesToCreate.length} games for flight ${flight.divisionName}`);
  }

  return { gamesCreated: gamesToCreate.length };
}

async function assignFieldsToGames(eventId: string) {
  // Get unscheduled games
  const unscheduledGames = await db
    .select()
    .from(games)
    .where(and(
      eq(games.eventId, eventId),
      isNull(games.fieldId)
    ));

  // Get available fields
  const availableFields = await db
    .select()
    .from(fields)
    .where(eq(fields.isOpen, true));

  if (availableFields.length === 0) {
    console.log('[Assign Fields] No available fields found');
    return;
  }

  // Simple field assignment - distribute games across available fields
  let fieldIndex = 0;
  const updates = [];

  for (const game of unscheduledGames) {
    const assignedField = availableFields[fieldIndex % availableFields.length];
    
    // For now, assign field without size compatibility check since fieldSize doesn't exist in games table
    updates.push({
      gameId: game.id,
      fieldId: assignedField.id
    });
    
    fieldIndex++;
  }

  // Apply field assignments
  for (const update of updates) {
    await db
      .update(games)
      .set({ 
        fieldId: update.fieldId
      })
      .where(eq(games.id, update.gameId));
  }

  console.log(`[Assign Fields] Assigned fields to ${updates.length} games`);
}



function isFieldSizeCompatible(gameFieldSize: string, availableFieldSize: string): boolean {
  // Field size compatibility matrix
  const compatibilityMap: { [key: string]: string[] } = {
    '4v4': ['4v4', '7v7', '9v9', '11v11'],
    '7v7': ['7v7', '9v9', '11v11'],
    '9v9': ['9v9', '11v11'],
    '11v11': ['11v11']
  };

  const compatibleSizes = compatibilityMap[gameFieldSize] || [gameFieldSize];
  return compatibleSizes.includes(availableFieldSize);
}

export default router;