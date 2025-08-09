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

    // Override with the specific tournament logo for this event
    if (eventInfo.length > 0) {
      eventInfo[0].logoUrl = 'https://app.matchpro.ai/uploads/2025-EmpireSurf-SuperCup-logo_badge_blue_1748622426612_i7ic0i.jpg';
    }

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
        divisionCode: eventAgeGroups.divisionCode
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

    // Get all flights for this age group
    const flightsData = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId
      })
      .from(eventBrackets)
      .where(and(
        eq(eventBrackets.eventId, eventId),
        eq(eventBrackets.ageGroupId, ageGroupIdNum)
      ));

    console.log(`[Age Group Schedule] Found ${flightsData.length} flights`);

    // Get all teams for this age group with status filter
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        bracketId: teams.bracketId,
        status: teams.status
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventIdNum),
        eq(teams.ageGroupId, ageGroupIdNum),
        isNotNull(teams.bracketId) // Only teams assigned to flights
      ));

    console.log(`[Age Group Schedule] Found ${teamsData.length} teams`);

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
        eq(games.eventId, eventId),
        eq(games.ageGroupId, ageGroupIdNum)
      ));

    console.log(`[Age Group Schedule] Found ${gamesData.length} games`);

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Process flights with their teams and games
    const processedFlights = flightsData.map(flight => {
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