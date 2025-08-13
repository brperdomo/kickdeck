import OpenAI from "openai";
import { db } from "../../db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { 
  teams, 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  games, 
  fields, 
  gameTimeSlots,
  eventGameFormats,
  gameFormats,
  aiConversationHistory
} from "../../db/schema";
import { v4 as uuidv4 } from 'uuid';

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TournamentGame {
  id: string;
  teamA: string;
  teamB: string;
  time: string;
  field: string;
  ageGroup?: string;
  bracket?: string;
}

interface TournamentConstraints {
  restPeriod: number;
  gameLength: number;
  bufferTime: number;
  fieldSize: string;
}

/**
 * OpenAI Responses API Tournament Scheduling Service
 * Uses PostgreSQL for conversation persistence and real-time constraint validation
 */
export class OpenAIResponsesScheduler {
  
  /**
   * Generate or get session ID for conversation tracking
   */
  private static generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Store conversation message in PostgreSQL
   */
  private static async storeMessage(eventId: string, sessionId: string, role: string, content: string, toolCallId?: string) {
    try {
      await db.insert(aiConversationHistory).values({
        eventId: parseInt(eventId),
        sessionId,
        role,
        content,
        toolCallId: toolCallId || null
      });
    } catch (error) {
      console.error('Failed to store conversation message:', error);
    }
  }

  /**
   * Load conversation history from PostgreSQL
   */
  private static async loadConversationHistory(eventId: string, sessionId: string): Promise<any[]> {
    try {
      const messages = await db.query.aiConversationHistory.findMany({
        where: and(
          eq(aiConversationHistory.eventId, parseInt(eventId)),
          eq(aiConversationHistory.sessionId, sessionId)
        ),
        orderBy: [desc(aiConversationHistory.createdAt)]
      });

      return messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        tool_call_id: msg.toolCallId
      })).reverse(); // Return chronological order
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  }

  /**
   * Initialize system prompt with current tournament context
   */
  private static async getSystemPrompt(eventId: string): Promise<string> {
    const tournamentData = await this.fetchTournamentData(eventId);
    const flightConfig = await this.getFlightConfigurations(eventId);
    
    return `
You are a professional tournament scheduling assistant for MatchPro.AI. You help tournament directors manage complex scheduling with natural language commands.

CORE PERSONALITY:
- Be conversational, helpful, and proactive
- Always acknowledge user requests before explaining constraints
- Use clear, non-technical language for constraint explanations
- Suggest solutions, not just problems

TOURNAMENT RULES (ALWAYS ENFORCE):
- No overlapping games on the same field at the same time
- Minimum rest period between games for any team: ${flightConfig[0]?.restPeriod || 90} minutes
- Maximum games per day per team: 2 games
- Game length: ${flightConfig[0]?.gameLength || 90} minutes
- Buffer time between games: ${flightConfig[0]?.bufferTime || 15} minutes
- Field size requirements: ${flightConfig[0]?.fieldSize || '7v7'}

RESPONSE GUIDELINES:
1. ACKNOWLEDGE the request first ("I'll move that game for you...")
2. VALIDATE constraints and explain conflicts in simple terms
3. SUGGEST alternatives when constraints are violated
4. CONFIRM successful changes with specific details
5. PROACTIVELY mention potential issues you notice

COMMUNICATION STYLE:
- "That field is already in use at 2 PM, but I can move it to 2:30 PM instead"
- "The Tigers would only have 45 minutes rest, which violates our 90-minute rule. How about 3 PM?"
- "I've successfully moved the game to Field 2 at 3 PM. Both teams now have proper rest periods."

AVAILABLE FUNCTIONS:
- moveGame: Move a game to new time/field (with constraint validation)
- swapTeams: Change teams in a specific game
- checkConflicts: Validate scheduling conflicts before making changes
- findValidTimes: Find available time slots that meet all constraints

Current tournament data: ${JSON.stringify(tournamentData, null, 2)}

Always be helpful and solution-oriented in your responses.

Current flight configuration: ${JSON.stringify(flightConfig, null, 2)}
Current tournament data: ${JSON.stringify(tournamentData, null, 2)}
`;
  }

  /**
   * Get centralized flight configuration parameters from Flight Configuration Overview
   */
  private static async getFlightConfigurations(eventId: string) {
    try {
      console.log(`📊 Fetching centralized flight configuration for event ${eventId}...`);
      
      // Fetch from the centralized flight configurations endpoint
      const response = await fetch(`http://localhost:3000/api/admin/events/${eventId}/flight-configurations`);
      if (response.ok) {
        const flightConfigs = await response.json();
        if (flightConfigs && flightConfigs.length > 0) {
          console.log('✅ Using centralized flight configuration parameters');
          return flightConfigs.map((config: any) => ({
            gameLength: config.gameLength || 90,
            restPeriod: config.restPeriod || 90,
            bufferTime: config.bufferTime || 15,
            fieldSize: config.fieldSize || '7v7'
          }));
        }
      }

      // Fallback to database query if API fails
      const eventFormats = await db.query.eventGameFormats.findMany({
        where: eq(eventGameFormats.eventId, parseInt(eventId))
      });

      if (eventFormats.length > 0) {
        return eventFormats.map(format => ({
          gameLength: format.gameLength || 90,
          restPeriod: 90, // Default rest period 
          bufferTime: format.bufferTime || 15,
          fieldSize: format.fieldSize || '7v7'
        }));
      }

      console.warn('No flight configurations found, using defaults');
      return [{
        gameLength: 90,
        restPeriod: 90,
        bufferTime: 15,
        fieldSize: '7v7'
      }];
    } catch (error) {
      console.warn('Failed to load flight configurations, using defaults:', error);
      return [{
        gameLength: 90,
        restPeriod: 90,
        bufferTime: 15,
        fieldSize: '7v7'
      }];
    }
  }

  /**
   * Fetch current tournament data
   */
  private static async fetchTournamentData(eventId: string) {
    console.log(`📊 Fetching tournament data for event ${eventId}...`);
    
    try {
      // Fetch existing games with proper field names
      const existingGames = await db.query.games.findMany({
        where: eq(games.eventId, eventId)
      });

      // Fetch teams
      const eventTeams = await db.query.teams.findMany({
        where: eq(teams.eventId, eventId)
      });

      // Fetch fields  
      const eventFields = await db.query.fields.findMany({
        where: eq(fields.eventId, parseInt(eventId))
      });

      const gameData: TournamentGame[] = existingGames.map(game => ({
        id: game.id.toString(),
        teamA: game.homeTeam || 'TBD',
        teamB: game.awayTeam || 'TBD', 
        time: game.scheduledTime || game.createdAt,
        field: game.fieldName || 'TBD',
        ageGroup: game.ageGroupId?.toString() || '',
        bracket: game.groupId?.toString() || ''
      }));

      return {
        games: gameData,
        teams: eventTeams.map(t => ({ id: t.id, name: t.name })),
        fields: eventFields.map(f => ({ id: f.id, name: f.name, size: f.fieldSize })),
        totalGames: gameData.length
      };
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      return { games: [], teams: [], fields: [], totalGames: 0 };
    }
  }

  /**
   * Smart conflict detection with detailed explanations
   */
  private static minutesBetween(date1: string, date2: string): number {
    return Math.abs((new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60));
  }

  private static checkConflicts(games: TournamentGame[], gameId: string, newTime: string, newField: string, constraints: TournamentConstraints) {
    const movingGame = games.find(g => g.id === gameId);
    if (!movingGame) return { valid: false, reason: "Game not found" };

    const teamA = movingGame.teamA;
    const teamB = movingGame.teamB;
    const movedTime = new Date(newTime);

    // Check field overlap
    for (let game of games) {
      if (game.id === gameId) continue;
      if (game.field === newField && game.time === newTime) {
        return { valid: false, reason: `Field ${newField} already in use at ${newTime}` };
      }
    }

    // Check rest period and daily limit
    let teamAGamesToday = 0;
    let teamBGamesToday = 0;

    for (let game of games) {
      if (game.id === gameId) continue;
      
      const gameDate = new Date(game.time).toISOString().split("T")[0];
      const newDate = movedTime.toISOString().split("T")[0];
      
      if (gameDate === newDate) {
        if (game.teamA === teamA || game.teamB === teamA) teamAGamesToday++;
        if (game.teamA === teamB || game.teamB === teamB) teamBGamesToday++;
      }

      // Rest time check
      if (game.teamA === teamA || game.teamB === teamA || game.teamA === teamB || game.teamB === teamB) {
        if (this.minutesBetween(game.time, newTime) < constraints.restPeriod) {
          const conflictTeam = (game.teamA === teamA || game.teamB === teamA) ? teamA : teamB;
          return { 
            valid: false, 
            reason: `${conflictTeam} needs ${constraints.restPeriod} minutes rest. Current gap is ${this.minutesBetween(game.time, newTime)} minutes.` 
          };
        }
      }
    }

    if (teamAGamesToday >= 2 || teamBGamesToday >= 2) {
      const team = teamAGamesToday >= 2 ? teamA : teamB;
      return { valid: false, reason: `${team} already has 2 games scheduled for ${movedTime.toISOString().split("T")[0]}` };
    }

    return { valid: true };
  }

  private static findAlternativeTimeSlots(games: TournamentGame[], gameId: string, startTime: string, field: string, constraints: TournamentConstraints): string[] {
    const alternatives: string[] = [];
    let proposedTime = new Date(startTime);

    for (let i = 1; i <= 20; i++) { // Try 20 increments (10 hours)
      proposedTime = new Date(proposedTime.getTime() + 30 * 60000); // +30 minutes
      const check = this.checkConflicts(games, gameId, proposedTime.toISOString(), field, constraints);
      if (check.valid) {
        alternatives.push(proposedTime.toISOString());
      }
      if (alternatives.length >= 5) break; // Limit to 5 suggestions
    }

    return alternatives;
  }

  /**
   * Enhanced move game with PostgreSQL integration and smart suggestions
   */
  private static async moveGame(eventId: string, { gameId, newTime, newField }: { gameId: string, newTime: string, newField: string }) {
    const tournamentData = await this.fetchTournamentData(eventId);
    const flightConfig = await this.getFlightConfigurations(eventId);
    const constraints: TournamentConstraints = {
      restPeriod: flightConfig[0]?.restPeriod || 90,
      gameLength: flightConfig[0]?.gameLength || 90,
      bufferTime: flightConfig[0]?.bufferTime || 15,
      fieldSize: flightConfig[0]?.fieldSize || '7v7'
    };

    const check = this.checkConflicts(tournamentData.games, gameId, newTime, newField, constraints);
    if (!check.valid) {
      const alternatives = this.findAlternativeTimeSlots(tournamentData.games, gameId, newTime, newField, constraints);
      if (alternatives.length > 0) {
        return {
          success: false,
          suggestions: alternatives,
          message: `❌ ${check.reason}. ✅ Available alternatives: ${alternatives.map(t => new Date(t).toLocaleTimeString()).join(', ')}`
        };
      }
      return { success: false, message: `❌ ${check.reason}. No alternatives found within 10 hours.` };
    }

    // Update the game in database
    try {
      await db.update(games)
        .set({
          scheduledTime: newTime,
          updatedAt: new Date().toISOString()
        })
        .where(eq(games.id, parseInt(gameId)));

      return { success: true, message: `✅ Game ${gameId} successfully moved to ${new Date(newTime).toLocaleString()} on ${newField}` };
    } catch (error) {
      return { success: false, message: `❌ Database error: ${error}` };
    }
  }

  private static async swapTeams(eventId: string, { gameId, teamA, teamB }: { gameId: string, teamA: string, teamB: string }) {
    try {
      await db.update(games)
        .set({
          homeTeam: teamA,
          awayTeam: teamB,
          updatedAt: new Date().toISOString()
        })
        .where(eq(games.id, parseInt(gameId)));

      return { success: true, message: `✅ Game ${gameId} teams updated to ${teamA} vs ${teamB}` };
    } catch (error) {
      return { success: false, message: `❌ Database error: ${error}` };
    }
  }

  /**
   * Main chat interface with PostgreSQL persistence
   */
  public static async chatWithScheduler(eventId: string, userMessage: string, sessionId?: string): Promise<string> {
    try {
      console.log(`🤖 Processing chat message for event ${eventId}: "${userMessage}"`);

      // Generate session ID if not provided
      if (!sessionId) {
        sessionId = this.generateSessionId();
      }

      // Load conversation history from database
      const conversationHistory = await this.loadConversationHistory(eventId, sessionId);
      
      // Add system prompt if this is a new conversation
      if (conversationHistory.length === 0) {
        const systemPrompt = await this.getSystemPrompt(eventId);
        await this.storeMessage(eventId, sessionId, 'system', systemPrompt);
        conversationHistory.push({ role: 'system', content: systemPrompt });
      }

      // Store user message
      await this.storeMessage(eventId, sessionId, 'user', userMessage);
      conversationHistory.push({ role: "user", content: userMessage });

      // Call OpenAI Responses API (not Realtime)
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: conversationHistory,
        tools: [
          {
            type: "function",
            function: {
              name: "moveGame",
              description: "Move a game to a new time and field (validates all tournament constraints)",
              parameters: {
                type: "object",
                properties: {
                  gameId: { type: "string", description: "ID of the game to move" },
                  newTime: { type: "string", format: "date-time", description: "New time in ISO format" },
                  newField: { type: "string", description: "Name of the field to move to" }
                },
                required: ["gameId", "newTime", "newField"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "swapTeams",
              description: "Change the teams in a specific game",
              parameters: {
                type: "object",
                properties: {
                  gameId: { type: "string", description: "ID of the game" },
                  teamA: { type: "string", description: "New home team name" },
                  teamB: { type: "string", description: "New away team name" }
                },
                required: ["gameId", "teamA", "teamB"]
              }
            }
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent scheduling logic
        max_tokens: 2000 // Increased for better tournament scheduling responses
      });

      // Handle tool calls
      const choice = response.choices[0];
      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          let result;
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === "moveGame") {
            result = await this.moveGame(eventId, args);
          } else if (toolCall.function.name === "swapTeams") {
            result = await this.swapTeams(eventId, args);
          }

          // Store tool result in database
          await this.storeMessage(eventId, sessionId, 'tool', JSON.stringify(result), toolCall.id);
          conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }

        // Get AI response after tool execution
        const followUpResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: conversationHistory,
          temperature: 0.3, // Lower temperature for more consistent scheduling logic
          max_tokens: 2000 // Increased for better tournament scheduling responses
        });

        const aiMessage = followUpResponse.choices[0].message.content || "I've processed your request.";
        await this.storeMessage(eventId, sessionId, 'assistant', aiMessage);
        return aiMessage;
      }

      // Regular response without tool calls
      const aiMessage = choice.message.content || "I'm here to help with tournament scheduling.";
      await this.storeMessage(eventId, sessionId, 'assistant', aiMessage);
      return aiMessage;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🚨 AI Scheduler Error:', error);
      return `❌ Sorry, I encountered an error: ${errorMessage}. Please try again.`;
    }
  }

  /**
   * Get conversation history from PostgreSQL for display
   */
  public static async getConversationHistory(eventId: string, sessionId: string): Promise<any[]> {
    const history = await this.loadConversationHistory(eventId, sessionId);
    return history.filter(msg => msg.role !== 'system');
  }

  /**
   * Clear conversation history for a session
   */
  public static async clearConversation(eventId: string, sessionId: string): Promise<void> {
    try {
      await db.delete(aiConversationHistory)
        .where(and(
          eq(aiConversationHistory.eventId, parseInt(eventId)),
          eq(aiConversationHistory.sessionId, sessionId)
        ));
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
    }
  }
}