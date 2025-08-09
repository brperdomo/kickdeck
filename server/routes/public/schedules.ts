import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { publishedSchedules, games, teams, events, eventAgeGroups, eventBrackets, fields, complexes } from '../../../db/schema';
import { eq, and, desc, isNull, isNotNull } from 'drizzle-orm';

const router = Router();

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
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        fieldId: games.fieldId,
        fieldName: fields.name,
        duration: games.duration,
        status: games.status,
        ageGroupId: games.ageGroupId,
        matchNumber: games.matchNumber
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(and(
        eq(games.eventId, eventIdNum)
      ));

    console.log(`[Public Schedules] Found ${gamesData.length} games`);

    // Get teams data
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        bracketId: teams.bracketId
      })
      .from(teams)
      .where(eq(teams.eventId, eventIdNum));

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
      .where(eq(eventAgeGroups.eventId, eventIdNum));

    // Get flights separately to avoid join issues
    const flightsData = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.eventId, eventIdNum));

    console.log(`[Public Schedules] Found ${ageGroupsData.length} age groups`);
    console.log(`[Public Schedules] Found ${flightsData.length} flights`);

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Create flights lookup
    const flightsMap = new Map();
    flightsData.forEach(flight => {
      flightsMap.set(flight.ageGroupId, flight);
    });

    // Create age groups and flights structure, separated by gender
    const ageGroupsByGender = new Map(); // Boys and Girls separate
    ageGroupsData.forEach(ageGroup => {
      const genderKey = ageGroup.gender; // 'Boys' or 'Girls'
      const ageGroupKey = `${ageGroup.ageGroup}-${ageGroup.gender}`;
      const flight = flightsMap.get(ageGroup.ageGroupId);
      
      if (!ageGroupsByGender.has(genderKey)) {
        ageGroupsByGender.set(genderKey, new Map());
      }
      
      const genderMap = ageGroupsByGender.get(genderKey);
      
      if (!genderMap.has(ageGroupKey)) {
        genderMap.set(ageGroupKey, {
          ageGroup: ageGroup.ageGroup,
          gender: ageGroup.gender,
          birthYear: ageGroup.birthYear,
          divisionCode: ageGroup.divisionCode,
          displayName: `${ageGroup.gender} ${ageGroup.birthYear}`, // Changed to "[Gender] [Birth Year]"
          flights: new Map()
        });
      }
      
      if (flight) {
        const ageGroupData = genderMap.get(ageGroupKey);
        
        if (!ageGroupData.flights.has(flight.flightName)) {
          // Count teams in this flight
          const teamsInFlight = teamsData.filter(t => 
            t.ageGroupId === ageGroup.ageGroupId && t.bracketId === flight.flightId
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
      }
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
      const homeTeam = teamsMap.get(game.homeTeamId);
      const awayTeam = teamsMap.get(game.awayTeamId);
      

      
      // Find flight info for this game
      let ageGroupName = 'Unknown';
      let flightName = 'Unknown';
      
      if (homeTeam || awayTeam) {
        const teamForAgeGroup = homeTeam || awayTeam;
        const ageGroupData = ageGroupsData.find(ag => ag.ageGroupId === teamForAgeGroup.ageGroupId);
        if (ageGroupData) {
          ageGroupName = `${ageGroupData.gender} ${ageGroupData.birthYear}`;
          const flightData = flightsData.find(f => f.flightId === teamForAgeGroup.bracketId);
          if (flightData) {
            flightName = flightData.flightName;
          }
        }
      }
      
      return {
        id: game.id,
        homeTeam: homeTeam?.name || (game.homeTeamId ? `Team ${game.homeTeamId}` : 'TBD'),
        awayTeam: awayTeam?.name || (game.awayTeamId ? `Team ${game.awayTeamId}` : 'TBD'),
        ageGroup: ageGroupName,
        flightName: flightName,
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
      standings: [] // TODO: Add standings data if needed
    };

    res.json(scheduleData);
  } catch (error) {
    console.error('Error fetching public schedule:', error);
    res.status(500).json({ error: 'Failed to fetch tournament schedule' });
  }
});

export default router;