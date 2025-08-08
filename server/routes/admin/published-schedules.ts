import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { publishedSchedules, games, teams, eventBrackets, eventAgeGroups, teamStandings, events } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { isAdmin } from '../../middleware';

const router = Router();

// Get schedule preview data for an event
router.get('/events/:eventId/schedule-preview', isAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Get event info
    const eventInfo = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate
      })
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);

    if (!eventInfo.length) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all games with team and bracket information
    const gamesData = await db
      .select({
        id: games.id,
        homeTeamName: games.homeTeamName,
        awayTeamName: games.awayTeamName,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        duration: games.duration,
        fieldName: games.fieldName,
        status: games.status,
        bracketName: eventBrackets.name,
        ageGroup: eventAgeGroups.name,
        flightName: eventBrackets.flightName
      })
      .from(games)
      .leftJoin(eventBrackets, eq(games.bracketId, eventBrackets.id))
      .leftJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(games.eventId, eventId));

    // Get team standings
    const standingsData = await db
      .select({
        teamName: teams.name,
        ageGroup: eventAgeGroups.name,
        flightName: eventBrackets.flightName,
        gamesPlayed: teamStandings.gamesPlayed,
        wins: teamStandings.wins,
        losses: teamStandings.losses,
        ties: teamStandings.ties,
        goalsScored: teamStandings.goalsScored,
        goalsAllowed: teamStandings.goalsAllowed,
        goalDifferential: teamStandings.goalDifferential,
        points: teamStandings.totalPoints
      })
      .from(teamStandings)
      .leftJoin(teams, eq(teamStandings.teamId, teams.id))
      .leftJoin(eventBrackets, eq(teamStandings.bracketId, eventBrackets.id))
      .leftJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(teamStandings.eventId, eventId));

    // Group data by age groups and flights
    const ageGroupsMap = new Map();

    gamesData.forEach(game => {
      if (!game.ageGroup || !game.flightName) return;
      
      const key = game.ageGroup;
      if (!ageGroupsMap.has(key)) {
        ageGroupsMap.set(key, {
          ageGroup: game.ageGroup,
          flights: new Map()
        });
      }
      
      const ageGroupData = ageGroupsMap.get(key);
      const flightKey = game.flightName;
      
      if (!ageGroupData.flights.has(flightKey)) {
        ageGroupData.flights.set(flightKey, {
          flightName: game.flightName,
          teamCount: 0,
          gameCount: 0
        });
      }
      
      ageGroupData.flights.get(flightKey).gameCount++;
    });

    // Add team counts from standings
    standingsData.forEach(standing => {
      if (!standing.ageGroup || !standing.flightName) return;
      
      const key = standing.ageGroup;
      if (ageGroupsMap.has(key)) {
        const ageGroupData = ageGroupsMap.get(key);
        const flightKey = standing.flightName;
        
        if (ageGroupData.flights.has(flightKey)) {
          ageGroupData.flights.get(flightKey).teamCount++;
        }
      }
    });

    // Convert to array format
    const ageGroups = Array.from(ageGroupsMap.values()).map(ageGroup => ({
      ageGroup: ageGroup.ageGroup,
      flights: Array.from(ageGroup.flights.values())
    }));

    const scheduleData = {
      games: gamesData.map(game => ({
        id: game.id,
        homeTeam: game.homeTeamName || 'TBD',
        awayTeam: game.awayTeamName || 'TBD',
        ageGroup: game.ageGroup || '',
        flightName: game.flightName || '',
        field: game.fieldName || '',
        date: game.scheduledDate || '',
        time: game.scheduledTime || '',
        duration: game.duration || 90,
        status: game.status || 'scheduled'
      })),
      standings: standingsData.map(standing => ({
        teamName: standing.teamName || '',
        ageGroup: standing.ageGroup || '',
        flightName: standing.flightName || '',
        gamesPlayed: standing.gamesPlayed || 0,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        ties: standing.ties || 0,
        goalsFor: standing.goalsScored || 0,
        goalsAgainst: standing.goalsAllowed || 0,
        points: standing.points || 0
      })),
      ageGroups,
      eventInfo: eventInfo[0]
    };

    res.json(scheduleData);
  } catch (error) {
    console.error('Error fetching schedule preview:', error);
    res.status(500).json({ error: 'Failed to fetch schedule preview' });
  }
});

// Get published schedules for an event
router.get('/events/:eventId/published-schedules', isAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    const schedules = await db
      .select()
      .from(publishedSchedules)
      .where(eq(publishedSchedules.eventId, parseInt(eventId)))
      .orderBy(desc(publishedSchedules.publishedAt));

    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching published schedules:', error);
    res.status(500).json({ error: 'Failed to fetch published schedules' });
  }
});

// Publish schedules for an event
router.post('/events/:eventId/publish-schedules', isAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    
    // First, get the current schedule preview data
    const previewResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/events/${eventId}/schedule-preview`, {
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });
    
    if (!previewResponse.ok) {
      return res.status(400).json({ error: 'No schedule data found to publish' });
    }
    
    const scheduleData = await previewResponse.json();
    
    if (!scheduleData.games || scheduleData.games.length === 0) {
      return res.status(400).json({ error: 'No games found to publish' });
    }

    // Deactivate any existing published schedules
    await db
      .update(publishedSchedules)
      .set({ isActive: false })
      .where(eq(publishedSchedules.eventId, parseInt(eventId)));

    // Create new published schedule
    const [published] = await db
      .insert(publishedSchedules)
      .values({
        eventId: parseInt(eventId),
        publishedBy: userId,
        scheduleData: scheduleData,
        isActive: true
      })
      .returning();

    const publicUrl = `/public/schedules/${eventId}`;
    
    res.json({ 
      success: true, 
      scheduleId: published.id,
      publicUrl,
      message: 'Schedules published successfully' 
    });
  } catch (error) {
    console.error('Error publishing schedules:', error);
    res.status(500).json({ error: 'Failed to publish schedules' });
  }
});

// Unpublish schedules for an event
router.post('/events/:eventId/unpublish-schedules', isAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    await db
      .update(publishedSchedules)
      .set({ isActive: false })
      .where(eq(publishedSchedules.eventId, parseInt(eventId)));

    res.json({ success: true, message: 'Schedules unpublished successfully' });
  } catch (error) {
    console.error('Error unpublishing schedules:', error);
    res.status(500).json({ error: 'Failed to unpublish schedules' });
  }
});

export default router;