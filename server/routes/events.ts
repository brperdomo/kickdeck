import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventAgeGroupFees, eventFees } from '@db/schema';
import { eq, and } from 'drizzle-orm';
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

      // First, delete all existing age groups and their fee assignments
      await tx.delete(eventAgeGroupFees)
        .where(
          eq(eventAgeGroupFees.ageGroupId,
            sql`(SELECT id FROM event_age_groups WHERE event_id = ${eventId.toString()})`
          )
        );

      await tx.delete(eventAgeGroups)
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

            await tx
              .insert(eventAgeGroupFees)
              .values({
                ageGroupId: insertedAgeGroup.id,
                feeId: group.feeId,
                createdAt: new Date().toISOString(),
              });

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

// Get event age groups
router.get('/:id/age-groups', async (req, res) => {
  try {
    const eventId = req.params.id;
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId.toString()),
    });
    res.json(ageGroups);
  } catch (error) {
    console.error("Error fetching age groups:", error);
    res.status(500).json({
      error: "Failed to fetch age groups",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get fee assignments
router.get('/:id/fee-assignments', async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Fetching fee assignments for event:', eventId);

    const assignments = await db
      .select({
        ageGroupId: eventAgeGroupFees.ageGroupId,
        feeId: eventAgeGroupFees.feeId,
      })
      .from(eventAgeGroupFees)
      .innerJoin(
        eventAgeGroups,
        eq(eventAgeGroupFees.ageGroupId, eventAgeGroups.id)
      )
      .where(eq(eventAgeGroups.eventId, eventId.toString()));

    console.log('Found assignments:', assignments);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching fee assignments:", error);
    res.status(500).json({
      error: "Failed to fetch fee assignments",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update fee assignments
router.put('/:id/fee-assignments', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { assignments } = req.body;

    await db.transaction(async (tx) => {
      // Delete existing assignments for this event's age groups
      await tx
        .delete(eventAgeGroupFees)
        .where(
          eq(eventAgeGroupFees.ageGroupId,
            sql`(SELECT id FROM event_age_groups WHERE event_id = ${eventId.toString()})`
          )
        );

      // Create new assignments
      if (assignments && Object.keys(assignments).length > 0) {
        for (const [feeId, groupIds] of Object.entries(assignments)) {
          if (Array.isArray(groupIds)) {
            for (const groupId of groupIds) {
              await tx
                .insert(eventAgeGroupFees)
                .values({
                  age_group_id: groupId,
                  fee_id: parseInt(feeId),
                  created_at: new Date().toISOString(),
                });
            }
          }
        }
      }
    });

    res.json({ message: "Fee assignments updated successfully" });
  } catch (error) {
    console.error("Error updating fee assignments:", error);
    res.status(500).json({
      error: "Failed to update fee assignments",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;