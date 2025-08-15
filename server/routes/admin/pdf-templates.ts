import { Router } from 'express';
import { db } from '../../../db';
import { pdfTemplates } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, requirePermission } from '../../middleware/auth';

const router = Router();

// GET /api/admin/events/:eventId/pdf-templates - Get all PDF templates for an event
router.get('/:eventId', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[PDF Templates] Fetching templates for event ${eventId}`);

    const templates = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.eventId, eventId))
      .orderBy(pdfTemplates.updatedAt);

    console.log(`[PDF Templates] Found ${templates.length} templates`);
    
    res.json(templates);
  } catch (error) {
    console.error('[PDF Templates] Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch PDF templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/events/:eventId/pdf-templates - Create new PDF template
router.post('/:eventId', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const templateData = req.body;
    
    console.log(`[PDF Templates] Creating template for event ${eventId}:`, templateData.name);

    const [newTemplate] = await db
      .insert(pdfTemplates)
      .values({
        id: templateData.id || `template_${Date.now()}`,
        eventId: eventId,
        name: templateData.name,
        description: templateData.description || '',
        pageWidth: templateData.pageWidth || 210,
        pageHeight: templateData.pageHeight || 297,
        elements: JSON.stringify(templateData.elements || []),
        backgroundColor: templateData.backgroundColor || '#ffffff',
        createdBy: req.user?.id,
        updatedBy: req.user?.id
      })
      .returning();

    console.log(`[PDF Templates] Template created with ID:`, newTemplate.id);
    
    res.json(newTemplate);
  } catch (error) {
    console.error('[PDF Templates] Error creating template:', error);
    res.status(500).json({ 
      error: 'Failed to create PDF template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/events/:eventId/pdf-templates/:templateId - Update PDF template
router.put('/:eventId/:templateId', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    const templateData = req.body;
    
    console.log(`[PDF Templates] Updating template ${templateId} for event ${eventId}`);

    const [updatedTemplate] = await db
      .update(pdfTemplates)
      .set({
        name: templateData.name,
        description: templateData.description,
        pageWidth: templateData.pageWidth,
        pageHeight: templateData.pageHeight,
        elements: JSON.stringify(templateData.elements),
        backgroundColor: templateData.backgroundColor,
        updatedBy: req.user?.id,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(pdfTemplates.id, templateId),
        eq(pdfTemplates.eventId, eventId)
      ))
      .returning();

    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[PDF Templates] Template updated successfully`);
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('[PDF Templates] Error updating template:', error);
    res.status(500).json({ 
      error: 'Failed to update PDF template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/events/:eventId/pdf-templates/:templateId - Delete PDF template
router.delete('/:eventId/:templateId', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    
    console.log(`[PDF Templates] Deleting template ${templateId} for event ${eventId}`);

    const [deletedTemplate] = await db
      .delete(pdfTemplates)
      .where(and(
        eq(pdfTemplates.id, templateId),
        eq(pdfTemplates.eventId, eventId)
      ))
      .returning();

    if (!deletedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[PDF Templates] Template deleted successfully`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[PDF Templates] Error deleting template:', error);
    res.status(500).json({ 
      error: 'Failed to delete PDF template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/events/:eventId/pdf-templates/:templateId/generate - Generate PDF using template
router.post('/:eventId/:templateId/generate', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    const { gameIds, includeAllGames } = req.body;
    
    console.log(`[PDF Templates] Generating PDFs using template ${templateId} for event ${eventId}`);

    // Get the template
    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(and(
        eq(pdfTemplates.id, templateId),
        eq(pdfTemplates.eventId, eventId)
      ));

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get games data from the public endpoint
    let gamesData;
    try {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      const gamesResponse = await fetch(`${baseUrl}/api/public/game-cards/${eventId}`);
      
      if (!gamesResponse.ok) {
        throw new Error('Failed to fetch games data');
      }
      
      gamesData = await gamesResponse.json();
    } catch (error) {
      console.error('[PDF Templates] Error fetching games data:', error);
      return res.status(500).json({ error: 'Failed to fetch games data' });
    }

    // Filter games if specific game IDs provided
    if (gameIds && gameIds.length > 0) {
      gamesData = gamesData.filter((game: any) => gameIds.includes(game.id));
    }

    console.log(`[PDF Templates] Generating PDFs for ${gamesData.length} games`);

    // Return generation job status (in a real implementation, this would be a background job)
    res.json({
      success: true,
      templateId,
      gameCount: gamesData.length,
      status: 'ready',
      downloadUrl: `/api/admin/events/${eventId}/pdf-templates/${templateId}/download?games=${gamesData.map((g: any) => g.id).join(',')}`
    });

  } catch (error) {
    console.error('[PDF Templates] Error generating PDFs:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDFs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;