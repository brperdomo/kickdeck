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

const router = Router();

/**
 * Get available fields for an event
 */
router.get('/events/:eventId/fields', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`🏟️ API: Getting available fields for event ${eventId}`);
    
    const fields = await FieldAvailabilityService.getAvailableFields(eventId);
    
    res.json({
      success: true,
      fields,
      count: fields.length
    });
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

export default router;