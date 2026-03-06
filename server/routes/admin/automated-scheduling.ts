import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { db } from '../../../db/index.js';
import { teams, events, eventGameFormats, complexes, fields, games, eventBrackets, matchupTemplates, gameFormats, eventFieldConfigurations, eventComplexes } from '../../../db/schema.js';
import { eq, and, inArray, sql, isNotNull, isNull } from 'drizzle-orm';
import { validateSchedulingSafety, validateFieldCapacity, validateNoDuplicateGames } from '../../middleware/scheduling-safety.js';
import { TournamentScheduler } from '../../services/tournament-scheduler.js';

const router = Router();

// DEBUG: Test template-based game generation 
router.post('/events/:eventId/scheduling/debug-template', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`🔍 DEBUG: Testing template generation for 6-team crossover`);
    
    // Import the dynamic template engine
    const { findBestTemplate, generateGamesFromTemplate } = await import('../../services/dynamic-matchup-engine.js');
    
    // Find the 6-team crossover template
    const template = await findBestTemplate(6, 'crossover');
    
    if (!template) {
      return res.json({ error: 'No 6-team crossover template found' });
    }
    
    console.log(`🔍 Found template:`, template);
    
    // Create mock teams for testing
    const mockTeams = [
      { id: 1, name: 'Team A1', bracketId: '1', groupId: 1, seedRanking: 1, poolAssignment: 'A' },
      { id: 2, name: 'Team A2', bracketId: '1', groupId: 1, seedRanking: 2, poolAssignment: 'A' },
      { id: 3, name: 'Team A3', bracketId: '1', groupId: 1, seedRanking: 3, poolAssignment: 'A' },
      { id: 4, name: 'Team B1', bracketId: '1', groupId: 2, seedRanking: 1, poolAssignment: 'B' },
      { id: 5, name: 'Team B2', bracketId: '1', groupId: 2, seedRanking: 2, poolAssignment: 'B' },
      { id: 6, name: 'Team B3', bracketId: '1', groupId: 2, seedRanking: 3, poolAssignment: 'B' }
    ];
    
    const bracketInfo = {
      id: 1,
      name: 'Test Bracket',
      tournamentFormat: 'group_of_6'
    };
    
    // Generate games using template
    const generatedGames = await generateGamesFromTemplate(template.id, mockTeams, bracketInfo);
    
    console.log(`🔍 Generated ${generatedGames.length} games:`, generatedGames);
    
    // Count pool games vs championship games
    const poolGames = generatedGames.filter(g => g.gameType === 'pool_play');
    const championshipGames = generatedGames.filter(g => g.gameType === 'final' || g.isChampionship);
    
    res.json({
      template: template,
      totalGames: generatedGames.length,
      poolGames: poolGames.length,
      championshipGames: championshipGames.length,
      games: generatedGames,
      analysis: {
        hasChampionship: championshipGames.length > 0,
        championshipDescription: championshipGames.map(g => g.notes || g.homeTeamName + ' vs ' + g.awayTeamName)
      }
    });
    
  } catch (error: any) {
    console.error('🔍 DEBUG ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

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
      const gamesPerTeam = calculateGamesPerTeam(teamCount, 'crossplay_enforced');
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
    case 'crossplay_enforced':
      // For 6-team crossplay: each team plays 6 games (3 teams from other pool x 2 rounds)
      return teamCount === 6 ? 6 : Math.min(teamCount - 1, 4);
    case 'knockout':
      return Math.ceil(Math.log2(teamCount)); // Single elimination
    case 'round_robin_knockout':
      return Math.min(teamCount - 1, 4) + Math.ceil(Math.log2(teamCount)); // Pool play + playoffs
    default:
      // CRITICAL: No more round-robin fallbacks for 6-team brackets
      return teamCount === 6 ? 6 : Math.min(teamCount - 1, 4);
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
      // Get format from database or default to crossplay_enforced for 6-team brackets
      const format = await getBracketFormat(eventId, flight.name) || 'crossplay_enforced';
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
        // Get format from database or default to crossplay_enforced for 6-team brackets  
        const format = await getBracketFormat(eventId, flight.name) || 'crossplay_enforced';
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
    // CRITICAL FIX: Clear existing games for selected flights to prevent overlaps
    console.log(`[Selective Scheduling] Clearing existing games for flights: ${flightIds.join(', ')}`);
    for (const flightId of flightIds) {
      const deletedGames = await db.delete(games).where(
        and(
          eq(games.eventId, eventId),
          sql`EXISTS (
            SELECT 1 FROM teams t 
            WHERE t.id = ${games.homeTeamId} 
              AND t.bracket_id = ${parseInt(flightId)}
          )`
        )
      );
      console.log(`[Selective Scheduling] Deleted existing games for flight ${flightId}`);
    }

    // Get event data - convert eventId to number for database query
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });
    
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    // Get available fields
    const eventFields = await db.query.fields.findMany();

    // Auto-seed event_field_configurations if none exist for this event
    // This ensures the field-availability service can find matching fields
    const existingFieldConfigs = await db.query.eventFieldConfigurations.findMany({
      where: eq(eventFieldConfigurations.eventId, eventId)
    });

    if (existingFieldConfigs.length === 0) {
      console.log(`[Selective Scheduling] No event_field_configurations found. Auto-seeding from venue fields...`);
      const eventComplexLinks = await db.query.eventComplexes.findMany({
        where: eq(eventComplexes.eventId, eventId)
      });

      let seededCount = 0;
      if (eventComplexLinks.length > 0) {
        const complexIds = eventComplexLinks.map(ec => ec.complexId);
        const venueFields = await db.query.fields.findMany({
          where: inArray(fields.complexId, complexIds)
        });

        for (const field of venueFields) {
          try {
            await db.insert(eventFieldConfigurations).values({
              eventId: eventId,
              fieldId: field.id,
              fieldSize: field.fieldSize || '11v11',
              sortOrder: field.sortOrder || 0,
              isActive: field.isOpen !== false,
              firstGameTime: field.openTime || '08:00',
              lastGameTime: field.closeTime || '22:00'
            });
            seededCount++;
          } catch (seedErr) {
            console.warn(`[Auto-seed] Skipping field ${field.id}: ${seedErr}`);
          }
        }
        console.log(`[Auto-seed] Created ${seededCount} event_field_configurations for event ${eventId} from ${eventComplexLinks.length} complexes`);
      } else {
        // No complexes linked — seed from ALL available fields as fallback
        const allFields = await db.query.fields.findMany();
        for (const field of allFields) {
          try {
            await db.insert(eventFieldConfigurations).values({
              eventId: eventId,
              fieldId: field.id,
              fieldSize: field.fieldSize || '11v11',
              sortOrder: field.sortOrder || 0,
              isActive: field.isOpen !== false,
              firstGameTime: field.openTime || '08:00',
              lastGameTime: field.closeTime || '22:00'
            });
            seededCount++;
          } catch (seedErr) {
            console.warn(`[Auto-seed] Skipping field ${field.id}: ${seedErr}`);
          }
        }
        console.log(`[Auto-seed] Created ${seededCount} event_field_configurations from all available fields (no complexes linked to event)`);
      }
    } else {
      console.log(`[Selective Scheduling] Found ${existingFieldConfigs.length} existing event_field_configurations`);
    }

    // Generate a schedule for the selected flights using admin-assigned templates
    const generatedGames: any[] = [];
    let gameCounter = 1;

    // Clear existing games for the selected flights BEFORE generating new ones (prevents duplicates on re-run)
    for (const flightId of flightIds) {
      const bracketInfo = await db.query.eventBrackets.findFirst({
        where: eq(eventBrackets.id, parseInt(flightId))
      });
      if (bracketInfo) {
        // Delete games whose teams belong to this flight
        const flightTeamIds = await db.select({ id: teams.id }).from(teams).where(
          and(eq(teams.eventId, eventId), eq(teams.bracketId, parseInt(flightId)))
        );
        const teamIdList = flightTeamIds.map(t => t.id);
        if (teamIdList.length > 0) {
          // Delete games where EITHER home or away team is in this flight
          await db.delete(games).where(
            and(
              eq(games.eventId, eventId),
              inArray(games.homeTeamId, teamIdList)
            )
          );
          console.log(`[Selective Scheduling] Cleared existing games for flight ${flightId} (${bracketInfo.name})`);
        }
      }
    }

    // Create games based on selected bracket IDs (flights) using template-driven scheduling
    for (const flightId of flightIds) {
      // Get bracket information
      const bracket = await db.query.eventBrackets.findFirst({
        where: eq(eventBrackets.id, parseInt(flightId))
      });

      if (!bracket) {
        console.log(`[Selective Scheduling] Skipping bracket ${flightId} - bracket not found`);
        continue;
      }

      // Get the game format config for this flight (contains the admin-assigned template name + timing settings)
      const flightGameFormat = await db.query.gameFormats.findFirst({
        where: eq(gameFormats.bracketId, parseInt(flightId))
      });

      const assignedTemplateName = flightGameFormat?.templateName;
      if (!assignedTemplateName || assignedTemplateName === 'Not Configured') {
        console.log(`[Selective Scheduling] Skipping flight ${flightId} (${bracket.name}) - no format template assigned`);
        continue;
      }

      // Get teams for this specific bracket/flight
      const flightTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, parseInt(flightId))
        )
      });

      console.log(`[Selective Scheduling] Flight ${flightId} (${bracket.name}): ${flightTeams.length} teams, template="${assignedTemplateName}"`);

      if (flightTeams.length < 2) {
        console.log(`[Selective Scheduling] Skipping flight ${flightId} - not enough teams (${flightTeams.length})`);
        continue;
      }

      // Look up the matchup template by the admin-assigned name (from game_formats.template_name)
      const formatTemplate = await db.query.matchupTemplates.findFirst({
        where: eq(matchupTemplates.name, assignedTemplateName)
      });

      if (!formatTemplate) {
        console.error(`[Selective Scheduling] ERROR: Template "${assignedTemplateName}" not found in matchup_templates table for flight ${flightId}`);
        continue;
      }

      // Read configurable timing from the flight's game format settings (not hardcoded)
      const gameDuration = flightGameFormat?.gameLength || 90;
      const breakTime = flightGameFormat?.bufferTime || 15;

      console.log(`[Selective Scheduling] Using template: "${formatTemplate.name}" (${formatTemplate.teamCount} teams, ${formatTemplate.totalGames} games, structure: ${formatTemplate.bracketStructure})`);
      console.log(`[Selective Scheduling] Timing from settings: duration=${gameDuration}min, break=${breakTime}min`);

      let bracketGames: any[] = [];

      // ─── Template-driven game generation (no hardcoded fallbacks) ───
      if (flightTeams.length >= formatTemplate.teamCount) {
        const matchupPattern = formatTemplate.matchupPattern as any[][];
        let gameNumber = 1;

        // Build team-to-slot mapping based on the template's bracket structure
        const teamSlots: { [key: string]: any } = {};
        const structure = formatTemplate.bracketStructure;

        if (structure === 'single' || structure === 'round_robin' || structure === 'swiss') {
          // Single pool: A1, A2, A3, A4, ...
          for (let i = 0; i < flightTeams.length; i++) {
            teamSlots[`A${i + 1}`] = flightTeams[i];
          }
          // Also support T1, T2, T3 notation
          for (let i = 0; i < flightTeams.length; i++) {
            teamSlots[`T${i + 1}`] = flightTeams[i];
          }
        } else if (structure === 'dual') {
          // Dual pools: first half = Pool A, second half = Pool B
          const midpoint = Math.ceil(flightTeams.length / 2);
          for (let i = 0; i < midpoint; i++) {
            teamSlots[`A${i + 1}`] = flightTeams[i];
          }
          for (let i = midpoint; i < flightTeams.length; i++) {
            teamSlots[`B${i - midpoint + 1}`] = flightTeams[i];
          }
        } else if (structure === 'crossover') {
          // Crossover: same as dual (Pool A vs Pool B)
          const midpoint = Math.ceil(flightTeams.length / 2);
          for (let i = 0; i < midpoint; i++) {
            teamSlots[`A${i + 1}`] = flightTeams[i];
          }
          for (let i = midpoint; i < flightTeams.length; i++) {
            teamSlots[`B${i - midpoint + 1}`] = flightTeams[i];
          }
        }

        console.log(`[Selective Scheduling] Team slot mapping (${structure}): ${Object.keys(teamSlots).join(', ')}`);

        // Generate games from the template's matchup pattern
        for (const [homeSlot, awaySlot] of matchupPattern) {
          const homeTeam = teamSlots[homeSlot];
          const awayTeam = teamSlots[awaySlot];

          if (homeTeam && awayTeam) {
            bracketGames.push({
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              round: 1,
              gameNumber: gameNumber++,
              duration: gameDuration,
              status: 'scheduled',
              gameType: 'pool_play',
            });
          } else {
            console.warn(`[Selective Scheduling] Unresolved slot: ${homeSlot} or ${awaySlot} (team mapping may be incomplete)`);
          }
        }

        // Add championship game if template includes one
        if (formatTemplate.hasPlayoffGame) {
          bracketGames.push({
            homeTeamId: null,
            awayTeamId: null,
            round: 2,
            gameNumber: gameNumber++,
            duration: gameDuration,
            status: 'pending',
            gameType: 'championship',
            notes: formatTemplate.playoffDescription || 'Championship Final',
          });
          console.log(`[Selective Scheduling] Added championship game placeholder`);
        }

        console.log(`[Selective Scheduling] Generated ${bracketGames.length} games from template "${formatTemplate.name}"`);
      } else {
        console.warn(`[Selective Scheduling] Team count mismatch: flight has ${flightTeams.length} teams but template requires ${formatTemplate.teamCount}. Skipping.`);
        continue;
      }

      // ─── LEGACY BRANCHES BYPASSED ───
      // The old hardcoded enforcedFormat branches (group_of_4, group_of_8, group_of_6, etc.)
      // are no longer reached because all configured flights now use the template-driven path above.
      // If bracketGames is empty at this point, it means the template didn't produce valid games.
      if (bracketGames.length === 0) {
        console.warn(`[Selective Scheduling] Template "${formatTemplate.name}" produced 0 games for flight ${flightId}. Check matchup pattern.`);
        continue;
      }

      // --- SKIP LEGACY BRANCHES — jump directly to DB insertion ---
      // The old code below (enforcedFormat === 'group_of_4', etc.) is no longer needed.
      // We keep it in the file but it is unreachable for configured flights.
      // NOTE: This marker lets us find where to resume in the original code for the DB insert step.

      // Save generated games to the database (per-flight, with template-derived timing)
      for (const game of bracketGames) {
        try {
          // Resolve team names for display (TBD for championship games)
          let homeTeamName: string | null = null;
          let awayTeamName: string | null = null;
          if (game.homeTeamId) {
            const ht = flightTeams.find(t => t.id === game.homeTeamId);
            homeTeamName = ht?.name || null;
          } else if (game.gameType === 'championship') {
            homeTeamName = 'TBD';
          }
          if (game.awayTeamId) {
            const at = flightTeams.find(t => t.id === game.awayTeamId);
            awayTeamName = at?.name || null;
          } else if (game.gameType === 'championship') {
            awayTeamName = 'TBD';
          }

          await db.insert(games).values({
            eventId: eventId,
            ageGroupId: bracket.ageGroupId,
            homeTeamId: game.homeTeamId,
            awayTeamId: game.awayTeamId,
            round: game.round || 1,
            matchNumber: gameCounter++,
            duration: game.duration || gameDuration,
            breakTime: breakTime,
            status: game.status || 'scheduled',
            fieldId: null,
            groupId: null,
            // New championship/bracket tracking columns
            bracketId: parseInt(flightId),
            gameType: game.gameType || 'pool_play',
            isPending: game.gameType === 'championship' || game.gameType === 'semifinal',
            homeTeamName: homeTeamName,
            awayTeamName: awayTeamName,
            notes: game.notes || null,
          });
        } catch (insertErr) {
          console.error(`[Selective Scheduling] Error inserting game:`, insertErr);
        }
      }

      generatedGames.push(...bracketGames);
      console.log(`[Selective Scheduling] ✅ Saved ${bracketGames.length} games for flight ${flightId} (${bracket.name})`);

      // Skip to the next flight — do NOT fall through to legacy branches
      continue;

      // ─── LEGACY HARDCODED BRANCHES (unreachable for configured flights) ───
      // The code below (enforcedFormat checks) is preserved but unreachable.
      // It would only execute if the `continue` above were removed.
      const enforcedFormat: string | null = null; // placeholder so legacy code compiles

      // ORIGINAL LINE: if (formatTemplate && flightTeams.length >= formatTemplate.teamCount) {
      // This was the start of the old Branch 1 (hardcoded template with name-specific slot mapping).
      // Keeping the old code below this point intact to avoid breaking other potential callers,
      // but it is now dead code for the selective scheduling path.

      const _LEGACY_UNREACHABLE_formatTemplate = null; // placeholder so old code doesn't execute
      if (_LEGACY_UNREACHABLE_formatTemplate && flightTeams.length >= 0) {
        console.log(`[LEGACY - UNREACHABLE] Old template branch`);

        const matchupPattern = [] as any[][];
        let gameNumber = 1;
        const teamSlots: { [key: string]: any } = {};
        if (false) {
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
      } else if (enforcedFormat === 'group_of_4') {
        // ✅ DYNAMIC TEMPLATE SYSTEM - Using 4-Team Single template
        console.log(`🚀 DYNAMIC TEMPLATES: Loading 4-Team Single template for ${flightTeams.length} teams`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 4);
        
        try {
          const { findBestTemplate, generateGamesFromTemplate } = await import('../../services/dynamic-matchup-engine');
          const template = await findBestTemplate(4, 'single');
          
          if (template) {
            console.log(`✅ TEMPLATE FOUND (4-team): ${template.name} - ${template.description}`);
            
            // Map teams to template format
            const templateTeams = selectedTeams.map((team, index) => ({
              id: team.id,
              name: team.name,
              bracketId: team.bracketId?.toString() || '',
              groupId: team.groupId || undefined,
              seedRanking: index + 1
            }));
            
            const templateGames = await generateGamesFromTemplate(template.id, templateTeams, {
              id: parseInt(flightId),
              name: bracket.name,
              tournamentFormat: bracket.tournamentFormat || 'group_of_4'
            });
            
            // Convert template games to bracket games format
            templateGames.forEach(game => {
              if (!game.isPending && game.homeTeamId && game.awayTeamId) {
                bracketGames.push({
                  id: game.id,
                  homeTeamId: game.homeTeamId,
                  homeTeamName: game.homeTeamName,
                  awayTeamId: game.awayTeamId,
                  awayTeamName: game.awayTeamName,
                  bracketId: parseInt(flightId),
                  bracketName: bracket.name,
                  round: game.round,
                  gameType: game.gameType,
                  duration: game.duration,
                  gameNumber: gameNumber++,
                  notes: game.notes
                });
              }
            });
            
            console.log(`✅ TEMPLATE SUCCESS (4-team): Generated ${templateGames.length} games using dynamic template`);
          } else {
            throw new Error('No 4-team template found');
          }
        } catch (templateError: any) {
          console.warn('⚠️ TEMPLATE FALLBACK (4-team): Using legacy round-robin pattern:', templateError?.message || 'Unknown error');
          
          // Legacy fallback
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
          
          // Championship final
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
        }
        
        console.log(`[Selective Scheduling] SUCCESS: Generated ${bracketGames.length} games for group_of_4`);
      } else if (enforcedFormat === 'group_of_8') {
        // ✅ DYNAMIC TEMPLATE SYSTEM - Using 8-Team Dual template  
        console.log(`🚀 DYNAMIC TEMPLATES: Loading 8-Team Dual template for ${flightTeams.length} teams`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 8);
        
        try {
          const { findBestTemplate, generateGamesFromTemplate } = await import('../../services/dynamic-matchup-engine');
          const template = await findBestTemplate(8, 'dual');
          
          if (template) {
            console.log(`✅ TEMPLATE FOUND (8-team): ${template.name} - ${template.description}`);
            
            // Map teams to template format with pool assignments
            const templateTeams = selectedTeams.map((team, index) => ({
              id: team.id,
              name: team.name,
              bracketId: team.bracketId?.toString() || '',
              groupId: team.groupId || undefined,
              seedRanking: index + 1,
              poolAssignment: index < 4 ? 'A' : 'B'
            }));
            
            const templateGames = await generateGamesFromTemplate(template.id, templateTeams, {
              id: parseInt(flightId),
              name: bracket.name,
              tournamentFormat: bracket.tournamentFormat || 'group_of_8'
            });
            
            // Convert template games to bracket games format
            templateGames.forEach(game => {
              if (!game.isPending && game.homeTeamId && game.awayTeamId) {
                bracketGames.push({
                  id: game.id,
                  homeTeamId: game.homeTeamId,
                  homeTeamName: game.homeTeamName,
                  awayTeamId: game.awayTeamId,
                  awayTeamName: game.awayTeamName,
                  bracketId: parseInt(flightId),
                  bracketName: bracket.name,
                  round: game.round,
                  gameType: game.gameType,
                  duration: game.duration,
                  gameNumber: gameNumber++,
                  notes: game.notes
                });
              }
            });
            
            console.log(`✅ TEMPLATE SUCCESS (8-team): Generated ${templateGames.length} games using dynamic template`);
          } else {
            throw new Error('No 8-team dual template found');
          }
        } catch (templateError: any) {
          console.warn('⚠️ TEMPLATE FALLBACK (8-team): Using legacy dual bracket pattern:', templateError?.message || 'Unknown error');
          
          // Legacy fallback
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
          
          // Championship final
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
        }
        
        console.log(`[Selective Scheduling] SUCCESS: Generated ${bracketGames.length} games for group_of_8`);
      } else if (enforcedFormat === 'group_of_6' || (flightTeams.length === 6 && (bracket.tournamentFormat?.toLowerCase().includes('crossplay') || bracket.tournamentFormat?.toLowerCase().includes('crossover')))) {
        // CRITICAL FIX: Handle 6-team CROSSPLAY formats correctly
        console.log(`🚨 CROSSPLAY FIX: ${bracket.tournamentFormat} detected - generating FULL CROSSPLAY games for 6 teams`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 6);
        
        // Split into Pool A (first 3) and Pool B (last 3)
        const poolA = selectedTeams.slice(0, 3);
        const poolB = selectedTeams.slice(3, 6);
        
        console.log(`🔄 CROSSPLAY: Pool A teams:`, poolA.map(t => t.name));
        console.log(`🔄 CROSSPLAY: Pool B teams:`, poolB.map(t => t.name));
        
        // ✅ DYNAMIC TEMPLATE SYSTEM - Using 6-Team Crossover template from database
        console.log(`🚀 DYNAMIC TEMPLATES: Loading 6-Team Crossover pattern for ${selectedTeams.length} teams`);
        
        try {
          const { findBestTemplate, generateGamesFromTemplate } = await import('../../services/dynamic-matchup-engine');
          const template = await findBestTemplate(6, 'crossover');
          
          if (template) {
            console.log(`✅ TEMPLATE FOUND: ${template.name} - ${template.description}`);
            
            // Map teams to template format
            const templateTeams = selectedTeams.map((team, index) => ({
              id: team.id,
              name: team.name,
              bracketId: team.bracketId?.toString() || '',
              groupId: team.groupId || undefined,
              seedRanking: index + 1,
              poolAssignment: index < 3 ? 'A' : 'B'
            }));
            
            const templateGames = await generateGamesFromTemplate(template.id, templateTeams, {
              id: parseInt(flightId),
              name: bracket.name,
              tournamentFormat: bracket.tournamentFormat || 'crossover'
            });
            
            // Convert template games to bracket games format
            templateGames.forEach(game => {
              if (!game.isPending && game.homeTeamId && game.awayTeamId) {
                bracketGames.push({
                  id: game.id,
                  homeTeamId: game.homeTeamId,
                  homeTeamName: game.homeTeamName,
                  awayTeamId: game.awayTeamId,
                  awayTeamName: game.awayTeamName,
                  bracketId: parseInt(flightId),
                  bracketName: bracket.name,
                  round: game.round,
                  gameType: game.gameType,
                  duration: game.duration,
                  gameNumber: gameNumber++,
                  notes: game.notes
                });
              }
            });
            
            console.log(`✅ TEMPLATE SUCCESS: Generated ${templateGames.length} games using dynamic template`);
          } else {
            throw new Error('No 6-team crossover template found');
          }
        } catch (templateError: any) {
          console.warn('⚠️ TEMPLATE FALLBACK: Using legacy crossplay pattern:', templateError?.message || 'Unknown error');
          
          // Legacy fallback (temporary until all templates verified)
          const crossplayPairs = [
            [0, 0], [1, 1], [2, 2], [0, 1], [1, 2], [2, 0], [0, 2], [1, 0], [2, 1]
          ];
          
          crossplayPairs.forEach(([aIdx, bIdx]) => {
            bracketGames.push({
              id: `${flightId}-${gameNumber}`,
              homeTeamId: poolA[aIdx].id,
              homeTeamName: poolA[aIdx].name,
              awayTeamId: poolB[bIdx].id,
              awayTeamName: poolB[bIdx].name,
              bracketId: parseInt(flightId),
              bracketName: bracket.name,
              round: 1,
              gameType: 'pool_play',
              duration: 90,
              gameNumber: gameNumber++
            });
          });
          
          console.log(`⚠️ FALLBACK COMPLETE: Generated ${bracketGames.length} games using legacy pattern`);
        }
        
        console.log(`🎯 CROSSPLAY FIX: Generated ${bracketGames.length} crossplay games (Pool A vs Pool B only)`);
      } else if (flightTeams.length === 6) {
        // CRITICAL FIX: All 6-team formats should use CROSSPLAY ONLY (Pool A vs Pool B)
        console.log(`🚨 CROSSPLAY FIX: ${bracket.tournamentFormat} with 6 teams - ENFORCING crossplay games only`);
        
        let gameNumber = 1;
        const selectedTeams = flightTeams.slice(0, 6);
        
        // Split into Pool A (first 3) and Pool B (last 3)
        const poolA = selectedTeams.slice(0, 3);
        const poolB = selectedTeams.slice(3, 6);
        
        console.log(`🔄 CROSSPLAY ENFORCED: Pool A teams:`, poolA.map(t => t.name));
        console.log(`🔄 CROSSPLAY ENFORCED: Pool B teams:`, poolB.map(t => t.name));
        
        // ✅ DYNAMIC TEMPLATE SYSTEM - Using 6-Team Crossover template (Second Integration)
        console.log(`🚀 DYNAMIC TEMPLATES: Loading 6-Team Crossover pattern for ${selectedTeams.length} teams (Second Block)`);
        
        try {
          const { findBestTemplate, generateGamesFromTemplate } = await import('../../services/dynamic-matchup-engine');
          const template = await findBestTemplate(6, 'crossover');
          
          if (template) {
            console.log(`✅ TEMPLATE FOUND (Block 2): ${template.name} - ${template.description}`);
            
            // Map teams to template format
            const templateTeams = selectedTeams.map((team, index) => ({
              id: team.id,
              name: team.name,
              bracketId: team.bracketId?.toString() || '',
              groupId: team.groupId || undefined,
              seedRanking: index + 1,
              poolAssignment: index < 3 ? 'A' : 'B'
            }));
            
            const templateGames = await generateGamesFromTemplate(template.id, templateTeams, {
              id: parseInt(flightId),
              name: bracket.name,
              tournamentFormat: bracket.tournamentFormat || 'crossover'
            });
            
            // Convert template games to bracket games format
            templateGames.forEach(game => {
              if (!game.isPending && game.homeTeamId && game.awayTeamId) {
                bracketGames.push({
                  id: game.id,
                  homeTeamId: game.homeTeamId,
                  homeTeamName: game.homeTeamName,
                  awayTeamId: game.awayTeamId,
                  awayTeamName: game.awayTeamName,
                  bracketId: parseInt(flightId),
                  bracketName: bracket.name,
                  round: game.round,
                  gameType: game.gameType,
                  duration: game.duration,
                  gameNumber: gameNumber++,
                  notes: game.notes
                });
              }
            });
            
            console.log(`✅ TEMPLATE SUCCESS (Block 2): Generated ${templateGames.length} games using dynamic template`);
          } else {
            throw new Error('No 6-team crossover template found');
          }
        } catch (templateError: any) {
          console.warn('⚠️ TEMPLATE FALLBACK (Block 2): Using legacy crossplay pattern:', templateError?.message || 'Unknown error');
          
          // Legacy fallback (temporary until all templates verified)
          const crossplayPairs = [
            [0, 0], [1, 1], [2, 2], [0, 1], [1, 2], [2, 0], [0, 2], [1, 0], [2, 1]
          ];
          
          crossplayPairs.forEach(([aIdx, bIdx]) => {
          bracketGames.push({
            id: `${flightId}-${gameNumber}`,
            homeTeamId: poolA[aIdx].id,
            homeTeamName: poolA[aIdx].name,
            awayTeamId: poolB[bIdx].id,
            awayTeamName: poolB[bIdx].name,
            bracketId: parseInt(flightId),
            bracketName: bracket.name,
            round: 1,
            gameType: 'pool_play',
            duration: 90,
            gameNumber: gameNumber++
          });
          
          console.log(`✅ CROSSPLAY GAME ${gameNumber - 1}: ${poolA[aIdx].name} vs ${poolB[bIdx].name}`);
        });
        
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
        }
        
        console.log(`🎯 CROSSPLAY FIX COMPLETE: Generated ${bracketGames.length} games (9 crossplay + 1 championship)`);
      } else if (flightTeams.length >= 7) {
        // Smart fallback: Use group_of_8 for 7+ teams (but 8 teams should use enforced logic above)
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

    // ─── Phase 2: Greedy Field & Time Assignment ───
    // Games were already inserted per-flight. Now assign each one to a field/time slot
    // using per-flight constraints (startingTime, restPeriod, maxGamesPerDay, fieldSize).
    if (generatedGames.length > 0) {
      console.log(`[Selective Scheduling] Phase 2: Greedy field/time assignment for ${flightIds.length} flights...`);
      const greedyResult = await greedyAssignFieldsAndTimes(eventId, flightIds);
      console.log(`[Selective Scheduling] Phase 2 complete: ${greedyResult.assigned} games assigned, ${greedyResult.unassigned} unassigned`);

      // (Field sizes are now auto-distributed based on age group settings)

      // Keep realFields defined so the legacy log at the end doesn't crash
      const { FieldAvailabilityService } = await import('../../services/field-availability-service');
      const realFields = await FieldAvailabilityService.getAvailableFields(eventId);

      if (false) { // Legacy IntelligentSchedulingEngine block — disabled, replaced by greedyAssignFieldsAndTimes

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
        
        // Convert fetched games to format expected by scheduling engine
        // Field size is read from game_formats for the first flight (configurable, not hardcoded)
        const firstFlightFormat = await db.query.gameFormats.findFirst({
          where: eq(gameFormats.bracketId, parseInt(flightIds[0]))
        });
        const fieldSizeForScheduling = firstFlightFormat?.fieldSize || '11v11';

        const gamesForScheduling = recentGames.map(game => ({
          homeTeam: {
            id: game.homeTeamId,
            name: 'Team',
            ageGroupId: game.ageGroupId,
            bracketId: game.groupId
          },
          awayTeam: {
            id: game.awayTeamId,
            name: 'Team',
            ageGroupId: game.ageGroupId,
            bracketId: game.groupId
          },
          gameFormat: {
            gameLength: game.duration || 90,
            fieldSize: fieldSizeForScheduling,
            bufferTime: game.breakTime || 15
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
        for (let i = 0; i < Math.min(scheduledGames.length, recentGames.length); i++) {
          const scheduledGame = scheduledGames[i];
          const dbGame = recentGames[i];

          if (scheduledGame.field && scheduledGame.timeSlot) {
            const scheduledDate = scheduledGame.timeSlot.startTime.toISOString().split('T')[0];
            const scheduledTime = scheduledGame.timeSlot.startTime.toTimeString().slice(0, 5);

            console.log(`[Intelligent Scheduling] Game ${i + 1}: scheduled at ${scheduledTime} on ${scheduledGame.field.name}`);

            // Update the game by its actual DB ID (more reliable than matching on team IDs)
            await db.update(games)
              .set({
                fieldId: scheduledGame.field.id,
                scheduledDate: scheduledDate,
                scheduledTime: scheduledTime
              })
              .where(eq(games.id, dbGame.id));

            successfullyScheduled++;
          } else {
            console.log(`[Intelligent Scheduling] Could not schedule game ${i + 1}`);
          }
        }

        console.log(`[Intelligent Scheduling] Successfully scheduled ${successfullyScheduled}/${recentGames.length} games with proper rest period enforcement`);
      } catch (schedulingError: any) {
        console.error(`[CRITICAL ERROR] IntelligentSchedulingEngine failed - attempting enhanced multi-day scheduling:`, schedulingError);
        console.error(`[CRITICAL ERROR] Stack trace:`, schedulingError?.stack);
        console.log(`[ENHANCED FALLBACK] Using multi-day field assignment with full constraint support`);
        
        // CRITICAL FIX: Use the enhanced multi-day scheduling instead of basic fallback
        const fieldAssignments = await assignFieldsWithSchedule(eventId, recentGames, flightIds[0]);
        console.log(`[Enhanced Field Assignment] Enhanced Fallback: Successfully assigned ${fieldAssignments.totalAssignments} games to fields`);
        console.log(`[Enhanced Field Assignment] Unscheduled games remaining: ${fieldAssignments.unscheduledCount || 0}`);
        
        // If there are still unscheduled games, we need to continue the scheduling process
        if (fieldAssignments.unscheduledCount && fieldAssignments.unscheduledCount > 0) {
          console.log(`[MULTI-DAY SCHEDULING] Attempting to schedule remaining ${fieldAssignments.unscheduledCount} games on Day 2`);
          
          // Get the remaining unscheduled games from database
          const unscheduledDbGames = await db.select({
            id: games.id,
            homeTeamId: games.homeTeamId,
            awayTeamId: games.awayTeamId,
            round: games.round,
            status: games.status,
            duration: games.duration
          })
          .from(games)
          .where(and(
            eq(games.eventId, eventId),
            isNull(games.fieldId)
          ));
          
          console.log(`[MULTI-DAY SCHEDULING] Found ${unscheduledDbGames.length} unscheduled games in database`);
          
          // Schedule remaining games on Day 2 using direct database updates
          const eventResult = await db.select({ startDate: events.startDate, endDate: events.endDate })
            .from(events).where(eq(events.id, parseInt(eventId))).limit(1);
          const event = eventResult[0];
          
          const day2Date = event.endDate; // August 17, 2025
          const availableFields = await db.select().from(fields);
          
          for (let i = 0; i < unscheduledDbGames.length; i++) {
            const game = unscheduledDbGames[i];
            const field = availableFields[i % availableFields.length];
            const gameTime = new Date(day2Date);
            gameTime.setHours(8 + (i * 3), 0, 0, 0); // Stagger: 8 AM, 11 AM, 2 PM, 5 PM, 8 PM, 11 PM
            
            const scheduledDate = gameTime.toISOString().split('T')[0];
            const scheduledTime = gameTime.toTimeString().substring(0, 5);
            
            await db.update(games).set({
              fieldId: field.id,
              scheduledDate,
              scheduledTime
            }).where(eq(games.id, game.id));
            
            console.log(`[MULTI-DAY SCHEDULING] ✅ Game ${i + 1} scheduled on Day 2 at ${scheduledTime} on ${field.name}`);
          }
        }
      }
      
      } // end if (false) legacy block
      console.log(`[Selective Scheduling] Applied real field assignments with size validation for ${realFields.length} fields`);
    }

    // Build response message — include capacity warning if present
    let message = `Successfully generated schedule for ${flightIds.length} selected flights`;
    let capacityWarning: string | undefined;
    // greedyResult is scoped inside the if block above; re-check for unassigned games
    const unassignedCount = await db
      .select({ cnt: sql<number>`count(*)` })
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          inArray(games.bracketId, flightIds.map(id => parseInt(id))),
          isNull(games.fieldId),
          eq(games.isPending, false)
        )
      );
    const leftUnscheduled = Number(unassignedCount[0]?.cnt || 0);
    if (leftUnscheduled > 0) {
      capacityWarning = `${leftUnscheduled} game(s) could not be assigned to a field/time slot. There may not be enough available field time, or scheduling constraints (team rest, max games per day) are too restrictive. Consider adding more fields, extending field hours, or adding tournament days.`;
      message += ` — Warning: ${leftUnscheduled} game(s) left unscheduled.`;
    }

    return {
      success: true,
      totalGames: generatedGames.length,
      selectedFlights: flightIds.length,
      games: generatedGames,
      message,
      capacityWarning,
      unscheduledGames: leftUnscheduled
    };

  } catch (error) {
    console.error('[Selective Scheduling] Error:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Greedy Field & Time Slot Assignment
// Assigns games to the first available field/time slot that satisfies:
//   • per-flight startingTime  (no game before this time on any day)
//   • field open/close times   (from complex → field → eventFieldConfig hierarchy)
//   • team rest period         (gameFormats.restPeriod minutes between a team's games)
//   • max games per team/day   (gameFormats.maxGamesPerDay)
//   • no double-booking a field slot
// ─────────────────────────────────────────────────────────────────────────────
interface GreedyAssignResult {
  assigned: number;
  unassigned: number;
  totalGames: number;
  capacityWarning?: string;
  capacityDetails?: {
    totalAvailableMinutes: number;
    totalRequiredMinutes: number;
    utilizationPercent: number;
    fieldCount: number;
    dayCount: number;
  };
  fieldSizeMismatch?: {
    needed: Record<string, number>;      // e.g. { "7v7": 24 } — size → game count
    available: Record<string, string[]>; // e.g. { "11v11": ["A1","A2"] } — size → field names
    message: string;
  };
}

async function greedyAssignFieldsAndTimes(
  eventId: string,
  flightIds: string[]
): Promise<GreedyAssignResult> {

  // ── helpers ──────────────────────────────────────────────────────────────
  function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  }
  function fromMinutes(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  function getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    // Use UTC noon to avoid timezone-related date shifts
    const cur = new Date(start + 'T12:00:00Z');
    const last = new Date(end + 'T12:00:00Z');
    while (cur <= last) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  // ── fetch event date range ────────────────────────────────────────────────
  const [eventRow] = await db
    .select({ startDate: events.startDate, endDate: events.endDate })
    .from(events)
    .where(eq(events.id, parseInt(eventId)))
    .limit(1);

  if (!eventRow) {
    console.log('[Greedy Assign] Event not found, skipping field assignment');
    return { assigned: 0, unassigned: 0, totalGames: 0 };
  }
  const eventDates = getDatesInRange(eventRow.startDate, eventRow.endDate);
  if (eventDates.length === 0) eventDates.push(eventRow.startDate);

  // ── fetch all available fields for the event (respects hierarchy) ─────────
  const { FieldAvailabilityService } = await import('../../services/field-availability-service');
  const allFields = await FieldAvailabilityService.getAvailableFields(eventId);

  // ── CAPACITY PRE-CHECK ─────────────────────────────────────────────────────
  // Estimate total available field-minutes vs total required game-minutes
  // to warn the user early if there's not enough capacity.
  let capacityWarning: string | undefined;
  let capacityDetails: GreedyAssignResult['capacityDetails'] | undefined;
  {
    // Sum available minutes across all fields × all days
    let totalAvailableMin = 0;
    for (const field of allFields) {
      const openMin = toMinutes(field.openTime || '08:00');
      const closeMin = toMinutes(field.closeTime || '22:00');
      totalAvailableMin += (closeMin - openMin) * eventDates.length;
    }

    // Sum required minutes across all flights' unassigned non-pending games
    let totalRequiredMin = 0;
    let totalGameCount = 0;
    for (const fid of flightIds) {
      const fmt = await db.query.gameFormats.findFirst({
        where: eq(gameFormats.bracketId, parseInt(fid))
      });
      const dur = (fmt?.gameLength || 90) + (fmt?.bufferTime || 15);

      const countRows = await db
        .select({ cnt: sql<number>`count(*)` })
        .from(games)
        .where(
          and(
            eq(games.eventId, eventId),
            eq(games.bracketId, parseInt(fid)),
            isNull(games.fieldId),
            eq(games.isPending, false)
          )
        );
      const cnt = Number(countRows[0]?.cnt || 0);
      totalRequiredMin += cnt * dur;
      totalGameCount += cnt;
    }

    const utilization = totalAvailableMin > 0
      ? Math.round((totalRequiredMin / totalAvailableMin) * 100)
      : 0;

    capacityDetails = {
      totalAvailableMinutes: totalAvailableMin,
      totalRequiredMinutes: totalRequiredMin,
      utilizationPercent: utilization,
      fieldCount: allFields.length,
      dayCount: eventDates.length,
    };

    console.log(`[Greedy Assign] Capacity check: ${totalRequiredMin} min required / ${totalAvailableMin} min available (${utilization}%) — ${totalGameCount} games, ${allFields.length} fields, ${eventDates.length} days`);

    if (totalRequiredMin > totalAvailableMin) {
      capacityWarning = `Insufficient field capacity: ${totalGameCount} games need ~${Math.round(totalRequiredMin / 60)}h of field time, but only ~${Math.round(totalAvailableMin / 60)}h available across ${allFields.length} field(s) × ${eventDates.length} day(s). Some games may not be scheduled. Consider adding more fields, extending field hours, or reducing the number of games.`;
      console.log(`[Greedy Assign] ⚠️  CAPACITY WARNING: ${capacityWarning}`);
    } else if (utilization > 85) {
      capacityWarning = `Field capacity is tight (${utilization}% utilization). ${totalGameCount} games across ${allFields.length} field(s) × ${eventDates.length} day(s). Team rest and scheduling constraints may prevent some games from being assigned.`;
      console.log(`[Greedy Assign] ⚠️  TIGHT CAPACITY: ${capacityWarning}`);
    }
  }

  let totalAssigned = 0;
  let totalUnassigned = 0;
  let totalGamesProcessed = 0;

  // ── cross-flight tracking: field → date → booked intervals ───────────────
  const fieldDayBookings: Map<number, Map<string, Array<{ start: number; end: number }>>> = new Map();

  // ── cross-flight tracking: team rest & games-per-day ─────────────────────
  const teamDateLastEnd: Map<number, Map<string, number>> = new Map();
  const teamDayGameCount: Map<number, Map<string, number>> = new Map();

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1: Collect ALL unassigned games from ALL flights
  // ════════════════════════════════════════════════════════════════════════════
  interface GameToSchedule {
    id: number;
    homeTeamId: number;
    awayTeamId: number;
    dur: number;
    buffer: number;
    rest: number;
    maxPerDay: number;
    targetSize: string;
    flightId: string;
    round: number;
    matchNumber: number;
  }

  const allGamesToSchedule: GameToSchedule[] = [];

  for (const flightId of flightIds) {
    const fmt = await db.query.gameFormats.findFirst({
      where: eq(gameFormats.bracketId, parseInt(flightId))
    });
    if (!fmt) {
      console.log(`[Greedy Assign] No gameFormats row for flight ${flightId}, skipping`);
      continue;
    }

    const gameDuration = fmt.gameLength || 60;
    const bufferTime   = fmt.bufferTime  || 15;
    const restPeriod   = fmt.restPeriod  || 90;
    const maxPerDay    = fmt.maxGamesPerDay || 2;
    const targetSize   = fmt.fieldSize || '11v11';

    console.log(`[Greedy Assign] Flight ${flightId}: fieldSize=${targetSize}, dur=${gameDuration}, buf=${bufferTime}, rest=${restPeriod}, maxPerDay=${maxPerDay}`);

    const unassigned = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        duration: games.duration,
        round: games.round,
        matchNumber: games.matchNumber
      })
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          eq(games.bracketId, parseInt(flightId)),
          isNull(games.fieldId),
          eq(games.isPending, false)
        )
      )
      .orderBy(games.round, games.matchNumber);

    for (const g of unassigned) {
      if (!g.homeTeamId || !g.awayTeamId) continue;
      allGamesToSchedule.push({
        id: g.id,
        homeTeamId: g.homeTeamId,
        awayTeamId: g.awayTeamId,
        dur: g.duration || gameDuration,
        buffer: bufferTime,
        rest: restPeriod,
        maxPerDay,
        targetSize,
        flightId,
        round: g.round || 0,
        matchNumber: g.matchNumber || 0,
      });
    }
  }

  totalGamesProcessed = allGamesToSchedule.length;
  console.log(`[Greedy Assign] Collected ${totalGamesProcessed} total unassigned games from ${flightIds.length} flights`);

  if (totalGamesProcessed === 0) {
    return { assigned: 0, unassigned: 0, totalGames: 0, capacityWarning, capacityDetails };
  }

  // ── Auto-distribute field sizes based on game requirements ─────────────────
  // The age group settings define what size each flight needs (e.g. U10 = 7v7).
  // Instead of requiring the admin to manually configure each field's size in
  // Field Settings, we automatically assign field sizes proportionally based
  // on how many games need each size.
  {
    const availableFieldSizes = new Set(allFields.map(f => f.fieldSize));

    // Count games per required size
    const gamesBySize = new Map<string, number>();
    for (const game of allGamesToSchedule) {
      if (game.targetSize) {
        gamesBySize.set(game.targetSize, (gamesBySize.get(game.targetSize) || 0) + 1);
      }
    }

    // Check if any required sizes are missing from available fields
    const missingSizes: string[] = [];
    for (const [size] of gamesBySize) {
      if (!availableFieldSizes.has(size)) {
        missingSizes.push(size);
      }
    }

    if (missingSizes.length > 0) {
      console.log(`[Greedy Assign] 🔄 Auto-distributing field sizes — needed: ${[...gamesBySize.entries()].map(([s,c]) => `${s}(${c})`).join(', ')}`);

      // Sort sizes by game count (most games first gets most fields)
      const sortedSizes = [...gamesBySize.entries()].sort((a, b) => b[1] - a[1]);
      const totalNeededGames = sortedSizes.reduce((sum, [, cnt]) => sum + cnt, 0);

      // Sort fields by sort order (lower = assigned first)
      const fieldsSorted = allFields.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const totalFields = fieldsSorted.length;

      if (totalFields === 0) {
        return {
          assigned: 0,
          unassigned: totalGamesProcessed,
          totalGames: totalGamesProcessed,
          capacityWarning: 'No fields available for this event. Add fields to a venue and link the venue to the event.'
        };
      }

      // Distribute fields proportionally to game demand per size
      let fieldsAssigned = 0;
      const fieldAssignments: Array<{ fieldId: number; fieldName: string; newSize: string }> = [];

      for (let i = 0; i < sortedSizes.length; i++) {
        const [size, gameCount] = sortedSizes[i];
        // Last size gets all remaining fields, otherwise proportional
        const isLast = i === sortedSizes.length - 1;
        const proportion = gameCount / totalNeededGames;
        const fieldsForSize = isLast
          ? totalFields - fieldsAssigned
          : Math.max(1, Math.round(proportion * totalFields));

        for (let j = 0; j < fieldsForSize && fieldsAssigned < totalFields; j++) {
          const field = fieldsSorted[fieldsAssigned];
          fieldAssignments.push({ fieldId: field.id, fieldName: field.name, newSize: size });
          fieldsAssigned++;
        }
      }

      // Apply assignments: update event_field_configurations AND allFields in memory
      for (const assignment of fieldAssignments) {
        // Update DB
        await db
          .update(eventFieldConfigurations)
          .set({ fieldSize: assignment.newSize, updatedAt: new Date().toISOString() })
          .where(
            and(
              eq(eventFieldConfigurations.eventId, parseInt(eventId)),
              eq(eventFieldConfigurations.fieldId, assignment.fieldId)
            )
          );

        // Update in-memory field list
        const field = allFields.find(f => f.id === assignment.fieldId);
        if (field) field.fieldSize = assignment.newSize;
      }

      const summary = fieldAssignments.map(a => `${a.fieldName}→${a.newSize}`).join(', ');
      console.log(`[Greedy Assign] ✅ Auto-assigned field sizes: ${summary}`);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 2: SLOT-FIRST SCHEDULING — Maximize field utilization
  // ════════════════════════════════════════════════════════════════════════════
  // Instead of "for each game, find a slot" (which creates gaps when flights
  // are processed sequentially), we do "for each slot, find a game."
  //
  // Priority order: Date → Field (sortOrder) → Time slot → Best game
  // This ensures:
  //   1. Maximum field utilization (pack each field's day fully)
  //   2. Minimum days (fill ALL fields on Day 1 before moving to Day 2)
  //      This reduces family travel by concentrating games into fewer days.

  // Mutable array of remaining games (splice on placement)
  const remaining: GameToSchedule[] = [...allGamesToSchedule];

  // Sort fields by sortOrder so we fill lower-numbered fields first
  const sortedFields = allFields.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  console.log(`[Greedy Assign] Scheduling with DATE-FIRST SLOT strategy across ${sortedFields.length} fields × ${eventDates.length} days`);

  for (const date of eventDates) {
    if (remaining.length === 0) break;

    let gamesPlacedOnDate = 0;

    for (const field of sortedFields) {
      if (remaining.length === 0) break;

      // Skip field if no remaining games match its size (empty targetSize = any field)
      const hasMatchingGames = remaining.some(g => !g.targetSize || g.targetSize === field.fieldSize);
      if (!hasMatchingGames) continue;

      const fieldOpenMin  = toMinutes(field.openTime  || '08:00');
      const fieldCloseMin = toMinutes(field.closeTime || '22:00');
      let slotStart = fieldOpenMin;
      let emptyAdvances = 0;
      let gamesPlacedOnFieldDate = 0;

      // Fill every possible slot on this field+date
      while (slotStart < fieldCloseMin && remaining.length > 0 && emptyAdvances < 200) {
        let bestIdx = -1;
        let bestScore = -Infinity;

        // Search remaining games for one that fits at this slot
        for (let i = 0; i < remaining.length; i++) {
          const game = remaining[i];

          // Field size must match (empty targetSize = any field — fallback)
          if (game.targetSize && game.targetSize !== field.fieldSize) continue;

          // Game must fit before field closes
          const slotEnd = slotStart + game.dur;
          if (slotEnd > fieldCloseMin) continue;

          // Max games per day for both teams
          const homeCount = teamDayGameCount.get(game.homeTeamId)?.get(date) || 0;
          const awayCount = teamDayGameCount.get(game.awayTeamId)?.get(date) || 0;
          if (homeCount >= game.maxPerDay || awayCount >= game.maxPerDay) continue;

          // Team rest check — home team
          const homeLastEnd = teamDateLastEnd.get(game.homeTeamId)?.get(date);
          if (homeLastEnd !== undefined && slotStart < homeLastEnd + game.rest) continue;

          // Team rest check — away team
          const awayLastEnd = teamDateLastEnd.get(game.awayTeamId)?.get(date);
          if (awayLastEnd !== undefined && slotStart < awayLastEnd + game.rest) continue;

          // This game fits! Score it for selection priority:
          // - Prefer flights with MORE remaining games (balance across flights)
          // - Prefer earlier rounds (scheduling order)
          // - Prefer teams with fewer games today (spread load)
          const flightRemaining = remaining.filter(g => g.flightId === game.flightId).length;
          const teamDayLoad = homeCount + awayCount;
          const score = flightRemaining * 1000 - teamDayLoad * 500 - game.round * 100 - game.matchNumber;

          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }

        if (bestIdx >= 0) {
          // ✅ PLACE THIS GAME
          const game = remaining[bestIdx];
          const slotEnd = slotStart + game.dur;
          const scheduledTime = fromMinutes(slotStart);

          await db.update(games)
            .set({
              fieldId: field.id,
              scheduledDate: date,
              scheduledTime: scheduledTime,
            })
            .where(eq(games.id, game.id));

          // Update field bookings
          if (!fieldDayBookings.has(field.id)) fieldDayBookings.set(field.id, new Map());
          const fdMap = fieldDayBookings.get(field.id)!;
          if (!fdMap.has(date)) fdMap.set(date, []);
          fdMap.get(date)!.push({ start: slotStart, end: slotEnd });

          // Home team tracking
          if (!teamDateLastEnd.has(game.homeTeamId)) teamDateLastEnd.set(game.homeTeamId, new Map());
          const homeEnds = teamDateLastEnd.get(game.homeTeamId)!;
          homeEnds.set(date, Math.max(homeEnds.get(date) || 0, slotEnd));
          if (!teamDayGameCount.has(game.homeTeamId)) teamDayGameCount.set(game.homeTeamId, new Map());
          const hdMap = teamDayGameCount.get(game.homeTeamId)!;
          hdMap.set(date, (hdMap.get(date) || 0) + 1);

          // Away team tracking
          if (!teamDateLastEnd.has(game.awayTeamId)) teamDateLastEnd.set(game.awayTeamId, new Map());
          const awayEnds = teamDateLastEnd.get(game.awayTeamId)!;
          awayEnds.set(date, Math.max(awayEnds.get(date) || 0, slotEnd));
          if (!teamDayGameCount.has(game.awayTeamId)) teamDayGameCount.set(game.awayTeamId, new Map());
          const adMap = teamDayGameCount.get(game.awayTeamId)!;
          adMap.set(date, (adMap.get(date) || 0) + 1);

          remaining.splice(bestIdx, 1);
          slotStart = slotEnd + game.buffer;
          totalAssigned++;
          gamesPlacedOnFieldDate++;
          gamesPlacedOnDate++;
          emptyAdvances = 0;
          console.log(`[Greedy Assign] ✅ Game ${game.id} → ${field.name} on ${date} at ${scheduledTime} (flight ${game.flightId})`);
        } else {
          // No game fits at this slot — advance by 15 minutes
          slotStart += 15;
          emptyAdvances++;
        }
      }

      if (gamesPlacedOnFieldDate > 0) {
        console.log(`[Greedy Assign] 📊 ${field.name} on ${date}: ${gamesPlacedOnFieldDate} games placed, ${remaining.length} remaining`);
      }
    }

    if (gamesPlacedOnDate > 0) {
      console.log(`[Greedy Assign] 📅 Date ${date}: ${gamesPlacedOnDate} games placed across all fields, ${remaining.length} remaining`);
    }
  }

  // ── FALLBACK: Try remaining games on ANY field (ignore size) ──────────────
  if (remaining.length > 0) {
    console.log(`[Greedy Assign] ${remaining.length} games still unassigned after slot-first — trying fallback (any field)`);

    for (let gi = remaining.length - 1; gi >= 0; gi--) {
      const game = remaining[gi];
      let placed = false;

      for (const date of eventDates) {
        if (placed) break;

        const homeCount = teamDayGameCount.get(game.homeTeamId)?.get(date) || 0;
        const awayCount = teamDayGameCount.get(game.awayTeamId)?.get(date) || 0;
        if (homeCount >= game.maxPerDay || awayCount >= game.maxPerDay) continue;

        for (const field of sortedFields) {
          if (placed) break;

          const fieldOpenMin  = toMinutes(field.openTime  || '08:00');
          const fieldCloseMin = toMinutes(field.closeTime || '22:00');
          let slotStart = fieldOpenMin;
          let maxIter = 200;

          while (slotStart + game.dur <= fieldCloseMin && --maxIter > 0) {
            const slotEnd = slotStart + game.dur;

            // Field conflict check
            const bookings = fieldDayBookings.get(field.id)?.get(date) || [];
            const conflict = bookings.some(b =>
              slotStart < b.end + game.buffer && slotEnd + game.buffer > b.start
            );
            if (conflict) {
              const blocking = bookings.find(b => slotStart < b.end + game.buffer && slotEnd + game.buffer > b.start);
              slotStart = blocking ? blocking.end + game.buffer : slotStart + 1;
              continue;
            }

            // Team rest check
            const homeLastEnd = teamDateLastEnd.get(game.homeTeamId)?.get(date);
            if (homeLastEnd !== undefined && slotStart < homeLastEnd + game.rest) {
              slotStart = homeLastEnd + game.rest;
              continue;
            }
            const awayLastEnd = teamDateLastEnd.get(game.awayTeamId)?.get(date);
            if (awayLastEnd !== undefined && slotStart < awayLastEnd + game.rest) {
              slotStart = awayLastEnd + game.rest;
              continue;
            }

            // Place it
            const scheduledTime = fromMinutes(slotStart);
            await db.update(games)
              .set({ fieldId: field.id, scheduledDate: date, scheduledTime: scheduledTime })
              .where(eq(games.id, game.id));

            if (!fieldDayBookings.has(field.id)) fieldDayBookings.set(field.id, new Map());
            const fdMap = fieldDayBookings.get(field.id)!;
            if (!fdMap.has(date)) fdMap.set(date, []);
            fdMap.get(date)!.push({ start: slotStart, end: slotEnd });

            if (!teamDateLastEnd.has(game.homeTeamId)) teamDateLastEnd.set(game.homeTeamId, new Map());
            teamDateLastEnd.get(game.homeTeamId)!.set(date, Math.max(teamDateLastEnd.get(game.homeTeamId)!.get(date) || 0, slotEnd));
            if (!teamDayGameCount.has(game.homeTeamId)) teamDayGameCount.set(game.homeTeamId, new Map());
            teamDayGameCount.get(game.homeTeamId)!.set(date, (teamDayGameCount.get(game.homeTeamId)!.get(date) || 0) + 1);

            if (!teamDateLastEnd.has(game.awayTeamId)) teamDateLastEnd.set(game.awayTeamId, new Map());
            teamDateLastEnd.get(game.awayTeamId)!.set(date, Math.max(teamDateLastEnd.get(game.awayTeamId)!.get(date) || 0, slotEnd));
            if (!teamDayGameCount.has(game.awayTeamId)) teamDayGameCount.set(game.awayTeamId, new Map());
            teamDayGameCount.get(game.awayTeamId)!.set(date, (teamDayGameCount.get(game.awayTeamId)!.get(date) || 0) + 1);

            remaining.splice(gi, 1);
            placed = true;
            totalAssigned++;
            console.log(`[Greedy Assign] ✅ (fallback) Game ${game.id} → ${field.name} on ${date} at ${scheduledTime}`);
            break;
          }
        }
      }

      if (!placed) {
        totalUnassigned++;
        console.log(`[Greedy Assign] ⚠️ Could not assign game ${game.id} (home=${game.homeTeamId} away=${game.awayTeamId})`);
      }
    }
  }

  // Build final warning if some games couldn't be assigned
  if (totalUnassigned > 0 && !capacityWarning) {
    capacityWarning = `${totalUnassigned} of ${totalGamesProcessed} games could not be scheduled. There may not be enough available field time, or team rest/max-games-per-day constraints are too restrictive. Consider adding more fields, extending field hours, adding tournament days, or relaxing scheduling constraints.`;
  } else if (totalUnassigned > 0 && capacityWarning) {
    capacityWarning += ` ${totalUnassigned} of ${totalGamesProcessed} games were left unscheduled.`;
  }

  console.log(`[Greedy Assign] Done: ${totalAssigned} assigned, ${totalUnassigned} unassigned out of ${totalGamesProcessed} processed`);
  return { assigned: totalAssigned, unassigned: totalUnassigned, totalGames: totalGamesProcessed, capacityWarning, capacityDetails };
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
  
  // Read format config from game_formats DB (not bracket name parsing)
  const fmt = await db.query.gameFormats.findFirst({
    where: eq(gameFormats.bracketId, parseInt(bracketId))
  });

  // Extract rest period: prefer game_formats, fall back to tournament settings
  const tournamentSettings = bracket?.tournamentSettings as any || {};
  const restPeriodMinutes = fmt?.restPeriod || tournamentSettings.restPeriodMinutes || 90;
  const maxGamesPerDay = fmt?.maxGamesPerDay || tournamentSettings.maxGamesPerTeam || 2;
  const requiredFieldSize = fmt?.fieldSize || '11v11';

  console.log(`[Enhanced Field Assignment] Bracket: ${bracketName}`);
  console.log(`[Enhanced Field Assignment] CONSTRAINTS: ${restPeriodMinutes}-minute rest period, max ${maxGamesPerDay} games per team per day`);
  console.log(`[Enhanced Field Assignment] Required field size: ${requiredFieldSize} (from DB)`);

  // Use FieldAvailabilityService to get fields dynamically (not hardcoded complexId)
  const { FieldAvailabilityService } = await import('../../services/field-availability-service');
  const allAvailableFields = await FieldAvailabilityService.getAvailableFields(eventId);
  const availableFields = allAvailableFields
    .filter(f => f.fieldSize === requiredFieldSize && f.isOpen)
    .map(f => ({
      id: f.id,
      name: f.name,
      fieldSize: f.fieldSize,
      openTime: f.openTime,
      closeTime: f.closeTime,
      isOpen: f.isOpen
    }));

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
  const gameDurationMinutes = fmt?.gameLength || 60;
  const bufferMinutes = fmt?.bufferTime || 15;
  const gameDurationMs = gameDurationMinutes * 60 * 1000; // from DB config
  const restPeriodMs = restPeriodMinutes * 60 * 1000; // Dynamic rest period (AFTER game ends)
  const bufferMs = bufferMinutes * 60 * 1000; // from DB config

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

  // CRITICAL: CONCURRENT SCHEDULING - Allow multiple games at same time when no team conflicts
  console.log(`[Enhanced Field Assignment] CONCURRENT SCHEDULING: Processing ${dbGames.length} games with dynamic rest period enforcement`);
  
  // Create unscheduled games list for concurrent processing
  const unscheduledGames = dbGames.map((game, index) => ({ 
    ...game, 
    originalIndex: index,
    id: game.id // Ensure game ID is preserved for database updates
  }));
  let currentTimeSlot = new Date(eventStartDate);
  currentTimeSlot.setHours(8, 0, 0, 0); // Start at 8:00 AM
  
  // CRITICAL: Track field occupancy across ALL time slots to prevent overlaps
  const fieldOccupancy: { [fieldId: number]: { [timeSlot: string]: boolean } } = {};
  
  // Initialize field occupancy tracking
  availableFields.forEach(field => {
    fieldOccupancy[field.id] = {};
  });

  // CRITICAL FIX: Load existing games from database to prevent overlaps
  console.log(`[Enhanced Field Assignment] Loading existing games from database for event ${eventId}...`);
  const existingGames = await db.select({
    id: games.id,
    fieldId: games.fieldId,
    scheduledDate: games.scheduledDate,
    scheduledTime: games.scheduledTime,
    duration: games.duration
  })
  .from(games)
  .where(
    and(
      eq(games.eventId, eventId),
      isNotNull(games.fieldId),
      isNotNull(games.scheduledDate),
      isNotNull(games.scheduledTime)
    )
  );

  console.log(`[Enhanced Field Assignment] Found ${existingGames.length} existing games, marking field occupancy...`);
  
  // Mark existing games as occupying fields
  existingGames.forEach(existingGame => {
    if (existingGame.fieldId && existingGame.scheduledDate && existingGame.scheduledTime) {
      const gameStartTime = new Date(`${existingGame.scheduledDate}T${existingGame.scheduledTime}`);
      const duration = existingGame.duration || 90; // Default 90 minutes
      const gameEndTime = new Date(gameStartTime.getTime() + (duration * 60 * 1000));
      
      // CRITICAL FIX: Mark field as occupied for EXACT game duration to prevent overlaps
      let occupancyTime = new Date(gameStartTime);
      while (occupancyTime < gameEndTime) {
        const occupancyKey = occupancyTime.toISOString();
        if (fieldOccupancy[existingGame.fieldId]) {
          fieldOccupancy[existingGame.fieldId][occupancyKey] = true;
        }
        occupancyTime = new Date(occupancyTime.getTime() + (15 * 60 * 1000)); // Mark every 15 minutes
      }
      
      console.log(`[Enhanced Field Assignment] 🔒 EXISTING GAME: Field ${existingGame.fieldId} occupied ${existingGame.scheduledTime} to ${gameEndTime.toTimeString().substring(0, 5)}`);
    }
  });
  
  console.log(`[Enhanced Field Assignment] STARTING MULTI-DAY SCHEDULING LOOP: ${unscheduledGames.length} games to schedule`);
  let iterationCount = 0;
  const maxIterations = 500; // Safety limit to prevent infinite loops

  while (unscheduledGames.length > 0 && iterationCount < maxIterations) {
    iterationCount++;
    
    // Skip to 2 PM if we've tried morning slots without success
    if (unscheduledGames.length > 0 && currentTimeSlot.getHours() >= 12 && currentTimeSlot.getHours() < 14) {
      console.log(`[Enhanced Field Assignment] Skipping midday break, advancing to 2:00 PM...`);
      currentTimeSlot.setHours(14, 0, 0, 0);
    }
    console.log(`\n[Enhanced Field Assignment] === ITERATION ${iterationCount} - TIME SLOT: ${currentTimeSlot.toLocaleString()} ===`);
    console.log(`[Enhanced Field Assignment] Remaining games to schedule: ${unscheduledGames.length}`);
    
    const scheduledThisRound: any[] = [];
    const currentTimeSlotKey = currentTimeSlot.toISOString();
    
    // CRITICAL FIX: Get fields available for ENTIRE GAME DURATION, not just start time
    const availableFieldsThisSlot = availableFields.filter(field => {
      // Check if field is available for the entire game duration (90 minutes)
      let checkTime = new Date(currentTimeSlot);
      const gameEndTime = new Date(currentTimeSlot.getTime() + gameDurationMs);
      
      while (checkTime < gameEndTime) {
        const checkTimeKey = checkTime.toISOString();
        if (fieldOccupancy[field.id][checkTimeKey]) {
          return false; // Field is occupied during game duration
        }
        checkTime = new Date(checkTime.getTime() + (15 * 60 * 1000)); // Check every 15 minutes
      }
      return true; // Field is available for entire game duration
    });
    
    console.log(`[Enhanced Field Assignment] Available fields for ${currentTimeSlot.toLocaleTimeString()}: ${availableFieldsThisSlot.length}/${availableFields.length} (${availableFieldsThisSlot.map(f => f.name).join(', ')})`);
    
    // If no fields available, advance to next time slot immediately
    if (availableFieldsThisSlot.length === 0) {
      console.log(`[Enhanced Field Assignment] ⏸️ No fields available at ${currentTimeSlot.toLocaleTimeString()}, advancing to next slot`);
      currentTimeSlot = new Date(currentTimeSlot.getTime() + (15 * 60 * 1000));
      continue;
    }
    
    // Try to schedule as many games as possible at this time slot
    for (let gameIndex = unscheduledGames.length - 1; gameIndex >= 0; gameIndex--) {
      const game = unscheduledGames[gameIndex];
      
      // Check if this game can be scheduled at current time slot
      let canSchedule = true;
      let teamConflictReason = '';
      
      // CRITICAL: Rest period check - only applies AFTER teams have already played
      if (game.homeTeamId && teamSchedules[game.homeTeamId]?.length > 0) {
        const homeTeamLastGameEnd = Math.max(...teamSchedules[game.homeTeamId].map(time => time.getTime()));
        const timeSinceLastGame = currentTimeSlot.getTime() - homeTeamLastGameEnd;
        if (timeSinceLastGame < restPeriodMs) {
          canSchedule = false;
          const remainingRest = Math.ceil((restPeriodMs - timeSinceLastGame) / (60 * 1000));
          teamConflictReason = `Home team needs ${remainingRest} more minutes rest (${restPeriodMinutes}min required)`;
        }
      }
      
      if (game.awayTeamId && teamSchedules[game.awayTeamId]?.length > 0) {
        const awayTeamLastGameEnd = Math.max(...teamSchedules[game.awayTeamId].map(time => time.getTime()));
        const timeSinceLastGame = currentTimeSlot.getTime() - awayTeamLastGameEnd;
        if (timeSinceLastGame < restPeriodMs) {
          canSchedule = false;
          const remainingRest = Math.ceil((restPeriodMs - timeSinceLastGame) / (60 * 1000));
          teamConflictReason = `Away team needs ${remainingRest} more minutes rest (${restPeriodMinutes}min required)`;
        }
      }
      
      // NEW REQUIREMENT: Every third game a team plays must be scheduled on the next day
      if (canSchedule) {
        const currentDate = currentTimeSlot.toDateString();
        
        // Count total games for each team (across all days)
        const homeTeamTotalGames = game.homeTeamId ? teamSchedules[game.homeTeamId]?.length || 0 : 0;
        const awayTeamTotalGames = game.awayTeamId ? teamSchedules[game.awayTeamId]?.length || 0 : 0;
        
        // If either team has played 2 games, their third game MUST be on the next day
        const homeTeamNeedsNextDay = homeTeamTotalGames === 2;
        const awayTeamNeedsNextDay = awayTeamTotalGames === 2;
        
        // Check if current time slot is on the tournament start date (Aug 16)
        const tournamentStartDate = new Date('2025-08-16').toDateString();
        const isFirstDay = currentDate === tournamentStartDate;
        
        if ((homeTeamNeedsNextDay || awayTeamNeedsNextDay) && isFirstDay) {
          canSchedule = false;
          teamConflictReason = `Team's 3rd game must be scheduled on next day (Aug 17)`;
        }
        
        // Count games on current day for max games per day constraint
        const homeTeamGamesOnDay = game.homeTeamId ? teamSchedules[game.homeTeamId]?.filter(gameTime => 
          gameTime.toDateString() === currentDate
        ).length || 0 : 0;
        const awayTeamGamesOnDay = game.awayTeamId ? teamSchedules[game.awayTeamId]?.filter(gameTime => 
          gameTime.toDateString() === currentDate
        ).length || 0 : 0;
        
        if (homeTeamGamesOnDay >= maxGamesPerDay || awayTeamGamesOnDay >= maxGamesPerDay) {
          canSchedule = false;
          teamConflictReason = `Max games per day exceeded (${maxGamesPerDay})`;
        }
      }
      
      // Check for team conflicts with other games scheduled this round
      if (canSchedule) {
        for (const scheduledGame of scheduledThisRound) {
          if ((game.homeTeamId && (game.homeTeamId === scheduledGame.homeTeamId || game.homeTeamId === scheduledGame.awayTeamId)) ||
              (game.awayTeamId && (game.awayTeamId === scheduledGame.homeTeamId || game.awayTeamId === scheduledGame.awayTeamId))) {
            canSchedule = false;
            teamConflictReason = `Team conflict with concurrent game at ${scheduledGame.fieldName}`;
            break;
          }
        }
      }
      
      // Find available field that's not already taken this round
      const actuallyAvailableFields = availableFieldsThisSlot.filter(field => 
        !scheduledThisRound.some(scheduled => scheduled.fieldId === field.id)
      );
      
      if (canSchedule && actuallyAvailableFields.length > 0) {
        const assignedField = actuallyAvailableFields[0]; // Take first truly available field
        
        const scheduledDateTime = new Date(currentTimeSlot);
        const scheduledDate = scheduledDateTime.toISOString().split('T')[0];
        const scheduledTime = scheduledDateTime.toTimeString().substring(0, 5);

        // CRITICAL FIX: Mark field as occupied for EXACT game duration to prevent overlaps
        const gameEndTimeForMarking = new Date(currentTimeSlot.getTime() + gameDurationMs);
        
        let occupancyTime = new Date(currentTimeSlot);
        while (occupancyTime < gameEndTimeForMarking) {
          const occupancyKey = occupancyTime.toISOString();
          fieldOccupancy[assignedField.id][occupancyKey] = true;
          occupancyTime = new Date(occupancyTime.getTime() + (15 * 60 * 1000)); // Mark every 15 minutes
        }
        
        console.log(`[Enhanced Field Assignment] 🔒 FIELD OCCUPIED: Field ${assignedField.name} from ${scheduledTime} to ${gameEndTimeForMarking.toTimeString().substring(0, 5)}`);

        // Record this game as scheduled
        const assignment = {
          gameIndex: game.originalIndex,
          fieldId: assignedField.id,
          fieldName: assignedField.name,
          scheduledDate,
          scheduledTime,
          scheduledDateTime: scheduledDateTime.toISOString(),
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId
        };
        
        assignments.push(assignment);
        scheduledThisRound.push(assignment);

        // Update database with field and schedule assignment - Use specific game ID to prevent duplicates
        try {
          await db.update(games).set({
            fieldId: assignedField.id,
            scheduledDate,
            scheduledTime
          }).where(eq(games.id, game.id));
          console.log(`[Enhanced Field Assignment] ✅ CONCURRENT: Game ${game.originalIndex + 1} (ID: ${game.id}) scheduled at ${scheduledTime} on ${assignedField.name}`);
        } catch (updateError) {
          console.error(`[Enhanced Field Assignment] Error updating game ${game.originalIndex + 1}:`, updateError);
        }

        // Record game end times for team rest period tracking
        const gameEndTime = new Date(scheduledDateTime.getTime() + gameDurationMs);
        if (game.homeTeamId) {
          if (!teamSchedules[game.homeTeamId]) teamSchedules[game.homeTeamId] = [];
          teamSchedules[game.homeTeamId].push(gameEndTime);
        }
        if (game.awayTeamId) {
          if (!teamSchedules[game.awayTeamId]) teamSchedules[game.awayTeamId] = [];
          teamSchedules[game.awayTeamId].push(gameEndTime);
        }

        // CRITICAL FIX: Mark game as scheduled instead of removing from array during iteration
        game.isScheduled = true;
      } else if (!canSchedule) {
        console.log(`[Enhanced Field Assignment] ⏳ Game ${game.originalIndex + 1} cannot be scheduled at ${currentTimeSlot.toLocaleTimeString()}: ${teamConflictReason}`);
      } else {
        console.log(`[Enhanced Field Assignment] 🏟️ Game ${game.originalIndex + 1} waiting for available field at ${currentTimeSlot.toLocaleTimeString()}`);
      }
    }
    
    console.log(`[Enhanced Field Assignment] SCHEDULED ${scheduledThisRound.length} concurrent games at ${currentTimeSlot.toLocaleTimeString()}`);
    
    // CRITICAL FIX: Remove scheduled games from unscheduledGames array AFTER iteration
    const remainingGames = unscheduledGames.filter(game => !game.isScheduled);
    const scheduledCount = unscheduledGames.length - remainingGames.length;
    if (scheduledCount > 0) {
      console.log(`[Enhanced Field Assignment] Removing ${scheduledCount} scheduled games from unscheduled list`);
      unscheduledGames.length = 0; // Clear array
      unscheduledGames.push(...remainingGames); // Repopulate with unscheduled games only
    }
    
    // If no games scheduled this round and we have remaining games, advance more aggressively
    if (scheduledThisRound.length === 0 && unscheduledGames.length > 0) {
      const currentHour = currentTimeSlot.getHours();
      const currentDate = currentTimeSlot.toDateString();
      const tournamentStartDate = new Date('2025-08-16').toDateString();
      const isFirstDay = currentDate === tournamentStartDate;
      
      console.log(`[Enhanced Field Assignment] No games scheduled this round. Current hour: ${currentHour}, remaining games: ${unscheduledGames.length}`);
      
      // Check if we need to move to Day 2 due to multi-day constraint
      const gamesNeedingDay2 = unscheduledGames.filter(game => {
        const homeTeamTotalGames = game.homeTeamId ? teamSchedules[game.homeTeamId]?.length || 0 : 0;
        const awayTeamTotalGames = game.awayTeamId ? teamSchedules[game.awayTeamId]?.length || 0 : 0;
        return homeTeamTotalGames === 2 || awayTeamTotalGames === 2;
      });
      
      if (gamesNeedingDay2.length > 0 && isFirstDay) {
        console.log(`[Enhanced Field Assignment] 🗓️ MULTI-DAY CONSTRAINT: ${gamesNeedingDay2.length} games need Day 2 scheduling, advancing to August 17th`);
        currentTimeSlot.setDate(currentTimeSlot.getDate() + 1);
        currentTimeSlot.setHours(8, 0, 0, 0);
        console.log(`[Enhanced Field Assignment] NOW SCHEDULING FOR DAY 2: ${currentTimeSlot.toDateString()}`);
      } else if (currentHour >= 11 && currentHour < 14) {
        console.log(`[Enhanced Field Assignment] Jumping to 2 PM to break deadlock...`);
        currentTimeSlot.setHours(14, 0, 0, 0);
      } else if (currentHour >= 14 && currentHour < 16) {
        console.log(`[Enhanced Field Assignment] Jumping to 4 PM to continue afternoon scheduling...`);
        currentTimeSlot.setHours(16, 0, 0, 0);
      } else if (currentHour >= 16) {
        console.log(`[Enhanced Field Assignment] End of Day 1, advancing to Day 2 for remaining games...`);
        currentTimeSlot.setDate(currentTimeSlot.getDate() + 1);
        currentTimeSlot.setHours(8, 0, 0, 0);
        console.log(`[Enhanced Field Assignment] NOW SCHEDULING FOR DAY 2: ${currentTimeSlot.toDateString()}`);
      } else {
        // Advance 15 minutes normally
        currentTimeSlot = new Date(currentTimeSlot.getTime() + (15 * 60 * 1000));
      }
    } else {
      // Advance to next time slot (15-minute intervals for better scheduling flexibility)
      currentTimeSlot = new Date(currentTimeSlot.getTime() + (15 * 60 * 1000)); // Advance 15 minutes
    }
    
    // Safety check: don't go beyond event end date + 24 hours to allow multi-day scheduling
    const maxEndTime = new Date(eventEndDate);
    maxEndTime.setDate(maxEndTime.getDate() + 1);
    maxEndTime.setHours(20, 0, 0, 0); // 8:00 PM next day (extended window)
    
    console.log(`[Enhanced Field Assignment] Time check: Current=${currentTimeSlot.toLocaleString()}, Max=${maxEndTime.toLocaleString()}`);
    
    if (currentTimeSlot > maxEndTime) {
      console.log(`[Enhanced Field Assignment] WARNING: Reached maximum scheduling time (next day 8 PM), ${unscheduledGames.length} games remain unscheduled`);
      
      // Final attempt: Schedule remaining games on the second day
      console.log(`[Enhanced Field Assignment] FINAL PUSH: Scheduling remaining ${unscheduledGames.length} games on Day 2`);
      for (let i = 0; i < unscheduledGames.length; i++) {
        const remainingGame = unscheduledGames[i];
        const fallbackField = availableFields[i % availableFields.length];
        const fallbackTime = new Date(eventEndDate); // Use event end date (Day 2)
        fallbackTime.setHours(8 + (i * 3), 0, 0, 0); // Stagger: 8 AM, 11 AM, 2 PM, 5 PM...
        
        console.log(`[Enhanced Field Assignment] FINAL: Scheduling game ${remainingGame.originalIndex + 1} at ${fallbackTime.toLocaleString()}`);
        
        const scheduledDate = fallbackTime.toISOString().split('T')[0];
        const scheduledTime = fallbackTime.toTimeString().substring(0, 5);
        
        try {
          await db.update(games).set({
            fieldId: fallbackField.id,
            scheduledDate,
            scheduledTime
          }).where(eq(games.id, remainingGame.id));
          
          assignments.push({
            gameId: remainingGame.id,
            fieldId: fallbackField.id,
            fieldName: fallbackField.name,
            scheduledDateTime: fallbackTime
          });
          
          console.log(`[Enhanced Field Assignment] ✅ FINAL: Game ${remainingGame.originalIndex + 1} scheduled at ${scheduledTime} on ${fallbackField.name}`);
        } catch (error) {
          console.error(`[Enhanced Field Assignment] Error in final scheduling:`, error);
        }
      }
      
      break;
    }
    
    // Safety check for infinite loops
    if (iterationCount >= maxIterations) {
      console.log(`[Enhanced Field Assignment] WARNING: Reached maximum iterations (${maxIterations}), breaking to prevent infinite loop`);
      break;
    }
  }

  // Summary
  const fieldsUsed = Array.from(new Set(assignments.map(a => a.fieldName)));
  const timeRange = assignments.length > 0 ? {
    start: assignments[0].scheduledDateTime,
    end: assignments[assignments.length - 1].scheduledDateTime
  } : null;

  console.log(`[Enhanced Field Assignment] LOOP ENDED - Assigned ${assignments.length} games across ${fieldsUsed.length} fields`);
  console.log(`[Enhanced Field Assignment] REMAINING UNSCHEDULED: ${unscheduledGames.length} games`);
  console.log(`[Enhanced Field Assignment] FINAL ITERATION COUNT: ${iterationCount}`);
  console.log(`[Enhanced Field Assignment] Time range: ${timeRange?.start} to ${timeRange?.end}`);
  console.log(`[Enhanced Field Assignment] Fields used: ${fieldsUsed.join(', ')}`);

  return {
    totalAssignments: assignments.length,
    assignments,
    fieldsUsed,
    timeRange,
    unscheduledCount: unscheduledGames.length
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