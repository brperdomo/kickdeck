import express from 'express';
import { db } from '@db';
import { matchupTemplates } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Simple Template Validation Endpoint
 * Basic template field verification
 */
router.post('/verify-template/:templateId', async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId, 10);
    const { teamCount, bracketStructure } = req.body;

    console.log(`[Template Verification] Testing template ${templateId} with ${teamCount} teams, ${bracketStructure} structure`);

    // Get template from database
    const template = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, templateId))
      .limit(1);

    if (!template.length) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const templateData = template[0];

    // Basic field verification
    const verification = {
      templateId,
      templateName: templateData.name,
      teamCount: {
        expected: teamCount,
        actual: templateData.teamCount,
        match: teamCount === templateData.teamCount,
        test: teamCount === templateData.teamCount ? "PASS" : "FAIL"
      },
      bracketStructure: {
        expected: bracketStructure,
        actual: templateData.bracketStructure,
        match: bracketStructure === templateData.bracketStructure,
        test: bracketStructure === templateData.bracketStructure ? "PASS" : "FAIL"
      },
      templateStatus: {
        isActive: templateData.isActive,
        hasPlayoffGame: templateData.hasPlayoffGame,
        totalGames: templateData.totalGames
      },
      overallTest: (teamCount === templateData.teamCount && 
                    bracketStructure === templateData.bracketStructure) ? "PASS" : "FAIL"
    };

    console.log(`[Template Verification] Result: ${verification.overallTest}`);
    res.json(verification);

  } catch (error) {
    console.error('[Template Verification] Error:', error);
    res.status(500).json({
      error: 'Template verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Template Summary Endpoint
 * Get all templates with basic info
 */
router.get('/template-summary', async (req, res) => {
  try {
    console.log('[Template Summary] Fetching all templates...');
    
    const templates = await db
      .select({
        id: matchupTemplates.id,
        name: matchupTemplates.name,
        description: matchupTemplates.description,
        teamCount: matchupTemplates.teamCount,
        bracketStructure: matchupTemplates.bracketStructure,
        totalGames: matchupTemplates.totalGames,
        hasPlayoffGame: matchupTemplates.hasPlayoffGame,
        isActive: matchupTemplates.isActive
      })
      .from(matchupTemplates)
      .where(eq(matchupTemplates.isActive, true));

    const summary = {
      totalTemplates: templates.length,
      teamCountDistribution: templates.reduce((acc: Record<number, number>, t) => {
        acc[t.teamCount] = (acc[t.teamCount] || 0) + 1;
        return acc;
      }, {}),
      bracketStructureDistribution: templates.reduce((acc: Record<string, number>, t) => {
        acc[t.bracketStructure] = (acc[t.bracketStructure] || 0) + 1;
        return acc;
      }, {}),
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        teamCount: t.teamCount,
        bracketStructure: t.bracketStructure,
        totalGames: t.totalGames,
        hasPlayoff: t.hasPlayoffGame
      }))
    };

    console.log(`[Template Summary] Found ${templates.length} active templates`);
    res.json(summary);

  } catch (error) {
    console.error('[Template Summary] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch template summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;