import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { eventScoringRules, events } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAdmin);

// Get scoring rules for an event
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Scoring Rules] Fetching rules for event ${eventId}`);
    
    // Check if event exists
    const event = await db
      .select({ id: events.id, name: events.name })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    
    if (!event.length) {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The specified event does not exist.'
      });
    }
    
    // Get scoring rules
    const rules = await db
      .select()
      .from(eventScoringRules)
      .where(eq(eventScoringRules.eventId, eventId))
      .orderBy(eventScoringRules.createdAt);
    
    console.log(`[Scoring Rules] Found ${rules.length} scoring rules for event ${eventId}`);
    
    res.json({
      success: true,
      event: event[0],
      rules: rules.map(rule => ({
        id: rule.id,
        title: rule.title,
        systemType: rule.systemType,
        scoring: {
          win: rule.win,
          loss: rule.loss,
          tie: rule.tie,
          shutout: rule.shutout,
          goalScored: rule.goalScored,
          goalCap: rule.goalCap,
          redCard: rule.redCard,
          yellowCard: rule.yellowCard
        },
        tiebreakers: {
          position1: rule.tiebreaker1,
          position2: rule.tiebreaker2,
          position3: rule.tiebreaker3,
          position4: rule.tiebreaker4,
          position5: rule.tiebreaker5,
          position6: rule.tiebreaker6,
          position7: rule.tiebreaker7,
          position8: rule.tiebreaker8
        },
        isActive: rule.isActive,
        createdAt: rule.createdAt
      }))
    });
    
  } catch (error) {
    console.error('[Scoring Rules] Error fetching rules:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scoring rules',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Create or update scoring rules for an event
router.post('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { 
      title,
      systemType,
      scoring,
      tiebreakers,
      isActive = true 
    } = req.body;
    
    console.log(`[Scoring Rules] Creating/updating rules for event ${eventId}`);
    
    // Validate required fields
    if (!title || !systemType || !scoring || !tiebreakers) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, systemType, scoring, and tiebreakers are required.'
      });
    }
    
    // Check if event exists
    const event = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    
    if (!event.length) {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The specified event does not exist.'
      });
    }
    
    // If setting as active, deactivate other rules first
    if (isActive) {
      await db
        .update(eventScoringRules)
        .set({ isActive: false })
        .where(eq(eventScoringRules.eventId, eventId));
      
      console.log(`[Scoring Rules] Deactivated existing rules for event ${eventId}`);
    }
    
    // Create new scoring rule
    const [newRule] = await db
      .insert(eventScoringRules)
      .values({
        eventId,
        title,
        systemType,
        win: scoring.win,
        loss: scoring.loss,
        tie: scoring.tie,
        shutout: scoring.shutout || 0,
        goalScored: scoring.goalScored || 0,
        goalCap: scoring.goalCap || 3,
        redCard: scoring.redCard || 0,
        yellowCard: scoring.yellowCard || 0,
        tiebreaker1: tiebreakers.position1,
        tiebreaker2: tiebreakers.position2,
        tiebreaker3: tiebreakers.position3,
        tiebreaker4: tiebreakers.position4,
        tiebreaker5: tiebreakers.position5,
        tiebreaker6: tiebreakers.position6,
        tiebreaker7: tiebreakers.position7,
        tiebreaker8: tiebreakers.position8,
        isActive
      })
      .returning();
    
    console.log(`[Scoring Rules] Created scoring rule ${newRule.id} for event ${eventId}`);
    
    res.json({
      success: true,
      message: 'Scoring rules created successfully',
      rule: {
        id: newRule.id,
        title: newRule.title,
        systemType: newRule.systemType,
        isActive: newRule.isActive
      }
    });
    
  } catch (error) {
    console.error('[Scoring Rules] Error creating rules:', error);
    res.status(500).json({ 
      error: 'Failed to create scoring rules',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Update scoring rules
router.put('/:eventId/:ruleId', async (req: Request, res: Response) => {
  try {
    const { eventId, ruleId } = req.params;
    const { 
      title,
      systemType,
      scoring,
      tiebreakers,
      isActive 
    } = req.body;
    
    console.log(`[Scoring Rules] Updating rule ${ruleId} for event ${eventId}`);
    
    // Check if rule exists
    const existingRule = await db
      .select()
      .from(eventScoringRules)
      .where(and(
        eq(eventScoringRules.id, parseInt(ruleId)),
        eq(eventScoringRules.eventId, eventId)
      ))
      .limit(1);
    
    if (!existingRule.length) {
      return res.status(404).json({ 
        error: 'Scoring rule not found',
        message: 'The specified scoring rule does not exist.'
      });
    }
    
    // If setting as active, deactivate other rules first
    if (isActive) {
      await db
        .update(eventScoringRules)
        .set({ isActive: false })
        .where(eq(eventScoringRules.eventId, eventId));
    }
    
    // Update the rule
    const [updatedRule] = await db
      .update(eventScoringRules)
      .set({
        title: title || existingRule[0].title,
        systemType: systemType || existingRule[0].systemType,
        win: scoring?.win ?? existingRule[0].win,
        loss: scoring?.loss ?? existingRule[0].loss,
        tie: scoring?.tie ?? existingRule[0].tie,
        shutout: scoring?.shutout ?? existingRule[0].shutout,
        goalScored: scoring?.goalScored ?? existingRule[0].goalScored,
        goalCap: scoring?.goalCap ?? existingRule[0].goalCap,
        redCard: scoring?.redCard ?? existingRule[0].redCard,
        yellowCard: scoring?.yellowCard ?? existingRule[0].yellowCard,
        tiebreaker1: tiebreakers?.position1 || existingRule[0].tiebreaker1,
        tiebreaker2: tiebreakers?.position2 || existingRule[0].tiebreaker2,
        tiebreaker3: tiebreakers?.position3 || existingRule[0].tiebreaker3,
        tiebreaker4: tiebreakers?.position4 || existingRule[0].tiebreaker4,
        tiebreaker5: tiebreakers?.position5 || existingRule[0].tiebreaker5,
        tiebreaker6: tiebreakers?.position6 || existingRule[0].tiebreaker6,
        tiebreaker7: tiebreakers?.position7 || existingRule[0].tiebreaker7,
        tiebreaker8: tiebreakers?.position8 || existingRule[0].tiebreaker8,
        isActive: isActive ?? existingRule[0].isActive
      })
      .where(eq(eventScoringRules.id, parseInt(ruleId)))
      .returning();
    
    console.log(`[Scoring Rules] Updated scoring rule ${ruleId} for event ${eventId}`);
    
    res.json({
      success: true,
      message: 'Scoring rules updated successfully',
      rule: {
        id: updatedRule.id,
        title: updatedRule.title,
        systemType: updatedRule.systemType,
        isActive: updatedRule.isActive
      }
    });
    
  } catch (error) {
    console.error('[Scoring Rules] Error updating rules:', error);
    res.status(500).json({ 
      error: 'Failed to update scoring rules',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Delete scoring rules
router.delete('/:eventId/:ruleId', async (req: Request, res: Response) => {
  try {
    const { eventId, ruleId } = req.params;
    
    console.log(`[Scoring Rules] Deleting rule ${ruleId} for event ${eventId}`);
    
    // Check if rule exists
    const existingRule = await db
      .select()
      .from(eventScoringRules)
      .where(and(
        eq(eventScoringRules.id, parseInt(ruleId)),
        eq(eventScoringRules.eventId, eventId)
      ))
      .limit(1);
    
    if (!existingRule.length) {
      return res.status(404).json({ 
        error: 'Scoring rule not found',
        message: 'The specified scoring rule does not exist.'
      });
    }
    
    // Delete the rule
    await db
      .delete(eventScoringRules)
      .where(eq(eventScoringRules.id, parseInt(ruleId)));
    
    console.log(`[Scoring Rules] Deleted scoring rule ${ruleId} for event ${eventId}`);
    
    res.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });
    
  } catch (error) {
    console.error('[Scoring Rules] Error deleting rule:', error);
    res.status(500).json({ 
      error: 'Failed to delete scoring rule',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get available tiebreaker options  
router.get('/:eventId/tiebreaker-options', async (req: Request, res: Response) => {
  try {
    const tiebreakerOptions = [
      { value: 'total_points', label: 'Total Points', description: 'Total points earned from wins, ties, and bonuses' },
      { value: 'head_to_head', label: 'Head-to-Head Record', description: 'Direct matchup results between tied teams' },
      { value: 'goal_differential', label: 'Goal Differential', description: 'Goals scored minus goals allowed' },
      { value: 'goals_scored', label: 'Goals Scored', description: 'Total goals scored (higher is better)' },
      { value: 'goals_allowed', label: 'Goals Allowed', description: 'Total goals allowed (lower is better)' },
      { value: 'shutouts', label: 'Shutouts', description: 'Number of games where opponent scored zero goals' },
      { value: 'fair_play', label: 'Fair Play Points', description: 'Penalty points from cards (lower is better)' },
      { value: 'coin_toss', label: 'Random/Coin Toss', description: 'Random determination for final tiebreaker' }
    ];
    
    res.json({
      success: true,
      options: tiebreakerOptions
    });
    
  } catch (error) {
    console.error('[Scoring Rules] Error fetching tiebreaker options:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tiebreaker options',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;