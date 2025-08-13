import OpenAI from "openai";
import { db } from "../../db";
import { eq, and, gte, lte } from "drizzle-orm";
import { 
  teams, 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  games, 
  fields, 
  gameTimeSlots,
  eventGameFormats,
  gameFormats
} from "../../db/schema";

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

interface ConversationContext {
  history: any[];
  tournamentData: any;
  flightConfig: any;
}

/**
 * OpenAI Responses API Tournament Scheduling Service
 * Uses OpenAI's Responses API for conversational tournament scheduling with constraint validation
 */
export class OpenAIResponsesScheduler {
  
  private static conversationHistory = new Map<string, ConversationContext>();
  
  /**
   * Initialize conversation context for an event
   */
  private static async initializeConversation(eventId: string): Promise<ConversationContext> {
    const tournamentData = await this.fetchTournamentData(eventId);
    const flightConfig = await this.getFlightConfigurations(eventId);
    
    const systemPrompt = `
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
`;

    const context: ConversationContext = {
      history: [{ role: "system", content: systemPrompt }],
      tournamentData,
      flightConfig
    };
    
    this.conversationHistory.set(eventId, context);
    return context;
  }

  /**
   * Get flight configuration parameters for scheduling
   */
  private static async getFlightConfigurations(eventId: string) {
    try {
      const eventGameFormats = await db.query.eventGameFormats.findMany({
        where: eq(eventGameFormats.eventId, parseInt(eventId))
      });

      if (eventGameFormats.length > 0) {
        return eventGameFormats.map(format => ({
          gameLength: format.gameLength || 90,
          restPeriod: format.restPeriod || 90,
          bufferTime: format.bufferTime || 15,
          fieldSize: format.fieldSize || '7v7'
        }));
      }

      // Fallback to game_formats table
      const gameFormats = await db.query.gameFormats.findMany({
        where: eq(gameFormats.eventId, parseInt(eventId))
      });

      return gameFormats.map(format => ({
        gameLength: format.gameLength || 90,
        restPeriod: format.restPeriod || 90,
        bufferTime: format.bufferTime || 15,
        fieldSize: format.fieldSize || '7v7'
      }));
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
      // Fetch existing games
      const existingGames = await db.query.games.findMany({
        where: eq(games.eventId, parseInt(eventId))
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
        time: game.gameDateTime || '',
        field: game.fieldName || '',
        ageGroup: game.ageGroup || '',
        bracket: game.bracketName || ''
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
   * Helper functions for constraint validation
   */
  private static minutesBetween(date1: string, date2: string): number {
    return Math.abs((new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60));
  }

  private static checkConflicts(games: TournamentGame[], gameId: string, newTime: string, newField: string, restPeriod: number = 90) {
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
        if (this.minutesBetween(game.time, newTime) < restPeriod) {
          const conflictTeam = (game.teamA === teamA || game.teamB === teamA) ? teamA : teamB;
          return { 
            valid: false, 
            reason: `${conflictTeam} needs ${restPeriod} minutes rest. Current gap is ${this.minutesBetween(game.time, newTime)} minutes.` 
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

  private static findNextValidTime(games: TournamentGame[], gameId: string, startTime: string, field: string, restPeriod: number = 90): string | null {
    let proposedTime = new Date(startTime);

    for (let i = 0; i < 20; i++) { // Try 20 increments (10 hours)
      proposedTime = new Date(proposedTime.getTime() + 30 * 60000); // +30 minutes
      const check = this.checkConflicts(games, gameId, proposedTime.toISOString(), field, restPeriod);
      if (check.valid) {
        return proposedTime.toISOString();
      }
    }

    return null;
  }

  /**
   * Tool functions for AI to call
   */
  private static async moveGame(eventId: string, { gameId, newTime, newField }: { gameId: string, newTime: string, newField: string }) {
    const context = this.conversationHistory.get(eventId);
    if (!context) throw new Error('Conversation context not found');

    const check = this.checkConflicts(context.tournamentData.games, gameId, newTime, newField, context.flightConfig[0]?.restPeriod);
    if (!check.valid) {
      const alt = this.findNextValidTime(context.tournamentData.games, gameId, newTime, newField, context.flightConfig[0]?.restPeriod);
      if (alt) {
        return {
          success: false,
          suggestion: alt,
          message: `❌ Requested move violates rule: ${check.reason}. ✅ Suggested alternate time: ${alt}`
        };
      }
      return { success: false, message: `❌ Requested move violates rule: ${check.reason}. No alternate time found within 10 hours.` };
    }

    // Update the game in database
    try {
      await db.update(games)
        .set({
          gameDateTime: newTime,
          fieldName: newField,
          updatedAt: new Date()
        })
        .where(eq(games.id, parseInt(gameId)));

      // Update local context
      const game = context.tournamentData.games.find((g: TournamentGame) => g.id === gameId);
      if (game) {
        game.time = newTime;
        game.field = newField;
      }

      return { success: true, message: `✅ Game ${gameId} successfully moved to ${newTime} on ${newField}` };
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
          updatedAt: new Date()
        })
        .where(eq(games.id, parseInt(gameId)));

      const context = this.conversationHistory.get(eventId);
      if (context) {
        const game = context.tournamentData.games.find((g: TournamentGame) => g.id === gameId);
        if (game) {
          game.teamA = teamA;
          game.teamB = teamB;
        }
      }

      return { success: true, message: `✅ Game ${gameId} teams updated to ${teamA} vs ${teamB}` };
    } catch (error) {
      return { success: false, message: `❌ Database error: ${error}` };
    }
  }

  /**
   * Main chat interface for tournament scheduling
   */
  public static async chatWithScheduler(eventId: string, userMessage: string): Promise<string> {
    try {
      console.log(`🤖 Processing chat message for event ${eventId}: "${userMessage}"`);

      // Initialize or get conversation context
      let context = this.conversationHistory.get(eventId);
      if (!context) {
        context = await this.initializeConversation(eventId);
      }

      // Add user message to conversation
      context.history.push({ role: "user", content: userMessage });

      // Call OpenAI Responses API (not Realtime)
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: context.history,
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
        temperature: 0.7,
        max_tokens: 1000
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

          // Add tool result to conversation
          context.history.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }

        // Get AI response after tool execution
        const followUpResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: context.history,
          temperature: 0.7,
          max_tokens: 1000
        });

        const aiMessage = followUpResponse.choices[0].message.content || "I've processed your request.";
        context.history.push({ role: "assistant", content: aiMessage });
        return aiMessage;
      }

      // Regular response without tool calls
      const aiMessage = choice.message.content || "I'm here to help with tournament scheduling.";
      context.history.push({ role: "assistant", content: aiMessage });
      return aiMessage;

    } catch (error) {
      console.error('🚨 OpenAI Responses API Error:', error);
      return `❌ Sorry, I encountered an error: ${error.message}. Please try again.`;
    }
  }

  /**
   * Get conversation history for display
   */
  public static getConversationHistory(eventId: string): any[] {
    const context = this.conversationHistory.get(eventId);
    return context ? context.history.filter(msg => msg.role !== 'system') : [];
  }

  /**
   * Clear conversation history
   */
  public static clearConversation(eventId: string): void {
    this.conversationHistory.delete(eventId);
  }
}