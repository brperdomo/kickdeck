import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups, seasonalScopes, eventScoringRules, eventComplexes, eventFieldSizes, eventFees, eventAgeGroupFees } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Fetching event details for:', eventId);

    // Get main event details
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, BigInt(eventId)))
      .limit(1);

    if (!event || event.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get age groups with their associated fees
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
        feeId: eventAgeGroupFees.feeId,
      })
      .from(eventAgeGroups)
      .leftJoin(
        eventAgeGroupFees,
        eq(eventAgeGroups.id, eventAgeGroupFees.ageGroupId)
      )
      .where(eq(eventAgeGroups.eventId, eventId.toString()));

    console.log('Fetched age groups:', ageGroups);

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
      .where(eq(eventFees.eventId, BigInt(eventId)));

    // Combine all data
    const result = {
      ...event[0],
      ageGroups: ageGroups.map(group => ({
        ...group,
        id: group.id,
        selected: true, // Mark all fetched age groups as selected
        feeId: group.feeId // Ensure feeId is included
      })),
      complexes: complexAssignments,
      fieldSizes,
      scoringRules,
      fees
    };

    console.log('Sending event details:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch event details', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;