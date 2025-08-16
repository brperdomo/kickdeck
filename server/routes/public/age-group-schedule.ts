import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, events, eventAgeGroups, eventBrackets, fields } from '../../../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

const router = Router();

// Get age group specific schedule data for public viewing
router.get('/:eventId/age-group/:ageGroupId', async (req: Request, res: Response) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const eventIdNum = parseInt(eventId);
    const ageGroupIdNum = parseInt(ageGroupId);
    
    console.log(`[Age Group Schedule] Fetching data for event ${eventId}, age group ${ageGroupId}`);
    console.log(`[Age Group Schedule] DEBUG: eventIdNum=${eventIdNum}, ageGroupIdNum=${ageGroupIdNum}`);
    
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

    // Use the event's actual logo from settings - no hardcoded overrides

    if (!eventInfo.length) {
      console.log(`[Age Group Schedule] Event ${eventId} not found`);
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    // Get age group info with proper division mapping
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
        eq(eventAgeGroups.eventId, eventIdNum), // FIXED: Use numeric eventId
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
    console.log(`[Age Group Schedule] About to query flights for eventIdNum=${eventIdNum}, ageGroupIdNum=${ageGroupIdNum}`);

    // Get all flights for this age group
    const flightsData = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId
      })
      .from(eventBrackets)
      .where(and(
        eq(eventBrackets.eventId, eventIdNum), // FIXED: Use numeric eventId
        eq(eventBrackets.ageGroupId, ageGroupIdNum)
      ));

    console.log(`[Age Group Schedule] Found ${flightsData.length} flights`);

    // Get all teams for this age group - FIXED: Handle data inconsistency by looking up teams from games
    let teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        bracketId: teams.bracketId,
        status: teams.status
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventIdNum), // FIXED: Use numeric eventId
        eq(teams.ageGroupId, ageGroupIdNum),
        // REMOVED: isNotNull(teams.bracketId) - allow teams without formal flight assignment
      ));

    console.log(`[Age Group Schedule] Found ${teamsData.length} teams directly assigned to age group ${ageGroupIdNum}`);

    // Get all games for this age group - FIXED: Use consistent data types
    console.log(`[Age Group Schedule] Query params: eventId=${eventId} (${typeof eventId}), ageGroupId=${ageGroupIdNum} (${typeof ageGroupIdNum})`);
    
    const gamesData = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        fieldId: games.fieldId,
        fieldName: fields.name,
        duration: games.duration,
        status: games.status,
        ageGroupId: games.ageGroupId,
        matchNumber: games.matchNumber,
        homeScore: games.homeScore,
        awayScore: games.awayScore
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(and(
        eq(games.eventId, eventIdNum), // FIXED: Use numeric eventId
        eq(games.ageGroupId, ageGroupIdNum)
      ));

    console.log(`[Age Group Schedule] Found ${gamesData.length} games`);
    console.log(`[Age Group Schedule] Sample games:`, gamesData.slice(0, 3).map(g => ({
      id: g.id, 
      homeTeamId: g.homeTeamId, 
      awayTeamId: g.awayTeamId,
      date: g.scheduledDate,
      time: g.scheduledTime
    })));

    // CRITICAL FIX: If no teams found directly, look up teams from games data (handle data inconsistency)
    if (teamsData.length === 0 && gamesData.length > 0) {
      console.log(`[Age Group Schedule] No direct teams found, extracting team data from games...`);
      
      // Get unique team IDs from games
      const teamIds = new Set();
      gamesData.forEach(game => {
        if (game.homeTeamId) teamIds.add(game.homeTeamId);
        if (game.awayTeamId) teamIds.add(game.awayTeamId);
      });

      // Look up team names from any age group for this event
      const gameTeamsData = await db
        .select({
          id: teams.id,
          name: teams.name,
          ageGroupId: teams.ageGroupId,
          bracketId: teams.bracketId,
          status: teams.status
        })
        .from(teams)
        .where(eq(teams.eventId, eventIdNum));

      // Filter to only teams referenced in games
      teamsData = gameTeamsData.filter(team => teamIds.has(team.id));
      console.log(`[Age Group Schedule] Extracted ${teamsData.length} teams from games data (original age groups: ${[...new Set(gameTeamsData.map(t => t.ageGroupId))].join(', ')})`);
    }

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Process flights with their teams and games - FIXED: Handle tournaments without formal flights
    let processedFlights = [];

    if (flightsData.length > 0) {
      // Traditional flight-based tournament
      processedFlights = flightsData.map(flight => {
        // Get teams for this flight
        const flightTeams = teamsData
          .filter(team => 
            team.bracketId === flight.flightId &&
            (team.status === 'approved' || team.status === 'registered')
          )
          .map(team => ({
            id: team.id,
            name: team.name,
            status: team.status
          }));

        // Get games for this flight
        const flightGames = gamesData
          .filter(game => {
            const homeTeam = teamsMap.get(game.homeTeamId);
            const awayTeam = teamsMap.get(game.awayTeamId);
            return homeTeam?.bracketId === flight.flightId || awayTeam?.bracketId === flight.flightId;
          })
          .map(game => {
            const homeTeam = teamsMap.get(game.homeTeamId);
            const awayTeam = teamsMap.get(game.awayTeamId);
            
            return {
              id: game.id,
              homeTeam: homeTeam?.name || 'TBD',
              awayTeam: awayTeam?.name || 'TBD',
              date: game.scheduledDate,
              time: game.scheduledTime,
              field: game.fieldName || `Field ${game.fieldId}`,
              status: game.status,
              homeScore: game.homeScore,
              awayScore: game.awayScore
            };
          })
          .sort((a, b) => {
            // Sort by date, then time
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          teamCount: flightTeams.length,
          teams: flightTeams,
          games: flightGames
        };
      })
      .filter(flight => flight.teamCount > 0); // Only include flights with teams
    } else {
      // No formal flights - create synthetic "Main" flight with all games/teams for this age group
      console.log(`[Age Group Schedule] No formal flights found, creating synthetic flight with all age group data`);
      
      // Get all teams for this age group (count unique teams from games)
      const uniqueTeamIds = new Set();
      gamesData.forEach(game => {
        if (game.homeTeamId) uniqueTeamIds.add(game.homeTeamId);
        if (game.awayTeamId) uniqueTeamIds.add(game.awayTeamId);
      });

      // Create teams list from game data
      const syntheticTeams = Array.from(uniqueTeamIds).map(teamId => {
        const team = teamsMap.get(teamId);
        return {
          id: teamId,
          name: team?.name || `Team ${teamId}`,
          status: team?.status || 'registered'
        };
      });

      // Process all games for this age group
      const syntheticGames = gamesData
        .map(game => {
          const homeTeam = teamsMap.get(game.homeTeamId);
          const awayTeam = teamsMap.get(game.awayTeamId);
          
          return {
            id: game.id,
            homeTeam: homeTeam?.name || `Team ${game.homeTeamId}`,
            awayTeam: awayTeam?.name || `Team ${game.awayTeamId}`,
            date: game.scheduledDate,
            time: game.scheduledTime,
            field: game.fieldName || `Field ${game.fieldId}`,
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore
          };
        })
        .sort((a, b) => {
          // Sort by date, then time
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

      processedFlights = [{
        flightId: null,
        flightName: 'Main',
        teamCount: syntheticTeams.length,
        teams: syntheticTeams,
        games: syntheticGames
      }];
    }

    const responseData = {
      eventInfo: eventInfo[0],
      ageGroupInfo: {
        ageGroup: ageGroupInfo[0].ageGroup,
        gender: ageGroupInfo[0].gender,
        birthYear: ageGroupInfo[0].birthYear,
        divisionCode: ageGroupInfo[0].divisionCode,
        displayName: `${ageGroupInfo[0].gender} ${ageGroupInfo[0].birthYear}`
      },
      flights: processedFlights
    };

    console.log(`[Age Group Schedule] Processed ${processedFlights.length} flights with teams`);
    console.log(`[Age Group Schedule] DEBUG: Final flights data:`, processedFlights.map(f => ({
      name: f.flightName, 
      teamCount: f.teamCount, 
      gameCount: f.games?.length || 0
    })));
    
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