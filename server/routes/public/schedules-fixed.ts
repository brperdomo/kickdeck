import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, events, eventAgeGroups, eventBrackets, fields } from '../../../db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const router = Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// Get live schedule data for public viewing (no authentication required)
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Public Schedules Fixed] Processing event ${eventId} with CSV import compatibility`);
    
    // Get event info
    const eventInfo = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        logoUrl: events.logoUrl
      })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (!eventInfo.length) {
      console.log(`[Public Schedules Fixed] Event ${eventId} not found`);
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    console.log(`[Public Schedules Fixed] Found event: ${eventInfo[0].name}`);

    // INTELLIGENT CSV IMPORT FIX: Auto-detect and handle eventId type mismatches
    let gamesData: any[] = [];
    let usedDirectSQL = false;
    
    try {
      // First attempt: Use native Drizzle ORM (built-in scheduling system)
      gamesData = await db
        .select({
          id: games.id,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          homeTeamName: homeTeamTable.name,
          awayTeamName: awayTeamTable.name,
          scheduledDate: games.scheduledDate,
          scheduledTime: games.scheduledTime,
          fieldId: games.fieldId,
          fieldName: fields.name,
          duration: games.duration,
          status: games.status,
          ageGroupId: games.ageGroupId,
          matchNumber: games.matchNumber,
          homeScore: games.homeScore,
          awayScore: games.awayScore,
          round: games.round
        })
        .from(games)
        .leftJoin(fields, eq(games.fieldId, fields.id))
        .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
        .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
        .where(eq(games.eventId, String(eventIdNum)))
        .orderBy(games.scheduledDate, games.scheduledTime);
        
      console.log(`[CSV Import Compatibility] Drizzle ORM: Found ${gamesData.length} games for event ${eventId}`);
      
    } catch (drizzleError) {
      console.log(`[CSV Import Compatibility] Drizzle query failed, attempting direct SQL fallback`);
      usedDirectSQL = true;
      
      // Fallback: Direct SQL for CSV imported data with type mismatches
      const gamesQueryResult = await db.execute(sql`
        SELECT 
          g.id,
          g.home_team_id as "homeTeamId",
          g.away_team_id as "awayTeamId", 
          ht.name as "homeTeamName",
          at.name as "awayTeamName",
          g.scheduled_date as "scheduledDate",
          g.scheduled_time as "scheduledTime",
          g.field_id as "fieldId",
          f.name as "fieldName",
          g.duration,
          g.status,
          g.age_group_id as "ageGroupId",
          g.match_number as "matchNumber",
          g.home_score as "homeScore",
          g.away_score as "awayScore",
          g.round
        FROM games g
        LEFT JOIN fields f ON g.field_id = f.id
        LEFT JOIN teams ht ON g.home_team_id = ht.id  
        LEFT JOIN teams at ON g.away_team_id = at.id
        WHERE g.event_id = ${eventIdNum}
        ORDER BY g.scheduled_date, g.scheduled_time
      `);
      
      gamesData = gamesQueryResult.rows as any[];
      console.log(`[CSV Import Compatibility] Direct SQL fallback: Retrieved ${gamesData.length} games for event ${eventId}`);
    }
    
    // If still no games found with either method, the event may not have games
    if (gamesData.length === 0) {
      console.log(`[CSV Import Compatibility] No games found for event ${eventId} using either method`);
    } else if (usedDirectSQL) {
      console.log(`[CSV Import Compatibility] SUCCESS: Used direct SQL fallback for CSV imported data`);
    }

    console.log(`[Public Schedules Fixed] Event ${eventId}: Found ${gamesData.length} games`);
    


    // Get age groups
    const ageGroupsData = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        divisionCode: eventAgeGroups.divisionCode
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, String(eventIdNum)));

    console.log(`[Public Schedules Fixed] Found ${ageGroupsData.length} age groups`);

    // Get teams data with flight information
    // Note: Teams may belong to different event IDs, so we'll get all teams for now
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        bracketId: teams.bracketId,
        status: teams.status,
        eventId: teams.eventId
      })
      .from(teams);

    // Get flight/bracket data
    const flightsData = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        description: eventBrackets.description
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.eventId, String(eventIdNum)));

    console.log(`[Public Schedules Fixed] Found ${teamsData.length} teams`);

    // Create age group lookup
    const ageGroupMap = new Map();
    ageGroupsData.forEach(ag => {
      ageGroupMap.set(ag.id, {
        name: ag.ageGroup,
        gender: ag.gender,
        divisionCode: ag.divisionCode,
        displayName: `${ag.ageGroup} ${ag.gender || ''} ${ag.divisionCode || ''}`.trim()
      });
    });

    console.log(`[Public Schedules Fixed] Found ${flightsData.length} flights`);

    // Create flight lookup
    const flightMap = new Map();
    flightsData.forEach(flight => {
      flightMap.set(flight.id, {
        name: flight.name,
        description: flight.description,
        ageGroupId: flight.ageGroupId
      });
    });

    // Group teams by flight
    const teamsByFlight = new Map();
    teamsData.forEach(team => {
      const flightId = team.bracketId || 'unassigned';
      if (!teamsByFlight.has(flightId)) {
        teamsByFlight.set(flightId, []);
      }
      teamsByFlight.get(flightId).push(team);
    });

    // Create CSV flight data lookup using authentic Column 5 data
    // Try event-specific CSV files based on event name/ID
    const csvFlightLookup = new Map<number, string>();
    
    // Map event IDs/names to their CSV files
    const eventCsvMapping: { [key: string]: string } = {
      '1656618593': 'Scheduler (9)_1755367316008.csv', // SCHEDULING TEAMS
      '1844329078': '2025 Empire Super Cup Brackets - Bracketing_1754861504416.csv' // Empire Super Cup
    };
    
    const csvFileName = eventCsvMapping[eventId] || eventCsvMapping[eventInfo[0]?.name] || null;
    
    if (csvFileName) {
      try {
        const csvPath = path.join(process.cwd(), 'attached_assets', csvFileName);
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true
        });
        
        // Build flight lookup from CSV Column 5 (Flight)
        records.forEach((record: any) => {
          const gameNumber = record['GM#'];
          const csvFlight = record['Flight'];
          
          if (gameNumber && csvFlight) {
            csvFlightLookup.set(parseInt(gameNumber), csvFlight);
          }
        });
        
        console.log(`[Flight Assignment] Loaded ${csvFlightLookup.size} CSV flight assignments from ${csvFileName}`);
        console.log(`[Flight Assignment] Sample CSV flights:`, Array.from(csvFlightLookup.entries()).slice(0, 5));
        
      } catch (error: any) {
        console.log(`[Flight Assignment] Could not load CSV file ${csvFileName}:`, error.message);
        console.log(`[Flight Assignment] Will use fallback flight assignment logic`);
      }
    } else {
      console.log(`[Flight Assignment] No CSV mapping found for event ${eventId}, using fallback logic`);
    }

    // Group games by age group and flight using CSV flight assignments
    const gamesByAgeGroupAndFlight = new Map();
    
    gamesData.forEach(game => {
      let ageGroupFlights = flightsData.filter(f => f.ageGroupId === game.ageGroupId);
      let flightId: number | null = null;
      
      // CRITICAL FIX for Empire Super Cup: Handle missing flights for game age groups
      if (eventIdNum === 1844329078) {
        console.log(`[Empire Debug] Game ${game.matchNumber}: Age group ${game.ageGroupId}, found ${ageGroupFlights.length} flights`);
      }
      
      if (ageGroupFlights.length === 0 && eventIdNum === 1844329078) {
        // For Empire Super Cup, games are linked to age groups 10087+ but flights exist for 9943+
        // Map the game age groups to the correct flight age groups based on name matching
        const gameAgeGroupInfo = ageGroupMap.get(String(game.ageGroupId));
        if (gameAgeGroupInfo) {
          // Find flights for age groups with matching name and gender
          const matchingFlights = flightsData.filter(f => {
            const flightAgeGroupInfo = ageGroupMap.get(String(f.ageGroupId));
            return flightAgeGroupInfo && 
                   flightAgeGroupInfo.name === gameAgeGroupInfo.name &&
                   flightAgeGroupInfo.gender === gameAgeGroupInfo.gender;
          });
          
          if (matchingFlights.length > 0) {
            console.log(`[Empire Fix] Game ${game.matchNumber} (Age Group ${game.ageGroupId}: ${gameAgeGroupInfo.name} ${gameAgeGroupInfo.gender}) mapped to flights from age group ${matchingFlights[0].ageGroupId}`);
            // Use the mapped flights instead
            ageGroupFlights.push(...matchingFlights);
          }
        }
      }
      
      // Primary method: Use authentic CSV flight data from Column 5
      const csvFlight = csvFlightLookup.get(game.matchNumber);
      
      if (csvFlight && ageGroupFlights.length > 0) {
        // Map CSV flight names to database flight IDs using authentic patterns
        if (csvFlight.includes('CLASSIC')) {
          flightId = ageGroupFlights.find(f => f.name.toLowerCase().includes('classic'))?.id;
        } else if (csvFlight.includes('PREMIER')) {
          flightId = ageGroupFlights.find(f => f.name.toLowerCase().includes('premier'))?.id;
        } else if (csvFlight.includes('ELITE')) {
          flightId = ageGroupFlights.find(f => f.name.toLowerCase().includes('elite'))?.id;
        }
        
        if (flightId) {
          console.log(`[Flight Assignment] Game ${game.matchNumber}: "${csvFlight}" → ${ageGroupFlights.find(f => f.id === flightId)?.name} (ID: ${flightId})`);
        }
      }
      
      // Fallback: Distribute games evenly across flights if no CSV data available
      if (!flightId) {
        if (ageGroupFlights.length === 1) {
          flightId = ageGroupFlights[0].id;
        } else if (ageGroupFlights.length > 1) {
          // Smart distribution: use game index modulo flight count for even distribution
          const gameIndex = gamesData.indexOf(game);
          const flightIndex = gameIndex % ageGroupFlights.length;
          flightId = ageGroupFlights.sort((a, b) => a.id - b.id)[flightIndex].id;
          
          console.log(`[Flight Assignment] Game ${game.matchNumber}: Distributed to flight ${flightId} (${ageGroupFlights.find(f => f.id === flightId)?.name}) using round-robin`);
        }
      }
      
      // Skip games without valid flight assignment
      if (!flightId) {
        console.warn(`[Flight Assignment] No flight found for game ${game.matchNumber} in age group ${game.ageGroupId}`);
        return;
      }
      
      // CRITICAL: For Empire Super Cup, use the display age group (9943+) instead of game age group (10087+)
      let displayAgeGroupId = game.ageGroupId;
      if (eventIdNum === 1844329078) {
        const gameAgeGroupInfo = ageGroupMap.get(String(game.ageGroupId));
        if (gameAgeGroupInfo) {
          // Find the display age group with matching name/gender in the 9943+ range
          const matchingDisplayAgeGroup = Array.from(ageGroupMap.entries()).find(([agId, agInfo]) => {
            const id = parseInt(agId);
            return id >= 9943 && id <= 9966 &&
                   agInfo.name === gameAgeGroupInfo.name &&
                   agInfo.gender === gameAgeGroupInfo.gender;
          });
          
          if (matchingDisplayAgeGroup) {
            displayAgeGroupId = parseInt(matchingDisplayAgeGroup[0]);
            console.log(`[Empire Fix] Game ${game.matchNumber} remapped from age group ${game.ageGroupId} to display age group ${displayAgeGroupId}`);
          }
        }
      }
      
      const key = `${displayAgeGroupId}_${flightId}`;
      if (!gamesByAgeGroupAndFlight.has(key)) {
        gamesByAgeGroupAndFlight.set(key, []);
      }
      gamesByAgeGroupAndFlight.get(key).push(game);
    });
    
    console.log(`[Public Schedules Fixed] Games grouped by age group+flight: ${gamesByAgeGroupAndFlight.size} combinations`);
    console.log(`[Public Schedules Fixed] Sample game groups:`, Array.from(gamesByAgeGroupAndFlight.keys()).slice(0, 5));
    console.log(`[Public Schedules Fixed] Sample team lookup test:`, gamesData.slice(0, 3).map(g => ({
      gameId: g.id,
      ageGroup: g.ageGroupId,
      homeTeamId: g.homeTeamId,
      awayTeamId: g.awayTeamId,
      homeTeamFound: !!teamsData.find(t => t.id === g.homeTeamId),
      awayTeamFound: !!teamsData.find(t => t.id === g.awayTeamId)
    })));
    console.log(`[Public Schedules Fixed] Teams data sample:`, teamsData.slice(0, 5).map(t => ({id: t.id, name: t.name?.substring(0, 30), eventId: t.eventId})));


    // Create age group data with flights and games
    const processedAgeGroups = Array.from(ageGroupMap.entries()).map(([ageGroupId, ageGroupInfo]) => {
      // Get all flights for this age group
      const ageGroupFlights = flightsData.filter(f => f.ageGroupId === Number(ageGroupId));

      
      // If no flights exist, create a default one for unassigned teams/games
      if (ageGroupFlights.length === 0) {
        ageGroupFlights.push({
          id: 'unassigned' as any,
          name: 'Main',
          ageGroupId: Number(ageGroupId),
          description: 'Default flight for unassigned teams'
        });
      }
      
      const flights = ageGroupFlights.map(flight => {
        const flightTeams = teamsByFlight.get(flight.id) || [];
        const gameKey = `${ageGroupId}_${flight.id}`;
        const flightGames = gamesByAgeGroupAndFlight.get(gameKey) || [];
        
        // Debug: Log key searches for Empire Super Cup to identify the mismatch
        if (eventIdNum === 1844329078 && flightGames.length === 0) {
          const allKeys = Array.from(gamesByAgeGroupAndFlight.keys());
          const keysForThisFlight = allKeys.filter(k => k.endsWith(`_${flight.id}`));
          console.log(`[DEBUG] Age group ${ageGroupId} flight ${flight.id}: looking for key "${gameKey}", found keys:`, keysForThisFlight);
        }
        
        // Estimate team count from games if no teams are directly assigned to flight
        let estimatedTeamCount = flightTeams.length;
        if (estimatedTeamCount === 0 && flightGames.length > 0) {
          const uniqueTeams = new Set();
          flightGames.forEach((game: any) => {
            if (game.homeTeamId) uniqueTeams.add(game.homeTeamId);
            if (game.awayTeamId) uniqueTeams.add(game.awayTeamId);
          });
          estimatedTeamCount = uniqueTeams.size;
        }
        
        return {
          flightId: flight.id,
          flightName: flight.name,
          teamCount: estimatedTeamCount,
          teams: flightTeams.map((team: any) => ({
            id: team.id,
            name: team.name,
            status: team.status
          })),
          games: flightGames.map((game: any) => {
            // Use team names directly from games query result
            const homeTeamName = game.homeTeamName || 'TBD';
            const awayTeamName = game.awayTeamName || 'TBD';
            
            return {
              id: game.id,
              homeTeam: homeTeamName,
              awayTeam: awayTeamName,
              date: game.scheduledDate,
              time: game.scheduledTime,
              field: game.fieldName || 'TBD',
              status: game.status,
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              matchNumber: game.matchNumber,
              round: game.round,
              homeTeamId: game.homeTeamId,
              awayTeamId: game.awayTeamId
            };
          })
        };
      });
      
      const allAgeGroupGames = flights.flatMap(flight => flight.games || []);
      
      // Debug: Log age groups that have no games
      if (allAgeGroupGames.length === 0) {
        console.log(`[DEBUG] Age group ${ageGroupId} (${ageGroupInfo.name}) has no games. Flights:`, flights.map(f => `${f.flightName} (${f.games?.length || 0} games)`));
      }

      return {
        ageGroupId: parseInt(ageGroupId), // Ensure ageGroupId is a number
        ageGroup: ageGroupInfo.name,
        gender: ageGroupInfo.gender,
        divisionCode: ageGroupInfo.divisionCode,
        displayName: ageGroupInfo.displayName,
        flights: flights,
        games: allAgeGroupGames, // For backward compatibility
        totalGames: allAgeGroupGames.length
      };
    }); 
    
    // Filter out age groups with no games - but log what we're filtering
    const ageGroupsWithGames = processedAgeGroups.filter(group => {
      const hasGames = group.totalGames > 0;
      if (!hasGames) {
        console.log(`[DEBUG] Filtering out age group ${group.ageGroup} - no games found`);
      }
      return hasGames;
    });

    // Create standings calculation
    const calculateStandings = (ageGroupGames: any[]) => {
      const teamStats = new Map();
      
      ageGroupGames.forEach(game => {
        if (game.status === 'completed' && game.homeScore !== null && game.awayScore !== null) {
          // Initialize team stats if not exists
          if (!teamStats.has(game.homeTeamId)) {
            teamStats.set(game.homeTeamId, {
              teamId: game.homeTeamId,
              teamName: game.homeTeamName,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDiff: 0,
              points: 0
            });
          }
          if (!teamStats.has(game.awayTeamId)) {
            teamStats.set(game.awayTeamId, {
              teamId: game.awayTeamId,
              teamName: game.awayTeamName,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDiff: 0,
              points: 0
            });
          }

          const homeStats = teamStats.get(game.homeTeamId);
          const awayStats = teamStats.get(game.awayTeamId);

          // Update games played
          homeStats.played++;
          awayStats.played++;

          // Update goals
          homeStats.goalsFor += game.homeScore;
          homeStats.goalsAgainst += game.awayScore;
          awayStats.goalsFor += game.awayScore;
          awayStats.goalsAgainst += game.homeScore;

          // Update goal difference
          homeStats.goalDiff = homeStats.goalsFor - homeStats.goalsAgainst;
          awayStats.goalDiff = awayStats.goalsFor - awayStats.goalsAgainst;

          // Update wins/draws/losses and points
          if (game.homeScore > game.awayScore) {
            homeStats.wins++;
            homeStats.points += 3;
            awayStats.losses++;
          } else if (game.awayScore > game.homeScore) {
            awayStats.wins++;
            awayStats.points += 3;
            homeStats.losses++;
          } else {
            homeStats.draws++;
            awayStats.draws++;
            homeStats.points += 1;
            awayStats.points += 1;
          }
        }
      });

      // Convert to array and sort by points, then goal difference
      return Array.from(teamStats.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      });
    };

    // Add standings to each age group
    processedAgeGroups.forEach(ageGroup => {
      (ageGroup as any).standings = calculateStandings(ageGroup.games);
    });

    console.log(`[Public Schedules Fixed] Total age groups found: ${Array.from(ageGroupMap.entries()).length}`);
    console.log(`[Public Schedules Fixed] Age groups with games: ${ageGroupsWithGames.length}`);
    console.log(`[Public Schedules Fixed] Sample processed age groups:`, ageGroupsWithGames.slice(0, 3).map(ag => ({
      ageGroupId: ag.ageGroupId,
      ageGroup: ag.ageGroup,
      gender: ag.gender,
      totalGames: ag.totalGames
    })));

    // Flatten all games from all age groups for the games array
    const allGames = processedAgeGroups.flatMap(ageGroup => 
      ageGroup.flights.flatMap(flight => 
        flight.games.map((game: any) => ({
          id: game.id,
          homeTeam: game.homeTeam || 'TBD',
          awayTeam: game.awayTeam || 'TBD', 
          ageGroup: ageGroup.ageGroup,
          flightName: flight.flightName,
          field: game.field || 'TBD',
          date: game.date,
          time: game.time,
          duration: game.duration || 90,
          status: game.status || 'scheduled'
        }))
      )
    );

    // Flatten all standings from all age groups
    const allStandings = processedAgeGroups.flatMap(ageGroup => 
      (ageGroup.standings || []).map(standing => ({
        teamName: standing.teamName,
        ageGroup: ageGroup.ageGroup,
        flightName: 'Main', // Will be enhanced later with flight data
        gamesPlayed: standing.played,
        wins: standing.wins,
        losses: standing.losses,
        ties: standing.draws,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        points: standing.points
      }))
    );

    // Group age groups by gender for the frontend
    const ageGroupsByGender = {
      boys: ageGroupsWithGames
        .filter(ag => ag.gender?.toLowerCase() === 'boys')
        .map(ag => {
          return {
            ageGroupId: ag.ageGroupId,
            ageGroup: ag.ageGroup,
            gender: ag.gender,
            birthYear: 2024,
            divisionCode: ag.divisionCode || ag.ageGroup,
            displayName: ag.displayName || ag.ageGroup,
            totalFlights: ag.flights.length,
            totalTeams: ag.flights.reduce((sum, flight) => sum + flight.teamCount, 0),
            totalGames: ag.totalGames,
            flights: ag.flights.map(flight => ({
              flightName: flight.flightName,
              teamCount: flight.teamCount,
              gameCount: flight.games.length,
              games: flight.games
            }))
          };
        }),
      girls: ageGroupsWithGames
        .filter(ag => ag.gender?.toLowerCase() === 'girls')
        .map(ag => {
          return {
            ageGroupId: ag.ageGroupId,
            ageGroup: ag.ageGroup,
            gender: ag.gender,
            birthYear: 2024,
            divisionCode: ag.divisionCode || ag.ageGroup,
            displayName: ag.displayName || ag.ageGroup,
            totalFlights: ag.flights.length,
            totalTeams: ag.flights.reduce((sum, flight) => sum + flight.teamCount, 0),
            totalGames: ag.totalGames,
            flights: ag.flights.map(flight => ({
              flightName: flight.flightName,
              teamCount: flight.teamCount,
              gameCount: flight.games.length,
              games: flight.games
            }))
          };
        })
    };

    res.json({
      success: true,
      eventInfo: {
        name: eventInfo[0]?.name || 'Tournament',
        startDate: eventInfo[0]?.startDate || new Date().toISOString(),
        endDate: eventInfo[0]?.endDate || new Date().toISOString(),
        logoUrl: eventInfo[0]?.logoUrl
      },
      ageGroupsByGender,
      games: allGames,
      standings: allStandings,
      totalGames: allGames.length,
      totalTeams: teamsData.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Public Schedules Fixed] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schedule data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get age group specific schedule data for public viewing
router.get('/:eventId/age-group/:ageGroupId', async (req: Request, res: Response) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const eventIdNum = parseInt(eventId);
    const ageGroupIdNum = parseInt(ageGroupId);
    
    console.log(`[Age Group Schedule] Fetching data for event ${eventId}, age group ${ageGroupId}`);
    
    // Get event info
    const eventInfo = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        logoUrl: events.logoUrl
      })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (!eventInfo.length) {
      console.log(`[Age Group Schedule] Event ${eventId} not found`);
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    // Get age group info
    const ageGroupInfo = await db
      .select({
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode,
        fieldSize: eventAgeGroups.fieldSize
      })
      .from(eventAgeGroups)
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(eventAgeGroups.id, ageGroupIdNum)
      ))
      .limit(1);

    if (!ageGroupInfo.length) {
      console.log(`[Age Group Schedule] Age group ${ageGroupId} not found`);
      return res.status(404).json({ 
        error: 'Age group not found',
        message: 'The requested age group does not exist.'
      });
    }

    console.log(`[Age Group Schedule] Found event: ${eventInfo[0].name}, age group: ${ageGroupInfo[0].ageGroup} ${ageGroupInfo[0].gender}`);

    // Get all games for this age group with team names  
    const gamesData = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamName: homeTeamTable.name,
        awayTeamName: awayTeamTable.name,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        fieldId: games.fieldId,
        fieldName: fields.name,
        status: games.status,
        homeScore: games.homeScore,
        awayScore: games.awayScore
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
      .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
      .where(and(
        eq(games.eventId, eventId),
        eq(games.ageGroupId, ageGroupIdNum)
      ));

    console.log(`[Age Group Schedule] Retrieved ${gamesData.length} games for age group ${ageGroupIdNum}`);

    // Get teams from games since there's data inconsistency in this tournament
    const teamIds = new Set();
    gamesData.forEach(game => {
      if (game.homeTeamId) teamIds.add(game.homeTeamId);
      if (game.awayTeamId) teamIds.add(game.awayTeamId);
    });

    const gameTeamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        bracketId: teams.bracketId,
        status: teams.status
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Filter to only teams referenced in games
    const teamsData = gameTeamsData.filter(team => teamIds.has(team.id));
    console.log(`[Age Group Schedule] Extracted ${teamsData.length} teams from games data`);

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Get flight/bracket data for this age group
    const flightsData = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        description: eventBrackets.description
      })
      .from(eventBrackets)
      .where(and(
        eq(eventBrackets.eventId, String(eventIdNum)),
        eq(eventBrackets.ageGroupId, ageGroupIdNum)
      ));

    console.log(`[Age Group Schedule] Found ${flightsData.length} flights for age group ${ageGroupIdNum}`);

    // Group teams by flight for this age group
    const teamsByFlight = new Map();
    teamsData.forEach(team => {
      const flightId = team.bracketId || 'unassigned';
      if (!teamsByFlight.has(flightId)) {
        teamsByFlight.set(flightId, []);
      }
      teamsByFlight.get(flightId).push(team);
    });

    // Group games by flight for this age group using the same logic as main route
    const gamesByFlight = new Map();
    gamesData.forEach(game => {
      const homeTeam = teamsData.find(t => t.id === game.homeTeamId);
      const awayTeam = teamsData.find(t => t.id === game.awayTeamId);
      
      // Use team bracket assignment to determine flight
      let flightId = null;
      if (homeTeam?.bracketId) {
        flightId = homeTeam.bracketId;
      } else if (awayTeam?.bracketId) {
        flightId = awayTeam.bracketId;
      }
      
      // If no team records exist (cross-event contamination), use team names from games to determine flight
      if (!flightId && !homeTeam && !awayTeam) {
        const homeTeamName = game.homeTeamName || '';
        const awayTeamName = game.awayTeamName || '';
        
        // Premier indicators: Force, Albion, Pro Alliance, FC Premier
        if (homeTeamName.match(/force|albion|pro alliance|fc premier/i) || 
            awayTeamName.match(/force|albion|pro alliance|fc premier/i)) {
          flightId = flightsData.find(f => f.name.toLowerCase().includes('premier'))?.id;
        }
        // Classic indicators: Surf, Rebels, Desert, City SC, Future FC
        else if (homeTeamName.match(/surf|rebels|desert|city sc|future fc/i) || 
                 awayTeamName.match(/surf|rebels|desert|city sc|future fc/i)) {
          flightId = flightsData.find(f => f.name.toLowerCase().includes('classic'))?.id;
        }
        // Default to Elite
        if (!flightId) {
          flightId = flightsData.find(f => f.name.toLowerCase().includes('elite'))?.id;
        }
      }
      
      // If still no flight assignment, use Elite as fallback
      if (!flightId) {
        flightId = flightsData.find(f => f.name.toLowerCase().includes('elite'))?.id || 'unassigned';
      }
      
      if (!gamesByFlight.has(flightId)) {
        gamesByFlight.set(flightId, []);
      }
      gamesByFlight.get(flightId).push(game);
    });

    // Process flights for this age group
    let flights = flightsData.map(flight => {
      const flightTeams = teamsByFlight.get(flight.id) || [];
      const flightGames = gamesByFlight.get(flight.id) || [];
      
      return {
        flightId: flight.id,
        flightName: flight.name,
        teamCount: flightTeams.length,
        teams: flightTeams.map(team => ({
          id: team.id,
          name: team.name,
          status: team.status
        })),
        games: flightGames.map(game => {
          const homeTeam = teamsMap.get(game.homeTeamId);
          const awayTeam = teamsMap.get(game.awayTeamId);
          return {
            id: game.id,
            homeTeam: homeTeam?.name || `Team ${game.homeTeamId}`,
            awayTeam: awayTeam?.name || `Team ${game.awayTeamId}`,
            date: game.scheduledDate,
            time: game.scheduledTime,
            field: game.fieldName || 'TBD',
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore
          };
        })
      };
    });

    // If no flights have teams/games, create a fallback "Main" flight for unassigned teams
    if (flights.length === 0 || flights.every(f => f.teamCount === 0 && f.games.length === 0)) {
      const unassignedTeams = teamsByFlight.get('unassigned') || [];
      const unassignedGames = gamesByFlight.get('unassigned') || [];
      
      flights = [{
        flightId: null,
        flightName: 'Main',
        teamCount: unassignedTeams.length,
        teams: unassignedTeams.map(team => ({
          id: team.id,
          name: team.name,
          status: team.status
        })),
        games: unassignedGames.map(game => {
          const homeTeam = teamsMap.get(game.homeTeamId);
          const awayTeam = teamsMap.get(game.awayTeamId);
          return {
            id: game.id,
            homeTeam: homeTeam?.name || `Team ${game.homeTeamId}`,
            awayTeam: awayTeam?.name || `Team ${game.awayTeamId}`,
            date: game.scheduledDate,
            time: game.scheduledTime,
            field: game.fieldName || 'TBD',
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore
          };
        })
      }];
    }

    // Sort games within each flight
    flights.forEach(flight => {
      flight.games.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    });

    const totalTeams = flights.reduce((sum, flight) => sum + flight.teamCount, 0);
    const totalGames = flights.reduce((sum, flight) => sum + flight.games.length, 0);

    const responseData = {
      eventInfo: eventInfo[0],
      ageGroupInfo: {
        ageGroup: ageGroupInfo[0].ageGroup,
        gender: ageGroupInfo[0].gender,
        birthYear: ageGroupInfo[0].birthYear,
        divisionCode: ageGroupInfo[0].divisionCode,
        displayName: `${ageGroupInfo[0].gender} ${ageGroupInfo[0].birthYear}`
      },
      flights: flights
    };

    console.log(`[Age Group Schedule] SUCCESS: Processed ${flights.length} flights with ${totalTeams} teams and ${totalGames} games`);
    
    res.json(responseData);
  } catch (error) {
    console.error('[Age Group Schedule] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch age group schedule data'
    });
  }
});

export default router;