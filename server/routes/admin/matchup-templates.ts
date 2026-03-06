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

// Seed default common templates
router.post('/matchup-templates/seed-defaults', async (req, res) => {
  try {
    console.log('[Matchup Templates] Seeding default templates');

    // Check if any templates already exist to avoid duplicates
    const existing = await db.select().from(matchupTemplates).limit(1);

    const defaults = [
      {
        name: '4-Team Round Robin',
        description: 'All 4 teams play each other once (6 pool games). Best for single-bracket flights with 4 teams.',
        teamCount: 4,
        bracketStructure: 'single' as const,
        matchupPattern: [['A1','A2'],['A3','A4'],['A1','A3'],['A2','A4'],['A1','A4'],['A2','A3']],
        totalGames: 6,
        hasPlayoffGame: false,
        isActive: true,
      },
      {
        name: '4-Team Round Robin + Championship',
        description: 'All 4 teams play each other once (6 pool games), then top 2 teams by points play a championship final.',
        teamCount: 4,
        bracketStructure: 'single' as const,
        matchupPattern: [['A1','A2'],['A3','A4'],['A1','A3'],['A2','A4'],['A1','A4'],['A2','A3']],
        totalGames: 7,
        hasPlayoffGame: true,
        playoffDescription: '1st place vs 2nd place in points standings play a championship final',
        isActive: true,
      },
      {
        name: '6-Team Dual Pools',
        description: '2 pools of 3 teams. Round robin within each pool (3+3=6 games), then Pool A winner vs Pool B winner in championship.',
        teamCount: 6,
        bracketStructure: 'dual' as const,
        matchupPattern: [['A1','A2'],['A1','A3'],['A2','A3'],['B1','B2'],['B1','B3'],['B2','B3']],
        totalGames: 7,
        hasPlayoffGame: true,
        playoffDescription: 'Pool A winner vs Pool B winner in championship final',
        isActive: true,
      },
      {
        name: '6-Team Crossover',
        description: '2 pools of 3. Every Pool A team plays every Pool B team (9 crossover games) plus championship.',
        teamCount: 6,
        bracketStructure: 'crossover' as const,
        matchupPattern: [['A1','B1'],['A2','B2'],['A3','B3'],['A1','B2'],['A2','B3'],['A3','B1'],['A1','B3'],['A2','B1'],['A3','B2']],
        totalGames: 10,
        hasPlayoffGame: true,
        playoffDescription: 'Top team from each pool plays in championship final',
        isActive: true,
      },
      {
        name: '8-Team Dual Brackets',
        description: '2 brackets of 4 teams. Round robin within each bracket (6+6=12 games), then bracket winners play in championship.',
        teamCount: 8,
        bracketStructure: 'dual' as const,
        matchupPattern: [
          ['A1','A2'],['A3','A4'],['A1','A3'],['A2','A4'],['A1','A4'],['A2','A3'],
          ['B1','B2'],['B3','B4'],['B1','B3'],['B2','B4'],['B1','B4'],['B2','B3'],
        ],
        totalGames: 13,
        hasPlayoffGame: true,
        playoffDescription: 'Bracket A winner vs Bracket B winner in championship final',
        isActive: true,
      },
      {
        name: '3-Team Round Robin',
        description: 'All 3 teams play each other once (3 pool games). Simplest format for small brackets.',
        teamCount: 3,
        bracketStructure: 'single' as const,
        matchupPattern: [['A1','A2'],['A1','A3'],['A2','A3']],
        totalGames: 3,
        hasPlayoffGame: false,
        isActive: true,
      },
    ];

    // Filter out templates whose names already exist
    const existingNames = new Set(
      (await db.select({ name: matchupTemplates.name }).from(matchupTemplates)).map(t => t.name)
    );
    const toInsert = defaults.filter(d => !existingNames.has(d.name));

    if (toInsert.length === 0) {
      return res.json({ message: 'All default templates already exist', created: 0 });
    }

    const inserted = await db.insert(matchupTemplates).values(toInsert).returning();

    console.log(`[Matchup Templates] Seeded ${inserted.length} default templates`);
    res.status(201).json({ message: `Created ${inserted.length} default templates`, created: inserted.length, templates: inserted });
  } catch (error) {
    console.error('[Matchup Templates] Error seeding defaults:', error);
    res.status(500).json({
      error: 'Failed to seed default templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;