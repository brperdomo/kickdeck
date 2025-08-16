import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, events, eventAgeGroups, fields, complexes } from '../../../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

const router = Router();

// Public route: Get all age groups/divisions for an event
router.get('/:eventId/divisions', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Division Schedules] Fetching divisions for event ${eventId}`);
    
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

    // Get all age groups/divisions for this event that have games
    const ageGroupsWithGames = await db
      .select({
        ageGroupId: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode,
        fieldSize: eventAgeGroups.fieldSize
      })
      .from(eventAgeGroups)
      .innerJoin(games, eq(games.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId))
      .groupBy(
        eventAgeGroups.id,
        eventAgeGroups.ageGroup, 
        eventAgeGroups.gender,
        eventAgeGroups.birthYear,
        eventAgeGroups.divisionCode,
        eventAgeGroups.fieldSize
      );

    // Sort divisions by gender (Boys first) and then by birth year (older first)
    const sortedDivisions = ageGroupsWithGames.sort((a, b) => {
      if (a.gender !== b.gender) {
        if (a.gender === 'Boys') return -1;
        if (b.gender === 'Boys') return 1;
      }
      return (b.birthYear || 0) - (a.birthYear || 0);
    });

    // Get game counts for each division
    const divisionsWithCounts = await Promise.all(
      sortedDivisions.map(async (division) => {
        const gameCount = await db
          .select({ count: games.id })
          .from(games)
          .where(eq(games.ageGroupId, division.ageGroupId));

        return {
          id: division.ageGroupId,
          name: division.ageGroup,
          divisionCode: division.divisionCode,
          gender: division.gender,
          birthYear: division.birthYear,
          fieldSize: division.fieldSize,
          gameCount: gameCount.length,
          publicUrl: `/public/schedules/${eventId}/age-group/${division.ageGroupId}`
        };
      })
    );

    console.log(`[Division Schedules] Found ${divisionsWithCounts.length} divisions with games`);

    res.json({
      success: true,
      event: eventInfo[0],
      divisions: divisionsWithCounts,
      totalDivisions: divisionsWithCounts.length,
      totalGames: divisionsWithCounts.reduce((sum, div) => sum + div.gameCount, 0)
    });

  } catch (error) {
    console.error('[Division Schedules] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch divisions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Public route: Get schedule for a specific division by division code
router.get('/:eventId/division/:divisionCode', async (req: Request, res: Response) => {
  try {
    const { eventId, divisionCode } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Division Schedule] Fetching schedule for ${divisionCode} in event ${eventId}`);
    
    // Find age group by division code
    const ageGroup = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode,
        fieldSize: eventAgeGroups.fieldSize
      })
      .from(eventAgeGroups)
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(eventAgeGroups.divisionCode, divisionCode)
      ))
      .limit(1);

    if (!ageGroup.length) {
      return res.status(404).json({
        error: 'Division not found',
        message: `Division ${divisionCode} does not exist in this tournament.`
      });
    }

    // Redirect to the standard age group schedule URL
    const redirectUrl = `/public/schedules/${eventId}/age-group/${ageGroup[0].id}`;
    res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('[Division Schedule] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch division schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;