/**
 * Automatic Field Configuration API
 * 
 * Ensures every event gets field configurations automatically
 */

import { Router } from 'express';
import { EventFieldConfigService } from '../../services/eventFieldConfigService';
import { isAdmin } from '../../middleware';

const router = Router();

/**
 * Create field configurations for a specific event
 */
router.post('/events/:eventId/field-configs/create', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    if (isNaN(eventIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID'
      });
    }
    
    await EventFieldConfigService.createFieldConfigurationsForEvent(eventIdNum);
    
    res.json({
      success: true,
      message: `Field configurations created for event ${eventId}`,
      eventId: eventIdNum
    });
    
  } catch (error: any) {
    console.error('[AUTO FIELD CONFIG] Creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create field configurations',
      details: error.message
    });
  }
});

/**
 * Ensure all events have field configurations (migration endpoint)
 */
router.post('/events/field-configs/migrate-all', isAdmin, async (req, res) => {
  try {
    await EventFieldConfigService.ensureAllEventsHaveFieldConfigurations();
    
    res.json({
      success: true,
      message: 'All events now have field configurations'
    });
    
  } catch (error: any) {
    console.error('[AUTO FIELD CONFIG] Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to migrate field configurations',
      details: error.message
    });
  }
});

/**
 * Get field configurations for an event with metadata
 */
router.get('/events/:eventId/field-configs', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    if (isNaN(eventIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID'
      });
    }
    
    const configurations = await EventFieldConfigService.getEventFieldConfigurations(eventIdNum);
    
    res.json({
      success: true,
      configurations,
      eventId: eventIdNum,
      count: configurations.length
    });
    
  } catch (error: any) {
    console.error('[AUTO FIELD CONFIG] Get configurations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get field configurations',
      details: error.message
    });
  }
});

export default router;