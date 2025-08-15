import { Router } from 'express';
import { db } from '../../../db';
import { 
  scoringRuleTemplates, 
  standingsCriteriaTemplates, 
  eventScoringConfiguration,
  insertScoringRuleTemplateSchema,
  insertStandingsCriteriaTemplateSchema,
  insertEventScoringConfigurationSchema
} from '@db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// GET /api/admin/scoring-templates - Get all scoring rule templates
router.get('/scoring-rules', async (req, res) => {
  try {
    const templates = await db.select().from(scoringRuleTemplates)
      .where(eq(scoringRuleTemplates.isActive, true))
      .orderBy(desc(scoringRuleTemplates.createdAt));
    
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch scoring rule templates:', error);
    res.status(500).json({ error: 'Failed to fetch scoring rule templates' });
  }
});

// POST /api/admin/scoring-templates/scoring-rules - Create new scoring rule template
router.post('/scoring-rules', async (req, res) => {
  try {
    const validatedData = insertScoringRuleTemplateSchema.parse(req.body);
    
    const [newTemplate] = await db.insert(scoringRuleTemplates)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Failed to create scoring rule template:', error);
    res.status(500).json({ 
      error: 'Failed to create scoring rule template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/scoring-templates/scoring-rules/:id - Update scoring rule template
router.put('/scoring-rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertScoringRuleTemplateSchema.parse(req.body);
    
    const [updatedTemplate] = await db.update(scoringRuleTemplates)
      .set({ ...validatedData, updatedAt: new Date().toISOString() })
      .where(eq(scoringRuleTemplates.id, id))
      .returning();
    
    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Scoring rule template not found' });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Failed to update scoring rule template:', error);
    res.status(500).json({ 
      error: 'Failed to update scoring rule template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/scoring-templates/scoring-rules/:id - Delete (deactivate) scoring rule template
router.delete('/scoring-rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [deactivatedTemplate] = await db.update(scoringRuleTemplates)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(scoringRuleTemplates.id, id))
      .returning();
    
    if (!deactivatedTemplate) {
      return res.status(404).json({ error: 'Scoring rule template not found' });
    }
    
    res.json({ message: 'Scoring rule template deactivated successfully' });
  } catch (error) {
    console.error('Failed to deactivate scoring rule template:', error);
    res.status(500).json({ error: 'Failed to deactivate scoring rule template' });
  }
});

// GET /api/admin/scoring-templates/standings-criteria - Get all standings criteria templates
router.get('/standings-criteria', async (req, res) => {
  try {
    const templates = await db.select().from(standingsCriteriaTemplates)
      .where(eq(standingsCriteriaTemplates.isActive, true))
      .orderBy(desc(standingsCriteriaTemplates.createdAt));
    
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch standings criteria templates:', error);
    res.status(500).json({ error: 'Failed to fetch standings criteria templates' });
  }
});

// POST /api/admin/scoring-templates/standings-criteria - Create new standings criteria template
router.post('/standings-criteria', async (req, res) => {
  try {
    const validatedData = insertStandingsCriteriaTemplateSchema.parse(req.body);
    
    const [newTemplate] = await db.insert(standingsCriteriaTemplates)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Failed to create standings criteria template:', error);
    res.status(500).json({ 
      error: 'Failed to create standings criteria template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/scoring-templates/standings-criteria/:id - Update standings criteria template
router.put('/standings-criteria/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertStandingsCriteriaTemplateSchema.parse(req.body);
    
    const [updatedTemplate] = await db.update(standingsCriteriaTemplates)
      .set({ ...validatedData, updatedAt: new Date().toISOString() })
      .where(eq(standingsCriteriaTemplates.id, id))
      .returning();
    
    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Standings criteria template not found' });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Failed to update standings criteria template:', error);
    res.status(500).json({ 
      error: 'Failed to update standings criteria template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/scoring-templates/standings-criteria/:id - Delete (deactivate) standings criteria template
router.delete('/standings-criteria/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [deactivatedTemplate] = await db.update(standingsCriteriaTemplates)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(standingsCriteriaTemplates.id, id))
      .returning();
    
    if (!deactivatedTemplate) {
      return res.status(404).json({ error: 'Standings criteria template not found' });
    }
    
    res.json({ message: 'Standings criteria template deactivated successfully' });
  } catch (error) {
    console.error('Failed to deactivate standings criteria template:', error);
    res.status(500).json({ error: 'Failed to deactivate standings criteria template' });
  }
});

// GET /api/admin/scoring-templates/event-configuration/:eventId - Get event scoring configuration
router.get('/event-configuration/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    const configuration = await db.select().from(eventScoringConfiguration)
      .where(eq(eventScoringConfiguration.eventId, eventId));
    
    res.json(configuration[0] || null);
  } catch (error) {
    console.error('Failed to fetch event scoring configuration:', error);
    res.status(500).json({ error: 'Failed to fetch event scoring configuration' });
  }
});

// POST /api/admin/scoring-templates/event-configuration - Create/Update event scoring configuration
router.post('/event-configuration', async (req, res) => {
  try {
    const validatedData = insertEventScoringConfigurationSchema.parse(req.body);
    
    // Check if configuration already exists for this event
    const existingConfig = await db.select().from(eventScoringConfiguration)
      .where(eq(eventScoringConfiguration.eventId, validatedData.eventId));
    
    let result;
    
    if (existingConfig.length > 0) {
      // Update existing configuration
      [result] = await db.update(eventScoringConfiguration)
        .set({ ...validatedData, updatedAt: new Date().toISOString() })
        .where(eq(eventScoringConfiguration.eventId, validatedData.eventId))
        .returning();
    } else {
      // Create new configuration
      [result] = await db.insert(eventScoringConfiguration)
        .values(validatedData)
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to save event scoring configuration:', error);
    res.status(500).json({ 
      error: 'Failed to save event scoring configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;