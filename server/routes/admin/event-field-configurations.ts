import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eventFieldConfigurations, events, fields, complexes, games } from '@db/schema';
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';
import { EventFieldConfigService } from '../../services/eventFieldConfigService';

const router = Router();

// ✅ EVENT FIELD CONFIGURATIONS API
// Provides comprehensive backend for FieldManagementDashboard component

// Get all fields for a specific event
router.get('/events/:eventId/fields', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[EVENT FIELDS] Fetching fields for event: ${eventId}`);
    
    // Verify event exists
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);
    
    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Helper to fetch fields with complete info
    const fetchFieldsData = () => db
      .select({
        id: eventFieldConfigurations.id,
        fieldId: eventFieldConfigurations.fieldId,
        fieldSize: eventFieldConfigurations.fieldSize,
        sortOrder: eventFieldConfigurations.sortOrder,
        isActive: eventFieldConfigurations.isActive,
        firstGameTime: eventFieldConfigurations.firstGameTime,
        lastGameTime: eventFieldConfigurations.lastGameTime,
        eventId: eventFieldConfigurations.eventId,
        createdAt: eventFieldConfigurations.createdAt,
        updatedAt: eventFieldConfigurations.updatedAt,
        // Get field details from the fields table
        name: fields.name,
        hasLights: fields.hasLights,
        isOpen: fields.isOpen,
        complexName: complexes.name
      })
      .from(eventFieldConfigurations)
      .leftJoin(fields, eq(eventFieldConfigurations.fieldId, fields.id))
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(eventFieldConfigurations.eventId, parseInt(eventId)))
      .orderBy(eventFieldConfigurations.sortOrder);

    // Always sync field configurations — picks up newly added fields/venues
    try {
      await EventFieldConfigService.createFieldConfigurationsForEvent(parseInt(eventId));
    } catch (seedError: any) {
      console.error(`[EVENT FIELDS] Field config sync failed:`, seedError.message);
    }

    // Fetch all fields for the event with complete field information
    let fieldsData = await fetchFieldsData();

    console.log(`[EVENT FIELDS] Found ${fieldsData.length} fields for event ${eventId}`);
    
    res.json({
      success: true,
      fields: fieldsData.map(field => ({
        id: field.fieldId, // Use actual field ID for field operations
        name: field.name || `Field ${field.fieldId}`,
        fieldSize: field.fieldSize,
        sortOrder: field.sortOrder,
        isActive: field.isActive,
        hasLights: field.hasLights || false,
        isOpen: field.isOpen || false,
        firstGameTime: field.firstGameTime,
        lastGameTime: field.lastGameTime,
        complexName: field.complexName,
        eventFieldConfigId: field.id, // Keep reference to event config
        eventId: field.eventId,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt
      }))
    });
    
  } catch (error: any) {
    console.error('[EVENT FIELDS] Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch event fields',
      details: error.message 
    });
  }
});

// Create new field for an event
router.post('/events/:eventId/fields', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      name, 
      fieldSize, 
      hasLights, 
      isOpen, 
      complexName, 
      firstGameTime 
    } = req.body;
    
    console.log(`[EVENT FIELDS] Creating new field for event: ${eventId}`);
    console.log(`[EVENT FIELDS] Field data:`, { name, fieldSize, hasLights, isOpen });
    
    // Validate required fields
    if (!name || !fieldSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, fieldSize'
      });
    }
    
    // Get the next sort order
    const maxSortOrder = await db
      .select({ maxOrder: sql`COALESCE(MAX(${eventFieldConfigurations.sortOrder}), 0)` })
      .from(eventFieldConfigurations)
      .where(eq(eventFieldConfigurations.eventId, parseInt(eventId)));
    
    const nextSortOrder = (maxSortOrder[0]?.maxOrder as number || 0) + 1;
    
    // Insert new field configuration
    const [newField] = await db
      .insert(eventFieldConfigurations)
      .values({
        eventId: parseInt(eventId),
        fieldId: 1, // Default field ID - this should be updated to reference actual fields
        fieldSize,
        sortOrder: nextSortOrder,
        isActive: true,
        firstGameTime: firstGameTime || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    
    console.log(`[EVENT FIELDS] Created field with ID: ${newField.id}`);
    
    res.json({
      success: true,
      field: {
        id: newField.id,
        fieldId: newField.fieldId,
        fieldSize: newField.fieldSize,
        sortOrder: newField.sortOrder,
        isActive: newField.isActive,
        firstGameTime: newField.firstGameTime,
        eventId: newField.eventId,
        createdAt: newField.createdAt,
        updatedAt: newField.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('[EVENT FIELDS] Creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create field',
      details: error.message 
    });
  }
});

// Update field for an event
router.put('/events/:eventId/fields/:fieldId', isAdmin, async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    const { 
      fieldSize, 
      sortOrder, 
      isActive, 
      firstGameTime,
      lastGameTime
    } = req.body;
    
    console.log(`[EVENT FIELDS] Updating field configuration for field ${fieldId} in event: ${eventId}`);
    console.log(`[EVENT FIELDS] Update data:`, { fieldSize, sortOrder, isActive, firstGameTime, lastGameTime });
    
    // Find the event field configuration by actual field ID (not config ID)
    const existingField = await db
      .select()
      .from(eventFieldConfigurations)
      .where(
        and(
          eq(eventFieldConfigurations.fieldId, parseInt(fieldId)),
          eq(eventFieldConfigurations.eventId, parseInt(eventId))
        )
      )
      .limit(1);
    
    if (existingField.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Field configuration not found for this event'
      });
    }

    // ── Detect field size change → clear all scheduled games ─────────────
    const oldFieldSize = existingField[0].fieldSize;
    const newFieldSize = fieldSize || oldFieldSize;
    let gamesCleared = 0;

    if (newFieldSize !== oldFieldSize) {
      console.log(`[EVENT FIELDS] Field size changing: ${oldFieldSize} → ${newFieldSize} for field ${fieldId} in event ${eventId}`);

      // Count how many scheduled games exist for this event
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(games)
        .where(
          and(
            eq(games.eventId, parseInt(eventId)),
            isNotNull(games.fieldId)
          )
        );
      gamesCleared = countResult[0]?.count || 0;

      if (gamesCleared > 0) {
        // Clear all field/date/time assignments — games become "unscheduled"
        await db
          .update(games)
          .set({
            fieldId: null,
            scheduledDate: null,
            scheduledTime: null,
          })
          .where(
            and(
              eq(games.eventId, parseInt(eventId)),
              isNotNull(games.fieldId)
            )
          );
        console.log(`[EVENT FIELDS] Cleared ${gamesCleared} scheduled games for event ${eventId} due to field size change`);
      }
    }

    // Update field configuration
    const [updatedField] = await db
      .update(eventFieldConfigurations)
      .set({
        fieldSize: fieldSize || existingField[0].fieldSize,
        sortOrder: sortOrder !== undefined ? sortOrder : existingField[0].sortOrder,
        isActive: isActive !== undefined ? isActive : existingField[0].isActive,
        firstGameTime: firstGameTime !== undefined ? firstGameTime : existingField[0].firstGameTime,
        lastGameTime: lastGameTime !== undefined ? lastGameTime : existingField[0].lastGameTime,
        updatedAt: new Date().toISOString()
      })
      .where(eq(eventFieldConfigurations.id, existingField[0].id))
      .returning();
    
    console.log(`[EVENT FIELDS] Updated field ${fieldId} successfully`);
    
    res.json({
      success: true,
      gamesCleared,
      fieldSizeChanged: newFieldSize !== oldFieldSize,
      field: {
        id: updatedField.id,
        fieldId: updatedField.fieldId,
        fieldSize: updatedField.fieldSize,
        sortOrder: updatedField.sortOrder,
        isActive: updatedField.isActive,
        firstGameTime: updatedField.firstGameTime,
        lastGameTime: updatedField.lastGameTime,
        eventId: updatedField.eventId,
        createdAt: updatedField.createdAt,
        updatedAt: updatedField.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('[EVENT FIELDS] Update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update field',
      details: error.message 
    });
  }
});

// Bulk update field order (for drag-and-drop reordering)
router.put('/events/:eventId/fields/reorder', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fieldOrders } = req.body;
    
    console.log(`[EVENT FIELDS] Reordering fields for event: ${eventId}`);
    console.log(`[EVENT FIELDS] New field orders:`, fieldOrders);
    
    if (!Array.isArray(fieldOrders)) {
      return res.status(400).json({
        success: false,
        error: 'fieldOrders must be an array of {id, sortOrder} objects'
      });
    }
    
    // Update each field configuration's sort order
    for (const { id, sortOrder } of fieldOrders) {
      await db
        .update(eventFieldConfigurations)
        .set({
          sortOrder: sortOrder,
          updatedAt: new Date().toISOString()
        })
        .where(
          and(
            eq(eventFieldConfigurations.id, parseInt(id)),
            eq(eventFieldConfigurations.eventId, parseInt(eventId))
          )
        );
    }
    
    console.log(`[EVENT FIELDS] Reordered ${fieldOrders.length} fields successfully`);
    
    res.json({
      success: true,
      message: 'Field order updated successfully'
    });
    
  } catch (error: any) {
    console.error('[EVENT FIELDS] Reorder error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reorder fields',
      details: error.message 
    });
  }
});

// Delete field from an event
router.delete('/events/:eventId/fields/:fieldId', isAdmin, async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    
    console.log(`[EVENT FIELDS] Deleting field ${fieldId} for event: ${eventId}`);
    
    // Check if field configuration exists and belongs to the event
    const existingField = await db
      .select()
      .from(eventFieldConfigurations)
      .where(
        and(
          eq(eventFieldConfigurations.id, parseInt(fieldId)),
          eq(eventFieldConfigurations.eventId, parseInt(eventId))
        )
      )
      .limit(1);
    
    if (existingField.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Field configuration not found or does not belong to this event'
      });
    }
    
    // TODO: Check if field has scheduled games before allowing deletion
    // For now, we'll allow deletion but this should be enhanced
    
    // Delete the field configuration
    await db
      .delete(eventFieldConfigurations)
      .where(eq(eventFieldConfigurations.id, parseInt(fieldId)));
    
    console.log(`[EVENT FIELDS] Field ${fieldId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Field deleted successfully'
    });
    
  } catch (error: any) {
    console.error('[EVENT FIELDS] Deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete field',
      details: error.message 
    });
  }
});

// Bulk update field sizes for an event
router.put('/events/:eventId/fields/bulk-update', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { updates } = req.body;
    
    console.log(`[EVENT FIELDS] Bulk updating fields for event: ${eventId}`);
    console.log(`[EVENT FIELDS] Bulk updates:`, updates);
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates must be an array of field update objects'
      });
    }
    
    // Update each field
    for (const update of updates) {
      const { id, ...updateData } = update;
      
      if (id) {
        await db
          .update(eventFieldConfigurations)
          .set({
            ...updateData,
            updatedAt: new Date().toISOString()
          })
          .where(
            and(
              eq(eventFieldConfigurations.id, parseInt(id)),
              eq(eventFieldConfigurations.eventId, parseInt(eventId))
            )
          );
      }
    }
    
    console.log(`[EVENT FIELDS] Bulk updated ${updates.length} fields successfully`);
    
    res.json({
      success: true,
      message: 'Fields updated successfully'
    });
    
  } catch (error: any) {
    console.error('[EVENT FIELDS] Bulk update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update fields',
      details: error.message 
    });
  }
});

export default router;