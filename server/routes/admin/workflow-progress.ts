import { Router } from 'express';
import { isAdmin } from '../../middleware/auth.js';
import { db } from '@db';
import { workflowProgress } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get workflow progress
router.get('/events/:eventId/workflow-progress', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type } = req.query;
    const workflowType = type as string || 'scheduling';

    const progress = await db.query.workflowProgress.findFirst({
      where: and(
        eq(workflowProgress.eventId, parseInt(eventId)),
        eq(workflowProgress.workflowType, workflowType)
      )
    });

    if (!progress) {
      return res.status(404).json({ error: 'No saved progress found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Failed to get workflow progress:', error);
    res.status(500).json({ error: 'Failed to load workflow progress' });
  }
});

// Save/update workflow progress
router.post('/events/:eventId/workflow-progress', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const progressData = req.body;

    // Check if progress already exists
    const existingProgress = await db.query.workflowProgress.findFirst({
      where: and(
        eq(workflowProgress.eventId, parseInt(eventId)),
        eq(workflowProgress.workflowType, progressData.workflowType)
      )
    });

    let result;
    if (existingProgress) {
      // Update existing progress
      result = await db.update(workflowProgress)
        .set({
          currentStep: progressData.currentStep,
          steps: JSON.stringify(progressData.steps),
          autoSaveEnabled: progressData.autoSaveEnabled,
          lastSaved: progressData.lastSaved,
          sessionId: progressData.sessionId,
          updatedAt: new Date()
        })
        .where(eq(workflowProgress.id, existingProgress.id))
        .returning();
    } else {
      // Create new progress record
      result = await db.insert(workflowProgress)
        .values({
          eventId: parseInt(eventId),
          workflowType: progressData.workflowType,
          currentStep: progressData.currentStep,
          steps: JSON.stringify(progressData.steps),
          autoSaveEnabled: progressData.autoSaveEnabled || true,
          lastSaved: progressData.lastSaved,
          sessionId: progressData.sessionId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }

    // Parse steps back to JSON for response
    const savedProgress = {
      ...result[0],
      steps: JSON.parse(result[0].steps as string)
    };

    res.json(savedProgress);
  } catch (error) {
    console.error('Failed to save workflow progress:', error);
    res.status(500).json({ error: 'Failed to save workflow progress' });
  }
});

// Delete workflow progress
router.delete('/events/:eventId/workflow-progress', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type } = req.query;
    const workflowType = type as string || 'scheduling';

    await db.delete(workflowProgress)
      .where(and(
        eq(workflowProgress.eventId, parseInt(eventId)),
        eq(workflowProgress.workflowType, workflowType)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workflow progress:', error);
    res.status(500).json({ error: 'Failed to delete workflow progress' });
  }
});

// Get all workflow sessions (for debugging/admin)
router.get('/events/:eventId/workflow-sessions', async (req, res) => {
  try {
    const { eventId } = req.params;

    const sessions = await db.query.workflowProgress.findMany({
      where: eq(workflowProgress.eventId, parseInt(eventId))
    });

    const formattedSessions = sessions.map((session: any) => ({
      ...session,
      steps: JSON.parse(session.steps as string)
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Failed to get workflow sessions:', error);
    res.status(500).json({ error: 'Failed to load workflow sessions' });
  }
});

// Delete workflow progress (start fresh)
router.delete('/events/:eventId/workflow-progress', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type } = req.query;
    const workflowType = type as string || 'scheduling';

    await db.delete(workflowProgress)
      .where(and(
        eq(workflowProgress.eventId, parseInt(eventId)),
        eq(workflowProgress.workflowType, workflowType)
      ));

    res.json({ success: true, message: 'Workflow progress cleared successfully' });
  } catch (error) {
    console.error('Failed to clear workflow progress:', error);
    res.status(500).json({ error: 'Failed to clear workflow progress' });
  }
});

export default router;