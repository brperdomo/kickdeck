import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { publishedSchedules } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Get published schedule for public viewing (no authentication required)
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Get the active published schedule for this event
    const publishedSchedule = await db
      .select()
      .from(publishedSchedules)
      .where(
        and(
          eq(publishedSchedules.eventId, parseInt(eventId)),
          eq(publishedSchedules.isActive, true)
        )
      )
      .orderBy(desc(publishedSchedules.publishedAt))
      .limit(1);

    if (!publishedSchedule.length) {
      return res.status(404).json({ 
        error: 'No published schedules found for this event',
        message: 'The tournament organizer has not yet published schedules for public viewing.'
      });
    }

    // Return the schedule data
    res.json(publishedSchedule[0].scheduleData);
  } catch (error) {
    console.error('Error fetching published schedule:', error);
    res.status(500).json({ error: 'Failed to fetch published schedule' });
  }
});

export default router;