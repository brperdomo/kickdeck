/**
 * Field Management API Routes
 * 
 * Provides real field availability checking, venue capacity analysis,
 * and time slot management for tournament scheduling.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { isAdmin } from '../../middleware';
import { FieldAvailabilityService } from '../../services/field-availability-service';
import { db } from '@db';
import { eventFieldConfigurations } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * Get available fields for an event
 */
router.get('/events/:eventId/fields', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`🏟️ API: Getting available fields for event ${eventId} with configurations`);
    
    // Get ALL field data for this event (including closed ones for management purposes)
    const { fields, complexes, eventComplexes } = await import('@db/schema');
    const { eq, and } = await import('drizzle-orm');
    
    const eventComplexesData = await db
      .select({
        complexId: eventComplexes.complexId,
        complexName: complexes.name,
        complexOpenTime: complexes.openTime,
        complexCloseTime: complexes.closeTime,
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        fieldOpenTime: fields.openTime,
        fieldCloseTime: fields.closeTime,
        hasLights: fields.hasLights,
        isOpen: fields.isOpen,
        complexIsOpen: complexes.isOpen
      })
      .from(eventComplexes)
      .innerJoin(complexes, eq(complexes.id, eventComplexes.complexId))
      .innerJoin(fields, eq(fields.complexId, complexes.id))
      .where(eq(eventComplexes.eventId, eventId));

    const baseFields = eventComplexesData.map((row: any) => ({
      id: row.fieldId,
      name: row.fieldName,
      fieldSize: row.fieldSize,
      complexId: row.complexId,
      complexName: row.complexName,
      openTime: row.fieldOpenTime || row.complexOpenTime,
      closeTime: row.fieldCloseTime || row.complexCloseTime,
      hasLights: row.hasLights,
      isOpen: row.isOpen && row.complexIsOpen // Field is open only if both field AND complex are open
    }));
    
    // Get event-specific configurations
    const configurations = await db
      .select()
      .from(eventFieldConfigurations)
      .where(eq(eventFieldConfigurations.eventId, parseInt(eventId)));
    
    console.log(`🏟️ API: Found ${baseFields.length} base fields and ${configurations.length} configurations`);
    
    // Create a map of field configurations for easy lookup
    const configMap = new Map();
    configurations.forEach(config => {
      configMap.set(config.fieldId, config);
    });
    
    // Merge base field data with event-specific configurations
    const enhancedFields = baseFields.map(field => {
      const config = configMap.get(field.id);
      return {
        ...field,
        fieldSize: config?.fieldSize || field.fieldSize || '11v11',
        isActive: config?.isActive !== undefined ? config.isActive : true,
        firstGameTime: config?.firstGameTime || null,
        sortOrder: config?.sortOrder || 0,
        // Complex status - use actual field/complex open status
        isOpen: field.isOpen
      };
    });
    
    // Sort by sort order if available
    enhancedFields.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    console.log(`🏟️ API: Enhanced ${enhancedFields.length} fields with configurations`);
    
    res.json(enhancedFields);
  } catch (error: any) {
    console.error('Error getting available fields:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get venue capacity analysis for an event
 */
router.get('/events/:eventId/venue-capacity', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`📊 API: Getting venue capacity for event ${eventId}`);
    
    const capacity = await FieldAvailabilityService.getVenueCapacity(eventId);
    
    res.json({
      success: true,
      capacity,
      summary: {
        totalComplexes: capacity.length,
        totalFields: capacity.reduce((sum, c) => sum + c.totalFields, 0),
        availableFields: capacity.reduce((sum, c) => sum + c.availableFields, 0)
      }
    });
  } catch (error: any) {
    console.error('Error getting venue capacity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check field availability for specific time
 */
router.post('/events/:eventId/fields/:fieldId/check-availability', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    const { startTime, endTime, dayIndex, excludeGameId } = req.body;
    
    console.log(`🔍 API: Checking availability for field ${fieldId} on day ${dayIndex} from ${startTime} to ${endTime}`);
    
    const availability = await FieldAvailabilityService.checkFieldAvailability(
      eventId,
      parseInt(fieldId),
      startTime,
      endTime,
      dayIndex,
      excludeGameId
    );
    
    res.json({
      success: true,
      availability
    });
  } catch (error: any) {
    console.error('Error checking field availability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Find available time slots for field size
 */
router.get('/events/:eventId/available-slots', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fieldSize, dayIndex, gameDuration = 90, bufferTime = 15 } = req.query;
    
    console.log(`🔍 API: Finding available slots for ${fieldSize} fields on day ${dayIndex}`);
    
    const slots = await FieldAvailabilityService.findAvailableTimeSlots(
      eventId,
      fieldSize as string,
      parseInt(dayIndex as string),
      parseInt(gameDuration as string),
      parseInt(bufferTime as string)
    );
    
    res.json({
      success: true,
      slots,
      count: slots.length
    });
  } catch (error: any) {
    console.error('Error finding available time slots:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reserve a time slot
 */
router.post('/events/:eventId/fields/:fieldId/reserve', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    const { startTime, endTime, dayIndex } = req.body;
    
    console.log(`🔒 API: Reserving field ${fieldId} from ${startTime} to ${endTime} on day ${dayIndex}`);
    
    const timeSlotId = await FieldAvailabilityService.reserveTimeSlot(
      eventId,
      parseInt(fieldId),
      startTime,
      endTime,
      dayIndex
    );
    
    res.json({
      success: true,
      timeSlotId,
      message: `Time slot reserved successfully`
    });
  } catch (error: any) {
    console.error('Error reserving time slot:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Release a time slot reservation
 */
router.delete('/events/:eventId/time-slots/:timeSlotId', requireAuth, isAdmin, async (req, res) => {
  try {
    const { timeSlotId } = req.params;
    
    console.log(`🔓 API: Releasing time slot ${timeSlotId}`);
    
    await FieldAvailabilityService.releaseTimeSlot(parseInt(timeSlotId));
    
    res.json({
      success: true,
      message: `Time slot ${timeSlotId} released successfully`
    });
  } catch (error: any) {
    console.error('Error releasing time slot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get field utilization statistics
 */
router.get('/events/:eventId/field-utilization', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`📈 API: Getting field utilization for event ${eventId}`);
    
    const utilization = await FieldAvailabilityService.getFieldUtilization(eventId);
    
    // Calculate overall statistics
    const fields = Object.values(utilization);
    const totalSlots = fields.reduce((sum, field) => sum + field.totalSlots, 0);
    const totalBookedSlots = fields.reduce((sum, field) => sum + field.bookedSlots, 0);
    const overallUtilization = totalSlots > 0 ? Math.round((totalBookedSlots / totalSlots) * 100) : 0;
    
    res.json({
      success: true,
      utilization,
      summary: {
        totalFields: fields.length,
        totalSlots,
        totalBookedSlots,
        overallUtilization: `${overallUtilization}%`,
        fieldDetails: fields
      }
    });
  } catch (error: any) {
    console.error('Error getting field utilization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update event field configuration (field size, availability, first game time)
 */
router.patch('/events/:eventId/field-configurations', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fieldId, fieldSize, isActive, firstGameTime } = req.body;

    console.log(`🔧 API: Updating field configuration for event ${eventId}, field ${fieldId}`);
    console.log('🔧 API: Update data:', { fieldSize, isActive, firstGameTime });
    console.log('🔧 API: Request body full:', req.body);

    // Check if configuration exists
    const existingConfig = await db
      .select()
      .from(eventFieldConfigurations)
      .where(and(
        eq(eventFieldConfigurations.eventId, parseInt(eventId)),
        eq(eventFieldConfigurations.fieldId, fieldId)
      ))
      .limit(1);

    // Prepare update data
    const updateData: any = {};
    if (fieldSize !== undefined) updateData.fieldSize = fieldSize;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (firstGameTime !== undefined) updateData.firstGameTime = firstGameTime;
    updateData.updatedAt = new Date().toISOString();

    console.log(`🔧 API: Prepared update data:`, updateData);
    console.log(`🔧 API: Existing config found:`, existingConfig.length > 0);

    if (existingConfig.length > 0) {
      // Update existing configuration
      console.log(`🔧 API: Updating existing configuration for event ${eventId}, field ${fieldId}`);
      const result = await db
        .update(eventFieldConfigurations)
        .set(updateData)
        .where(and(
          eq(eventFieldConfigurations.eventId, parseInt(eventId)),
          eq(eventFieldConfigurations.fieldId, fieldId)
        ))
        .returning();
      
      console.log(`🔧 API: Update result:`, result);
    } else {
      // Create new configuration if it doesn't exist
      console.log(`🔧 API: Creating new configuration for event ${eventId}, field ${fieldId}`);
      const result = await db.insert(eventFieldConfigurations).values({
        eventId: parseInt(eventId),
        fieldId,
        fieldSize: fieldSize || '11v11',
        isActive: isActive !== undefined ? isActive : true,
        firstGameTime,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();
      
      console.log(`🔧 API: Insert result:`, result);
    }

    // Verify the save by reading it back
    const verifyConfig = await db
      .select()
      .from(eventFieldConfigurations)
      .where(and(
        eq(eventFieldConfigurations.eventId, parseInt(eventId)),
        eq(eventFieldConfigurations.fieldId, fieldId)
      ))
      .limit(1);
    
    console.log(`🔧 API: Verification read-back:`, verifyConfig);

    res.json({
      success: true,
      message: 'Field configuration updated successfully',
      fieldId,
      updates: updateData
    });
  } catch (error: any) {
    console.error('Error updating field configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Bulk update field configurations for an event
 */
router.patch('/events/:eventId/field-configurations/bulk', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fieldUpdates } = req.body;

    console.log(`🔧 API: Bulk updating field configurations for event ${eventId}`);
    console.log('Field updates:', fieldUpdates);

    const results = [];
    
    for (const update of fieldUpdates) {
      const { id: fieldId, sortOrder, fieldSize } = update;
      
      // Check if configuration exists
      const existingConfig = await db
        .select()
        .from(eventFieldConfigurations)
        .where(and(
          eq(eventFieldConfigurations.eventId, parseInt(eventId)),
          eq(eventFieldConfigurations.fieldId, fieldId)
        ))
        .limit(1);

      const updateData = {
        sortOrder,
        fieldSize,
        updatedAt: new Date().toISOString()
      };

      if (existingConfig.length > 0) {
        // Update existing configuration
        await db
          .update(eventFieldConfigurations)
          .set(updateData)
          .where(and(
            eq(eventFieldConfigurations.eventId, parseInt(eventId)),
            eq(eventFieldConfigurations.fieldId, fieldId)
          ));
      } else {
        // Create new configuration if it doesn't exist
        await db.insert(eventFieldConfigurations).values({
          eventId: parseInt(eventId),
          fieldId,
          fieldSize,
          sortOrder,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      results.push({ fieldId, updated: true });
    }

    res.json({
      success: true,
      message: `Updated ${results.length} field configurations`,
      results
    });
  } catch (error: any) {
    console.error('Error bulk updating field configurations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;