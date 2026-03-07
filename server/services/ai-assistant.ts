import OpenAI from 'openai';
import { db } from '@db';
import { aiAuditLog } from '@db/schema';
import { getOpenAIClient } from './openai-client-factory';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  success: boolean;
  message: string;
  actions?: any[];
  error?: string;
}

export class AIAssistant {
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    // Initialize with system context about tournament management
    this.conversationHistory.push({
      role: 'system',
      content: `You are an AI assistant for a tournament management system. You help tournament directors with:
      
1. Scheduling games and managing tournament brackets
2. Team assignment and flight configuration  
3. Field management and conflict resolution
4. Tournament format selection and optimization
5. Real-time schedule adjustments

You have access to:
- Game scheduling APIs
- Team and bracket management
- Field availability systems
- Conflict detection algorithms

Respond concisely and suggest specific actions when possible. Always confirm actions before executing them.`
    });
  }

  async processMessage(
    userMessage: string,
    userId: number,
    eventId?: string,
    context?: any,
    orgId?: number
  ): Promise<AIResponse> {
    const openai = await getOpenAIClient(orgId);
    if (!openai) {
      return { success: false, message: 'AI assistant is not configured. Add an OpenAI API key in Settings → AI Configuration.', error: 'No API key configured' };
    }
    try {
      // Add user message to conversation
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Prepare context for the AI
      let contextString = '';
      if (context) {
        contextString = `\n\nCurrent tournament context: ${JSON.stringify(context, null, 2)}`;
      }

      // Get AI response
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          ...this.conversationHistory,
          {
            role: 'user',
            content: userMessage + contextString
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const aiMessage = response.choices[0].message.content;
      
      // Parse AI response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(aiMessage || '{}');
      } catch (e) {
        parsedResponse = { message: aiMessage, actions: [] };
      }

      // Add AI response to conversation
      this.conversationHistory.push({
        role: 'assistant',
        content: aiMessage || 'I apologize, but I encountered an error processing your request.'
      });

      // Log the interaction
      await this.logInteraction(
        userId,
        userMessage,
        aiMessage || '',
        eventId ? parseInt(eventId) : null,
        context
      );

      return {
        success: true,
        message: parsedResponse.message || aiMessage,
        actions: parsedResponse.actions || []
      };

    } catch (error) {
      console.error('[AI Assistant] Error processing message:', error);
      
      return {
        success: false,
        message: 'I encountered an error processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateSchedulingSuggestions(
    eventId: string,
    constraints: any,
    orgId?: number
  ): Promise<AIResponse> {
    try {
      const openai = await getOpenAIClient(orgId);
      if (!openai) {
        return { success: false, message: 'AI not configured. Add an OpenAI API key in Settings → AI Configuration.', error: 'No API key' };
      }
      const prompt = `Analyze the following tournament scheduling constraints and provide optimization suggestions:

Event ID: ${eventId}
Constraints: ${JSON.stringify(constraints, null, 2)}

Please provide specific recommendations for:
1. Game scheduling optimization
2. Field utilization improvements  
3. Rest period optimization
4. Conflict resolution

Respond in JSON format with:
{
  "message": "summary of recommendations",
  "actions": [
    {
      "type": "scheduling_suggestion",
      "description": "action description",
      "priority": "high|medium|low",
      "parameters": {}
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'system',
            content: 'You are an expert tournament scheduling optimizer. Analyze constraints and provide actionable recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const aiMessage = response.choices[0].message.content;
      const parsedResponse = JSON.parse(aiMessage || '{}');

      return {
        success: true,
        message: parsedResponse.message,
        actions: parsedResponse.actions || []
      };

    } catch (error) {
      console.error('[AI Assistant] Error generating scheduling suggestions:', error);
      return {
        success: false,
        message: 'Failed to generate scheduling suggestions',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async analyzeConflicts(
    games: any[],
    fields: any[],
    teams: any[],
    orgId?: number
  ): Promise<AIResponse> {
    try {
      const openai = await getOpenAIClient(orgId);
      if (!openai) {
        return { success: false, message: 'AI not configured. Add an OpenAI API key in Settings → AI Configuration.', error: 'No API key' };
      }
      const prompt = `Analyze the following tournament data for scheduling conflicts:

Games: ${JSON.stringify(games.slice(0, 10), null, 2)}
Fields: ${JSON.stringify(fields, null, 2)}
Teams: ${JSON.stringify(teams.slice(0, 20), null, 2)}

Identify:
1. Time conflicts (overlapping games)
2. Field double-bookings
3. Team rest period violations
4. Resource allocation issues

Provide specific conflict resolution suggestions in JSON format.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'system',
            content: 'You are a tournament conflict detection expert. Analyze data and identify specific scheduling conflicts with solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const aiMessage = response.choices[0].message.content;
      const parsedResponse = JSON.parse(aiMessage || '{}');

      return {
        success: true,
        message: parsedResponse.message,
        actions: parsedResponse.actions || []
      };

    } catch (error) {
      console.error('[AI Assistant] Error analyzing conflicts:', error);
      return {
        success: false,
        message: 'Failed to analyze conflicts',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async logInteraction(
    userId: number,
    userMessage: string,
    aiResponse: string,
    entityId: number | null,
    context: any
  ): Promise<void> {
    try {
      await db.insert(aiAuditLog).values({
        actionType: 'ai_chat',
        entityType: 'tournament_management',
        entityId: entityId,
        userId: userId,
        changes: {
          userMessage,
          aiResponse,
          context
        },
        timestamp: new Date(),
        ipAddress: null,
        userAgent: null
      });
    } catch (error) {
      console.error('[AI Assistant] Failed to log interaction:', error);
    }
  }

  clearConversation(): void {
    this.conversationHistory = this.conversationHistory.slice(0, 1); // Keep system message
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }
}

export const aiAssistant = new AIAssistant();