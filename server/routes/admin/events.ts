import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups, eventScoringRules, eventComplexes, eventFieldSizes, eventFees, coupons } from '@db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Get event details endpoint
router.get('/:id', async (req, res) => {
  try {
    const eventId = BigInt(req.params.id);
    console.log('Fetching event details for ID:', eventId);

    // Get main event details
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event || event.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get age groups with fee assignments
    const ageGroups = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        birthYear: eventAgeGroups.birthYear,
        gender: eventAgeGroups.gender,
        projectedTeams: eventAgeGroups.projectedTeams,
        fieldSize: eventAgeGroups.fieldSize,
        scoringRule: eventAgeGroups.scoringRule,
        amountDue: eventAgeGroups.amountDue,
        birth_date_start: eventAgeGroups.birth_date_start,
        divisionCode: eventAgeGroups.divisionCode,
        feeId: eventAgeGroups.feeId,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    // Get complex assignments
    const complexAssignments = await db
      .select()
      .from(eventComplexes)
      .where(eq(eventComplexes.eventId, eventId));

    // Get field sizes
    const fieldSizes = await db
      .select()
      .from(eventFieldSizes)
      .where(eq(eventFieldSizes.eventId, eventId));

    // Get scoring rules
    const scoringRules = await db
      .select()
      .from(eventScoringRules)
      .where(eq(eventScoringRules.eventId, eventId));

    // Get fees
    const fees = await db
      .select()
      .from(eventFees)
      .where(eq(eventFees.eventId, eventId));

    // Combine all data
    const result = {
      ...event[0],
      ageGroups: ageGroups.map(group => ({
        ...group,
        selected: true,
      })),
      complexes: complexAssignments,
      fieldSizes,
      scoringRules,
      fees
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch event details', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete event endpoint
router.delete('/:id', async (req, res) => {
  try {
    const eventId = BigInt(req.params.id);
    console.log('Starting event deletion for ID:', eventId);

    await db.transaction(async (tx) => {
      // Delete coupons first
      await tx.delete(coupons)
        .where(eq(coupons.eventId, eventId))
        .execute();
      console.log('Deleted coupons');

      // Delete age groups
      await tx.delete(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId))
        .execute();
      console.log('Deleted age groups');

      // Delete complexes
      await tx.delete(eventComplexes)
        .where(eq(eventComplexes.eventId, eventId))
        .execute();
      console.log('Deleted event complexes');

      // Delete field sizes
      await tx.delete(eventFieldSizes)
        .where(eq(eventFieldSizes.eventId, eventId))
        .execute();
      console.log('Deleted event field sizes');

      // Delete scoring rules
      await tx.delete(eventScoringRules)
        .where(eq(eventScoringRules.eventId, eventId))
        .execute();
      console.log('Deleted event scoring rules');

      // Delete fees
      await tx.delete(eventFees)
        .where(eq(eventFees.eventId, eventId))
        .execute();
      console.log('Deleted event fees');

      // Finally delete the event itself
      const [deletedEvent] = await tx.delete(events)
        .where(eq(events.id, eventId))
        .returning();

      if (!deletedEvent) {
        throw new Error('Event not found');
      }
    });

    console.log('Successfully deleted event:', eventId);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to delete event",
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;