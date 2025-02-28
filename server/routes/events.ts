import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventFees } from '@db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const eventId = BigInt(req.params.id);
    const eventData = req.body;

    console.log('Updating event:', eventId);

    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      // Update event basic info
      const [updatedEvent] = await tx
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
        .where(eq(events.id, eventId))
        .returning();

      console.log('Event basic info updated');

      // Delete existing age groups
      await tx.delete(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId));

      console.log('Existing age groups deleted');

      // Insert new age groups with their fee assignments
      if (eventData.ageGroups && eventData.ageGroups.length > 0) {
        const selectedGroups = eventData.ageGroups.filter(group => group.selected);
        console.log('Processing selected age groups:', selectedGroups);

        for (const group of selectedGroups) {
          // Insert age group with fee assignment
          const [insertedAgeGroup] = await tx
            .insert(eventAgeGroups)
            .values({
              eventId: eventId,
              ageGroup: group.ageGroup,
              birthYear: group.birthYear,
              gender: group.gender,
              projectedTeams: group.projectedTeams || null,
              fieldSize: group.fieldSize || null,
              scoringRule: group.scoringRule || null,
              amountDue: group.amountDue || null,
              birth_date_start: group.birth_date_start || null,
              divisionCode: group.divisionCode || null,
              feeId: group.feeId || null, // Direct fee assignment
              createdAt: new Date().toISOString(),
            })
            .returning();

          console.log('Inserted age group with fee:', insertedAgeGroup);
        }
      }

      return updatedEvent;
    });

    console.log('Event update completed:', result);
    res.json({ message: "Event updated successfully", event: result });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ 
      error: "Failed to update event", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;