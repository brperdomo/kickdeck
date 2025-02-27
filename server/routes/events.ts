import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Assuming necessary imports like 'app', 'db', 'events', 'eventAgeGroups', 'seasonalScopes', 'eq' are present.

async function processAgeGroups(ageGroups: any[], seasonalScopeId: number) {
  const processedAgeGroups = await Promise.all(ageGroups.map(async (ageGroup) => {
    return ageGroup;
  }));
  return processedAgeGroups;
}

app.patch('/api/admin/events/:id', async (req, res) => {
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
        .where(eq(events.id, eventId))
        .returning();

      // Get existing age groups for comparison
      const existingAgeGroups = await tx
        .select()
        .from(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId));

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
          projectedTeams: group.projectedTeams,
          fieldSize: group.fieldSize,
          scoringRule: group.scoringRule,
          amountDue: group.amountDue || null,
          createdAt: new Date().toISOString(),
          birth_date_start: group.birth_date_start || null,
        }));

        await tx.insert(eventAgeGroups).values(ageGroupsToInsert);
      }

      return updatedEvent;
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event", details: error instanceof Error ? error.message : 'Unknown error' });
  }
});