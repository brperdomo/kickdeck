import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { gameFormats, matchupTemplates, events } from '@db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

// ✅ TOURNAMENT FORMAT CONFIGURATION API
// Provides comprehensive backend for FormatSettings component

// Get all tournament format templates
router.get('/events/:eventId/format-templates', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[FORMAT TEMPLATES] Fetching templates for event: ${eventId}`);
    
    // Fetch all available matchup templates
    const templates = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.isActive, true))
      .orderBy(desc(matchupTemplates.createdAt));
    
    console.log(`[FORMAT TEMPLATES] Found ${templates.length} active templates`);
    
    res.json({
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        teamCount: template.teamCount,
        bracketStructure: template.bracketStructure,
        matchupPattern: template.matchupPattern ? JSON.parse(template.matchupPattern as string) : [],
        totalGames: template.totalGames,
        hasPlayoffGame: template.hasPlayoffGame,
        playoffDescription: template.playoffDescription,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }))
    });
    
  } catch (error: any) {
    console.error('[FORMAT TEMPLATES] Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch format templates',
      details: error.message 
    });
  }
});

// Create new tournament format template
router.post('/events/:eventId/format-templates', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      name, 
      description, 
      teamCount, 
      bracketStructure, 
      matchupPattern, 
      totalGames, 
      hasPlayoffGame, 
      playoffDescription 
    } = req.body;
    
    console.log(`[FORMAT TEMPLATES] Creating new template for event: ${eventId}`);
    console.log(`[FORMAT TEMPLATES] Template data:`, { name, teamCount, bracketStructure });
    
    // Validate required fields
    if (!name || !teamCount || !bracketStructure) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, teamCount, bracketStructure'
      });
    }
    
    // Insert new template
    const [newTemplate] = await db
      .insert(matchupTemplates)
      .values({
        name,
        description: description || '',
        teamCount: parseInt(teamCount),
        bracketStructure,
        matchupPattern: JSON.stringify(matchupPattern || []),
        totalGames: parseInt(totalGames) || 0,
        hasPlayoffGame: hasPlayoffGame || false,
        playoffDescription: playoffDescription || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    
    console.log(`[FORMAT TEMPLATES] Created template with ID: ${newTemplate.id}`);
    
    res.json({
      success: true,
      template: {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        teamCount: newTemplate.teamCount,
        bracketStructure: newTemplate.bracketStructure,
        matchupPattern: newTemplate.matchupPattern ? JSON.parse(newTemplate.matchupPattern as string) : [],
        totalGames: newTemplate.totalGames,
        hasPlayoffGame: newTemplate.hasPlayoffGame,
        playoffDescription: newTemplate.playoffDescription,
        isActive: newTemplate.isActive,
        createdAt: newTemplate.createdAt,
        updatedAt: newTemplate.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('[FORMAT TEMPLATES] Creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create format template',
      details: error.message 
    });
  }
});

// Update tournament format template
router.put('/events/:eventId/format-templates/:templateId', isAdmin, async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    const { 
      name, 
      description, 
      teamCount, 
      bracketStructure, 
      matchupPattern, 
      totalGames, 
      hasPlayoffGame, 
      playoffDescription,
      isActive 
    } = req.body;
    
    console.log(`[FORMAT TEMPLATES] Updating template ${templateId} for event: ${eventId}`);
    
    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, parseInt(templateId)))
      .limit(1);
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Update template
    const [updatedTemplate] = await db
      .update(matchupTemplates)
      .set({
        name: name || existingTemplate[0].name,
        description: description || existingTemplate[0].description,
        teamCount: teamCount ? parseInt(teamCount) : existingTemplate[0].teamCount,
        bracketStructure: bracketStructure || existingTemplate[0].bracketStructure,
        matchupPattern: matchupPattern ? JSON.stringify(matchupPattern) : existingTemplate[0].matchupPattern,
        totalGames: totalGames ? parseInt(totalGames) : existingTemplate[0].totalGames,
        hasPlayoffGame: hasPlayoffGame !== undefined ? hasPlayoffGame : existingTemplate[0].hasPlayoffGame,
        playoffDescription: playoffDescription !== undefined ? playoffDescription : existingTemplate[0].playoffDescription,
        isActive: isActive !== undefined ? isActive : existingTemplate[0].isActive,
        updatedAt: new Date().toISOString()
      })
      .where(eq(matchupTemplates.id, parseInt(templateId)))
      .returning();
    
    console.log(`[FORMAT TEMPLATES] Updated template ${templateId} successfully`);
    
    res.json({
      success: true,
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        teamCount: updatedTemplate.teamCount,
        bracketStructure: updatedTemplate.bracketStructure,
        matchupPattern: updatedTemplate.matchupPattern ? JSON.parse(updatedTemplate.matchupPattern as string) : [],
        totalGames: updatedTemplate.totalGames,
        hasPlayoffGame: updatedTemplate.hasPlayoffGame,
        playoffDescription: updatedTemplate.playoffDescription,
        isActive: updatedTemplate.isActive,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('[FORMAT TEMPLATES] Update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update format template',
      details: error.message 
    });
  }
});

// Delete tournament format template
router.delete('/events/:eventId/format-templates/:templateId', isAdmin, async (req, res) => {
  try {
    const { eventId, templateId } = req.params;
    
    console.log(`[FORMAT TEMPLATES] Deleting template ${templateId} for event: ${eventId}`);
    
    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, parseInt(templateId)))
      .limit(1);
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Soft delete (set isActive to false)
    await db
      .update(matchupTemplates)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(matchupTemplates.id, parseInt(templateId)));
    
    console.log(`[FORMAT TEMPLATES] Template ${templateId} deactivated successfully`);
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
    
  } catch (error: any) {
    console.error('[FORMAT TEMPLATES] Deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete format template',
      details: error.message 
    });
  }
});

// Get game formats for a specific event
router.get('/events/:eventId/game-formats', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[GAME FORMATS] Fetching formats for event: ${eventId}`);
    
    // Fetch game formats for the event
    const formats = await db
      .select()
      .from(gameFormats)
      .orderBy(desc(gameFormats.createdAt));
    
    console.log(`[GAME FORMATS] Found ${formats.length} formats for event`);
    
    res.json({
      success: true,
      formats: formats
    });
    
  } catch (error: any) {
    console.error('[GAME FORMATS] Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch game formats',
      details: error.message 
    });
  }
});

// Get tournament-specific configurations (placeholder for future expansion)
router.get('/events/:eventId/configurations', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[TOURNAMENT CONFIG] Fetching configurations for event: ${eventId}`);
    
    // Return basic configuration info
    res.json({
      success: true,
      configurations: {
        eventId: parseInt(eventId),
        templatesAvailable: true,
        formatsConfigurable: true
      }
    });
    
  } catch (error: any) {
    console.error('[TOURNAMENT CONFIG] Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tournament configurations',
      details: error.message 
    });
  }
});

export default router;