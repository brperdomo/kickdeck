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
    console.log('Received update data size:', JSON.stringify(eventData).length, 'bytes');

    // Strip unnecessary data from large objects to reduce payload size
    if (eventData.ageGroups && Array.isArray(eventData.ageGroups)) {
      // Keep only essential properties for each age group
      eventData.ageGroups = eventData.ageGroups.map(group => ({
        id: group.id,
        ageGroup: group.ageGroup,
        gender: group.gender, 
        birthDateStart: group.birthDateStart,
        birthDateEnd: group.birthDateEnd,
        minBirthYear: group.minBirthYear,
        maxBirthYear: group.maxBirthYear,
        divisionCode: group.divisionCode,
        projectedTeams: group.projectedTeams || 0,
        amountDue: group.amountDue,
        feeId: group.feeId,
        selected: group.selected
      }));
    }

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
        await tx.delete(eventAgeGroupFees)
          .where(eq(eventAgeGroupFees.ageGroupId, group.id));
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
        const selectedGroups = eventData.ageGroups.filter((group: any) => group.isSelected);
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
              fieldSize: group.fieldSize || "11v11", // Ensure field_size is never null
              scoringRule: group.scoringRule || null,
              amountDue: group.amountDue || null,
              createdAt: new Date().toISOString(),
              birth_date_start: group.birthDateStart || null,
              divisionCode: group.divisionCode || null,
            })
            .returning();

          console.log('Inserted age group:', insertedAgeGroup);

          // Process fee assignments if any
          if (group.fees && Array.isArray(group.fees) && group.fees.length > 0) {
            console.log('Processing fee assignments:', group.fees);

            // Insert all fee assignments for this age group
            const feeAssignments = group.fees.map((feeId: number) => ({
              ageGroupId: insertedAgeGroup.id,
              feeId: feeId,
              createdAt: new Date().toISOString()
            }));

            await tx.insert(eventAgeGroupFees).values(feeAssignments);
            console.log(`Fee assignments created for age group ${insertedAgeGroup.id}`);
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

// Get event by ID for editing
router.get("/admin/events/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;

    // Get event
    const event = await db.query.events.findFirst({
      where: eq(events.id, BigInt(id)),
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get age groups with their fee assignments
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, id.toString()),
    });

    // Get fee assignments for each age group
    for (const ageGroup of ageGroups) {
      const feeAssignments = await db
        .select({ feeId: eventAgeGroupFees.feeId })
        .from(eventAgeGroupFees)
        .where(eq(eventAgeGroupFees.ageGroupId, ageGroup.id));

      // Add fees array to age group
      (ageGroup as any).fees = feeAssignments.map(row => row.feeId);
      // Mark as selected for the form
      (ageGroup as any).isSelected = true;
    }

    console.log('Sending event with age groups:', ageGroups.length);

    return res.json({
      ...event,
      ageGroups,
    });
  } catch (error) {
    console.error("Error getting event:", error);
    return res.status(500).json({ error: "Failed to get event" });
  }
});

export default router;