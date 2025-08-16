import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, events, eventAgeGroups, eventBrackets, fields } from '../../../db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, isNotNull } from 'drizzle-orm';

const router = Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// Get live schedule data for public viewing (no authentication required)
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Public Schedules Fixed] Fetching data for event ${eventId}`);
    
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

    // Get all games for this event with team and field details
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

    console.log(`[Public Schedules Fixed] Found ${gamesData.length} games`);

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

    // Group games by age group and flight
    const gamesByAgeGroupAndFlight = new Map();
    gamesData.forEach(game => {
      // For this tournament, team assignments in games don't match teams table
      // So we'll assign all games for an age group to the first available flight
      const ageGroupFlights = flightsData.filter(f => f.ageGroupId === game.ageGroupId);
      
      // Use the first flight for this age group, preferring ones with teams
      let flightId: string | number = 'unassigned';
      if (ageGroupFlights.length > 0) {
        // Try to find a flight with teams first
        const flightWithTeams = ageGroupFlights.find(flight => {
          const teams = teamsData.filter(t => t.bracketId === flight.id);
          return teams.length > 0;
        });
        flightId = String(flightWithTeams?.id || ageGroupFlights[0]?.id || 'unassigned');
      }
      
      const key = `${game.ageGroupId}_${flightId}`;
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
        
        return {
          flightId: flight.id,
          flightName: flight.name,
          teamCount: flightTeams.length,
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
    }).filter(ag => ag.totalGames > 0); // Only include age groups with games

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
    console.log(`[Public Schedules Fixed] Age groups with games: ${processedAgeGroups.length}`);
    console.log(`[Public Schedules Fixed] Sample processed age groups:`, processedAgeGroups.slice(0, 3).map(ag => ({
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
      boys: processedAgeGroups
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
      girls: processedAgeGroups
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

    // Get all games for this age group
    const gamesData = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
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

    // Group games by flight for this age group
    const gamesByFlight = new Map();
    gamesData.forEach(game => {
      const homeTeam = teamsData.find(t => t.id === game.homeTeamId);
      const flightId = homeTeam?.bracketId || 'unassigned';
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