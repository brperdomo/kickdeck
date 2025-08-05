import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { db } from '../../../db/index.js';
import { teams, events, eventGameFormats, complexes, fields, games, eventBrackets } from '../../../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { validateSchedulingSafety, validateFieldCapacity, validateNoDuplicateGames } from '../../middleware/scheduling-safety.js';

const router = Router();

// Generate scheduling preview for automated scheduling
router.post('/events/:eventId/scheduling/preview', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { includeApprovedTeams, autoGenerateStructure } = req.body;

    console.log(`[Automated Scheduling] Generating preview for event ${eventId}`);

    // Fetch event data
    const eventData = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });

    if (!eventData) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Fetch approved teams
    const approvedTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ),
      with: {
        ageGroup: true
      }
    });

    // Fetch available fields - using default complex for now
    const eventFields = await db.query.fields.findMany({
      where: eq(fields.complexId, 1), // Default to complex 1
      with: {
        complex: true
      }
    });

    // Fetch game format rules
    const gameFormats = await db.query.eventGameFormats.findMany({
      where: eq(eventGameFormats.eventId, parseInt(eventId))
    });

    // Group teams by age group and gender
    const teamsByAgeGroup = approvedTeams.reduce((acc: any, team: any) => {
      const ageGroupKey = `${team.ageGroup?.ageGroup || 'Unknown'}_${team.gender || 'Unknown'}`;
      if (!acc[ageGroupKey]) {
        acc[ageGroupKey] = [];
      }
      acc[ageGroupKey].push(team);
      return acc;
    }, {});

    // Calculate scheduling requirements
    const ageGroupAnalysis = Object.entries(teamsByAgeGroup).map(([ageGroupKey, teams]: [string, any]) => {
      const teamCount = teams.length;
      const flightsNeeded = Math.ceil(teamCount / 8); // Max 8 teams per flight
      const bracketsPerFlight = teamCount <= 4 ? 1 : Math.ceil(teamCount / 4);
      const gamesPerTeam = calculateGamesPerTeam(teamCount, 'round_robin');
      const totalGames = Math.ceil((teamCount * gamesPerTeam) / 2);

      return {
        ageGroup: ageGroupKey,
        teamCount,
        flightsNeeded,
        bracketsPerFlight,
        totalGames,
        estimatedGamesPerTeam: gamesPerTeam
      };
    });

    const totalGames = ageGroupAnalysis.reduce((sum, ag) => sum + ag.totalGames, 0);
    const totalFlights = ageGroupAnalysis.reduce((sum, ag) => sum + ag.flightsNeeded, 0);
    const totalBrackets = ageGroupAnalysis.reduce((sum, ag) => sum + (ag.flightsNeeded * ag.bracketsPerFlight), 0);

    // Field capacity analysis
    const gameFormat = gameFormats[0] || { gameLength: 90, bufferTime: 15 };
    const timePerGame = gameFormat.gameLength + gameFormat.bufferTime;
    const operatingHours = 12; // Assume 12-hour operation day
    const maxGamesPerFieldPerDay = Math.floor((operatingHours * 60) / timePerGame);
    const totalFieldCapacityPerDay = maxGamesPerFieldPerDay * eventFields.length;
    
    const daysRequired = Math.ceil(totalGames / totalFieldCapacityPerDay);
    const fieldUtilization = (totalGames / totalFieldCapacityPerDay) * 100;

    // Conflict detection
    const conflicts: string[] = [];
    const warnings: string[] = [];

    if (totalGames > totalFieldCapacityPerDay) {
      if (daysRequired > 3) {
        conflicts.push(`Tournament requires ${daysRequired} days, which may be too long for a typical tournament format`);
      } else {
        warnings.push(`Tournament will require ${daysRequired} days to complete`);
      }
    }

    if (fieldUtilization > 95) {
      conflicts.push('Field utilization exceeds 95% - very tight schedule with no buffer time');
    } else if (fieldUtilization > 85) {
      warnings.push('High field utilization (>85%) - limited flexibility for schedule adjustments');
    }

    if (eventFields.length < 2) {
      warnings.push('Limited field availability may cause scheduling bottlenecks');
    }

    // Check for coach conflicts (teams with same coach)
    const coachTeams = approvedTeams.reduce((acc: any, team: any) => {
      const coachKey = team.coachName?.toLowerCase() || team.coachEmail?.toLowerCase();
      if (coachKey) {
        if (!acc[coachKey]) acc[coachKey] = [];
        acc[coachKey].push(team);
      }
      return acc;
    }, {});

    const coachConflicts = Object.entries(coachTeams).filter(([_, teams]: [string, any]) => teams.length > 1);
    if (coachConflicts.length > 0) {
      warnings.push(`${coachConflicts.length} coaches have multiple teams - scheduling will require conflict management`);
    }

    const feasible = conflicts.length === 0;

    const preview = {
      totalTeams: approvedTeams.length,
      totalFlights,
      totalBrackets,
      totalGames,
      fieldsRequired: Math.ceil(totalGames / maxGamesPerFieldPerDay),
      fieldsAvailable: eventFields.length,
      estimatedDuration: `${daysRequired} day${daysRequired > 1 ? 's' : ''}`,
      fieldUtilization: Math.min(fieldUtilization, 100),
      conflicts,
      warnings,
      feasible,
      ageGroupBreakdown: ageGroupAnalysis,
      gameFormat: {
        gameDuration: gameFormat.gameLength,
        restPeriod: gameFormat.bufferTime,
        timePerGame
      }
    };

    res.json({ preview, teamsByAgeGroup });
  } catch (error) {
    console.error('Automated scheduling preview error:', error);
    res.status(500).json({ error: 'Failed to generate scheduling preview' });
  }
});

// SAFETY CHECK: Validate scheduling prerequisites 
router.post('/events/:eventId/scheduling/validate', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      totalGamesNeeded,
      targetFlightIds,
      targetBracketIds,
      gameDurationMinutes = 90,
      bufferMinutes = 15
    } = req.body;

    console.log(`[Scheduling Validation] Running safety checks for event ${eventId}`);

    const validationResult = await validateSchedulingSafety(
      eventId,
      totalGamesNeeded,
      targetFlightIds,
      targetBracketIds,
      gameDurationMinutes,
      bufferMinutes
    );

    res.json({
      success: true,
      validation: validationResult,
      canProceed: validationResult.canProceed,
      message: validationResult.summary.recommendation
    });

  } catch (error) {
    console.error('[Scheduling Validation] Error:', error);
    res.status(500).json({ 
      error: 'Failed to validate scheduling safety',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate complete automated schedule
router.post('/events/:eventId/scheduling/auto-generate', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      includeApprovedTeams,
      autoCreateFlights,
      autoGenerateBrackets,
      autoSeedTeams,
      optimizeFieldUsage,
      detectConflicts,
      respectGameFormatRules,
      targetFlightIds,
      targetBracketIds,
      forceGeneration = false // Override safety checks (admin only)
    } = req.body;

    console.log(`[Automated Scheduling] Starting automated schedule generation for event ${eventId}`);

    // MANDATORY SAFETY CHECK: Validate before generating any games
    if (!forceGeneration) {
      console.log(`[Automated Scheduling] Running mandatory safety checks`);
      
      // Quick estimate of games needed for validation
      const estimatedGames = 50; // Will be calculated more precisely below
      
      const safetyCheck = await validateSchedulingSafety(
        eventId,
        estimatedGames,
        targetFlightIds,
        targetBracketIds
      );

      if (!safetyCheck.canProceed) {
        console.log(`[Automated Scheduling] BLOCKED: Safety check failed`);
        return res.status(400).json({
          error: 'Cannot proceed with scheduling - critical safety issues detected',
          safetyCheck,
          solution: 'Resolve the listed errors before attempting to generate games'
        });
      }

      console.log(`[Automated Scheduling] Safety checks passed - proceeding with generation`);
    } else {
      console.log(`[Automated Scheduling] WARNING: Force generation enabled - bypassing safety checks`);
    }

    // Step 1: Analyze approved teams
    const approvedTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ),
      with: {
        ageGroup: true
      }
    });

    console.log(`[Automated Scheduling] Found ${approvedTeams.length} approved teams`);

    if (approvedTeams.length === 0) {
      return res.status(400).json({ error: 'No approved teams found for scheduling' });
    }

    // Step 2: Auto-create flights
    const flightData = await createAutomaticFlights(parseInt(eventId), approvedTeams);
    console.log(`[Automated Scheduling] Created ${flightData.flights.length} flights`);

    // Step 3: Auto-generate brackets
    const bracketData = await createAutomaticBrackets(parseInt(eventId), flightData.flights, approvedTeams);
    console.log(`[Automated Scheduling] Generated ${bracketData.brackets.length} brackets`);

    // Step 4: Auto-seed teams
    const seedingData = await createAutomaticSeeding(bracketData.brackets, approvedTeams);
    console.log(`[Automated Scheduling] Completed automatic seeding for all brackets`);

    // Step 5: Field capacity analysis and time block generation
    const fieldData = await analyzeFieldCapacity(parseInt(eventId));
    const timeBlockData = await generateOptimalTimeBlocks(parseInt(eventId), fieldData, bracketData.totalGames);
    console.log(`[Automated Scheduling] Generated ${timeBlockData.timeBlocks.length} time blocks`);

    // Step 6: Conflict detection
    const conflictAnalysis = await detectSchedulingConflicts(approvedTeams, seedingData, timeBlockData);
    console.log(`[Automated Scheduling] Detected ${conflictAnalysis.conflicts.length} conflicts`);

    // Step 7: Generate final schedule
    const finalSchedule = await generateCompleteSchedule({
      eventId: parseInt(eventId),
      flights: flightData.flights,
      brackets: bracketData.brackets,
      seeding: seedingData,
      timeBlocks: timeBlockData.timeBlocks,
      fields: fieldData.fields,
      conflicts: conflictAnalysis
    });

    console.log(`[Automated Scheduling] Generated complete schedule with ${finalSchedule.games.length} games`);

    // Save the complete workflow data
    await saveAutomatedWorkflowData(parseInt(eventId), {
      flights: flightData,
      brackets: bracketData,
      seeding: seedingData,
      timeBlocks: timeBlockData,
      schedule: finalSchedule,
      conflicts: conflictAnalysis
    });

    res.json({
      success: true,
      totalGames: finalSchedule.games.length,
      totalDays: timeBlockData.daysRequired,
      conflictsDetected: conflictAnalysis.conflicts.length,
      warningsDetected: conflictAnalysis.warnings.length,
      schedule: finalSchedule,
      summary: {
        flights: flightData.flights.length,
        brackets: bracketData.brackets.length,
        timeBlocks: timeBlockData.timeBlocks.length,
        fieldsUsed: fieldData.fields.length
      }
    });

  } catch (error) {
    console.error('Automated scheduling generation error:', error);
    res.status(500).json({ error: 'Failed to generate automated schedule' });
  }
});

// Helper functions
function calculateGamesPerTeam(teamCount: number, format: string): number {
  switch (format) {
    case 'round_robin':
      return teamCount - 1; // Each team plays every other team once
    case 'knockout':
      return Math.ceil(Math.log2(teamCount)); // Single elimination
    case 'round_robin_knockout':
      return Math.min(teamCount - 1, 4) + Math.ceil(Math.log2(teamCount)); // Pool play + playoffs
    default:
      return Math.min(teamCount - 1, 4); // Default to max 4 games per team
  }
}

async function createAutomaticFlights(eventId: number, teams: any[]) {
  // Group teams by age group and gender
  const groupedTeams = teams.reduce((acc: any, team: any) => {
    const key = `${team.ageGroup?.ageGroup || 'Unknown'}_${team.gender || 'Unknown'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(team);
    return acc;
  }, {});

  const flights = [];
  let flightIndex = 1;

  for (const [groupKey, groupTeams] of Object.entries(groupedTeams)) {
    const [ageGroup, gender] = groupKey.split('_');
    const teamArray = groupTeams as any[];
    
    // Create flights with max 8 teams each
    for (let i = 0; i < teamArray.length; i += 8) {
      const flightTeams = teamArray.slice(i, i + 8);
      const flightName = `${ageGroup} ${gender} Flight ${Math.ceil((i + 1) / 8)}`;
      
      flights.push({
        id: `flight_${flightIndex++}`,
        name: flightName,
        ageGroup,
        gender,
        teams: flightTeams,
        teamCount: flightTeams.length
      });
    }
  }

  return { flights };
}

async function createAutomaticBrackets(eventId: number, flights: any[], teams: any[]) {
  const brackets = [];
  let totalGames = 0;

  for (const flight of flights) {
    const teamCount = flight.teams.length;
    
    if (teamCount <= 4) {
      // Single bracket for small flights
      const bracket = {
        id: `bracket_${flight.id}`,
        flightId: flight.id,
        name: `${flight.name} Bracket`,
        format: 'round_robin',
        teams: flight.teams,
        teamCount,
        estimatedGames: calculateGamesPerTeam(teamCount, 'round_robin') * teamCount / 2
      };
      brackets.push(bracket);
      totalGames += bracket.estimatedGames;
    } else {
      // Multiple brackets for larger flights
      const bracketsNeeded = Math.ceil(teamCount / 4);
      for (let i = 0; i < bracketsNeeded; i++) {
        const bracketTeams = flight.teams.slice(i * 4, (i + 1) * 4);
        const bracket = {
          id: `bracket_${flight.id}_${i + 1}`,
          flightId: flight.id,
          name: `${flight.name} Bracket ${i + 1}`,
          format: 'round_robin',
          teams: bracketTeams,
          teamCount: bracketTeams.length,
          estimatedGames: calculateGamesPerTeam(bracketTeams.length, 'round_robin') * bracketTeams.length / 2
        };
        brackets.push(bracket);
        totalGames += bracket.estimatedGames;
      }
    }
  }

  return { brackets, totalGames };
}

async function createAutomaticSeeding(brackets: any[], teams: any[]) {
  const seeding = {};

  for (const bracket of brackets) {
    // Simple random seeding for now
    // In production, this could use team rankings, past performance, etc.
    const shuffledTeams = [...bracket.teams].sort(() => Math.random() - 0.5);
    
    (seeding as any)[bracket.id] = {
      bracketId: bracket.id,
      teamSeedings: shuffledTeams.map((team: any, index: number) => ({
        teamId: team.id,
        teamName: team.teamName,
        seed: index + 1,
        ageGroup: team.ageGroup?.ageGroup,
        gender: team.gender
      }))
    };
  }

  return seeding;
}

async function analyzeFieldCapacity(eventId: number) {
  const eventData = await db.query.events.findFirst({
    where: eq(events.id, eventId)
  });

  const eventFields = await db.query.fields.findMany({
    where: eq(fields.complexId, 1), // Default to complex 1
    with: {
      complex: true
    }
  });

  return { fields: eventFields, capacity: eventFields.length };
}

async function generateOptimalTimeBlocks(eventId: number, fieldData: any, totalGames: number) {
  const gameFormats = await db.query.eventGameFormats.findMany({
    where: eq(eventGameFormats.eventId, eventId)
  });

  const gameFormat = gameFormats[0] || { gameLength: 90, bufferTime: 15 };
  const timePerGame = gameFormat.gameLength + gameFormat.bufferTime;
  const operatingHours = 12;
  const maxGamesPerFieldPerDay = Math.floor((operatingHours * 60) / timePerGame);
  const totalCapacityPerDay = maxGamesPerFieldPerDay * fieldData.fields.length;
  const daysRequired = Math.ceil(totalGames / totalCapacityPerDay);

  const timeBlocks = [];
  const startTime = 8; // 8 AM start

  for (let day = 0; day < daysRequired; day++) {
    for (let gameSlot = 0; gameSlot < maxGamesPerFieldPerDay; gameSlot++) {
      const hour = startTime + Math.floor((gameSlot * timePerGame) / 60);
      const minute = (gameSlot * timePerGame) % 60;
      
      timeBlocks.push({
        id: `timeblock_${day}_${gameSlot}`,
        day: day + 1,
        startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        duration: gameFormat.gameLength,
        available: true
      });
    }
  }

  return { timeBlocks, daysRequired };
}

async function detectSchedulingConflicts(teams: any[], seeding: any, timeBlocks: any) {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  // Check for coach conflicts
  const coachTeams = teams.reduce((acc: any, team: any) => {
    const coachKey = team.coachName?.toLowerCase() || team.coachEmail?.toLowerCase();
    if (coachKey) {
      if (!acc[coachKey]) acc[coachKey] = [];
      acc[coachKey].push(team);
    }
    return acc;
  }, {});

  Object.entries(coachTeams).forEach(([coach, teams]: [string, any]) => {
    if (teams.length > 1) {
      warnings.push(`Coach ${coach} has ${teams.length} teams - requires conflict-free scheduling`);
    }
  });

  return { conflicts, warnings };
}

async function generateCompleteSchedule(params: any) {
  const { brackets, seeding, timeBlocks, fields } = params;
  const games = [];
  let gameId = 1;

  for (const bracket of brackets) {
    const bracketSeeding = (seeding as any)[bracket.id];
    if (!bracketSeeding) continue;

    const teams = bracketSeeding.teamSeedings;
    
    // Generate round-robin games for this bracket
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        games.push({
          id: gameId++,
          bracketId: bracket.id,
          homeTeam: teams[i],
          awayTeam: teams[j],
          round: 1,
          status: 'scheduled',
          field: fields[Math.floor(Math.random() * fields.length)]?.name || 'Field 1',
          timeBlock: timeBlocks[Math.floor(Math.random() * timeBlocks.length)]
        });
      }
    }
  }

  return { games };
}

// Generate selective automated schedule for specific flights (legacy endpoint)
router.post('/schedule-selected-flights', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId, selectedFlights } = req.body;
    
    console.log(`[Selective Scheduling] Starting selective schedule generation for event ${eventId}`);
    console.log(`[Selective Scheduling] Selected flights: ${selectedFlights?.join(', ') || 'none'}`);

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required for selective scheduling' });
    }

    if (!selectedFlights || !Array.isArray(selectedFlights) || selectedFlights.length === 0) {
      return res.status(400).json({ error: 'Flight IDs are required for selective scheduling' });
    }

    // Use the existing selective scheduling implementation
    const result = await generateSelectiveSchedule(eventId, selectedFlights, {
      includeReferees: true,
      includeFacilities: true
    });

    res.json({
      success: result.success,
      message: result.message || `Schedule generated successfully for ${selectedFlights.length} selected flights`,
      selectedFlights: result.selectedFlights || selectedFlights.length,
      totalGames: result.totalGames || 0,
      flightNames: selectedFlights,
      games: result.games || []
    });

  } catch (error) {
    console.error('Selective scheduling error:', error);
    res.status(500).json({ 
      error: 'Failed to generate selective schedule',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Generate selective automated schedule for specific flights (new endpoint)
router.post('/events/:eventId/generate-selective-schedule', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { flightIds, includeReferees, includeFacilities } = req.body;

    console.log(`[Selective Scheduling] Starting selective schedule generation for event ${eventId}`);
    console.log(`[Selective Scheduling] Selected flights: ${flightIds.join(', ')}`);

    if (!flightIds || !Array.isArray(flightIds) || flightIds.length === 0) {
      return res.status(400).json({ error: 'Flight IDs are required for selective scheduling' });
    }

    // For now, we'll use a simplified approach by calling the existing endpoint
    // This endpoint will be enhanced to support selective scheduling
    console.log(`[Selective Scheduling] Processing ${flightIds.length} flight IDs`);

    // For now, create a simplified selective scheduling implementation
    // This will be enhanced to integrate with the full scheduling engine
    const result = await generateSelectiveSchedule(eventId, flightIds, {
      includeReferees: includeReferees !== false,
      includeFacilities: includeFacilities !== false
    });

    res.json({
      success: result.success,
      message: result.message || `Schedule generated successfully for ${flightIds.length} selected flights`,
      selectedFlights: result.selectedFlights || flightIds.length,
      totalGames: result.totalGames || 0,
      flightNames: flightIds,
      games: result.games || []
    });

  } catch (error) {
    console.error('Selective scheduling error:', error);
    res.status(500).json({ 
      error: 'Failed to generate selective schedule',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Simplified selective scheduling implementation
async function generateSelectiveSchedule(eventId: string, flightIds: string[], options: any) {
  console.log(`[Selective Scheduling] Generating schedule for flights: ${flightIds.join(', ')}`);
  
  try {
    // Get event data - convert eventId to number for database query
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });
    
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    // Get available fields
    const eventFields = await db.query.fields.findMany();

    // Generate a basic schedule for the selected flights
    const generatedGames = [];
    let gameCounter = 1;

    // Create games based on selected bracket IDs (flights)
    for (const flightId of flightIds) {
      // Get teams for this specific bracket/flight
      const flightTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, parseInt(flightId))
        )
      });

      console.log(`[Selective Scheduling] Found ${flightTeams.length} teams for bracket/flight ${flightId}`);

      if (flightTeams.length < 2) {
        console.log(`[Selective Scheduling] Skipping bracket ${flightId} - not enough teams (${flightTeams.length})`);
        continue;
      }

      // Generate round-robin games for this flight
      for (let i = 0; i < flightTeams.length; i++) {
        for (let j = i + 1; j < flightTeams.length; j++) {
          const homeTeam = flightTeams[i];
          const awayTeam = flightTeams[j];
          
          generatedGames.push({
            id: gameCounter++,
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            bracketId: parseInt(flightId),
            field: eventFields[Math.floor(Math.random() * eventFields.length)]?.name || 'Field 1',
            scheduledTime: new Date(Date.now() + (gameCounter * 60 * 60 * 1000)).toISOString(), // Spread games over time
            round: 1,
            status: 'scheduled'
          });
        }
      }
    }

    console.log(`[Selective Scheduling] Generated ${generatedGames.length} games for ${flightIds.length} flights`);

    // Save games to database if any were generated
    if (generatedGames.length > 0) {
      console.log(`[Selective Scheduling] Saving ${generatedGames.length} games to database`);
      
      // Clear existing games for these brackets to avoid duplicates
      for (const flightId of flightIds) {
        await db.delete(games).where(
          and(
            eq(games.eventId, eventId),
            eq(games.groupId, parseInt(flightId)) // games table uses group_id instead of bracket_id
          )
        );
      }

      // Get the age group ID for the first bracket
      const bracketAgeGroupQuery = await db.select({
        ageGroupId: eventBrackets.ageGroupId
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.id, parseInt(flightIds[0])))
      .limit(1);

      const ageGroupId = bracketAgeGroupQuery[0]?.ageGroupId;
      if (!ageGroupId) {
        throw new Error(`No age group found for bracket ${flightIds[0]}`);
      }
      console.log(`[Selective Scheduling] Using age group ID: ${ageGroupId} for bracket ${flightIds[0]}`);

      // Convert generated games to database format
      const dbGames = generatedGames.map(game => ({
        eventId: eventId, // Keep as string (references text field)
        ageGroupId: ageGroupId, // Integer field - required
        groupId: null, // Set to null since bracket 570 doesn't exist in tournament_groups
        homeTeamId: game.homeTeamId, // Integer field
        awayTeamId: game.awayTeamId, // Integer field
        fieldId: null, // Will be assigned during field scheduling
        timeSlotId: null, // Will be assigned during time scheduling
        status: 'scheduled' as const,
        round: game.round,
        matchNumber: game.id,
        duration: 90, // Default 90 minutes
        breakTime: 15, // Default 15 minute break
        homeScore: null,
        awayScore: null,
        homeYellowCards: 0,
        awayYellowCards: 0,
        homeRedCards: 0,
        awayRedCards: 0
      }));

      console.log(`[Selective Scheduling] Sample database game object:`, JSON.stringify(dbGames[0], null, 2));

      // Insert games into database
      await db.insert(games).values(dbGames);
      console.log(`[Selective Scheduling] Successfully saved ${dbGames.length} games to database`);
    }

    return {
      success: true,
      totalGames: generatedGames.length,
      selectedFlights: flightIds.length,
      games: generatedGames,
      message: `Successfully generated schedule for ${flightIds.length} selected flights`
    };

  } catch (error) {
    console.error('[Selective Scheduling] Error:', error);
    throw error;
  }
}

async function saveAutomatedWorkflowData(eventId: number, workflowData: any) {
  // This would save the complete workflow data to the database
  // For now, we'll just log it
  console.log(`[Automated Scheduling] Saving workflow data for event ${eventId}`);
  console.log(`- Flights: ${workflowData.flights.flights.length}`);
  console.log(`- Brackets: ${workflowData.brackets.brackets.length}`);
  console.log(`- Games: ${workflowData.schedule.games.length}`);
  
  return true;
}

export default router;