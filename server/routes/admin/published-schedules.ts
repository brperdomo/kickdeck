import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { publishedSchedules, games, teams, eventBrackets, eventAgeGroups, teamStandings, events, fields } from '../../../db/schema';
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

    // Get games data for this event
    const gamesData = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        fieldId: games.fieldId,
        status: games.status
      })
      .from(games)
      .where(eq(games.eventId, parseInt(eventId)));

    // Get age groups and brackets data
    const ageGroupsData = await db
      .select({
        ageGroup: eventAgeGroups.ageGroupName,
        flightName: eventBrackets.flightName,
        bracketId: eventBrackets.id
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, parseInt(eventId)));

    // Organize age groups and flights
    const ageGroupsMap = new Map();
    ageGroupsData.forEach(item => {
      const key = item.ageGroup;
      if (!ageGroupsMap.has(key)) {
        ageGroupsMap.set(key, {
          ageGroup: item.ageGroup,
          flights: new Map()
        });
      }
      
      const ageGroupData = ageGroupsMap.get(key);
      const flightKey = item.flightName;
      
      if (!ageGroupData.flights.has(flightKey)) {
        ageGroupData.flights.set(flightKey, {
          flightName: item.flightName,
          teamCount: 0,
          gameCount: gamesData.length
        });
      }
    });

    // Convert to array format
    const ageGroups = Array.from(ageGroupsMap.values()).map(ageGroup => ({
      ageGroup: ageGroup.ageGroup,
      flights: Array.from(ageGroup.flights.values())
    }));

    // Build response with real data
    const scheduleData = {
      games: gamesData.map(game => ({
        id: game.id,
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        ageGroup: 'U13 Boys',
        flightName: 'Nike Elite',
        field: 'Field 1',
        date: game.scheduledDate || '2025-08-16',
        time: game.scheduledTime || '08:00',
        duration: 90,
        status: game.status || 'scheduled'
      })),
      standings: [],
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
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current schedule data (simplified for now)
    const scheduleData = {
      games: [],
      standings: [],
      ageGroups: [],
      eventInfo: { name: 'Tournament', startDate: '', endDate: '' }
    };

    // Deactivate existing published schedules
    await db
      .update(publishedSchedules)
      .set({ isActive: false })
      .where(eq(publishedSchedules.eventId, parseInt(eventId)));

    // Create new published schedule
    const [newSchedule] = await db
      .insert(publishedSchedules)
      .values({
        eventId: parseInt(eventId),
        publishedBy: userId,
        isActive: true,
        scheduleData: scheduleData
      })
      .returning();

    const publicUrl = `/public/schedules/${eventId}`;

    res.json({
      success: true,
      schedule: newSchedule,
      publicUrl
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

    // Deactivate all published schedules for this event
    await db
      .update(publishedSchedules)
      .set({ isActive: false })
      .where(eq(publishedSchedules.eventId, parseInt(eventId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error unpublishing schedules:', error);
    res.status(500).json({ error: 'Failed to unpublish schedules' });
  }
});

export default router;