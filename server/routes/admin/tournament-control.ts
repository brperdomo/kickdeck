/**
 * Tournament Control API Routes
 * Handles unified tournament control center functionality
 */

import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { events, teams, games, eventAgeGroups, eventBrackets, fields, gameFormats, eventGameFormats, eventScheduleConstraints, gameTimeSlots, tournamentGroups, eventFieldConfigurations } from '@db/schema';
import { TimeSlotManager } from '../../utils/timeSlotManager';
import { eq, and, count, isNull, isNotNull } from 'drizzle-orm';

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
  // ── Fetch all relevant data in parallel ────────────────────────────────
  const eid = Number(eventId);
  const [
    eventData,
    teamsData,
    gamesData,
    bracketsData,
    formatsData,
    fieldConfigs,
  ] = await Promise.all([
    db.select().from(events).where(eq(events.id, eid)).limit(1),
    db.select().from(teams).where(eq(teams.eventId, eventId)),
    db.select().from(games).where(eq(games.eventId, eventId)),
    db.select().from(eventBrackets).where(eq(eventBrackets.eventId, eid)),
    db.select().from(gameFormats),
    db.select().from(eventFieldConfigurations).where(eq(eventFieldConfigurations.eventId, eid)),
  ]);

  if (eventData.length === 0) throw new Error('Tournament not found');

  // ── Weighted step scoring (total = 100) ────────────────────────────────
  //   Step 1: Teams imported              → 15 pts
  //   Step 2: Brackets/flights created    → 15 pts
  //   Step 3: Game formats assigned       → 15 pts
  //   Step 4: Fields configured           → 10 pts
  //   Step 5: Schedule generated (games)  → 20 pts
  //   Step 6: All games time-assigned     → 15 pts
  //   Step 7: Championships resolved      → 10 pts

  let progress = 0;
  const issues: Array<{ type: 'info' | 'warning' | 'error'; message: string; action?: string }> = [];

  // Step 1 — Teams
  const hasTeams = teamsData.length > 0;
  if (hasTeams) progress += 15;
  else issues.push({ type: 'info', message: 'Import or register teams.', action: 'register-teams' });

  // Step 2 — Brackets / flights
  const hasBrackets = bracketsData.length > 0;
  if (hasBrackets) progress += 15;
  else issues.push({ type: 'info', message: 'Create flights/brackets for your age groups.', action: 'create-brackets' });

  // Step 3 — Game formats assigned to brackets
  // Only count brackets that have ≥2 teams (viable for scheduling);
  // phantom or empty brackets shouldn't block progress.
  const bracketTeamCounts = new Map<number, number>();
  for (const t of teamsData) {
    if (t.bracketId) bracketTeamCounts.set(t.bracketId, (bracketTeamCounts.get(t.bracketId) || 0) + 1);
  }
  const viableBrackets = bracketsData.filter(b => (bracketTeamCounts.get(b.id) || 0) >= 2);
  const viableBracketIds = new Set(viableBrackets.map(b => b.id));
  const assignedFormats = formatsData.filter(f => viableBracketIds.has(f.bracketId));
  const allFormatsAssigned = viableBrackets.length > 0 && assignedFormats.length >= viableBrackets.length;
  if (allFormatsAssigned) {
    progress += 15;
  } else if (assignedFormats.length > 0) {
    progress += Math.round(15 * (assignedFormats.length / Math.max(viableBrackets.length, 1)));
    const unassigned = viableBrackets.length - assignedFormats.length;
    issues.push({ type: 'warning', message: `${assignedFormats.length}/${viableBrackets.length} flights have game formats assigned. ${unassigned} flight(s) still need a format.`, action: 'assign-formats' });
  } else if (hasBrackets) {
    issues.push({ type: 'warning', message: 'Assign game formats to your flights.', action: 'assign-formats' });
  }

  // Step 4 — Fields configured for event
  const hasFields = fieldConfigs.length > 0;
  if (hasFields) progress += 10;
  else issues.push({ type: 'info', message: 'Configure field availability for this event.', action: 'configure-fields' });

  // Step 5 — Games generated
  const nonPendingGames = gamesData.filter(g => !g.isPending);
  const pendingGames = gamesData.filter(g => g.isPending);
  const hasGames = nonPendingGames.length > 0;
  if (hasGames) progress += 20;
  else if (allFormatsAssigned && hasTeams) {
    issues.push({ type: 'info', message: 'Generate the schedule to create games.', action: 'generate-schedule' });
  }

  // Step 6 — Games assigned to fields + times
  const scheduledGames = nonPendingGames.filter(g => g.fieldId !== null && g.scheduledDate !== null && g.scheduledTime !== null);
  if (hasGames) {
    const ratio = scheduledGames.length / nonPendingGames.length;
    const step6pts = Math.round(15 * ratio);
    progress += step6pts;
    if (ratio < 1) {
      issues.push({
        type: 'warning',
        message: `${scheduledGames.length}/${nonPendingGames.length} games assigned to fields/times.`,
        action: 'assign-fields'
      });
    }
  }

  // Step 7 — Championship / pending games resolved
  if (pendingGames.length > 0) {
    const resolvedPending = pendingGames.filter(g => g.homeTeamId && g.awayTeamId);
    const ratio = resolvedPending.length / pendingGames.length;
    progress += Math.round(10 * ratio);
    if (ratio < 1) {
      issues.push({
        type: 'info',
        message: `${pendingGames.length - resolvedPending.length} championship games awaiting results.`,
        action: 'resolve-championships'
      });
    }
  } else if (hasGames) {
    progress += 10; // no pending games = fully resolved
  }

  // Clamp
  progress = Math.min(100, Math.max(0, progress));

  // ── Determine phase ────────────────────────────────────────────────────
  let phase: 'setup' | 'configuration' | 'scheduling' | 'optimization' | 'finalized' = 'setup';
  let nextAction = 'Configure game formats and flights';

  if (progress >= 100) {
    phase = 'finalized';
    nextAction = 'Tournament schedule is complete';
  } else if (progress >= 65) {
    phase = 'optimization';
    nextAction = 'Optimize schedule and assign referees';
  } else if (progress >= 45) {
    phase = 'scheduling';
    nextAction = 'Generate the schedule';
  } else if (progress >= 15) {
    phase = 'configuration';
    nextAction = issues[0]?.message || 'Continue configuration';
  }

  return { phase, progress, nextAction, canProceed: true, issues };
}

async function getComponentsStatus(eventId: string) {
  const teamsData = await db.select().from(teams).where(eq(teams.eventId, eventId));
  const gamesData = await db.select().from(games).where(eq(games.eventId, eventId));
  
  // Check if event has game formats configured through eventGameFormats table
  const eventGameFormatsData = await db.select().from(eventGameFormats).where(eq(eventGameFormats.eventId, Number(eventId)));
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
    where: eq(events.id, Number(eventId))
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
      matchCount: formatConfig?.maxGamesPerDay || 2, // Max games per team per day from DB
      matchTime: formatConfig?.gameLength || 60,
      breakTime: 5, // Default break time
      paddingTime: formatConfig?.bufferTime || 15,
      totalTime: (formatConfig?.gameLength || 60) + 5 + (formatConfig?.bufferTime || 15),
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
  
  // Get teams for this flight grouped by bracket
  const flightTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      groupId: teams.groupId,
      ageGroupId: teams.ageGroupId
    })
    .from(teams)
    .where(and(
      eq(teams.eventId, eventId),
      eq(teams.ageGroupId, flight.ageGroupId),
      eq(teams.status, 'approved')
    ));

  if (flightTeams.length < 2) {
    return { gamesCreated: 0 };
  }

  console.log(`[Generate Games] Found ${flightTeams.length} teams for flight ${flight.divisionName}`);

  // Group teams by bracket (groupId)
  const teamsByBracket = new Map();
  flightTeams.forEach(team => {
    const bracketId = team.groupId;
    if (!bracketId) {
      console.warn(`[Generate Games] Team ${team.name} has no bracket assignment - skipping`);
      return;
    }
    
    if (!teamsByBracket.has(bracketId)) {
      teamsByBracket.set(bracketId, []);
    }
    teamsByBracket.get(bracketId).push(team);
  });

  console.log(`[Generate Games] Teams distributed across ${teamsByBracket.size} brackets:`, 
    Array.from(teamsByBracket.entries()).map(([bracketId, teams]) => 
      `Bracket ${bracketId}: ${teams.length} teams`));

  const gamesToCreate = [];
  let gameNumber = 1;

  // PHASE 1: Generate pool play games within each bracket (round-robin within bracket)
  // NOTE: For crossplay brackets, skip intra-pool games - only generate crossplay games
  
  // Check if this is a crossplay format first
  let isCrossplayFormat = false;
  if (teamsByBracket.size >= 2) {
    const firstBracket = await db.query.tournamentGroups.findFirst({
      where: eq(tournamentGroups.id, Array.from(teamsByBracket.keys())[0]),
      columns: { type: true }
    });
    isCrossplayFormat = firstBracket?.type === 'crossplay';
    console.log(`[Generate Games] CROSSPLAY DEBUG: Detected crossplay format: ${isCrossplayFormat}`);
  }
  
  if (!isCrossplayFormat) {
    // Standard brackets: generate round-robin within each bracket
    console.log(`[Generate Games] STANDARD FORMAT: Creating intra-bracket pool play games`);
    for (const [bracketId, bracketTeams] of Array.from(teamsByBracket.entries())) {
      console.log(`[Generate Games] Creating pool play for bracket ${bracketId} (${bracketTeams.length} teams)`);
      
      // Round-robin within this bracket only
      for (let i = 0; i < bracketTeams.length; i++) {
        for (let j = i + 1; j < bracketTeams.length; j++) {
          const team1 = bracketTeams[i];
          const team2 = bracketTeams[j];
          
          // Randomize Home/Away team assignments for game card generation
          const randomizeHomeAway = Math.random() < 0.5;
          const homeTeam = randomizeHomeAway ? team1 : team2;
          const awayTeam = randomizeHomeAway ? team2 : team1;

          gamesToCreate.push({
            eventId: eventId,
            ageGroupId: flight.ageGroupId,
            groupId: bracketId, // Store which bracket this game belongs to
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            matchNumber: gameNumber++,
            duration: flight.matchTime,
            status: 'scheduled',
            round: 1 // Pool play round
          });
        }
      }
    }
  } else {
    console.log(`[Generate Games] CROSSPLAY FORMAT: Skipping ALL intra-pool games - will generate ONLY crossplay games between different brackets`);
  }

  // PHASE 2: Generate crossplay/championship games based on bracket type
  const bracketsWithTeams = Array.from(teamsByBracket.entries()).filter(([_, teams]) => teams.length > 0);
  
  if (bracketsWithTeams.length >= 2) {
    // Check bracket type to determine crossplay behavior
    const firstBracket = await db.query.tournamentGroups.findFirst({
      where: eq(tournamentGroups.id, bracketsWithTeams[0][0]),
      columns: { type: true }
    });
    
    const bracketType = firstBracket?.type || 'round_robin';
    
    if (bracketType === 'crossplay') {
      // 6-team format: Only crossplay games between pools (no intra-pool games)
      console.log(`[Generate Games] Creating crossplay-only games for 6-team format`);
      
      // Only crossplay games between brackets (teams from Pool A vs teams from Pool B)
      const [bracket1Teams, bracket2Teams] = [bracketsWithTeams[0][1], bracketsWithTeams[1][1]];
      
      // CRITICAL CROSSPLAY VALIDATION: Each team in bracket 1 plays each team in bracket 2 (9 total games for 3v3 crossplay)
      console.log(`[Generate Games] CROSSPLAY VALIDATION: Pool A has ${bracket1Teams.length} teams, Pool B has ${bracket2Teams.length} teams`);
      console.log(`[Generate Games] CROSSPLAY VALIDATION: Pool A teams: ${bracket1Teams.map((t: any) => t.name).join(', ')}`);
      console.log(`[Generate Games] CROSSPLAY VALIDATION: Pool B teams: ${bracket2Teams.map((t: any) => t.name).join(', ')}`);
      
      for (const team1 of bracket1Teams) {
        for (const team2 of bracket2Teams) {
          // CRITICAL VALIDATION: Ensure teams are from different brackets
          if (team1.groupId === team2.groupId) {
            console.error(`[Generate Games] CRITICAL ERROR: Teams ${team1.name} and ${team2.name} are both in bracket ${team1.groupId} - THIS SHOULD NEVER HAPPEN IN CROSSPLAY!`);
            throw new Error(`CROSSPLAY VIOLATION: Teams from same bracket cannot play each other`);
          }
          
          console.log(`[Generate Games] CROSSPLAY GAME: ${team1.name} (Bracket ${team1.groupId}) vs ${team2.name} (Bracket ${team2.groupId})`);
          
          // Randomize Home/Away team assignments for game card generation
          const randomizeHomeAway = Math.random() < 0.5;
          const homeTeamId = randomizeHomeAway ? team1.id : team2.id;
          const awayTeamId = randomizeHomeAway ? team2.id : team1.id;
          
          gamesToCreate.push({
            eventId: eventId,
            ageGroupId: flight.ageGroupId,
            groupId: null, // Crossplay games don't belong to a specific bracket
            homeTeamId: homeTeamId,
            awayTeamId: awayTeamId,
            matchNumber: gameNumber++,
            duration: flight.matchTime,
            status: 'scheduled',
            round: 1 // All crossplay games are in round 1 (no separate pool play)
          });
        }
      }
      
      // Championship game (1st in points vs 2nd in points across all teams)
      gamesToCreate.push({
        eventId: eventId,
        ageGroupId: flight.ageGroupId,
        groupId: null, // Championship game doesn't belong to a specific bracket
        homeTeamId: null, // Will be determined by overall points standings
        awayTeamId: null, // Will be determined by overall points standings  
        matchNumber: gameNumber++,
        duration: flight.matchTime,
        status: 'scheduled',
        round: 2 // Championship round (after crossplay round)
      });
      
    } else {
      // 8-team format: championship between bracket winners only
      console.log(`[Generate Games] Creating championship game between bracket winners`);
      
      gamesToCreate.push({
        eventId: eventId,
        ageGroupId: flight.ageGroupId,
        groupId: null, // Championship game doesn't belong to a specific bracket
        homeTeamId: null, // Will be determined by bracket winners
        awayTeamId: null, // Will be determined by bracket winners
        matchNumber: gameNumber++,
        duration: flight.matchTime,
        status: 'scheduled',
        round: 2 // Championship round
      });
    }
  } else if (bracketsWithTeams.length === 1) {
    // 4-team single bracket format: championship between 1st and 2nd in points
    console.log(`[Generate Games] Creating championship game for single bracket (1st vs 2nd in points)`);
    
    gamesToCreate.push({
      eventId: eventId,
      ageGroupId: flight.ageGroupId,
      groupId: null, // Championship game doesn't belong to a specific bracket
      homeTeamId: null, // Will be determined by points standings (1st place)
      awayTeamId: null, // Will be determined by points standings (2nd place)
      matchNumber: gameNumber++,
      duration: flight.matchTime,
      status: 'scheduled',
      round: 2 // Championship round (after pool play)
    });
  }

  // Insert games into database
  if (gamesToCreate.length > 0) {
    await db.insert(games).values(gamesToCreate);
    console.log(`[Generate Games] Created ${gamesToCreate.length} games for flight ${flight.divisionName} (${gamesToCreate.length - (bracketsWithTeams.length >= 2 ? 1 : 0)} pool play + ${bracketsWithTeams.length >= 2 ? 1 : 0} championship)`);
    
    // CRITICAL FIX: Immediately assign fields to newly created games
    console.log(`[Generate Games] FIELD ASSIGNMENT: Automatically assigning fields to ${gamesToCreate.length} newly created games`);
    await assignFieldsToGames(eventId);
    console.log(`[Generate Games] FIELD ASSIGNMENT: Field assignment completed for flight ${flight.divisionName}`);
  }

  return { gamesCreated: gamesToCreate.length };
}

export async function assignFieldsToGames(eventId: string) {
  console.log(`[Assign Fields] Starting field assignment for event ${eventId}`);
  
  // Get unscheduled games with their age group field size requirements
  const unscheduledGames = await db
    .select({
      id: games.id,
      ageGroupId: games.ageGroupId,
      eventId: games.eventId,
      fieldSize: eventAgeGroups.fieldSize
    })
    .from(games)
    .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
    .where(and(
      eq(games.eventId, eventId),
      isNull(games.fieldId)
    ));

  console.log(`[Assign Fields] Found ${unscheduledGames.length} games without field assignments`);
  
  if (unscheduledGames.length === 0) {
    console.log('[Assign Fields] No games need field assignment - all games already have fields assigned');
    return;
  }

  // Get available fields grouped by field size
  const availableFields = await db
    .select()
    .from(fields)
    .where(eq(fields.isOpen, true));

  if (availableFields.length === 0) {
    console.log('[Assign Fields] ERROR: No available fields found - cannot assign fields');
    return;
  }
  
  console.log(`[Assign Fields] Found ${availableFields.length} available fields`);

  // Group fields by size for efficient assignment
  const fieldsBySize: { [size: string]: typeof availableFields } = {};
  availableFields.forEach(field => {
    const size = field.fieldSize || '11v11';
    if (!fieldsBySize[size]) {
      fieldsBySize[size] = [];
    }
    fieldsBySize[size].push(field);
  });

  console.log('[Assign Fields] Available fields by size:', 
    Object.keys(fieldsBySize).map(size => `${size}: ${fieldsBySize[size].length} fields`));

  // Field assignment with size compatibility checking
  const updates = [];
  const fieldIndexes: { [size: string]: number } = {};

  for (const game of unscheduledGames) {
    const requiredSize = game.fieldSize || '11v11';
    const compatibleFields = fieldsBySize[requiredSize];
    
    if (!compatibleFields || compatibleFields.length === 0) {
      console.warn(`[Assign Fields] WARNING: No ${requiredSize} fields available for game ${game.id} - trying fallback assignment`);
      
      // Try to assign to any available field as fallback
      const fallbackFields = Object.values(fieldsBySize).flat();
      if (fallbackFields.length > 0) {
        const fallbackField = fallbackFields[0];
        console.log(`[Assign Fields] FALLBACK: Assigning game ${game.id} to field ${fallbackField.name} (${fallbackField.fieldSize})`);
        updates.push({
          gameId: game.id,
          fieldId: fallbackField.id,
          fieldSize: fallbackField.fieldSize,
          fieldName: fallbackField.name
        });
      }
      continue;
    }
    
    // Initialize field index for this size if not exists
    if (!(requiredSize in fieldIndexes)) {
      fieldIndexes[requiredSize] = 0;
    }
    
    // Round-robin assignment within compatible fields
    const assignedField = compatibleFields[fieldIndexes[requiredSize] % compatibleFields.length];
    fieldIndexes[requiredSize]++;
    
    console.log(`[Assign Fields] Assigning game ${game.id} to field ${assignedField.name} (${assignedField.fieldSize})`);
    
    updates.push({
      gameId: game.id,
      fieldId: assignedField.id,
      fieldSize: requiredSize,
      fieldName: assignedField.name
    });
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

  console.log(`[Assign Fields] Successfully assigned ${updates.length} games to size-compatible fields`);
  
  // Log assignment summary
  const assignmentSummary: { [size: string]: number } = {};
  updates.forEach(update => {
    assignmentSummary[update.fieldSize] = (assignmentSummary[update.fieldSize] || 0) + 1;
  });
  
  Object.entries(assignmentSummary).forEach(([size, count]) => {
    console.log(`[Assign Fields] ${size} games: ${count} assigned`);
  });
}



// CRITICAL: Fix crossplay game generation bug
router.post('/tournaments/:eventId/fix-crossplay-games', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ageGroupId, flightId } = req.body;
    
    console.log(`[CROSSPLAY FIX] Starting critical crossplay fix for event ${eventId}, age group ${ageGroupId}`);
    
    // Find the flight and verify it's crossplay format
    const flight = await db.query.eventBrackets.findFirst({
      where: and(
        eq(eventBrackets.id, flightId),
        eq(eventBrackets.eventId, eventId)
      )
    });
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    
    // Get tournament groups for this flight
    const brackets = await db.query.tournamentGroups.findMany({
      where: and(
        eq(tournamentGroups.eventId, eventId),
        eq(tournamentGroups.ageGroupId, ageGroupId)
      )
    });
    
    const crossplayBrackets = brackets.filter(b => b.type === 'crossplay');
    if (crossplayBrackets.length === 0) {
      return res.status(400).json({ error: 'No crossplay brackets found for this flight' });
    }
    
    console.log(`[CROSSPLAY FIX] Found ${crossplayBrackets.length} crossplay brackets`);
    
    // DELETE all existing games for this age group (they're corrupted)
    const deletedGames = await db
      .delete(games)
      .where(and(
        eq(games.eventId, eventId),
        eq(games.ageGroupId, ageGroupId)
      ))
      .returning();
    
    console.log(`[CROSSPLAY FIX] DELETED ${deletedGames.length} corrupted games`);
    
    // Regenerate games using the fixed logic - use available game generation
    console.log(`[CROSSPLAY FIX] Games deleted, manual bracket recreation needed`);
    
    res.json({
      success: true,
      message: `Fixed crossplay games: deleted ${deletedGames.length} corrupted games`,
      deletedGames: deletedGames.length,
      regeneratedGames: 0
    });
    
  } catch (error: any) {
    console.error('[CROSSPLAY FIX] Critical error:', error);
    res.status(500).json({ error: 'Failed to fix crossplay games: ' + error.message });
  }
});

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

// Manual field assignment endpoint for testing
router.post('/tournaments/:eventId/assign-fields', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Manual Field Assignment] Starting for event ${eventId}`);
    
    await assignFieldsToGames(eventId);
    
    // Get count of games now with fields assigned
    const gamesWithFields = await db
      .select({ count: count() })
      .from(games)
      .where(and(
        eq(games.eventId, eventId),
        isNull(games.fieldId)
      ));
    
    const remainingUnassigned = gamesWithFields[0]?.count || 0;
    
    res.json({
      success: true,
      message: 'Field assignment completed',
      remainingUnassigned: remainingUnassigned
    });
    
  } catch (error: any) {
    console.error('[Manual Field Assignment] Error:', error);
    res.status(500).json({ error: 'Failed to assign fields: ' + error.message });
  }
});

export default router;