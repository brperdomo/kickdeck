import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups, seasonalScopes, eventScoringRules, eventComplexes, eventFieldSizes } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Get event details endpoint
router.get('/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    // Get event details
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get age groups with seasonal scope info
    const ageGroupsWithScope = await db
      .select({
        id: eventAgeGroups.id,
        eventId: eventAgeGroups.eventId,
        ageGroup: eventAgeGroups.ageGroup,
        birthYear: eventAgeGroups.birthYear,
        gender: eventAgeGroups.gender,
        projectedTeams: eventAgeGroups.projectedTeams,
        scoringRule: eventAgeGroups.scoringRule,
        fieldSize: eventAgeGroups.fieldSize,
        amountDue: eventAgeGroups.amountDue,
        seasonalScope: {
          id: seasonalScopes.id,
          name: seasonalScopes.name,
          startYear: seasonalScopes.startYear,
          endYear: seasonalScopes.endYear,
          isActive: seasonalScopes.isActive
        }
      })
      .from(eventAgeGroups)
      .leftJoin(seasonalScopes, eq(eventAgeGroups.seasonalScopeId, seasonalScopes.id))
      .where(eq(eventAgeGroups.eventId, eventId.toString()));

    // Get scoring rules
    const scoringRules = await db
      .select()
      .from(eventScoringRules)
      .where(eq(eventScoringRules.eventId, eventId));

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

    // Format response
    const response = {
      ...event,
      ageGroups: ageGroupsWithScope.map(ag => ({
        ...ag,
        seasonalScopeId: ag.seasonalScope.id
      })),
      scoringRules,
      seasonalScope: ageGroupsWithScope.length > 0 ? ageGroupsWithScope[0].seasonalScope : null,
      selectedComplexIds: complexAssignments.map(a => a.complexId),
      complexFieldSizes: Object.fromEntries(
        fieldSizes.map(f => [f.fieldId, f.fieldSize])
      )
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching event details:', error);
    console.error("Error details:", error);
    res.status(500).json({ message: "Failed to fetch event details" });
  }
});

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      startDate,
      endDate,
      timezone,
      applicationDeadline,
      details,
      agreement,
      refundPolicy,
      seasonalScopeId,
      selectedAgeGroupIds,
    } = req.body;

    // Update event within a transaction
    await db.transaction(async (tx) => {
      // Update main event details
      await tx.update(events)
        .set({
          name,
          startDate,
          endDate,
          timezone,
          applicationDeadline,
          details,
          agreement,
          refundPolicy,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, parseInt(id)));

      // If we have new age group selections
      if (selectedAgeGroupIds && selectedAgeGroupIds.length > 0) {
        // First delete existing age group associations
        await tx.delete(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, id.toString()));

        // Then insert new age group associations
        const ageGroupValues = selectedAgeGroupIds.map(ageGroupId => ({
          eventId: id.toString(),
          ageGroupSettingsId: parseInt(ageGroupId),
          seasonalScopeId: parseInt(seasonalScopeId),
          createdAt: new Date().toISOString()
        }));

        await tx.insert(eventAgeGroups).values(ageGroupValues);
      }
    });

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update event' 
    });
  }
});

export default router;