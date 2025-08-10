import { Router } from 'express';
import { db } from '@db';
import { eventFieldConfigurations, fields, games, gameTimeSlots, eventComplexes } from '@db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();

// Admin authentication applied in main routes.ts

/**
 * COMPLETELY REMOVE a field from tournament usage
 * This is tournament-specific field exclusion, not system-wide deletion
 */
router.delete('/events/:eventId/fields/:fieldId/exclude', async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    const fieldIdNum = parseInt(fieldId);
    const eventIdNum = parseInt(eventId);

    console.log(`[FIELD EXCLUSION] Starting complete removal of field ${fieldId} from event ${eventId}`);

    // Start transaction for atomic field removal
    await db.transaction(async (tx) => {
      // Step 1: Check if field exists and belongs to event's complexes
      const eventComplexList = await tx
        .select({ complexId: eventComplexes.complexId })
        .from(eventComplexes)
        .where(eq(eventComplexes.eventId, String(eventIdNum)));

      const complexIds = eventComplexList.map(ec => ec.complexId);
      
      const field = await tx
        .select()
        .from(fields)
        .where(and(
          eq(fields.id, fieldIdNum),
          inArray(fields.complexId, complexIds)
        ))
        .limit(1);

      if (field.length === 0) {
        throw new Error(`Field ${fieldId} not found or not associated with event ${eventId}`);
      }

      console.log(`[FIELD EXCLUSION] Field found: ${field[0].name}`);

      // Step 2: Remove ALL games scheduled on this field for this event
      const gamesToDelete = await tx
        .select({ id: games.id })
        .from(games)
        .where(and(
          eq(games.eventId, String(eventId)),
          eq(games.fieldId, fieldIdNum)
        ));

      if (gamesToDelete.length > 0) {
        console.log(`[FIELD EXCLUSION] Removing ${gamesToDelete.length} games from field ${fieldId}`);
        
        await tx
          .delete(games)
          .where(and(
            eq(games.eventId, String(eventId)),
            eq(games.fieldId, fieldIdNum)
          ));
      }

      // Step 3: Remove ALL time slots for this field in this event
      const timeSlotsToDelete = await tx
        .select({ id: gameTimeSlots.id })
        .from(gameTimeSlots)
        .where(and(
          eq(gameTimeSlots.eventId, String(eventId)),
          eq(gameTimeSlots.fieldId, fieldIdNum)
        ));

      if (timeSlotsToDelete.length > 0) {
        console.log(`[FIELD EXCLUSION] Removing ${timeSlotsToDelete.length} time slots for field ${fieldId}`);
        
        await tx
          .delete(gameTimeSlots)
          .where(and(
            eq(gameTimeSlots.eventId, String(eventId)),
            eq(gameTimeSlots.fieldId, fieldIdNum)
          ));
      }

      // Step 4: Mark field as completely inactive for this event
      const existingConfig = await tx
        .select()
        .from(eventFieldConfigurations)
        .where(and(
          eq(eventFieldConfigurations.eventId, eventIdNum),
          eq(eventFieldConfigurations.fieldId, fieldIdNum)
        ))
        .limit(1);

      if (existingConfig.length > 0) {
        // Update existing configuration to exclude field
        await tx
          .update(eventFieldConfigurations)
          .set({
            isActive: false,
            isExcluded: true, // Mark as completely excluded
            updatedAt: new Date().toISOString()
          })
          .where(and(
            eq(eventFieldConfigurations.eventId, eventIdNum),
            eq(eventFieldConfigurations.fieldId, fieldIdNum)
          ));
        
        console.log(`[FIELD EXCLUSION] Updated field configuration to exclude field ${fieldId}`);
      } else {
        // Create new configuration marking field as excluded
        await tx
          .insert(eventFieldConfigurations)
          .values({
            eventId: eventIdNum,
            fieldId: fieldIdNum,
            isActive: false,
            isExcluded: true, // Mark as completely excluded
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        
        console.log(`[FIELD EXCLUSION] Created exclusion configuration for field ${fieldId}`);
      }

      console.log(`[FIELD EXCLUSION] Successfully removed field ${fieldId} from tournament ${eventId}`);
    });

    res.json({
      success: true,
      message: `Field ${fieldId} has been completely removed from tournament usage`,
      action: 'field_excluded',
      fieldId: fieldIdNum,
      eventId: eventIdNum
    });

  } catch (error: any) {
    console.error(`[FIELD EXCLUSION ERROR] Failed to exclude field ${req.params.fieldId}:`, error);
    
    res.status(500).json({
      error: 'Failed to exclude field from tournament',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get excluded fields for an event
 */
router.get('/events/:eventId/fields/excluded', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const excludedFields = await db
      .select({
        fieldId: eventFieldConfigurations.fieldId,
        fieldName: fields.name,
        excludedAt: eventFieldConfigurations.updatedAt
      })
      .from(eventFieldConfigurations)
      .leftJoin(fields, eq(fields.id, eventFieldConfigurations.fieldId))
      .where(and(
        eq(eventFieldConfigurations.eventId, parseInt(eventId)),
        eq(eventFieldConfigurations.isExcluded, true)
      ));

    res.json({
      excludedFields,
      count: excludedFields.length
    });

  } catch (error: any) {
    console.error('[FIELD EXCLUSION] Error fetching excluded fields:', error);
    res.status(500).json({
      error: 'Failed to fetch excluded fields',
      message: error.message
    });
  }
});

/**
 * Restore a previously excluded field
 */
router.post('/events/:eventId/fields/:fieldId/restore', async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    const fieldIdNum = parseInt(fieldId);

    await db
      .update(eventFieldConfigurations)
      .set({
        isActive: true,
        isExcluded: false,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(eventFieldConfigurations.eventId, parseInt(eventId)),
        eq(eventFieldConfigurations.fieldId, fieldIdNum)
      ));

    console.log(`[FIELD RESTORATION] Restored field ${fieldId} for event ${eventId}`);

    res.json({
      success: true,
      message: `Field ${fieldId} has been restored to tournament usage`,
      action: 'field_restored',
      fieldId: fieldIdNum
    });

  } catch (error: any) {
    console.error('[FIELD RESTORATION ERROR]:', error);
    res.status(500).json({
      error: 'Failed to restore field',
      message: error.message
    });
  }
});

export default router;