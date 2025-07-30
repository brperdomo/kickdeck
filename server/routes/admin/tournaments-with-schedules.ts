import { Router } from 'express';
import { db } from '@db';
import { events, games, teams } from '@db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// GET /api/admin/tournaments/with-schedules - Get all tournaments with schedule statistics
router.get('/with-schedules', isAdmin, async (req, res) => {
  try {
    console.log('Fetching tournaments with schedule data...');

    // Get all events with basic info
    const allEvents = await db.query.events.findMany({
      where: eq(events.isArchived, false),
      orderBy: [desc(events.createdAt)]
    });

    // Get schedule statistics for each event
    const tournamentsWithSchedules = await Promise.all(
      allEvents.map(async (event) => {
        try {
          // Count games for this event
          const gameCount = await db
            .select({ count: count() })
            .from(games)
            .where(sql`${games.eventId} = ${event.id}`);

          // Count approved teams for this event
          const teamCount = await db
            .select({ count: count() })
            .from(teams)
            .where(sql`${teams.eventId} = ${event.id} AND ${teams.status} = 'approved'`);

          // Get unique age groups count (approximate)
          const ageGroupCount = await db
            .select({ count: sql`COUNT(DISTINCT ${teams.ageGroupId})` })
            .from(teams)
            .where(sql`${teams.eventId} = ${event.id} AND ${teams.status} = 'approved'`);

          // Determine tournament status
          const now = new Date();
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          
          let status: 'upcoming' | 'active' | 'completed';
          if (now < startDate) {
            status = 'upcoming';
          } else if (now >= startDate && now <= endDate) {
            status = 'active';
          } else {
            status = 'completed';
          }

          return {
            id: event.id,
            name: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            totalGames: gameCount[0]?.count || 0,
            totalTeams: teamCount[0]?.count || 0,
            ageGroups: parseInt(ageGroupCount[0]?.count as string) || 0,
            status
          };
        } catch (eventError) {
          console.error(`Error processing event ${event.id}:`, eventError);
          return {
            id: event.id,
            name: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            totalGames: 0,
            totalTeams: 0,
            ageGroups: 0,
            status: 'upcoming' as const
          };
        }
      })
    );

    console.log(`Found ${tournamentsWithSchedules.length} tournaments with schedule data`);
    res.json(tournamentsWithSchedules);

  } catch (error) {
    console.error('Error fetching tournaments with schedules:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tournaments with schedule data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;