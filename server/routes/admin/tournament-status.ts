import express from 'express';
import { db } from '@db';
import { events, games, teams, eventAgeGroups } from '@db/schema';
import { eq, and, count, countDistinct } from 'drizzle-orm';
import { requirePermission } from '../../middleware/auth';

const router = express.Router();

// GET /api/admin/events/:eventId/tournament-status
router.get('/:eventId/tournament-status', requirePermission('schedule_management'), async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get event details
    const [event] = await db
      .select({
        id: events.id,
        name: events.name
      })
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get age groups count and list
    const ageGroupsData = await db
      .select({
        ageGroup: eventAgeGroups.ageGroup,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    const ageGroupsList = Array.from(new Set(ageGroupsData.map(ag => ag.ageGroup))).sort();
    const ageGroupsCount = ageGroupsList.length;

    // Get games count
    const [gamesResult] = await db
      .select({ count: count() })
      .from(games)
      .where(eq(games.eventId, eventId));

    const gamesScheduled = gamesResult?.count || 0;

    // Get teams count
    const [teamsResult] = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    const teamsRegistered = teamsResult?.count || 0;

    // Determine status
    let status: 'fully_scheduled' | 'partially_scheduled' | 'not_scheduled';
    if (gamesScheduled > 0 && ageGroupsCount > 0) {
      status = 'fully_scheduled';
    } else if (ageGroupsCount > 0) {
      status = 'not_scheduled';
    } else {
      status = 'not_scheduled';
    }

    const response = {
      eventName: event.name,
      ageGroups: ageGroupsCount,
      gamesScheduled,
      teamsRegistered,
      status,
      ageGroupsList
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching tournament status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tournament status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;