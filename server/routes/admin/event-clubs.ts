import { Router } from 'express';
import { db } from '../../../db';
import { clubs, teams, events } from '@db/schema';
import { eq, sql, and, isNotNull, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { hasEventAccess } from '../../middleware/event-access';

const router = Router();

// Get clubs for a specific event
router.get('/:eventId/clubs', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get teams for this event that have club information
    const teamsWithClubs = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        clubId: teams.clubId,
        clubName: teams.clubName,
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        isNotNull(teams.clubId)
      ));

    // Get unique club IDs from teams
    const clubIds = [...new Set(teamsWithClubs
      .filter(team => team.clubId !== null)
      .map(team => team.clubId))];

    // Get club details for these club IDs
    const clubsData = clubIds.length > 0 
      ? await db
          .select()
          .from(clubs)
          .where(sql`${clubs.id} IN (${clubIds.join(',')})`)
      : [];

    // Count teams per club
    const clubStats = clubIds.map(clubId => {
      const teamsForClub = teamsWithClubs.filter(team => team.clubId === clubId);
      const clubData = clubsData.find(club => club.id === clubId) || { 
        id: clubId,
        name: teamsForClub[0]?.clubName || 'Unknown Club',
        logoUrl: null,
      };
      
      return {
        ...clubData,
        teamCount: teamsForClub.length,
      };
    });

    return res.json(clubStats);
  } catch (error) {
    console.error(`Error getting clubs for event ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update club information
router.patch('/:eventId/clubs/:clubId', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const clubId = parseInt(req.params.clubId);

    const clubSchema = z.object({
      name: z.string().min(1, "Club name is required"),
      logoUrl: z.string().optional().nullable(),
    });

    const validatedData = clubSchema.parse(req.body);

    // First, check if the club exists
    const [existingClub] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    let club;

    if (existingClub) {
      // Update existing club
      [club] = await db
        .update(clubs)
        .set({
          name: validatedData.name,
          logoUrl: validatedData.logoUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(clubs.id, clubId))
        .returning();
    } else {
      // Create new club
      [club] = await db
        .insert(clubs)
        .values({
          id: clubId,
          name: validatedData.name,
          logoUrl: validatedData.logoUrl || null,
          createdAt: new Date().toISOString(),
        })
        .returning();
    }

    // Update all teams for this event with this club ID
    await db
      .update(teams)
      .set({
        clubName: validatedData.name,
      })
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.clubId, clubId)
      ));

    return res.json(club);
  } catch (error) {
    console.error(`Error updating club for event ID ${req.params.eventId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event details with club count
router.get('/:eventId', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get event details
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Count unique club IDs for this event
    const uniqueClubCount = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${teams.clubId})`,
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        isNotNull(teams.clubId)
      ))
      .then(result => result[0]?.count || 0);

    // Get total teams count
    const totalTeamsCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(teams)
      .where(eq(teams.eventId, eventId))
      .then(result => result[0]?.count || 0);

    return res.json({
      ...event,
      clubCount: uniqueClubCount,
      teamCount: totalTeamsCount,
    });
  } catch (error) {
    console.error(`Error getting event details for ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;