import { Router } from 'express';
import { db } from '../../../db';
import { sql, eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Get flight templates for an event
router.get('/:eventId/flight-templates', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const templates = await db.execute(sql`
      SELECT id, event_id, level, display_name, description, sort_order, is_active
      FROM event_flight_templates 
      WHERE event_id = ${eventId} AND is_active = true
      ORDER BY sort_order, display_name
    `);

    res.json(templates.rows);
  } catch (error) {
    console.error('Error fetching flight templates:', error);
    res.status(500).json({ error: 'Failed to fetch flight templates' });
  }
});

// Create flight template for an event
router.post('/:eventId/flight-templates', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { level, displayName, description, sortOrder = 0 } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO event_flight_templates (event_id, level, display_name, description, sort_order)
      VALUES (${eventId}, ${level}, ${displayName}, ${description}, ${sortOrder})
      RETURNING *
    `);

    // Apply this template to all existing brackets in the event
    await db.execute(sql`
      UPDATE event_brackets 
      SET level = ${level}
      WHERE event_id = ${eventId} AND level = 'middle_flight'
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating flight template:', error);
    res.status(500).json({ error: 'Failed to create flight template' });
  }
});

// Update flight template and apply to all brackets
router.put('/:eventId/flight-templates/:templateId', isAdmin, async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    const { level, displayName, description, sortOrder } = req.body;
    
    // Get the old level value
    const oldTemplate = await db.execute(sql`
      SELECT level FROM event_flight_templates 
      WHERE id = ${parseInt(templateId)} AND event_id = ${eventId}
    `);
    
    if (oldTemplate.rows.length === 0) {
      return res.status(404).json({ error: 'Flight template not found' });
    }
    
    const oldLevel = oldTemplate.rows[0].level;
    
    // Update the template
    const result = await db.execute(sql`
      UPDATE event_flight_templates 
      SET level = ${level}, display_name = ${displayName}, description = ${description}, sort_order = ${sortOrder}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(templateId)} AND event_id = ${eventId}
      RETURNING *
    `);

    // Apply changes to all brackets using this level in the event
    await db.execute(sql`
      UPDATE event_brackets 
      SET level = ${level}
      WHERE event_id = ${eventId} AND level = ${oldLevel}
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating flight template:', error);
    res.status(500).json({ error: 'Failed to update flight template' });
  }
});

// Delete flight template
router.delete('/:eventId/flight-templates/:templateId', isAdmin, async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    
    // Soft delete - mark as inactive
    await db.execute(sql`
      UPDATE event_flight_templates 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(templateId)} AND event_id = ${eventId}
    `);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting flight template:', error);
    res.status(500).json({ error: 'Failed to delete flight template' });
  }
});

// Initialize default flight templates for an event
router.post('/:eventId/flight-templates/initialize-defaults', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if templates already exist
    const existing = await db.execute(sql`
      SELECT COUNT(*) as count FROM event_flight_templates 
      WHERE event_id = ${eventId} AND is_active = true
    `);
    
    if (existing.rows[0].count > 0) {
      return res.json({ message: 'Flight templates already exist for this event' });
    }
    
    // Create default templates
    const defaultTemplates = [
      { level: 'top_flight', displayName: 'Top Flight', description: 'Highest skill/competition level', sortOrder: 1 },
      { level: 'middle_flight', displayName: 'Middle Flight', description: 'Intermediate skill/competition level', sortOrder: 2 },
      { level: 'bottom_flight', displayName: 'Bottom Flight', description: 'Recreational/developmental level', sortOrder: 3 }
    ];
    
    for (const template of defaultTemplates) {
      await db.execute(sql`
        INSERT INTO event_flight_templates (event_id, level, display_name, description, sort_order)
        VALUES (${eventId}, ${template.level}, ${template.displayName}, ${template.description}, ${template.sortOrder})
      `);
    }
    
    res.json({ 
      success: true, 
      message: 'Default flight templates created successfully',
      templatesCreated: defaultTemplates.length 
    });
  } catch (error) {
    console.error('Error initializing default flight templates:', error);
    res.status(500).json({ error: 'Failed to initialize default flight templates' });
  }
});

export default router;