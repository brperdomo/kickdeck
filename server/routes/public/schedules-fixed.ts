import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, events, eventAgeGroups, fields } from '../../../db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and } from 'drizzle-orm';

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

    // Get teams data
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        status: teams.status
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, String(eventIdNum)),
        eq(teams.status, 'approved')
      ));

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

    // Group games by age group
    const gamesByAgeGroup = new Map();
    gamesData.forEach(game => {
      if (!gamesByAgeGroup.has(game.ageGroupId)) {
        gamesByAgeGroup.set(game.ageGroupId, []);
      }
      gamesByAgeGroup.get(game.ageGroupId).push(game);
    });

    // Create age group data with games
    const processedAgeGroups = Array.from(ageGroupMap.entries()).map(([ageGroupId, ageGroupInfo]) => {
      const ageGroupGames = gamesByAgeGroup.get(ageGroupId) || [];
      

      return {
        ageGroupId: parseInt(ageGroupId), // Ensure ageGroupId is a number
        ageGroup: ageGroupInfo.name,
        gender: ageGroupInfo.gender,
        divisionCode: ageGroupInfo.divisionCode,
        displayName: ageGroupInfo.displayName,
        games: ageGroupGames,
        totalGames: ageGroupGames.length
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

    console.log(`[Public Schedules Fixed] Processed ${processedAgeGroups.length} age groups with games`);
    console.log(`[Public Schedules Fixed] Sample age groups:`, processedAgeGroups.slice(0, 3).map(ag => ({ageGroup: ag.ageGroup, gender: ag.gender, games: ag.games.length})));

    // Flatten all games from all age groups for the games array
    const allGames = processedAgeGroups.flatMap(ageGroup => 
      ageGroup.games.map(game => ({
        id: game.id,
        homeTeam: game.homeTeamName || 'TBD',
        awayTeam: game.awayTeamName || 'TBD', 
        ageGroup: ageGroup.ageGroup,
        flightName: game.flightName || 'Main',
        field: game.fieldName || 'TBD',
        date: game.scheduledDate,
        time: game.scheduledTime,
        duration: game.duration || 90,
        status: game.status || 'scheduled'
      }))
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
          const uniqueTeamIds = new Set();
          ag.games.forEach((game: any) => {
            if (game.homeTeamId) uniqueTeamIds.add(game.homeTeamId);
            if (game.awayTeamId) uniqueTeamIds.add(game.awayTeamId);
          });
          const teamCount = uniqueTeamIds.size;
          

          
          return {
            ageGroupId: ag.ageGroupId, // Add the missing ageGroupId for navigation
            ageGroup: ag.ageGroup,
            gender: ag.gender,
            birthYear: 2024, // Will be enhanced with real birth year data
            divisionCode: ag.divisionCode || ag.ageGroup,
            displayName: ag.displayName || ag.ageGroup,
            totalFlights: 1, // Will be enhanced with flight data
            totalTeams: teamCount,
            flights: [{
              flightName: 'Main',
              teamCount: teamCount,
              gameCount: ag.games.length
            }]
          };
        }),
      girls: processedAgeGroups
        .filter(ag => ag.gender?.toLowerCase() === 'girls')
        .map(ag => {
          const uniqueTeamIds = new Set();
          ag.games.forEach((game: any) => {
            if (game.homeTeamId) uniqueTeamIds.add(game.homeTeamId);
            if (game.awayTeamId) uniqueTeamIds.add(game.awayTeamId);
          });
          const teamCount = uniqueTeamIds.size;
          
          return {
            ageGroupId: ag.ageGroupId, // Add the missing ageGroupId for navigation
            ageGroup: ag.ageGroup,
            gender: ag.gender,
            birthYear: 2024, // Will be enhanced with real birth year data
            divisionCode: ag.divisionCode || ag.ageGroup,
            displayName: ag.displayName || ag.ageGroup,
            totalFlights: 1, // Will be enhanced with flight data
            totalTeams: teamCount,
            flights: [{
              flightName: 'Main',
              teamCount: teamCount,
              gameCount: ag.games.length
            }]
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

export default router;