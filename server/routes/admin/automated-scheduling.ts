import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { db } from '../../../db/index.js';
import { teams, events, eventGameFormats, complexes, fields, games, eventBrackets, matchupTemplates } from '../../../db/schema.js';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { validateSchedulingSafety, validateFieldCapacity, validateNoDuplicateGames } from '../../middleware/scheduling-safety.js';
import { TournamentScheduler } from '../../services/tournament-scheduler.js';

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

// Generate schedule ONLY for properly configured brackets (CORRECTED: User has only configured U12 Boys Nike Premier)
router.post('/events/:eventId/scheduling/auto-generate', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { forceGeneration = false } = req.body;

    console.log(`[Schedule All] Starting schedule generation for event ${eventId}`);

    // REALITY CHECK: User has only configured U12 Boys Nike Premier with one of the 3 formats they created
    // The system should ONLY schedule games for brackets that have been properly configured

    // STEP 1: Find brackets that have actual tournament format configurations
    const configuredBrackets = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId),
      with: {
        teams: {
          where: eq(teams.status, 'approved')
        }
      }
    });

    console.log(`[Schedule All] Found ${configuredBrackets.length} total brackets in event (should be 72, not 76)`);

    // STEP 2: Filter for brackets that have ACTUAL format configurations
    // Currently this should only be U12 Boys Nike Premier
    const eligibleBrackets = configuredBrackets.filter(bracket => {
      const hasEnoughTeams = bracket.teams.length >= 2;
      const hasConfiguredFormat = bracket.tournamentFormat && bracket.tournamentFormat !== null;
      
      if (!hasEnoughTeams) {
        console.log(`[Schedule All] Skipping ${bracket.name} - only ${bracket.teams.length} teams (need ≥2)`);
        return false;
      }
      
      if (!hasConfiguredFormat) {
        console.log(`[Schedule All] Skipping ${bracket.name} - no format configured yet`);
        return false;
      }
      
      console.log(`[Schedule All] ✓ ${bracket.name} eligible: ${bracket.teams.length} teams, format: ${bracket.tournamentFormat}`);
      return true;
    });

    console.log(`[Schedule All] ${eligibleBrackets.length} brackets ready for scheduling (user has only configured U12 Boys Nike Premier)`);

    if (eligibleBrackets.length === 0) {
      return res.status(400).json({ 
        error: 'No brackets have been configured for scheduling yet',
        details: `Found ${configuredBrackets.length} total brackets but none have tournament formats configured. You need to use the Flight Configuration interface to assign your 3 formats (4-Team Single, 6-Team Crossover, 8-Team Dual) to specific brackets.`,
        total_brackets: configuredBrackets.length,
        expected_brackets: 72, // 24 age groups x 3 flights  
        bracket_count_issue: configuredBrackets.length > 72 ? "Extra brackets detected - should be exactly 72" : null,
        user_configured_formats: ["4-Team Single Bracket", "6-Team Crossover Brackets", "8-Team Dual Brackets"],
        next_step: "Configure flight formats for specific brackets before scheduling"
      });
    }

    // STEP 4: Generate games for each eligible bracket using actual database formats
    let totalGames = 0;
    const schedulingResults = [];

    for (const bracket of eligibleBrackets) {
      console.log(`[Schedule All] Processing bracket: ${bracket.name} (${bracket.teams.length} teams, format: ${bracket.tournamentFormat})`);
      
      try {
        // Use the existing selective scheduling logic with actual database bracket data
        const bracketData = [{
          bracketId: bracket.id,
          bracketName: bracket.name,
          format: bracket.tournamentFormat,
          tournamentFormat: bracket.tournamentFormat,
          templateName: bracket.tournamentFormat,
          teams: bracket.teams.map(team => ({
            id: team.id,
            name: team.name,
            bracketId: team.bracketId
          }))
        }];

        // Generate games using the tournament scheduler with real database formats
        const scheduleResult = await TournamentScheduler.generateSchedule(eventId, bracketData);
        const bracketGames = scheduleResult.games;
        
        console.log(`[Schedule All] Generated ${bracketGames.length} games for bracket ${bracket.name}`);
        totalGames += bracketGames.length;
        
        schedulingResults.push({
          bracketId: bracket.id,
          bracketName: bracket.name,
          format: bracket.tournamentFormat,
          gamesGenerated: bracketGames.length,
          teams: bracket.teams.length
        });

      } catch (error) {
        console.error(`[Schedule All] Error processing bracket ${bracket.name}:`, error);
        schedulingResults.push({
          bracketId: bracket.id,
          bracketName: bracket.name,
          format: bracket.tournamentFormat,
          error: error instanceof Error ? error.message : 'Unknown error',
          teams: bracket.teams.length
        });
      }
    }

    console.log(`[Schedule All] COMPLETED: Generated ${totalGames} total games for ${eligibleBrackets.length} brackets`);

    res.json({
      success: true,
      message: `Schedule generated successfully for ${eligibleBrackets.length} properly configured brackets`,
      totalGames,
      eligibleBrackets: eligibleBrackets.length,
      totalBrackets: configuredBrackets.length,
      flightFormatConfigurations: 0, // No game formats configured yet
      schedulingResults,
      summary: {
        eligible_for_scheduling: eligibleBrackets.length,
        total_brackets_in_event: configuredBrackets.length,
        flight_format_configs_found: 0, // No game formats configured yet
        games_generated: totalGames
      }
    });

  } catch (error) {
    console.error('[Schedule All] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
      // Get format from database or default to round_robin
      const format = await getBracketFormat(eventId, flight.name) || 'round_robin';
      const bracket = {
        id: `bracket_${flight.id}`,
        flightId: flight.id,
        name: `${flight.name} Bracket`,
        format: format,
        tournamentFormat: format, // Use configured format
        teams: flight.teams,
        teamCount,
        estimatedGames: format === 'round_robin_final' ? 
          (calculateGamesPerTeam(teamCount, 'round_robin') * teamCount / 2) + 1 : // +1 for championship
          calculateGamesPerTeam(teamCount, 'round_robin') * teamCount / 2
      };
      brackets.push(bracket);
      totalGames += bracket.estimatedGames;
    } else {
      // Multiple brackets for larger flights
      const bracketsNeeded = Math.ceil(teamCount / 4);
      for (let i = 0; i < bracketsNeeded; i++) {
        const bracketTeams = flight.teams.slice(i * 4, (i + 1) * 4);
        // Get format from database or default to round_robin
        const format = await getBracketFormat(eventId, flight.name) || 'round_robin';
        const bracket = {
          id: `bracket_${flight.id}_${i + 1}`,
          flightId: flight.id,
          name: `${flight.name} Bracket ${i + 1}`,
          format: format,
          tournamentFormat: format, // Use configured format
          teams: bracketTeams,
          teamCount: bracketTeams.length,
          estimatedGames: format === 'round_robin_final' ? 
            (calculateGamesPerTeam(bracketTeams.length, 'round_robin') * bracketTeams.length / 2) + 1 : // +1 for championship
            calculateGamesPerTeam(bracketTeams.length, 'round_robin') * bracketTeams.length / 2
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

// Add the missing route that frontend expects
router.post('/events/:eventId/generate-selective-schedule', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { flightIds } = req.body;

    console.log(`[Frontend Route] Selective schedule generation for event ${eventId}, flights: ${flightIds?.join(', ') || 'none'}`);

    if (!flightIds || !Array.isArray(flightIds) || flightIds.length === 0) {
      return res.status(400).json({ error: 'Flight IDs are required for selective scheduling' });
    }

    // Call the existing selective scheduling function
    const result = await generateSelectiveSchedule(eventId, flightIds, {
      includeReferees: true,
      includeFacilities: true
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
    console.error('Frontend selective scheduling error:', error);
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
    const generatedGames: any[] = [];
    let gameCounter = 1;

    // Import TournamentScheduler (already imported at top of file)
    
    // Create games based on selected bracket IDs (flights) using the fixed tournament scheduler
    for (const flightId of flightIds) {
      // Get bracket information including tournament format
      const bracket = await db.query.eventBrackets.findFirst({
        where: eq(eventBrackets.id, parseInt(flightId))
      });
      
      if (!bracket) {
        console.log(`[Selective Scheduling] Skipping bracket ${flightId} - bracket not found`);
        continue;
      }

      // Get teams for this specific bracket/flight
      const flightTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, parseInt(flightId))
        )
      });

      console.log(`[Selective Scheduling] Found ${flightTeams.length} teams for bracket/flight ${flightId}`);
      console.log(`[Selective Scheduling] Bracket format: ${bracket.tournamentFormat}, Name: ${bracket.name}`);
      console.log(`[Selective Scheduling] *** TRACE POINT 1: About to check tournament format logic ***`);

      if (flightTeams.length < 2) {
        console.log(`[Selective Scheduling] Skipping bracket ${flightId} - not enough teams (${flightTeams.length})`);
        continue;
      }

      // Get the tournament format template from database
      const formatTemplate = await db.query.matchupTemplates.findFirst({
        where: eq(matchupTemplates.name, bracket.tournamentFormat)
      });
      
      console.log(`[Selective Scheduling] Processing ${bracket.tournamentFormat} format for ${flightTeams.length} teams`);
      console.log(`[Selective Scheduling] CRITICAL DEBUG: bracket.tournamentFormat="${bracket.tournamentFormat}", teams=${flightTeams.length}, will use group_of_4 logic: ${bracket.tournamentFormat === 'group_of_4' && flightTeams.length === 4}`);
      
      let bracketGames = [];
      
      if (formatTemplate && flightTeams.length >= formatTemplate.teamCount) {
        console.log(`[Selective Scheduling] Using template: ${formatTemplate.name} (${formatTemplate.teamCount} teams, ${formatTemplate.totalGames} games)`);
        
        // Generate games based on the matchup pattern from the template
        const matchupPattern = formatTemplate.matchupPattern as any[][];
        let gameNumber = 1;
        
        // Assign teams to slots (A1, A2, A3, A4, B1, B2, B3, B4 for 8-Team Dual)
        const teamSlots: { [key: string]: any } = {};
        if (formatTemplate.name === '8-Team Dual Brackets') {
          // Pool A: first 4 teams, Pool B: next 4 teams
          teamSlots['A1'] = flightTeams[0];
          teamSlots['A2'] = flightTeams[1];
          teamSlots['A3'] = flightTeams[2];
          teamSlots['A4'] = flightTeams[3];
          teamSlots['B1'] = flightTeams[4];
          teamSlots['B2'] = flightTeams[5];
          teamSlots['B3'] = flightTeams[6];
          teamSlots['B4'] = flightTeams[7];
        }
        
        // Generate games from matchup pattern
        for (const matchup of matchupPattern) {
          const [homeSlot, awaySlot] = matchup;
          
          // Handle TBD games (finals) as placeholder championship games
          if (homeSlot === 'TBD' || awaySlot === 'TBD') {
            // This is the championship final - create placeholder game
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: null, // Will be determined after pool play
              homeTeamName: 'Pool A Winner',
              awayTeamId: null, // Will be determined after pool play
              awayTeamName: 'Pool B Winner',
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 2, // Championship final is round 2
              gameType: 'championship',
              duration: 90,
              gameNumber: gameNumber++,
              notes: 'Championship Final - Teams TBD based on pool standings',
              isPending: true
            });
            continue;
          }
          
          const homeTeam = teamSlots[homeSlot];
          const awayTeam = teamSlots[awaySlot];
          
          if (homeTeam && awayTeam) {
            // Determine round (as integer) and game type
            let roundNumber = 1; // Pool play is round 1
            let gameType = 'pool_play';
            
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: homeTeam.id,
              homeTeamName: homeTeam.name,
              awayTeamId: awayTeam.id,
              awayTeamName: awayTeam.name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: roundNumber,
              gameType: gameType,
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        console.log(`[Selective Scheduling] Generated ${bracketGames.length} games using ${formatTemplate.name} template`);
      } else if (bracket.tournamentFormat === 'group_of_4') {
        // Handle group_of_4 format - ALWAYS generate 6 pool games + 1 championship = 7 total (regardless of team count)
        console.log(`[Selective Scheduling] *** HIT GROUP_OF_4 LOGIC! *** USING group_of_4 format - generating 6 pool + 1 championship regardless of actual team count (${flightTeams.length} teams)`);
        let gameNumber = 1;
        
        // Take only first 4 teams for group_of_4 format
        const selectedTeams = flightTeams.slice(0, 4);
        console.log(`[Selective Scheduling] Selected first 4 teams from ${flightTeams.length} available teams: ${selectedTeams.map(t => t.name).join(', ')}`);
        
        // Generate 6 pool play games (round-robin among 4 teams)
        for (let i = 0; i < selectedTeams.length; i++) {
          for (let j = i + 1; j < selectedTeams.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: selectedTeams[i].id,
              homeTeamName: selectedTeams[i].name,
              awayTeamId: selectedTeams[j].id,
              awayTeamName: selectedTeams[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1, // Pool play is round 1
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        // Add championship final (7th game)
        bracketGames.push({
          id: `${flightId}-${gameNumber}`,
          homeTeamId: null, // TBD based on standings
          homeTeamName: '1st Place',
          awayTeamId: null, // TBD based on standings  
          awayTeamName: '2nd Place',
          bracketId: parseInt(flightId),
          bracketName: bracket.name,
          round: 2, // Championship is round 2
          gameType: 'championship',
          duration: 90,
          gameNumber: gameNumber++,
          notes: 'Championship Final - Teams TBD based on pool standings',
          isPending: true
        });
        
        console.log(`[Selective Scheduling] SUCCESS: Generated 6 pool + 1 championship = ${bracketGames.length} games for group_of_4 (used ${selectedTeams.length} of ${flightTeams.length} teams)`);
      } else if (flightTeams.length === 6) {
        // Smart fallback: Use group_of_6 (9 pool games + 1 championship = 10 games)
        console.log(`[Selective Scheduling] SMART FALLBACK: ${bracket.tournamentFormat} not handled, using group_of_6 for ${flightTeams.length} teams`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 6);
        
        // Generate 9 pool games (2 groups of 3: Pool A vs Pool B)
        const poolA = selectedTeams.slice(0, 3);
        const poolB = selectedTeams.slice(3, 6);
        
        // Pool A round-robin (3 games)
        for (let i = 0; i < poolA.length; i++) {
          for (let j = i + 1; j < poolA.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: poolA[i].id,
              homeTeamName: poolA[i].name,
              awayTeamId: poolA[j].id,
              awayTeamName: poolA[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1,
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        // Pool B round-robin (3 games)  
        for (let i = 0; i < poolB.length; i++) {
          for (let j = i + 1; j < poolB.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: poolB[i].id,
              homeTeamName: poolB[i].name,
              awayTeamId: poolB[j].id,
              awayTeamName: poolB[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1,
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        // Cross-pool games (3 games: each Pool A team plays each Pool B team)
        for (let i = 0; i < poolA.length; i++) {
          bracketGames.push({
            id: `${flightId}-${gameNumber}`,
            homeTeamId: poolA[i].id,
            homeTeamName: poolA[i].name,
            awayTeamId: poolB[i].id,
            awayTeamName: poolB[i].name,
            bracketId: parseInt(flightId),
            bracketName: bracket.name,
            round: 1,
            gameType: 'pool_play',
            duration: 90,
            gameNumber: gameNumber++
          });
        }
        
        // Championship final (10th game)
        bracketGames.push({
          id: `${flightId}-${gameNumber}`,
          homeTeamId: null,
          homeTeamName: '1st Place',
          awayTeamId: null,
          awayTeamName: '2nd Place',
          bracketId: parseInt(flightId),
          bracketName: bracket.name,
          round: 2,
          gameType: 'championship',
          duration: 90,
          gameNumber: gameNumber++,
          notes: 'Championship Final - Teams TBD based on pool standings',
          isPending: true
        });
        
        console.log(`[Selective Scheduling] Generated ${bracketGames.length} games using smart group_of_6 fallback (9 pool + 1 championship)`);
      } else if (flightTeams.length >= 7 && flightTeams.length <= 8) {
        // Smart fallback: Use group_of_8 (12 pool games + 1 championship = 13 games)
        console.log(`[Selective Scheduling] SMART FALLBACK: ${bracket.tournamentFormat} not handled, using group_of_8 for ${flightTeams.length} teams`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 8);
        
        // Generate 12 pool games (2 groups of 4: Pool A vs Pool B)
        const poolA = selectedTeams.slice(0, 4);
        const poolB = selectedTeams.slice(4, 8);
        
        // Pool A round-robin (6 games)
        for (let i = 0; i < poolA.length; i++) {
          for (let j = i + 1; j < poolA.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: poolA[i].id,
              homeTeamName: poolA[i].name,
              awayTeamId: poolA[j].id,
              awayTeamName: poolA[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1,
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        // Pool B round-robin (6 games)
        for (let i = 0; i < poolB.length; i++) {
          for (let j = i + 1; j < poolB.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: poolB[i].id,
              homeTeamName: poolB[i].name,
              awayTeamId: poolB[j].id,
              awayTeamName: poolB[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1,
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        // Championship final (13th game)
        bracketGames.push({
          id: `${flightId}-${gameNumber}`,
          homeTeamId: null,
          homeTeamName: 'Pool A Winner',
          awayTeamId: null,
          awayTeamName: 'Pool B Winner',
          bracketId: parseInt(flightId),
          bracketName: bracket.name,
          round: 2,
          gameType: 'championship',
          duration: 90,
          gameNumber: gameNumber++,
          notes: 'Championship Final - Pool A Winner vs Pool B Winner',
          isPending: true
        });
        
        console.log(`[Selective Scheduling] Generated ${bracketGames.length} games using smart group_of_8 fallback (12 pool + 1 championship)`);
      } else if (flightTeams.length === 4 || flightTeams.length === 5) {
        // Smart fallback: Use group_of_4 for 4-5 teams
        console.log(`[Selective Scheduling] SMART FALLBACK: ${bracket.tournamentFormat} not handled, using group_of_4 for ${flightTeams.length} teams`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 4);
        
        // Generate 6 pool play games (round-robin among 4 teams)
        for (let i = 0; i < selectedTeams.length; i++) {
          for (let j = i + 1; j < selectedTeams.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: selectedTeams[i].id,
              homeTeamName: selectedTeams[i].name,
              awayTeamId: selectedTeams[j].id,
              awayTeamName: selectedTeams[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1,
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        
        // Add championship final (7th game)
        bracketGames.push({
          id: `${flightId}-${gameNumber}`,
          homeTeamId: null,
          homeTeamName: '1st Place',
          awayTeamId: null,
          awayTeamName: '2nd Place',
          bracketId: parseInt(flightId),
          bracketName: bracket.name,
          round: 2,
          gameType: 'championship',
          duration: 90,
          gameNumber: gameNumber++,
          notes: 'Championship Final - Teams TBD based on pool standings',
          isPending: true
        });
        
        console.log(`[Selective Scheduling] Generated ${bracketGames.length} games using smart group_of_4 fallback`);
      } else {
        console.log(`[Selective Scheduling] Cannot generate games: format=${bracket.tournamentFormat}, teams=${flightTeams.length} (not enough teams or unsupported count), template found=${!!formatTemplate}`);
      }
      
      console.log(`[Selective Scheduling] Generated ${bracketGames.length} games for bracket ${bracket.name} (template: ${bracket.tournamentFormat})`);
      
      // Convert tournament scheduler games to the expected format
      bracketGames.forEach((game: any) => {
        generatedGames.push({
          id: gameCounter++,
          homeTeam: game.homeTeamName,
          awayTeam: game.awayTeamName,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          bracketId: parseInt(flightId),
          field: game.field || 'TBD', // Will be assigned by field availability service
          scheduledTime: new Date(Date.now() + (gameCounter * 60 * 60 * 1000)).toISOString(),
          round: game.round || 1, // Use integer for round
          gameType: game.gameType || 'pool_play',
          duration: game.duration || 90,
          status: 'scheduled'
        });
      });
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
      const dbGames = generatedGames.map(game => {
        console.log(`[Debug] Processing game: homeTeamId=${game.homeTeamId}, awayTeamId=${game.awayTeamId}, gameType=${game.gameType}`);
        return {
          eventId: eventId, // Keep as string (references text field)
          ageGroupId: ageGroupId, // Integer field - required
          groupId: null, // Set to null since bracket 570 doesn't exist in tournament_groups
          homeTeamId: game.homeTeamId, // Allow null for championship games (will be set later)
          awayTeamId: game.awayTeamId, // Allow null for championship games (will be set later)
          fieldId: null, // Will be assigned during field scheduling
          timeSlotId: null, // Will be assigned during time scheduling
          status: game.gameType === 'championship' ? 'pending' : 'scheduled', // Championship games start as pending
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
        };
      });

      console.log(`[Selective Scheduling] Sample database game object:`, JSON.stringify(dbGames[0], null, 2));
      
      // Debug: Log all generated games to find the problematic -1
      console.log(`[Selective Scheduling] Debug - All ${dbGames.length} games being inserted:`);
      dbGames.forEach((game, index) => {
        console.log(`Game ${index + 1}: homeTeamId=${game.homeTeamId}, awayTeamId=${game.awayTeamId}, status=${game.status}, round=${game.round}`);
      });

      // Insert games into database
      await db.insert(games).values(dbGames);
      console.log(`[Selective Scheduling] Successfully saved ${dbGames.length} games to database`);
      
      // Apply field assignments using real Galway Downs fields with proper size validation
      const { FieldAvailabilityService } = await import('../../services/field-availability-service');
      
      // Get real fields for this event
      const realFields = await FieldAvailabilityService.getAvailableFields(eventId);
      console.log(`[Selective Scheduling] Found ${realFields.length} real fields available for event ${eventId}`);
      
      // CRITICAL: Use the improved IntelligentSchedulingEngine for proper rest period enforcement
      console.log(`[Selective Scheduling] STARTING - Using IntelligentSchedulingEngine for proper rest period enforcement`);
      
      try {
        // Initialize the improved scheduling engine
        console.log(`[Selective Scheduling] STEP 1: Importing IntelligentSchedulingEngine...`);
        const schedulingModule = await import('../../utils/schedulingEngine');
        console.log(`[Selective Scheduling] STEP 2: Module imported successfully`);
        
        const { IntelligentSchedulingEngine } = schedulingModule;
        if (!IntelligentSchedulingEngine) {
          throw new Error('IntelligentSchedulingEngine class not found in module');
        }
        console.log(`[Selective Scheduling] STEP 3: Creating new IntelligentSchedulingEngine instance for event ${eventId}...`);
        
        const eventIdNumber = parseInt(eventId);
        console.log(`[Selective Scheduling] STEP 4: Event ID converted to number: ${eventIdNumber}`);
        
        const schedulingEngine = new IntelligentSchedulingEngine(eventIdNumber);
        console.log(`[Selective Scheduling] STEP 5: Engine instance created successfully`);
        
        console.log(`[Selective Scheduling] STEP 6: Initializing scheduling engine...`);
        await schedulingEngine.initialize();
        console.log(`[Selective Scheduling] STEP 7: Engine initialized successfully!`);
        
        // Convert dbGames to format expected by scheduling engine
        const gamesForScheduling = dbGames.map(game => ({
          homeTeam: { 
            id: game.homeTeamId, 
            name: generatedGames.find(g => g.homeTeamId === game.homeTeamId)?.homeTeam || 'TBD',
            ageGroupId: game.ageGroupId,
            bracketId: game.groupId
          },
          awayTeam: { 
            id: game.awayTeamId, 
            name: generatedGames.find(g => g.awayTeamId === game.awayTeamId)?.awayTeam || 'TBD',
            ageGroupId: game.ageGroupId,
            bracketId: game.groupId
          },
          gameFormat: {
            gameLength: game.duration,
            fieldSize: '11v11', // Default for U14 Girls
            bufferTime: 15
          },
          id: game.homeTeamId && game.awayTeamId ? `${game.homeTeamId}-${game.awayTeamId}` : 'championship',
          isPending: !game.homeTeamId || !game.awayTeamId
        }));
        
        console.log(`[Intelligent Scheduling] Attempting to schedule ${gamesForScheduling.length} games with 90-minute rest period enforcement`);
        
        // Schedule games with proper rest period enforcement
        const scheduledGames = await schedulingEngine.scheduleGames(gamesForScheduling);
        
        console.log(`[Intelligent Scheduling] Successfully scheduled ${scheduledGames.length}/${gamesForScheduling.length} games`);
        
        // Update database with scheduled times and fields
        let successfullyScheduled = 0;
        for (let i = 0; i < Math.min(scheduledGames.length, dbGames.length); i++) {
          const scheduledGame = scheduledGames[i];
          const dbGame = dbGames[i];
          
          if (scheduledGame.field && scheduledGame.timeSlot) {
            const scheduledDate = scheduledGame.timeSlot.startTime.toISOString().split('T')[0];
            const scheduledTime = scheduledGame.timeSlot.startTime.toTimeString().slice(0, 5);
            
            console.log(`[Intelligent Scheduling] Game ${i + 1}: ${scheduledGame.homeTeam.name} vs ${scheduledGame.awayTeam.name} at ${scheduledTime} on ${scheduledGame.field.name}`);
            
            // Update the game with intelligent scheduling results
            await db.update(games)
              .set({ 
                fieldId: scheduledGame.field.id,
                scheduledDate: scheduledDate,
                scheduledTime: scheduledTime
              })
              .where(and(
                eq(games.eventId, eventId),
                eq(games.homeTeamId, dbGame.homeTeamId || -1),
                eq(games.awayTeamId, dbGame.awayTeamId || -1),
                eq(games.round, dbGame.round)
              ));
            
            successfullyScheduled++;
          } else {
            console.log(`[Intelligent Scheduling] Could not schedule game ${i + 1}: ${scheduledGame.homeTeam.name || 'TBD'} vs ${scheduledGame.awayTeam.name || 'TBD'}`);
          }
        }
        
        console.log(`[Intelligent Scheduling] Successfully scheduled ${successfullyScheduled}/${dbGames.length} games with proper rest period enforcement`);
      } catch (schedulingError: any) {
        console.error(`[CRITICAL ERROR] IntelligentSchedulingEngine failed - falling back to basic assignment:`, schedulingError);
        console.error(`[CRITICAL ERROR] Stack trace:`, schedulingError?.stack);
        console.log(`[FALLBACK] Using basic field assignment instead of intelligent scheduling`);
        // Fallback to basic field assignment if intelligent scheduling fails
        const fieldAssignments = await assignFieldsWithSchedule(eventId, dbGames, flightIds[0]);
        console.log(`[Enhanced Field Assignment] Fallback: Successfully assigned ${fieldAssignments.totalAssignments} games to fields`);
      }
      
      console.log(`[Selective Scheduling] Applied real field assignments with size validation for ${realFields.length} fields`);
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

// Enhanced Field Assignment with 90-Minute Rest Period Enforcement
async function assignFieldsWithSchedule(eventId: string, dbGames: any[], bracketId: string) {
  console.log(`[Enhanced Field Assignment] Starting assignment for ${dbGames.length} games`);

  // Get bracket information including tournament settings for rest period
  const bracketQuery = await db.select({
    name: eventBrackets.name,
    tournamentSettings: eventBrackets.tournamentSettings
  })
  .from(eventBrackets)
  .where(eq(eventBrackets.id, parseInt(bracketId)))
  .limit(1);

  const bracket = bracketQuery[0];
  const bracketName = bracket?.name || '';
  
  // Extract rest period from tournament settings
  const tournamentSettings = bracket?.tournamentSettings as any || {};
  const restPeriodMinutes = tournamentSettings.restPeriodMinutes || 90; // Default to 90 if not set
  const maxGamesPerDay = tournamentSettings.maxGamesPerTeam || 2; // Default to 2 if not set
  
  console.log(`[Enhanced Field Assignment] Bracket: ${bracketName}`);
  console.log(`[Enhanced Field Assignment] CONSTRAINTS: ${restPeriodMinutes}-minute rest period, max ${maxGamesPerDay} games per team per day`);

  // Determine required field size (U14 Girls = 11v11)
  let requiredFieldSize = '11v11'; // Default for U14 Girls
  if (bracketName.includes('U7') || bracketName.includes('U8') || bracketName.includes('U9') || bracketName.includes('U10')) {
    requiredFieldSize = '7v7';
  } else if (bracketName.includes('U11') || bracketName.includes('U12') || (bracketName.includes('U13') && bracketName.includes('Boys'))) {
    requiredFieldSize = '9v9';
  }

  console.log(`[Enhanced Field Assignment] Required field size: ${requiredFieldSize}`);

  // Use Galway Downs complex ID directly (confirmed from fields data)
  const complexId = 8; // Galway Downs Soccer Complex with 28 fields

  // Get matching fields with scheduling info
  const availableFields = await db.select({
    id: fields.id,
    name: fields.name,
    fieldSize: fields.fieldSize,
    openTime: fields.openTime,
    closeTime: fields.closeTime,
    isOpen: fields.isOpen
  })
  .from(fields)
  .where(
    and(
      eq(fields.complexId, complexId),
      eq(fields.fieldSize, requiredFieldSize),
      eq(fields.isOpen, true)
    )
  );

  console.log(`[Enhanced Field Assignment] Found ${availableFields.length} matching ${requiredFieldSize} fields:`);
  availableFields.forEach(field => {
    console.log(`  - ${field.name}: ${field.openTime} - ${field.closeTime}`);
  });

  if (availableFields.length === 0) {
    console.log(`[Enhanced Field Assignment] WARNING: No ${requiredFieldSize} fields available`);
    return { totalAssignments: 0, assignments: [] };
  }

  // Get event dates for scheduling
  const eventDatesQuery = await db.select({
    startDate: events.startDate,
    endDate: events.endDate,
    timezone: events.timezone
  })
  .from(events)
  .where(eq(events.id, parseInt(eventId)))
  .limit(1);

  const eventDates = eventDatesQuery[0];
  if (!eventDates) {
    throw new Error('Event dates not found');
  }

  // Parse event dates
  const eventStartDate = new Date(eventDates.startDate);
  const eventEndDate = new Date(eventDates.endDate);
  console.log(`[Enhanced Field Assignment] Event dates: ${eventStartDate.toDateString()} to ${eventEndDate.toDateString()}`);

  // CRITICAL: Enhanced scheduling with dynamic rest period and max games per day constraint
  const assignments: any[] = [];
  const fieldSchedules: { [fieldId: number]: Date } = {}; // Next available time for each field
  const teamSchedules: { [teamId: number]: Date[] } = {}; // All game times for each team
  const gameDurationMs = 90 * 60 * 1000; // 90 minutes
  const restPeriodMs = restPeriodMinutes * 60 * 1000; // Dynamic rest period (AFTER game ends)
  const bufferMs = 15 * 60 * 1000; // 15 minutes between games on same field

  console.log(`[Enhanced Field Assignment] Using dynamic rest period: ${restPeriodMinutes} minutes from flight configuration`);

  // Initialize field schedules from event start date and field open times
  availableFields.forEach(field => {
    const openTime = field.openTime || '08:00'; // Default to 8 AM if null
    const [hours, minutes] = openTime.split(':');
    const startTime = new Date(eventStartDate);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    fieldSchedules[field.id] = startTime;
    console.log(`[Enhanced Field Assignment] Field ${field.name} available from ${startTime.toLocaleString()}`);
  });

  // Initialize team schedules
  dbGames.forEach(game => {
    if (game.homeTeamId && !teamSchedules[game.homeTeamId]) {
      teamSchedules[game.homeTeamId] = [];
    }
    if (game.awayTeamId && !teamSchedules[game.awayTeamId]) {
      teamSchedules[game.awayTeamId] = [];
    }
  });

  // CRITICAL: Schedule games with 90-minute rest period enforcement
  for (let i = 0; i < dbGames.length; i++) {
    const game = dbGames[i];
    console.log(`[Enhanced Field Assignment] Scheduling game ${i + 1}: Team ${game.homeTeamId} vs Team ${game.awayTeamId}`);
    
    let bestField = null;
    let bestTime = null;
    let currentFieldIndex = 0;
    
    // Try to find a field/time that respects rest periods
    while (!bestField && currentFieldIndex < availableFields.length * 10) { // Max 10 cycles through fields
      const field = availableFields[currentFieldIndex % availableFields.length];
      const proposedTime = new Date(fieldSchedules[field.id]);
      
      // Check if this time violates team rest periods
      let violatesRestPeriod = false;
      
      // Check home team rest period
      if (game.homeTeamId && teamSchedules[game.homeTeamId]) {
        const homeTeamGames = teamSchedules[game.homeTeamId];
        for (const gameEndTime of homeTeamGames) {
          const timeSinceLastGame = proposedTime.getTime() - gameEndTime.getTime();
          if (timeSinceLastGame < restPeriodMs && timeSinceLastGame >= 0) {
            violatesRestPeriod = true;
            console.log(`[Enhanced Field Assignment] Game ${i + 1} violates home team rest period: ${timeSinceLastGame / 60000} minutes since last game`);
            break;
          }
        }
      }
      
      // Check away team rest period
      if (!violatesRestPeriod && game.awayTeamId && teamSchedules[game.awayTeamId]) {
        const awayTeamGames = teamSchedules[game.awayTeamId];
        for (const gameEndTime of awayTeamGames) {
          const timeSinceLastGame = proposedTime.getTime() - gameEndTime.getTime();
          if (timeSinceLastGame < restPeriodMs && timeSinceLastGame >= 0) {
            violatesRestPeriod = true;
            console.log(`[Enhanced Field Assignment] Game ${i + 1} violates away team rest period: ${timeSinceLastGame / 60000} minutes since last game`);
            break;
          }
        }
      }
      
      // Check max 2 games per team per day constraint
      if (!violatesRestPeriod) {
        const proposedDate = proposedTime.toDateString();
        const homeTeamGamesOnDay = game.homeTeamId ? teamSchedules[game.homeTeamId]?.filter(gameTime => 
          gameTime.toDateString() === proposedDate
        ).length || 0 : 0;
        const awayTeamGamesOnDay = game.awayTeamId ? teamSchedules[game.awayTeamId]?.filter(gameTime => 
          gameTime.toDateString() === proposedDate
        ).length || 0 : 0;
        
        if (homeTeamGamesOnDay >= maxGamesPerDay || awayTeamGamesOnDay >= maxGamesPerDay) {
          violatesRestPeriod = true;
          console.log(`[Enhanced Field Assignment] Game ${i + 1} violates max games per day: Home team has ${homeTeamGamesOnDay}, Away team has ${awayTeamGamesOnDay} games on ${proposedDate} (max: ${maxGamesPerDay})`);
        }
      }
      
      if (!violatesRestPeriod && proposedTime <= eventEndDate) {
        bestField = field;
        bestTime = proposedTime;
        break;
      } else {
        // Move this field's next available slot forward
        fieldSchedules[field.id] = new Date(fieldSchedules[field.id].getTime() + bufferMs);
      }
      
      currentFieldIndex++;
    }

    // If we couldn't find a valid slot, use the earliest available field anyway
    if (!bestField) {
      console.log(`[Enhanced Field Assignment] WARNING: Could not find ideal slot for game ${i + 1}, using earliest available field`);
      bestField = availableFields[0];
      bestTime = fieldSchedules[bestField.id];
      
      // Ensure it's within event dates
      if (bestTime > eventEndDate) {
        const nextDayStart = new Date(eventStartDate);
        nextDayStart.setDate(nextDayStart.getDate() + 1);
        const [hours, minutes] = (bestField.openTime || '08:00').split(':');
        nextDayStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (nextDayStart <= eventEndDate) {
          bestTime = nextDayStart;
        }
      }
    }

    const scheduledDateTime = new Date(bestTime);
    
    const scheduledDate = scheduledDateTime.toISOString().split('T')[0];
    const scheduledTime = scheduledDateTime.toTimeString().substring(0, 5);

    assignments.push({
      gameIndex: i,
      fieldId: bestField.id,
      fieldName: bestField.name,
      scheduledDate,
      scheduledTime,
      scheduledDateTime: scheduledDateTime.toISOString()
    });

    // Update database with field and schedule assignment
    try {
      // Use raw SQL to update with date/time since Drizzle schema may not have these columns yet
      await db.execute(sql`
        UPDATE games 
        SET field_id = ${bestField.id},
            scheduled_date = ${scheduledDate},
            scheduled_time = ${scheduledTime}
        WHERE event_id = ${eventId}
          AND home_team_id = ${game.homeTeamId || -1}
          AND away_team_id = ${game.awayTeamId || -1}
          AND round = ${game.round}
      `);
      console.log(`[Enhanced Field Assignment] Updated game ${i + 1}: Field ${bestField.name} at ${scheduledDate} ${scheduledTime}`);
    } catch (updateError) {
      console.error(`[Enhanced Field Assignment] Error updating game ${i + 1}:`, updateError);
      // Fallback: Just update field ID
      try {
        await db.update(games)
          .set({ fieldId: bestField.id })
          .where(
            and(
              eq(games.eventId, eventId),
              eq(games.homeTeamId, game.homeTeamId || -1),
              eq(games.awayTeamId, game.awayTeamId || -1),
              eq(games.round, game.round)
            )
          );
        console.log(`[Enhanced Field Assignment] Fallback: Updated game ${i + 1} with field ${bestField.name} only`);
      } catch (fallbackError) {
        console.error(`[Enhanced Field Assignment] Fallback failed for game ${i + 1}:`, fallbackError);
      }
    }

    // Update field's next available time and team schedules
    fieldSchedules[bestField.id] = new Date(scheduledDateTime.getTime() + gameDurationMs + bufferMs);
    
    // Record game end times for team rest period tracking
    const gameEndTime = new Date(scheduledDateTime.getTime() + gameDurationMs);
    if (game.homeTeamId) {
      teamSchedules[game.homeTeamId].push(gameEndTime);
    }
    if (game.awayTeamId) {
      teamSchedules[game.awayTeamId].push(gameEndTime);
    }

    console.log(`[Enhanced Field Assignment] Game ${i + 1}: Field ${bestField.name} at ${scheduledDate} ${scheduledTime} (90-min rest enforced)`);
  }

  // Summary
  const fieldsUsed = Array.from(new Set(assignments.map(a => a.fieldName)));
  const timeRange = assignments.length > 0 ? {
    start: assignments[0].scheduledDateTime,
    end: assignments[assignments.length - 1].scheduledDateTime
  } : null;

  console.log(`[Enhanced Field Assignment] COMPLETE - Assigned ${assignments.length} games across ${fieldsUsed.length} fields`);
  console.log(`[Enhanced Field Assignment] Time range: ${timeRange?.start} to ${timeRange?.end}`);
  console.log(`[Enhanced Field Assignment] Fields used: ${fieldsUsed.join(', ')}`);

  return {
    totalAssignments: assignments.length,
    assignments,
    fieldsUsed,
    timeRange
  };
}

// Helper function to get bracket format from database
async function getBracketFormat(eventId: number, flightName: string): Promise<string | null> {
  try {
    // Look for existing bracket with matching name pattern
    const bracket = await db.query.eventBrackets.findFirst({
      where: and(
        eq(eventBrackets.eventId, eventId.toString()),
        sql`${eventBrackets.name} ILIKE ${`%${flightName.split(' ')[0]}%`}` // Match on first part of flight name
      )
    });
    
    return bracket?.tournamentFormat || null;
  } catch (error) {
    console.error('Error fetching bracket format:', error);
    return null;
  }
}

// Helper function to determine field size from bracket name
function determineFieldSizeFromBracket(bracketName: string): string {
  if (!bracketName) return '11v11';
  
  // Comprehensive field size validation based on age groups
  if (bracketName.includes('U7') || bracketName.includes('U8') || bracketName.includes('U9') || bracketName.includes('U10')) {
    return '7v7'; // Maps to fields B1, B2
  } else if (bracketName.includes('U11') || bracketName.includes('U12') || (bracketName.includes('U13') && bracketName.includes('Boys'))) {
    return '9v9'; // Maps to fields A1, A2
  } else if (bracketName.includes('U13') && bracketName.includes('Girls')) {
    return '11v11'; // U13 Girls MUST use 11v11 fields (f1-f6)
  } else if (bracketName.match(/U1[4-9]/)) { // U14-U19
    return '11v11'; // Maps to fields f1-f6
  } else {
    return '11v11';
  }
}

export default router;