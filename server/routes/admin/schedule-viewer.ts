import { Router } from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups, fields, complexes, events, gameTimeSlots } from '@db/schema';
import { eq, count } from 'drizzle-orm';

const router = Router();

// GET /api/admin/events/:eventId/schedule - Get complete tournament schedule
router.get('/:eventId/schedule', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Keep as string
    
    if (!eventId) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get event details for real dates
    const eventData = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate
      })
      .from(events)
      .where(eq(events.id, parseInt(eventId)));
    
    const event = eventData[0];
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get basic game count and team information
    const [gamesCount] = await db
      .select({ count: count() })
      .from(games)
      .where(eq(games.eventId, eventId));

    const [teamsCount] = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Get age groups for this event with proper ID mapping
    const ageGroupsData = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    // Create age group lookup map
    const ageGroupsMap = ageGroupsData.reduce((acc, ag) => {
      acc[ag.id] = ag.ageGroup;
      return acc;
    }, {} as Record<number, string>);
    
    const ageGroups = ageGroupsData.map(ag => ag.ageGroup);

    // Get actual team names from database
    const actualTeamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        clubName: teams.clubName,
        status: teams.status
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Get actual games with real team and field data including time slots
    const actualGamesData = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        status: games.status,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        createdAt: games.createdAt,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name,
        complexAddress: complexes.address,
        // Get time slot data if available
        timeSlotStart: gameTimeSlots.startTime,
        timeSlotEnd: gameTimeSlots.endTime
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .where(eq(games.eventId, eventId));

    // Create team lookup map
    const teamsMap = actualTeamsData.reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {} as Record<number, any>);

    // Create date range for tournament
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const tournamentDates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      tournamentDates.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Transform actual games with real team names, field data, and dates
    const realGames = actualGamesData.map((game, index) => {
      const homeTeam = game.homeTeamId ? teamsMap[game.homeTeamId] : null;
      const awayTeam = game.awayTeamId ? teamsMap[game.awayTeamId] : null;
      const ageGroup = ageGroupsMap[game.ageGroupId] || 'Unknown';
      
      // Use real field data from database - handle null field assignments properly
      const fieldName = game.fieldName || (game.fieldId ? `Field ${game.fieldId}` : 'Unassigned');
      const venue = game.complexName ? `${fieldName} (${game.complexName})` : fieldName;
      
      // Use real time slot data if available, otherwise generate realistic schedule
      let gameDate = tournamentDates[0]; // Default to first day
      let gameTime = '08:00';
      
      if (game.timeSlotStart) {
        // Use actual scheduled time from time slot
        const startTime = new Date(game.timeSlotStart);
        gameDate = startTime.toISOString().split('T')[0];
        gameTime = startTime.toTimeString().substring(0, 5);
        console.log(`[Schedule Viewer] Using real time slot for game ${game.gameId}: ${gameDate} ${gameTime}`);
      } else {
        // Distribute games evenly across tournament days with realistic times
        const gamesPerDay = Math.ceil(actualGamesData.length / tournamentDates.length);
        const dayIndex = Math.floor(index / gamesPerDay);
        gameDate = tournamentDates[dayIndex % tournamentDates.length];
        
        // Generate realistic game times (8 AM to 6 PM, games every 90 minutes)
        const gameIndexInDay = index % gamesPerDay;
        const slotsPerDay = 10; // 8AM-6PM = 10 hours, ~1 game per hour
        const slotIndex = gameIndexInDay % slotsPerDay;
        const hour = 8 + slotIndex;
        const minute = (gameIndexInDay % 2) * 30; // Alternate between :00 and :30
        gameTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
      
      return {
        id: game.gameId,
        homeTeam: homeTeam?.name || `Team ${game.homeTeamId}`,
        awayTeam: awayTeam?.name || `Team ${game.awayTeamId}`,
        homeTeamClub: homeTeam?.clubName || '',
        awayTeamClub: awayTeam?.clubName || '',
        ageGroup: ageGroup,
        field: venue,
        fieldName: fieldName,
        complexName: game.complexName || '',
        complexAddress: game.complexAddress || '',
        fieldSize: game.fieldSize || '',
        date: gameDate,
        time: gameTime,
        duration: 90,
        status: game.status || 'scheduled',
        homeScore: game.homeScore,
        awayScore: game.awayScore
      };
    });

    // Use only real games - no fallback sample data
    const displayGames = realGames;

    // Get real field data from database
    const realFieldsData = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        hasLights: fields.hasLights,
        complexName: complexes.name,
        complexAddress: complexes.address,
        openTime: fields.openTime,
        closeTime: fields.closeTime
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.isOpen, true));

    const fieldsData = realFieldsData.map(field => ({
      name: field.complexName ? `${field.name} (${field.complexName})` : field.name,
      surface: 'Grass', // Default since surface not in schema
      size: field.fieldSize || '11v11',
      hasLights: field.hasLights,
      complexName: field.complexName,
      address: field.complexAddress,
      hours: `${field.openTime || '08:00'} - ${field.closeTime || '22:00'}`
    }));

    // Check if these are real tournament games or generated scheduling data
    const isGeneratedSchedule = actualGamesData.length > 0 && 
      actualGamesData.every(game => {
        const gameDate = new Date(game.createdAt);
        const eventStart = new Date(event.startDate);
        // If games were created before tournament start date, they're generated
        return gameDate < eventStart;
      });

    const scheduleStatus = isGeneratedSchedule ? 'preview' : 'official';
    
    res.json({
      games: displayGames,
      fields: fieldsData,
      ageGroups,
      dates: tournamentDates,
      totalGames: actualGamesData.length,
      scheduleStatus: scheduleStatus,
      isPreview: isGeneratedSchedule,
      actualData: {
        gamesInDatabase: actualGamesData.length,
        teamsInDatabase: actualTeamsData.length,
        ageGroupsConfigured: ageGroups.length,
        realTeamsFound: actualTeamsData.length,
        scheduledGamesFound: actualGamesData.length,
        scheduleType: isGeneratedSchedule ? 'AUTO-GENERATED PREVIEW' : 'OFFICIAL SCHEDULE'
      },
      teamsList: actualTeamsData.map(t => ({ id: t.id, name: t.name, club: t.clubName })),
      eventId,
      eventDetails: {
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate
      }
    });

  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    res.status(500).json({ error: 'Failed to fetch tournament schedule' });
  }
});

// GET /api/admin/events/:eventId/fields - Get fields for the event
router.get('/:eventId/fields', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Return basic field structure
    const fields = [
      { id: 1, name: 'Field 1', surface: 'Grass', size: '11v11' },
      { id: 2, name: 'Field 2', surface: 'Grass', size: '11v11' },
      { id: 3, name: 'Field 3', surface: 'Grass', size: '9v9' },
      { id: 4, name: 'Field 4', surface: 'Turf', size: '7v7' }
    ];

    res.json(fields);

  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

export default router;