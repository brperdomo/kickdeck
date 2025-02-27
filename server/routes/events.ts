import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventAgeGroupFees, teams } from '@db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm/sql';


const router = Router();

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    console.log('Updating event:', eventId);
    console.log('Received update data:', JSON.stringify(eventData, null, 2));

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
        .where(eq(events.id, BigInt(eventId)))
        .returning();

      console.log('Event basic info updated');

      // First, get all existing age group IDs to properly clean up fee assignments
      const existingAgeGroups = await tx
        .select({ id: eventAgeGroups.id })
        .from(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId.toString()));

      // Delete fee assignments for existing age groups
      for (const group of existingAgeGroups) {
        await tx.execute(sql`DELETE FROM event_age_group_fees WHERE age_group_id = ${group.id}`);
      }

      // Delete existing age groups
      await tx
        .delete(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId.toString()));

      console.log('Existing age groups and fee assignments deleted');

      // Insert new age groups and their fee assignments
      if (eventData.ageGroups && eventData.ageGroups.length > 0) {
        console.log('Processing age groups:', eventData.ageGroups);

        // Filter only selected age groups
        const selectedGroups = eventData.ageGroups.filter(group => group.selected);
        console.log('Selected age groups:', selectedGroups);

        for (const group of selectedGroups) {
          console.log('Processing selected group:', group);

          // Insert age group
          const [insertedAgeGroup] = await tx
            .insert(eventAgeGroups)
            .values({
              eventId: eventId.toString(),
              ageGroup: group.ageGroup,
              birthYear: group.birthYear,
              gender: group.gender,
              projectedTeams: group.projectedTeams || null,
              fieldSize: group.fieldSize || null,
              scoringRule: group.scoringRule || null,
              amountDue: group.amountDue || null,
              createdAt: new Date().toISOString(),
              birth_date_start: group.birth_date_start || null,
              divisionCode: group.divisionCode || null,
            })
            .returning();

          console.log('Inserted age group:', insertedAgeGroup);

          // If fee is assigned, create the fee assignment
          if (group.feeId) {
            console.log('Creating fee assignment for group:', {
              ageGroupId: insertedAgeGroup.id,
              feeId: group.feeId
            });

            await tx.execute(sql`
              INSERT INTO event_age_group_fees (age_group_id, fee_id, created_at) 
              VALUES (${insertedAgeGroup.id}, ${group.feeId}, ${new Date().toISOString()})
            `);

            console.log('Fee assignment created successfully');
          }
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