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
        endDate: events.endDate
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
        eq(games.eventId, eventId),
        isNotNull(games.homeTeamId),
        isNotNull(games.awayTeamId)
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
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    console.log(`[Public Schedules] Found ${teamsData.length} teams`);

    // Get age groups and flights
    const ageGroupsData = await db
      .select({
        ageGroupId: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        divisionCode: eventAgeGroups.divisionCode,
        flightId: eventBrackets.id,
        flightName: eventBrackets.flightName
      })
      .from(eventAgeGroups)
      .leftJoin(eventBrackets, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log(`[Public Schedules] Found ${ageGroupsData.length} age group/flight combinations`);

    // Create teams lookup
    const teamsMap = new Map();
    teamsData.forEach(team => teamsMap.set(team.id, team));

    // Create age groups and flights structure
    const ageGroupsMap = new Map();
    ageGroupsData.forEach(item => {
      if (!item.ageGroupId) return;
      
      const ageGroupKey = `${item.ageGroup}-${item.gender}`;
      if (!ageGroupsMap.has(ageGroupKey)) {
        ageGroupsMap.set(ageGroupKey, {
          ageGroup: item.ageGroup,
          gender: item.gender,
          divisionCode: item.divisionCode,
          displayName: `${item.ageGroup} ${item.gender}`,
          flights: new Map()
        });
      }
      
      if (item.flightId && item.flightName) {
        const ageGroupData = ageGroupsMap.get(ageGroupKey);
        const flightKey = item.flightName;
        
        if (!ageGroupData.flights.has(flightKey)) {
          // Count teams in this flight
          const teamsInFlight = teamsData.filter(t => 
            t.ageGroupId === item.ageGroupId && t.bracketId === item.flightId
          ).length;
          
          // Count games in this flight
          const gamesInFlight = gamesData.filter(g => {
            const homeTeam = teamsMap.get(g.homeTeamId);
            const awayTeam = teamsMap.get(g.awayTeamId);
            return homeTeam?.bracketId === item.flightId || awayTeam?.bracketId === item.flightId;
          }).length;
          
          ageGroupData.flights.set(flightKey, {
            flightName: item.flightName,
            teamCount: teamsInFlight,
            gameCount: gamesInFlight
          });
        }
      }
    });

    // Convert to array format
    const ageGroups = Array.from(ageGroupsMap.values()).map(ageGroup => ({
      ageGroup: ageGroup.ageGroup,
      gender: ageGroup.gender,
      divisionCode: ageGroup.divisionCode,
      displayName: ageGroup.displayName,
      flights: Array.from(ageGroup.flights.values())
    }));

    // Process games data with team names and flight info
    const processedGames = gamesData.map(game => {
      const homeTeam = teamsMap.get(game.homeTeamId);
      const awayTeam = teamsMap.get(game.awayTeamId);
      
      // Find flight info for this game
      let ageGroupName = 'Unknown';
      let flightName = 'Unknown';
      
      if (homeTeam && awayTeam) {
        const ageGroupData = ageGroupsData.find(ag => ag.ageGroupId === homeTeam.ageGroupId);
        if (ageGroupData) {
          ageGroupName = `${ageGroupData.ageGroup} ${ageGroupData.gender}`;
          const flightData = ageGroupsData.find(ag => 
            ag.ageGroupId === homeTeam.ageGroupId && ag.flightId === homeTeam.bracketId
          );
          if (flightData) {
            flightName = flightData.flightName;
          }
        }
      }
      
      return {
        id: game.id,
        homeTeam: homeTeam?.name || `Team ${game.homeTeamId}`,
        awayTeam: awayTeam?.name || `Team ${game.awayTeamId}`,
        ageGroup: ageGroupName,
        flightName: flightName,
        field: game.fieldName || `Field ${game.fieldId}`,
        date: game.scheduledDate || new Date().toISOString().split('T')[0],
        time: game.scheduledTime || '08:00',
        duration: game.duration || 90,
        status: game.status || 'scheduled'
      };
    });

    console.log(`[Public Schedules] Processed ${processedGames.length} games`);
    console.log(`[Public Schedules] Age groups: ${ageGroups.length}`);

    // Build response with live data
    const scheduleData = {
      eventInfo: eventInfo[0],
      ageGroups: ageGroups,
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