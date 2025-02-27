import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups } from '@db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

async function processAgeGroups(ageGroups: any[], seasonalScopeId: number) {
  return ageGroups.map(ageGroup => ({
    ...ageGroup,
    eventId: ageGroup.eventId?.toString() // Ensure eventId is string
  }));
}

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    // Process age groups to ensure birth_date_start is set
    const processedAgeGroups = await processAgeGroups(
      eventData.ageGroups || [],
      eventData.seasonalScopeId
    );

    // Replace the age groups in the request with the processed ones
    eventData.ageGroups = processedAgeGroups;

    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      // Update event
      const updatedEvent = await tx
        .update(events)
        .set({
          name: eventData.name,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          timezone: eventData.timezone,
          applicationDeadline: eventData.applicationDeadline,
          details: eventData.details,
          agreement: eventData.agreement,
          refundPolicy: eventData.refundPolicy,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, BigInt(eventId)))
        .returning();

      // Delete existing age groups first
      await tx
        .delete(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId));

      // Insert new age groups
      if (eventData.ageGroups && eventData.ageGroups.length > 0) {
        const ageGroupsToInsert = eventData.ageGroups.map((group: any) => ({
          eventId: eventId,
          ageGroup: group.ageGroup,
          birthYear: group.birthYear,
          gender: group.gender,
          projectedTeams: group.projectedTeams || null,
          fieldSize: group.fieldSize,
          scoringRule: group.scoringRule || null,
          amountDue: group.amountDue || null,
          createdAt: new Date().toISOString(),
          birth_date_start: group.birth_date_start || null,
        }));

        await tx.insert(eventAgeGroups).values(ageGroupsToInsert);
      }

      return updatedEvent[0];
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ 
      error: "Failed to update event", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;