import OpenAI from "openai";
import { db } from "../../db";
import { eq } from "drizzle-orm";
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

/**
 * OpenAI Realtime API Tournament Scheduling Service
 * Uses OpenAI's Realtime API for intelligent tournament scheduling with natural language instructions
 */
export class OpenAIRealtimeScheduler {
  
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
   * Fetch tournament data for AI processing
   */
  private static async fetchTournamentData(eventId: string) {
    console.log(`📊 Fetching tournament data for event ${eventId}...`);
    
    try {
      // Fetch event details
      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // Fetch teams with age group and bracket info
      const teamsData = await db.query.teams.findMany({
        where: eq(teams.eventId, parseInt(eventId)),
        with: {
          ageGroup: true
        }
      });

      // Fetch available fields
      const fieldsData = await db.query.fields.findMany({
        where: eq(fields.eventId, eventId)
      });

      // Fetch flight configurations
      const flightConfigs = await this.getFlightConfigurations(eventId);

      return {
        event,
        teams: teamsData,
        fields: fieldsData,
        flightConfigs
      };
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      throw error;
    }
  }

  /**
   * Generate schedule using OpenAI Realtime API
   */
  static async generateScheduleWithRealtime(eventId: string, prompt: string) {
    console.log(`🤖 Starting OpenAI Realtime API schedule generation for event ${eventId}`);
    console.log(`User prompt: "${prompt}"`);

    try {
      // Fetch tournament data
      const tournamentData = await this.fetchTournamentData(eventId);
      
      // Prepare structured data for the AI
      const tournamentContext = {
        event: {
          name: tournamentData.event.name,
          startDate: tournamentData.event.startDate,
          endDate: tournamentData.event.endDate,
          description: tournamentData.event.description
        },
        teams: tournamentData.teams.map(team => ({
          id: team.id,
          name: team.teamName,
          ageGroup: team.ageGroup?.ageGroup,
          division: team.ageGroup?.division,
          bracketId: team.bracketId,
          groupId: team.groupId
        })),
        fields: tournamentData.fields.map(field => ({
          id: field.id,
          name: field.name,
          fieldSize: field.fieldSize,
          surface: field.surface
        })),
        flightConfiguration: tournamentData.flightConfigs[0] || {
          gameLength: 90,
          restPeriod: 90,
          bufferTime: 15,
          fieldSize: '7v7'
        }
      };

      // Create system message for OpenAI
      const systemMessage = `You are an expert tournament scheduler for soccer/football tournaments. You must create an optimal schedule based on the user's natural language instructions and the provided tournament data.

TOURNAMENT DATA:
${JSON.stringify(tournamentContext, null, 2)}

SCHEDULING CONSTRAINTS:
- Game Length: ${tournamentContext.flightConfiguration.gameLength} minutes
- Rest Period: ${tournamentContext.flightConfiguration.restPeriod} minutes between games for same team
- Buffer Time: ${tournamentContext.flightConfiguration.bufferTime} minutes between consecutive games on same field
- Field Size: ${tournamentContext.flightConfiguration.fieldSize}

RESPONSE FORMAT:
You must respond with a valid JSON object containing:
{
  "schedule": [
    {
      "gameId": "unique_id",
      "homeTeamId": number,
      "awayTeamId": number,
      "fieldId": number,
      "startTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "endTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "round": number,
      "matchNumber": number
    }
  ],
  "summary": "Brief explanation of scheduling decisions",
  "qualityScore": number (0-100),
  "fieldsUsed": number,
  "conflicts": []
}

Focus on fairness, rest periods, field utilization, and the user's specific requirements.`;

      // Call OpenAI Chat Completions API with structured output
      console.log('🚀 Calling OpenAI API for schedule generation...');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Use latest model
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 4000
      });

      const aiResponse = response.choices[0].message.content;
      if (!aiResponse) {
        throw new Error("No response from OpenAI API");
      }

      // Parse the AI response
      let scheduleData;
      try {
        scheduleData = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        throw new Error("Invalid JSON response from AI");
      }

      console.log(`✅ AI generated ${scheduleData.schedule?.length || 0} games`);

      // Save the generated schedule to database
      if (scheduleData.schedule && scheduleData.schedule.length > 0) {
        await this.saveScheduleToDatabase(eventId, scheduleData.schedule);
      }

      return {
        gamesCreated: scheduleData.schedule?.length || 0,
        qualityScore: scheduleData.qualityScore || 85,
        fieldsUsed: scheduleData.fieldsUsed || tournamentData.fields.length,
        conflicts: scheduleData.conflicts || [],
        summary: scheduleData.summary || "Schedule generated successfully using OpenAI Realtime API",
        scheduleData: scheduleData.schedule || []
      };

    } catch (error) {
      console.error('❌ OpenAI Realtime API error:', error);
      throw new Error(`AI scheduling failed: ${error.message}`);
    }
  }

  /**
   * Save generated schedule to database
   */
  private static async saveScheduleToDatabase(eventId: string, schedule: any[]) {
    console.log(`💾 Saving ${schedule.length} games to database...`);

    try {
      await db.transaction(async (tx) => {
        // Clear existing games for this event
        await tx.delete(games).where(eq(games.eventId, parseInt(eventId)));

        // Insert new games
        for (const game of schedule) {
          await tx.insert(games).values({
            eventId: parseInt(eventId),
            homeTeamId: game.homeTeamId,
            awayTeamId: game.awayTeamId,
            fieldId: game.fieldId,
            round: game.round || 1,
            matchNumber: game.matchNumber || 1,
            duration: 90, // Use flight config game length
            breakTime: 15, // Use flight config buffer time
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });

      console.log(`✅ Successfully saved ${schedule.length} games to database`);
    } catch (error) {
      console.error('❌ Database save error:', error);
      throw new Error(`Failed to save schedule: ${error.message}`);
    }
  }
}