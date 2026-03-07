import { Router } from 'express';
import { HelpCenterService } from '../../services/help-center-service';
import { db } from '../../../db';
import { organizationSettings } from '../../../db/schema';

const router = Router();

/** Helper: get the first org's ID for multi-tenant key lookup */
async function getOrgId(): Promise<number | undefined> {
  try {
    const [org] = await db.select({ id: organizationSettings.id }).from(organizationSettings).limit(1);
    return org?.id;
  } catch { return undefined; }
}

/**
 * POST /api/admin/help-center/chat
 * Send a message to the Help Center AI chatbot.
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, currentPage } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use provided sessionId or generate a new one
    const activeSessionId = sessionId || HelpCenterService.generateSessionId();

    const orgId = await getOrgId();
    const result = await HelpCenterService.chat(activeSessionId, message, currentPage, orgId);

    res.json({
      response: result.response,
      sessionId: result.sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Help Center API] Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Failed to process help center message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/help-center/clear
 * Clear conversation history for a session.
 */
router.post('/clear', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    await HelpCenterService.clearConversation(sessionId);

    res.json({ success: true });
  } catch (error) {
    console.error('[Help Center API] Error clearing conversation:', error);
    res.status(500).json({
      error: 'Failed to clear conversation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/help-center/history
 * Get conversation history for a session.
 */
router.get('/history', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const messages = await HelpCenterService.loadConversationHistory(sessionId);

    // Filter out system messages before returning to the client
    const clientMessages = messages.filter((m) => m.role !== 'system');

    res.json({ messages: clientMessages, sessionId });
  } catch (error) {
    console.error('[Help Center API] Error loading history:', error);
    res.status(500).json({
      error: 'Failed to load conversation history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
