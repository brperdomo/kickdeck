import express from 'express';
import { db } from '@db';
import { matchupTemplates, insertMatchupTemplateSchema } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Function to detect team count from matchup patterns
function detectTeamCountFromPattern(matchupPattern: any): number {
  const teamSet = new Set<string>();
  
  // Handle different data formats
  let patterns: string[] = [];
  
  if (Array.isArray(matchupPattern)) {
    // Direct array format like [["A1", "A2"], ["A3", "A4"]]
    if (matchupPattern.length > 0 && Array.isArray(matchupPattern[0])) {
      patterns = matchupPattern.map((pair: string[]) => `${pair[0]} vs ${pair[1]}`);
    } else {
      // String array format like ["A1 vs A2", "A3 vs A4"]
      patterns = matchupPattern as string[];
    }
  } else if (typeof matchupPattern === 'string') {
    try {
      const parsed = JSON.parse(matchupPattern);
      patterns = Array.isArray(parsed) ? parsed : [];
    } catch {
      patterns = [matchupPattern];
    }
  }
  
  patterns.forEach(matchup => {
    // Split by "vs" and extract team identifiers
    const teams = matchup.split(' vs ');
    teams.forEach(team => {
      const trimmedTeam = team.trim();
      // Extract team identifier patterns: A1, B3, T1, H1, Q1W, etc.
      // Skip TBD, Champion, Third, Winner as these are placeholders
      if (!['TBD', 'Champion1', 'Champion2', 'Third1', 'Third2'].includes(trimmedTeam) && 
          !trimmedTeam.includes('Winner') && !trimmedTeam.includes('W1W') && !trimmedTeam.includes('W2W')) {
        
        const match = trimmedTeam.match(/([A-Z])(\d+)/);
        if (match) {
          teamSet.add(`${match[1]}${match[2]}`);
        } else if (trimmedTeam.match(/^T\d+$/)) {
          // Handle T1, T2, T3, T4, etc.
          teamSet.add(trimmedTeam);
        } else if (trimmedTeam.match(/^[HL]\d+$/)) {
          // Handle H1, H2, L1, L2, etc.
          teamSet.add(trimmedTeam);
        }
      }
    });
  });
  
  return teamSet.size;
}

const router = express.Router();

// Get all matchup templates
router.get('/matchup-templates', async (req, res) => {
  try {
    console.log('[Matchup Templates] Fetching all templates');
    
    const templates = await db
      .select()
      .from(matchupTemplates)
      .orderBy(desc(matchupTemplates.createdAt));

    // Add dynamic team count detection for each template
    const enhancedTemplates = templates.map(template => {
      let detectedTeamCount = template.teamCount;
      
      // Try to detect team count from matchup pattern if available
      if (template.matchupPattern && Array.isArray(template.matchupPattern)) {
        try {
          const dynamicCount = detectTeamCountFromPattern(template.matchupPattern);
          if (dynamicCount > 0) {
            detectedTeamCount = dynamicCount;
            console.log(`[Matchup Templates] Template "${template.name}": detected ${dynamicCount} teams from pattern`);
          }
        } catch (error) {
          console.warn(`[Matchup Templates] Could not detect team count for template "${template.name}":`, error);
        }
      }
      
      return {
        ...template,
        teamCount: detectedTeamCount
      };
    });

    console.log(`[Matchup Templates] Found ${enhancedTemplates.length} templates with dynamic team detection`);
    res.json(enhancedTemplates);
  } catch (error) {
    console.error('[Matchup Templates] Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matchup templates',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get matchup template by ID
router.get('/matchup-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Fetching template ${id}`);
    
    const template = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, id))
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[Matchup Templates] Found template: ${template[0].name}`);
    res.json(template[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error fetching template:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Create new matchup template
router.post('/matchup-templates', async (req, res) => {
  try {
    console.log('[Matchup Templates] Creating new template:', req.body);
    
    // Validate request body
    const validatedData = insertMatchupTemplateSchema.parse(req.body);
    
    const newTemplate = await db
      .insert(matchupTemplates)
      .values(validatedData)
      .returning();

    console.log(`[Matchup Templates] Created template: ${newTemplate[0].name} (ID: ${newTemplate[0].id})`);
    res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error creating template:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update matchup template
router.put('/matchup-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Updating template ${id}:`, req.body);
    
    // Validate request body
    const validatedData = insertMatchupTemplateSchema.parse(req.body);
    
    const updatedTemplate = await db
      .update(matchupTemplates)
      .set({ ...validatedData, updatedAt: new Date().toISOString() })
      .where(eq(matchupTemplates.id, id))
      .returning();

    if (updatedTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[Matchup Templates] Updated template: ${updatedTemplate[0].name}`);
    res.json(updatedTemplate[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error updating template:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete matchup template
router.delete('/matchup-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Deleting template ${id}`);
    
    const deletedTemplate = await db
      .delete(matchupTemplates)
      .where(eq(matchupTemplates.id, id))
      .returning();

    if (deletedTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[Matchup Templates] Deleted template: ${deletedTemplate[0].name}`);
    res.json({ message: 'Template deleted successfully', template: deletedTemplate[0] });
  } catch (error) {
    console.error('[Matchup Templates] Error deleting template:', error);
    res.status(500).json({ 
      error: 'Failed to delete matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Clone matchup template
router.post('/matchup-templates/:id/clone', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Cloning template ${id}`);
    
    // Fetch original template
    const originalTemplate = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, id))
      .limit(1);

    if (originalTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = originalTemplate[0];
    
    // Create clone with new name
    const cloneData = {
      name: `${template.name} (Copy)`,
      description: template.description || '',
      teamCount: template.teamCount,
      bracketStructure: template.bracketStructure,
      matchupPattern: template.matchupPattern,
      totalGames: template.totalGames,
      hasPlayoffGame: template.hasPlayoffGame,
      playoffDescription: template.playoffDescription,
      isActive: true,
    };

    const clonedTemplate = await db
      .insert(matchupTemplates)
      .values(cloneData)
      .returning();

    console.log(`[Matchup Templates] Cloned template: ${clonedTemplate[0].name} (ID: ${clonedTemplate[0].id})`);
    res.status(201).json(clonedTemplate[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error cloning template:', error);
    res.status(500).json({ 
      error: 'Failed to clone matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;