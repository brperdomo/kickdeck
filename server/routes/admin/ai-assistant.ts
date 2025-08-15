import { Router } from 'express';
import { aiAssistant } from '../../services/ai-assistant';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Chat endpoint for AI assistant
router.post('/chat', isAdmin, async (req, res) => {
  try {
    const { message, eventId, context } = req.body;
    const userId = (req.session as any).user?.id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const response = await aiAssistant.processMessage(
      message,
      userId,
      eventId,
      context
    );

    res.json(response);
  } catch (error) {
    console.error('[AI Assistant API] Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate scheduling suggestions
router.post('/scheduling-suggestions', isAdmin, async (req, res) => {
  try {
    const { eventId, constraints } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const response = await aiAssistant.generateSchedulingSuggestions(
      eventId,
      constraints || {}
    );

    res.json(response);
  } catch (error) {
    console.error('[AI Assistant API] Error generating scheduling suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate scheduling suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze conflicts
router.post('/analyze-conflicts', isAdmin, async (req, res) => {
  try {
    const { games, fields, teams } = req.body;

    if (!games || !fields || !teams) {
      return res.status(400).json({ 
        error: 'Games, fields, and teams data are required' 
      });
    }

    const response = await aiAssistant.analyzeConflicts(games, fields, teams);

    res.json(response);
  } catch (error) {
    console.error('[AI Assistant API] Error analyzing conflicts:', error);
    res.status(500).json({ 
      error: 'Failed to analyze conflicts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear conversation history
router.post('/clear-conversation', isAdmin, async (req, res) => {
  try {
    aiAssistant.clearConversation();
    res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    console.error('[AI Assistant API] Error clearing conversation:', error);
    res.status(500).json({ 
      error: 'Failed to clear conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get conversation history
router.get('/conversation-history', isAdmin, async (req, res) => {
  try {
    const history = aiAssistant.getConversationHistory();
    res.json({ history });
  } catch (error) {
    console.error('[AI Assistant API] Error getting conversation history:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;