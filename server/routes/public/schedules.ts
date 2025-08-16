import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { publishedSchedules, games, teams, events, eventAgeGroups, eventBrackets, fields, complexes } from '../../../db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, desc, isNull, isNotNull, inArray, or } from 'drizzle-orm';

const router = Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// Get live schedule data for public viewing (no authentication required)
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Public Schedules] Fetching data for event ${eventId}`);
    
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
      console.log(`[Public Schedules] Event ${eventId} not found`);
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    console.log(`[Public Schedules] Found event: ${eventInfo[0].name}`);

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
        ageGroupName: eventAgeGroups.ageGroup
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
      .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(games.eventId, eventId)
      ));

    console.log(`[Public Schedules] Found ${gamesData.length} games`);

    // Get teams data with status filter for active teams only
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
        eq(teams.eventId, eventId),
        isNotNull(teams.bracketId) // Only teams assigned to flights
      ));

    console.log(`[Public Schedules] Found ${teamsData.length} teams`);

    // Get age groups with birth year
    const ageGroupsData = await db
      .select({
        ageGroupId: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    // Get flights separately to avoid join issues
    const flightsData = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.eventId, eventId));

    console.log(`[Public Schedules] Found ${ageGroupsData.length} age groups`);
    console.log(`[Public Schedules] Found ${flightsData.length} flights`);

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Create flights lookup - group by age group since each age group can have multiple flights
    const flightsByAgeGroup = new Map();
    flightsData.forEach(flight => {
      if (!flightsByAgeGroup.has(flight.ageGroupId)) {
        flightsByAgeGroup.set(flight.ageGroupId, []);
      }
      flightsByAgeGroup.get(flight.ageGroupId).push(flight);
    });

    // Create age groups and flights structure, separated by gender
    const ageGroupsByGender = new Map(); // Boys and Girls separate
    ageGroupsData.forEach(ageGroup => {
      const genderKey = ageGroup.gender; // 'Boys' or 'Girls'
      const ageGroupKey = `${ageGroup.ageGroup}-${ageGroup.gender}`;
      const flights = flightsByAgeGroup.get(ageGroup.ageGroupId) || [];
      
      if (!ageGroupsByGender.has(genderKey)) {
        ageGroupsByGender.set(genderKey, new Map());
      }
      
      const genderMap = ageGroupsByGender.get(genderKey);
      
      if (!genderMap.has(ageGroupKey)) {
        genderMap.set(ageGroupKey, {
          ageGroupId: ageGroup.ageGroupId,
          ageGroup: ageGroup.ageGroup,
          gender: ageGroup.gender,
          birthYear: ageGroup.birthYear,
          divisionCode: ageGroup.divisionCode,
          displayName: `${ageGroup.gender} ${ageGroup.birthYear}`, // Changed to "[Gender] [Birth Year]"
          flights: new Map()
        });
      }
      
      const ageGroupData = genderMap.get(ageGroupKey);
      
      // Process all flights for this age group
      flights.forEach(flight => {
        if (!ageGroupData.flights.has(flight.flightName)) {
          // Count teams in this flight (only approved/registered teams)
          const teamsInFlight = teamsData.filter(t => 
            t.ageGroupId === ageGroup.ageGroupId && 
            t.bracketId === flight.flightId &&
            (t.status === 'approved' || t.status === 'registered')
          ).length;
          
          // Only include flights that have teams
          if (teamsInFlight > 0) {
            // Count games in this flight
            const gamesInFlight = gamesData.filter(g => {
              const homeTeam = teamsMap.get(g.homeTeamId);
              const awayTeam = teamsMap.get(g.awayTeamId);
              return homeTeam?.bracketId === flight.flightId || awayTeam?.bracketId === flight.flightId;
            }).length;
            
            ageGroupData.flights.set(flight.flightName, {
              flightName: flight.flightName,
              teamCount: teamsInFlight,
              gameCount: gamesInFlight
            });
          }
        }
      });
    });

    // Convert to array format, separated by gender
    const ageGroupsStructure = {
      boys: [],
      girls: []
    };
    
    // Process Boys
    if (ageGroupsByGender.has('Boys')) {
      ageGroupsStructure.boys = Array.from(ageGroupsByGender.get('Boys').values())
        .filter(ageGroup => ageGroup.flights.size > 0) // Only include age groups with flights that have teams
        .map(ageGroup => ({
          ageGroupId: ageGroup.ageGroupId,
          ageGroup: ageGroup.ageGroup,
          gender: ageGroup.gender,
          birthYear: ageGroup.birthYear,
          divisionCode: ageGroup.divisionCode,
          displayName: ageGroup.displayName,
          flights: Array.from(ageGroup.flights.values()),
          totalFlights: ageGroup.flights.size,
          totalTeams: Array.from(ageGroup.flights.values()).reduce((sum, flight) => sum + flight.teamCount, 0)
        }))
        .sort((a, b) => b.birthYear - a.birthYear); // Sort by birth year descending (older first)
    }
    
    // Process Girls  
    if (ageGroupsByGender.has('Girls')) {
      ageGroupsStructure.girls = Array.from(ageGroupsByGender.get('Girls').values())
        .filter(ageGroup => ageGroup.flights.size > 0) // Only include age groups with flights that have teams
        .map(ageGroup => ({
          ageGroupId: ageGroup.ageGroupId,
          ageGroup: ageGroup.ageGroup,
          gender: ageGroup.gender,
          birthYear: ageGroup.birthYear,
          divisionCode: ageGroup.divisionCode,
          displayName: ageGroup.displayName,
          flights: Array.from(ageGroup.flights.values()),
          totalFlights: ageGroup.flights.size,
          totalTeams: Array.from(ageGroup.flights.values()).reduce((sum, flight) => sum + flight.teamCount, 0)
        }))
        .sort((a, b) => b.birthYear - a.birthYear); // Sort by birth year descending (older first)
    }

    // Process games data with team names and flight info
    const processedGames = gamesData.map(game => {
      // Use team names directly from the join, with fallback to map lookup
      let homeTeamName = game.homeTeamName;
      let awayTeamName = game.awayTeamName;
      
      if (!homeTeamName && game.homeTeamId) {
        const homeTeam = teamsMap.get(game.homeTeamId);
        homeTeamName = homeTeam?.name || `Team ${game.homeTeamId}`;
      }
      
      if (!awayTeamName && game.awayTeamId) {
        const awayTeam = teamsMap.get(game.awayTeamId);
        awayTeamName = awayTeam?.name || `Team ${game.awayTeamId}`;
      }
      
      // Find age group info for this game
      let ageGroupName = game.ageGroupName || 'Unknown';
      
      return {
        id: game.id,
        homeTeam: homeTeamName || 'TBD',
        awayTeam: awayTeamName || 'TBD',
        ageGroup: ageGroupName,
        field: game.fieldName || `Field ${game.fieldId}`,
        date: game.scheduledDate || new Date().toISOString().split('T')[0],
        time: game.scheduledTime || '08:00',
        duration: game.duration || 90,
        status: game.status || 'scheduled'
      };
    }).sort((a, b) => {
      // Sort by date first (Saturday before Sunday), then by time
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // If same date, sort by time
      return a.time.localeCompare(b.time);
    });

    console.log(`[Public Schedules] Processed ${processedGames.length} games`);
    console.log(`[Public Schedules] Boys age groups: ${ageGroupsStructure.boys.length}`);
    console.log(`[Public Schedules] Girls age groups: ${ageGroupsStructure.girls.length}`);

    // Build response with separated gender data
    const scheduleData = {
      eventInfo: eventInfo[0],
      ageGroupsByGender: ageGroupsStructure,
      games: processedGames,
      standings: await calculateLiveStandings(eventIdNum, gamesData.filter(g => g.status === 'completed'), teamsData)
    };

    res.json(scheduleData);
  } catch (error) {
    console.error('Error fetching public schedule:', error);
    res.status(500).json({ error: 'Failed to fetch tournament schedule' });
  }
});

// Get age group specific schedule data
router.get('/:eventId/age-group/:ageGroupId', async (req: Request, res: Response) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const eventIdNum = parseInt(eventId);
    const ageGroupIdNum = parseInt(ageGroupId);
    
    console.log(`[Public Age Group Schedule] Fetching data for event ${eventId}, age group ${ageGroupId}`);
    
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
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    // Use the event's actual logo from settings - no hardcoded overrides

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
        eq(eventAgeGroups.id, ageGroupId)
      ))
      .limit(1);

    if (!ageGroupInfo.length) {
      return res.status(404).json({ 
        error: 'Age group not found',
        message: 'The requested age group does not exist for this tournament.'
      });
    }

    const ageGroup = ageGroupInfo[0];
    const displayName = `${ageGroup.gender} ${ageGroup.birthYear}`;

    // Get flights for this age group
    const flightsData = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name
      })
      .from(eventBrackets)
      .where(and(
        eq(eventBrackets.eventId, eventId),
        eq(eventBrackets.ageGroupId, ageGroupId)
      ));

    // Get teams for this age group
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        bracketId: teams.bracketId,
        status: teams.status
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.ageGroupId, ageGroupId),
        isNotNull(teams.bracketId)
      ));

    // Get games for this age group (by finding teams in this age group)
    const teamIds = teamsData.map(team => team.id);
    
    const gamesData = teamIds.length > 0 ? await db
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
        homeScore: games.homeScore,
        awayScore: games.awayScore
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(and(
        eq(games.eventId, eventId),
        or(
          inArray(games.homeTeamId, teamIds),
          inArray(games.awayTeamId, teamIds)
        )
      )) : [];

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Process flights with their teams and games
    const processedFlights = flightsData.map(flight => {
      const flightTeams = teamsData.filter(team => 
        team.bracketId === flight.flightId &&
        (team.status === 'approved' || team.status === 'registered')
      );

      const flightGames = gamesData.filter(game => {
        const homeTeam = teamsMap.get(game.homeTeamId);
        const awayTeam = teamsMap.get(game.awayTeamId);
        return homeTeam?.bracketId === flight.flightId || awayTeam?.bracketId === flight.flightId;
      }).map(game => ({
        id: game.id,
        homeTeam: teamsMap.get(game.homeTeamId)?.name || `Team ${game.homeTeamId}`,
        awayTeam: teamsMap.get(game.awayTeamId)?.name || `Team ${game.awayTeamId}`,
        date: game.scheduledDate || new Date().toISOString().split('T')[0],
        time: game.scheduledTime || '08:00',
        field: game.fieldName || `Field ${game.fieldId}`,
        status: game.status || 'scheduled',
        homeScore: game.homeScore,
        awayScore: game.awayScore
      })).sort((a, b) => {
        // Sort by date first, then by time
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.time.localeCompare(b.time);
      });

      return {
        flightId: flight.flightId,
        flightName: flight.flightName,
        teamCount: flightTeams.length,
        teams: flightTeams.map(team => ({
          id: team.id,
          name: team.name,
          status: team.status
        })),
        games: flightGames
      };
    }).filter(flight => flight.teamCount > 0); // Only include flights with teams

    const responseData = {
      eventInfo: eventInfo[0],
      ageGroupInfo: {
        ageGroup: ageGroup.ageGroup,
        gender: ageGroup.gender,
        birthYear: ageGroup.birthYear,
        divisionCode: ageGroup.divisionCode,
        displayName: displayName
      },
      flights: processedFlights
    };

    console.log(`[Public Age Group Schedule] Found ${processedFlights.length} flights with ${processedFlights.reduce((sum, f) => sum + f.teamCount, 0)} teams`);
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching age group schedule:', error);
    res.status(500).json({ error: 'Failed to fetch age group schedule' });
  }
});

// Helper function to get live standings from the dedicated standings API
async function calculateLiveStandings(eventId: number, completedGames: any[], eventTeams: any[]) {
  try {
    // Call the dedicated standings recalculation endpoint to get current standings
    const standingsResponse = await fetch(`http://localhost:5000/api/public/standings/${eventId}/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (standingsResponse.ok) {
      const standingsData = await standingsResponse.json();
      return standingsData.standings || {};
    }
    
    return {};
  } catch (error) {
    console.error('[STANDINGS FETCH] Error:', error);
    return {};
  }
}

export default router;