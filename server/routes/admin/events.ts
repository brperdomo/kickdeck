import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups, seasonalScopes } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

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
          event_id: id.toString(),
          age_group_settings_id: parseInt(ageGroupId),
          seasonal_scope_id: parseInt(seasonalScopeId),
          created_at: new Date().toISOString()
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