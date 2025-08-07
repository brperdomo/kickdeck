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

// REMOVED DUPLICATE ROUTE - CONSOLIDATED INTO SINGLE ENDPOINT ABOVE

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
      } else if (bracket.tournamentFormat === 'round_robin' && flightTeams.length >= 2) {
        console.log(`[Selective Scheduling] FALLBACK: Using round_robin for ${bracket.tournamentFormat} with ${flightTeams.length} teams - THIS CREATES 10 GAMES!`);
        // Fallback to simple round-robin for legacy formats
        let gameNumber = 1;
        for (let i = 0; i < flightTeams.length; i++) {
          for (let j = i + 1; j < flightTeams.length; j++) {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: flightTeams[i].id,
              homeTeamName: flightTeams[i].name,
              awayTeamId: flightTeams[j].id,
              awayTeamName: flightTeams[j].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1, // Pool play round number
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          }
        }
        console.log(`[Selective Scheduling] Generated ${bracketGames.length} round-robin games (fallback)`);
      } else {
        console.log(`[Selective Scheduling] *** UNEXPECTED PATH! *** Cannot generate games: format=${bracket.tournamentFormat}, teams=${flightTeams.length}, template found=${!!formatTemplate}`);
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
      
      // Update games with real field assignments
      for (const dbGame of dbGames) {
        // Determine required field size based on game bracket name
        const game = generatedGames.find(g => g.homeTeamId === dbGame.homeTeamId && g.awayTeamId === dbGame.awayTeamId);
        if (!game) continue;
        
        const bracket = await db.query.eventBrackets.findFirst({
          where: eq(eventBrackets.id, game.bracketId)
        });
        
        const requiredFieldSize = determineFieldSizeFromBracket(bracket?.name || '');
        
        // Find suitable real fields
        const suitableFields = realFields.filter(field => field.fieldSize === requiredFieldSize);
        const selectedField = suitableFields.length > 0 
          ? suitableFields[gameCounter % suitableFields.length]
          : realFields[gameCounter % realFields.length]; // Fallback to any available field
        
        if (selectedField) {
          // Update the game record with real field ID
          await db.update(games)
            .set({ fieldId: selectedField.id })
            .where(and(
              eq(games.eventId, eventId),
              eq(games.homeTeamId, dbGame.homeTeamId),
              eq(games.awayTeamId, dbGame.awayTeamId)
            ));
          
          console.log(`[Selective Scheduling] Assigned game ${game.homeTeam} vs ${game.awayTeam} to field ${selectedField.name} (${selectedField.fieldSize})`);
        }
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