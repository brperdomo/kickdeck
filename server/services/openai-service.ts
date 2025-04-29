import OpenAI from "openai";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import { 
  teams, 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  games, 
  fields, 
  gameTimeSlots,
  tournamentGroups,
  complexes
} from "../../db/schema";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Soccer Scheduling AI Service
 * This service uses OpenAI's GPT-4o to generate and optimize schedules for soccer tournaments
 */
export class SoccerSchedulerAI {
  /**
   * Utility method to convert a time string (e.g. "08:00") to a proper Date object
   * on the same day as the reference date
   * @param referenceDate - The reference date to use for year/month/day
   * @param timeString - The time string in format "HH:MM"
   * @returns A Date object with the same day as referenceDate but time from timeString
   */
  private static getTimeFromString(referenceDate: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(referenceDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
  /**
   * Generates an optimal schedule for a soccer tournament
   * @param eventId - The ID of the event
   * @param constraints - Scheduling constraints
   * @returns The generated schedule and any detected conflicts
   */
  static async generateSchedule(eventId: string | number, constraints: ScheduleConstraints) {
    console.log(`Starting schedule generation for event ID: ${eventId}`);
    console.log(`Constraints: ${JSON.stringify(constraints)}`);
    
    try {
      // 1. Fetch all necessary data for scheduling
      console.log("Fetching event data...");
      const eventData = await this.getEventData(eventId);
      console.log("Event data fetched successfully");
      
      console.log("Fetching teams data...");
      const teamsData = await this.getTeamsData(eventId);
      console.log(`Teams data fetched successfully. Found ${teamsData.length} teams.`);
      
      // Check if we have enough teams to generate a schedule
      if (teamsData.length < 2) {
        console.log(`Not enough teams (${teamsData.length}) to generate a schedule`);
        throw new Error(`Not enough teams to generate a schedule. Found only ${teamsData.length} approved teams.`);
      }
      
      // 2. Prepare prompt for OpenAI
      console.log("Generating scheduling prompt...");
      const prompt = this.generateSchedulingPrompt(eventData, teamsData, constraints);
      console.log("Prompt generated successfully");
      
      try {
        // 3. Call OpenAI API
        console.log("Making OpenAI API call...");
        const scheduleResponse = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are an advanced sports tournament scheduling assistant specializing in soccer tournaments. You create optimal game schedules while respecting all constraints."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2 // Lower temperature for more consistent results
        });
        
        console.log("OpenAI API response received");
        
        if (!scheduleResponse.choices || scheduleResponse.choices.length === 0) {
          throw new Error("OpenAI API returned empty response");
        }
        
        // 4. Parse and validate the schedule
        console.log("Parsing API response...");
        const responseContent = scheduleResponse.choices[0].message.content;
        
        if (!responseContent) {
          throw new Error("OpenAI API returned empty content");
        }
        
        let scheduleResult;
        try {
          scheduleResult = JSON.parse(responseContent);
        } catch (parseError) {
          console.error("Failed to parse OpenAI response:", parseError);
          console.error("Raw response:", responseContent);
          throw new Error("Failed to parse OpenAI response as JSON");
        }
        
        if (!scheduleResult.games || !Array.isArray(scheduleResult.games)) {
          console.error("Unexpected response format:", scheduleResult);
          throw new Error("OpenAI response missing expected 'games' array");
        }
        
        console.log(`Schedule parsed successfully with ${scheduleResult.games.length} games`);
        
        // 5. Check for conflicts and validation issues
        console.log("Detecting potential schedule conflicts...");
        const conflicts = this.detectScheduleConflicts(scheduleResult.games, teamsData, eventData);
        console.log(`Detected ${conflicts.length} potential conflicts`);
        
        // 6. Return the complete schedule with conflicts
        console.log("Returning schedule data");
        return {
          schedule: scheduleResult.games,
          qualityScore: scheduleResult.qualityScore || 85,
          conflicts,
          bracketSchedules: scheduleResult.bracketSchedules || []
        };
      } catch (openaiError) {
        console.error("OpenAI API call failed:", openaiError);
        
        // Check if it's a rate limit or quota error
        const isRateLimitError = openaiError.status === 429 || 
                               (openaiError.error && 
                               (openaiError.error.type === 'insufficient_quota' || 
                                openaiError.error.type === 'rate_limit_exceeded'));
        
        if (isRateLimitError) {
          throw new Error("OpenAI API rate limit exceeded or insufficient quota. Please try again later or check your API usage limits.");
        }
        
        // More specific error messages based on OpenAI error types
        if (openaiError.error && openaiError.error.type === 'invalid_request_error') {
          throw new Error(`OpenAI API invalid request error: ${openaiError.message}`);
        }
        
        if (openaiError.error && openaiError.error.type === 'authentication_error') {
          throw new Error("OpenAI API authentication error. Please check your API key.");
        }
        
        // For other OpenAI errors
        throw new Error(`OpenAI API call failed: ${openaiError.message}`);
      }
    } catch (error) {
      console.error("Error generating AI schedule:", error);
      
      // If it's already an Error object with a message, rethrow it
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Failed to generate AI schedule");
    }
  }
  
  /**
   * Optimizes an existing schedule to resolve conflicts
   * @param eventId - The ID of the event
   * @param options - Optimization options
   * @returns The optimized schedule
   */
  static async optimizeSchedule(eventId: string | number, options: OptimizationOptions) {
    console.log(`Starting schedule optimization for event ID: ${eventId}`);
    console.log(`Options: ${JSON.stringify(options)}`);
    
    try {
      // 1. Get the current schedule
      console.log("Fetching current schedule...");
      const existingSchedule = await this.getCurrentSchedule(eventId);
      console.log(`Current schedule fetched with ${existingSchedule.length} games`);
      
      // 2. Get teams and fields data
      console.log("Fetching teams data...");
      const teamsData = await this.getTeamsData(eventId);
      console.log(`Teams data fetched successfully. Found ${teamsData.length} teams.`);
      
      console.log("Fetching event data...");
      const eventData = await this.getEventData(eventId);
      console.log("Event data fetched successfully");
      
      // 3. Prepare the optimization prompt
      console.log("Generating optimization prompt...");
      const prompt = this.generateOptimizationPrompt(existingSchedule, teamsData, eventData, options);
      console.log("Prompt generated successfully");
      
      try {
        // 4. Call OpenAI API
        console.log("Making OpenAI API call for schedule optimization...");
        const optimizationResponse = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are an advanced sports tournament scheduling assistant specializing in soccer tournaments. You optimize existing game schedules to resolve conflicts while making minimal changes."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2
        });
        
        console.log("OpenAI API response received for optimization");
        
        if (!optimizationResponse.choices || optimizationResponse.choices.length === 0) {
          throw new Error("OpenAI API returned empty response");
        }
        
        // 5. Parse and validate the optimized schedule
        console.log("Parsing API response...");
        const responseContent = optimizationResponse.choices[0].message.content;
        
        if (!responseContent) {
          throw new Error("OpenAI API returned empty content");
        }
        
        let optimizedResult;
        try {
          optimizedResult = JSON.parse(responseContent);
        } catch (parseError) {
          console.error("Failed to parse OpenAI response:", parseError);
          console.error("Raw response:", responseContent);
          throw new Error("Failed to parse OpenAI optimization response as JSON");
        }
        
        if (!optimizedResult.games || !Array.isArray(optimizedResult.games)) {
          console.error("Unexpected response format:", optimizedResult);
          throw new Error("OpenAI response missing expected 'games' array");
        }
        
        console.log(`Optimization parsed successfully with ${optimizedResult.games.length} games`);
        
        // 6. Check for remaining conflicts
        console.log("Detecting potential remaining conflicts...");
        const remainingConflicts = this.detectScheduleConflicts(optimizedResult.games, teamsData, eventData);
        console.log(`Detected ${remainingConflicts.length} potential conflicts after optimization`);
        
        // 7. Return the optimized schedule with any remaining conflicts
        console.log("Returning optimized schedule data");
        return {
          schedule: optimizedResult.games,
          qualityScore: optimizedResult.qualityScore || 95,
          conflicts: remainingConflicts,
          changesApplied: optimizedResult.changesApplied || []
        };
      } catch (openaiError) {
        console.error("OpenAI API call failed:", openaiError);
        
        // Check if it's a rate limit or quota error
        const isRateLimitError = openaiError.status === 429 || 
                               (openaiError.error && 
                               (openaiError.error.type === 'insufficient_quota' || 
                                openaiError.error.type === 'rate_limit_exceeded'));
        
        if (isRateLimitError) {
          throw new Error("OpenAI API rate limit exceeded or insufficient quota. Please try again later or check your API usage limits.");
        }
        
        // More specific error messages based on OpenAI error types
        if (openaiError.error && openaiError.error.type === 'invalid_request_error') {
          throw new Error(`OpenAI API invalid request error: ${openaiError.message}`);
        }
        
        if (openaiError.error && openaiError.error.type === 'authentication_error') {
          throw new Error("OpenAI API authentication error. Please check your API key.");
        }
        
        // For other OpenAI errors
        throw new Error(`OpenAI API call failed for optimization: ${openaiError.message}`);
      }
    } catch (error) {
      console.error("Error optimizing schedule:", error);
      
      // If it's already an Error object with a message, rethrow it
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Failed to optimize schedule");
    }
  }
  
  /**
   * Suggests bracket assignments for teams without assigned brackets
   * @param eventId - The ID of the event
   * @returns Suggested bracket assignments for teams
   */
  static async suggestBracketAssignments(eventId: string | number) {
    try {
      // 1. Get teams without brackets
      const teamsWithoutBrackets = await this.getTeamsWithoutBrackets(eventId);
      
      if (teamsWithoutBrackets.length === 0) {
        console.log("No teams without brackets found for event " + eventId);
        return { 
          suggestions: [],
          source: 'fallback',
          message: "All teams already have bracket assignments or there are no approved teams without brackets."
        };
      }
      
      // 2. Get available brackets
      const availableBrackets = await this.getAvailableBrackets(eventId);
      
      // Check if we have available brackets
      if (availableBrackets.length === 0) {
        console.log("No available brackets found for event " + eventId);
        return { 
          suggestions: [],
          source: 'fallback',
          message: "No brackets found for this event. Please create brackets first."
        };
      }
      
      try {
        // 3. Prepare prompt for OpenAI
        const prompt = this.generateBracketAssignmentPrompt(teamsWithoutBrackets, availableBrackets);
        
        // 4. Call OpenAI API
        const bracketResponse = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are an advanced sports tournament assistant specializing in soccer team classifications. You assign teams to appropriate brackets based on their attributes."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000,
          temperature: 0.3
        });
        
        // 5. Parse and return the suggestions
        const suggestions = JSON.parse(bracketResponse.choices[0].message.content);
        
        return {
          suggestions: suggestions.bracketAssignments || [],
          source: "ai"
        };
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // Check if it's a rate limit or quota error
        const isRateLimitError = openaiError.status === 429 || 
                               (openaiError.error && 
                               (openaiError.error.type === 'insufficient_quota' || 
                                openaiError.error.type === 'rate_limit_exceeded'));
        
        if (isRateLimitError) {
          console.log("Rate limit or quota exceeded, using fallback method for bracket assignment");
          
          // Use a fallback method for bracket suggestions
          return this.generateFallbackBracketSuggestions(teamsWithoutBrackets, availableBrackets);
        }
        
        // For other OpenAI errors, rethrow
        throw openaiError;
      }
    } catch (error) {
      console.error("Error suggesting bracket assignments:", error);
      
      // If it's already an Error object with a message, rethrow it
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Failed to suggest bracket assignments");
    }
  }
  
  /**
   * Generates fallback bracket suggestions when OpenAI API is unavailable
   * Uses simple heuristics based on age group, birth year, etc.
   * @param teams - Teams without brackets
   * @param brackets - Available brackets
   * @returns Suggested bracket assignments
   */
  private static generateFallbackBracketSuggestions(teams: any[], brackets: any[]) {
    const suggestions = [];
    
    // Group brackets by age group
    const bracketsByAgeGroup = brackets.reduce((acc, bracket) => {
      const ageGroup = bracket.ageGroup || '';
      if (!acc[ageGroup]) {
        acc[ageGroup] = [];
      }
      acc[ageGroup].push(bracket);
      return acc;
    }, {});
    
    // For each team, find a matching bracket based on age group
    for (const team of teams) {
      const teamAgeGroup = team.ageGroup || '';
      const matchingBrackets = bracketsByAgeGroup[teamAgeGroup] || [];
      
      if (matchingBrackets.length > 0) {
        // Sort brackets alphabetically to at least be consistent
        matchingBrackets.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        // Just take the first available bracket of the matching age group
        // This is a simplistic approach but better than nothing when AI is unavailable
        suggestions.push({
          teamId: team.id,
          teamName: team.name,
          suggestedBracketId: matchingBrackets[0].id,
          suggestedBracketName: matchingBrackets[0].name,
          confidence: 0.7, // Lower confidence since this is a fallback method
          reasoning: "Based on matching age group (fallback method)"
        });
      }
    }
    
    return {
      suggestions,
      source: "fallback"
    };
  }
  
  /**
   * Detects conflicts in a schedule
   * @param scheduledGames - The scheduled games
   * @param teamsData - Team data including coaches
   * @returns Array of detected conflicts
   */
  private static detectScheduleConflicts(scheduledGames: any[], teamsData: any, eventData?: any) {
    const conflicts: ScheduleConflict[] = [];
    
    // Map to track coach schedules
    const coachSchedules = new Map<string, any[]>();
    // Map to track team schedules
    const teamSchedules = new Map<number, any[]>();
    // Map to track field usage
    const fieldUsage = new Map<string, any[]>();
    
    // Process each game to build the tracking maps
    for (const game of scheduledGames) {
      // Track field usage
      const fieldKey = `${game.field}-${game.startTime}`;
      if (!fieldUsage.has(fieldKey)) {
        fieldUsage.set(fieldKey, []);
      }
      fieldUsage.get(fieldKey)?.push(game);
      
      // Track team schedules
      if (game.homeTeam?.id) {
        if (!teamSchedules.has(game.homeTeam.id)) {
          teamSchedules.set(game.homeTeam.id, []);
        }
        teamSchedules.get(game.homeTeam.id)?.push(game);
      }
      
      if (game.awayTeam?.id) {
        if (!teamSchedules.has(game.awayTeam.id)) {
          teamSchedules.set(game.awayTeam.id, []);
        }
        teamSchedules.get(game.awayTeam.id)?.push(game);
      }
      
      // Track coach schedules
      if (game.homeTeam?.coach) {
        if (!coachSchedules.has(game.homeTeam.coach)) {
          coachSchedules.set(game.homeTeam.coach, []);
        }
        coachSchedules.get(game.homeTeam.coach)?.push(game);
      }
      
      if (game.awayTeam?.coach) {
        if (!coachSchedules.has(game.awayTeam.coach)) {
          coachSchedules.set(game.awayTeam.coach, []);
        }
        coachSchedules.get(game.awayTeam.coach)?.push(game);
      }
      
      // Check for field operating hour constraints if eventData is provided
      if (eventData && eventData.fieldsByName) {
        const fieldInfo = eventData.fieldsByName[game.field];
        if (fieldInfo) {
          const gameStart = new Date(game.startTime);
          const gameEnd = new Date(game.endTime);
          
          // Convert field hours to comparable times on the same day as the game
          const fieldOpenTime = this.getTimeFromString(gameStart, fieldInfo.openTime);
          const fieldCloseTime = this.getTimeFromString(gameStart, fieldInfo.closeTime);
          
          // Check if game is outside of field operating hours
          if (gameStart < fieldOpenTime || gameEnd > fieldCloseTime) {
            conflicts.push({
              type: 'field_hours',
              description: `Game scheduled on field ${game.field} outside of operating hours (${fieldInfo.openTime} to ${fieldInfo.closeTime})`,
              severity: 'high',
              affectedGames: [game.id]
            });
          }
          
          // Check if field's complex is closed
          if (fieldInfo.complexName && !fieldInfo.complexIsOpen) {
            conflicts.push({
              type: 'complex_closed',
              description: `Game scheduled on field ${game.field} where the complex (${fieldInfo.complexName}) is closed`,
              severity: 'critical',
              affectedGames: [game.id]
            });
          }
        }
      }
    }
    
    // Check for field conflicts (same field, overlapping times)
    for (const [key, fieldGames] of fieldUsage.entries()) {
      if (fieldGames.length > 1) {
        conflicts.push({
          type: 'field_overbooked',
          description: `Field ${fieldGames[0].field} has ${fieldGames.length} games scheduled at ${new Date(fieldGames[0].startTime).toLocaleTimeString()}`,
          severity: 'critical',
          affectedGames: fieldGames.map(g => g.id)
        });
      }
    }
    
    // Check for coach conflicts (same coach, overlapping games)
    for (const [coach, coachGames] of coachSchedules.entries()) {
      if (coachGames.length <= 1) continue;
      
      coachGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      for (let i = 0; i < coachGames.length - 1; i++) {
        const game1 = coachGames[i];
        const game2 = coachGames[i + 1];
        
        const game1End = new Date(game1.endTime).getTime();
        const game2Start = new Date(game2.startTime).getTime();
        
        // If less than 30 minutes between games, flag as potential conflict
        if (game2Start - game1End < 30 * 60 * 1000) {
          conflicts.push({
            type: 'coach_conflict',
            description: `Coach ${coach} has teams playing with less than 30 minutes between games`,
            severity: 'high',
            affectedGames: [game1.id, game2.id]
          });
        }
      }
    }
    
    // Check for team rest period violations
    for (const [teamId, teamGames] of teamSchedules.entries()) {
      if (teamGames.length <= 1) continue;
      
      teamGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      for (let i = 0; i < teamGames.length - 1; i++) {
        const game1 = teamGames[i];
        const game2 = teamGames[i + 1];
        
        const game1End = new Date(game1.endTime).getTime();
        const game2Start = new Date(game2.startTime).getTime();
        
        // Convert rest period to milliseconds (2 hours = 7,200,000 ms)
        const minRestPeriod = 2 * 60 * 60 * 1000;
        
        if (game2Start - game1End < minRestPeriod) {
          const teamName = game1.homeTeam.id === teamId 
            ? game1.homeTeam.name 
            : game1.awayTeam.name;
            
          conflicts.push({
            type: 'rest_period',
            description: `Team ${teamName} has less than 2 hours between games`,
            severity: 'medium',
            affectedGames: [game1.id, game2.id]
          });
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Gets all event data needed for scheduling
   * @param eventId - The event ID
   * @returns Event data including age groups, fields, etc.
   */
  private static async getEventData(eventId: string | number) {
    try {
      // Get event details - ensuring we're using the proper types
      const eventIdStr = eventId.toString();
      // For the events table, we need to use numeric comparison since it's a bigint
      const eventIdNum = Number(eventId);
      
      // Get event details
      const [eventData] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventIdNum));
        
      if (!eventData) {
        throw new Error("Event not found");
      }
      
      // Get age groups for this event - eventId columns are text in these tables
      const ageGroupsData = await db
        .select()
        .from(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventIdStr));
        
      // Get brackets for this event
      const bracketsData = await db
        .select()
        .from(eventBrackets)
        .where(eq(eventBrackets.eventId, eventIdStr));
        
      // Get fields for this event - fields don't have an eventId column
      // We'll just get all fields since they're not directly linked to events
      // Also get complexes to get field-complex relationships and operating hours
      const fieldsData = await db
        .select({
          id: fields.id,
          name: fields.name,
          hasLights: fields.hasLights,
          hasParking: fields.hasParking,
          isOpen: fields.isOpen,
          openTime: fields.openTime,
          closeTime: fields.closeTime,
          specialInstructions: fields.specialInstructions,
          complexId: fields.complexId,
          // Select only specific complex fields that exist in the database
          complexName: complexes.name,
          complexOpenTime: complexes.openTime,
          complexCloseTime: complexes.closeTime,
          complexIsOpen: complexes.isOpen
        })
        .from(fields)
        .leftJoin(complexes, eq(fields.complexId, complexes.id))
        .where(eq(fields.isOpen, true));
        
      // Get available time slots for this event
      const timeSlotsData = await db
        .select()
        .from(gameTimeSlots)
        .where(eq(gameTimeSlots.eventId, eventIdStr));
      
      // Create a fields-by-name map for easy access during conflict detection
      const fieldsByName = {};
      for (const field of fieldsData) {
        fieldsByName[field.name] = field;
      }
      
      return {
        event: eventData,
        ageGroups: ageGroupsData,
        brackets: bracketsData,
        fields: fieldsData,
        fieldsByName: fieldsByName,
        timeSlots: timeSlotsData
      };
    } catch (error) {
      console.error("Error fetching event data:", error);
      throw error;
    }
  }
  
  /**
   * Gets all teams registered for the event
   * @param eventId - The event ID
   * @returns Teams data
   */
  private static async getTeamsData(eventId: string | number) {
    try {
      // Get all teams for this event with approved status
      const eventIdStr = eventId.toString();
      
      const teamsData = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.eventId, eventIdStr),
            eq(teams.status, 'approved')
          )
        );
        
      return teamsData;
    } catch (error) {
      console.error("Error fetching teams data:", error);
      throw error;
    }
  }
  
  /**
   * Gets the current schedule for an event
   * @param eventId - The event ID
   * @returns Current schedule data
   */
  private static async getCurrentSchedule(eventId: string | number) {
    try {
      // Get existing games for this event
      const eventIdStr = eventId.toString();
      
      const gamesData = await db
        .select()
        .from(games)
        .where(eq(games.eventId, eventIdStr));
        
      return gamesData;
    } catch (error) {
      console.error("Error fetching current schedule:", error);
      throw error;
    }
  }
  
  /**
   * Gets teams without assigned brackets
   * @param eventId - The event ID
   * @returns Teams without bracket assignments
   */
  private static async getTeamsWithoutBrackets(eventId: string | number) {
    try {
      // Get teams that don't have a bracket assigned
      console.log(`Finding teams without brackets for event: ${eventId}`);
      const eventIdStr = eventId.toString();
      
      const allTeams = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.eventId, eventIdStr),
            eq(teams.status, 'approved')
          )
        );
      
      console.log(`Total approved teams found: ${allTeams.length}`);
      
      // Check if bracketId is null OR bracketId is undefined
      const teamsWithoutBrackets = allTeams.filter(team => team.bracketId === null || team.bracketId === undefined);
      
      console.log(`Teams without bracketId: ${teamsWithoutBrackets.length}`);
      // Log the first few teams for debugging
      if (teamsWithoutBrackets.length > 0) {
        console.log(`Sample team without bracket: ${JSON.stringify(teamsWithoutBrackets[0])}`);
      }
      
      return teamsWithoutBrackets;
    } catch (error) {
      console.error("Error fetching teams without brackets:", error);
      throw error;
    }
  }
  
  /**
   * Gets available brackets for an event
   * @param eventId - The event ID
   * @returns Available brackets
   */
  private static async getAvailableBrackets(eventId: string | number) {
    try {
      // Get all brackets for this event
      const eventIdStr = eventId.toString();
      
      const brackets = await db
        .select()
        .from(eventBrackets)
        .where(eq(eventBrackets.eventId, eventIdStr));
        
      return brackets;
    } catch (error) {
      console.error("Error fetching available brackets:", error);
      throw error;
    }
  }
  
  /**
   * Generates a prompt for OpenAI to create a schedule
   * @param eventData - Event data
   * @param teamsData - Teams data
   * @param constraints - Scheduling constraints
   * @returns The generated prompt
   */
  private static generateSchedulingPrompt(eventData: any, teamsData: any, constraints: ScheduleConstraints) {
    return `
I need you to generate an optimal schedule for a soccer tournament with the following details:

EVENT INFORMATION:
- Name: ${eventData.event.name}
- Start Date: ${eventData.event.startDate}
- End Date: ${eventData.event.endDate}
- Number of Fields: ${eventData.fields.length}
- Available Fields: ${eventData.fields.map(f => f.name).join(', ')}

FIELD AVAILABILITY CONSTRAINTS:
${eventData.fields.map(f => `- ${f.name}: Open from ${f.openTime} to ${f.closeTime} ${f.complexName ? `(Complex: ${f.complexName}, Open from ${f.complexOpenTime} to ${f.complexCloseTime})` : ''}`).join('\n')}

TEAMS INFORMATION:
${teamsData.map(team => `- Team ID: ${team.id}, Name: ${team.name}, Age Group: ${team.ageGroup}, Coach: ${team.coach || 'Unknown'}, Bracket: ${team.bracketId || 'Not assigned'}`).join('\n')}

SCHEDULING CONSTRAINTS:
- Maximum Games Per Day: ${constraints.maxGamesPerDay || 3}
- Minutes Per Game: ${constraints.minutesPerGame || 60}
- Break Between Games: ${constraints.breakBetweenGames || 15} minutes
- Minimum Rest Period: ${constraints.minRestPeriod || 2} hours between games for the same team
- Resolve Coach Conflicts: ${constraints.resolveCoachConflicts ? 'Yes' : 'No'}
- Optimize Field Usage: ${constraints.optimizeFieldUsage ? 'Yes' : 'No'}
- Tournament Format: ${constraints.tournamentFormat || 'round_robin_knockout'}

SCHEDULING INSTRUCTIONS:
1. Schedule games for each bracket separately
2. Avoid scheduling games for teams with the same coach at overlapping times
3. Ensure adequate rest periods between games for each team
4. Teams should play roughly the same number of games
5. Distribute games evenly across all available fields
6. IMPORTANT: Only schedule games during the operating hours of each field
7. IMPORTANT: Do not schedule games on fields where their complex is closed
8. For tournament formats:
   - Round Robin: Each team plays against every other team in their bracket once
   - Knockout: Teams advance based on wins
   - Round Robin + Knockout: Group stage followed by playoffs

OUTPUT REQUIREMENTS:
Generate a JSON schedule with the following structure:
{
  "games": [
    {
      "id": "1",
      "homeTeam": { "id": 1, "name": "Team A", "coach": "Coach Name" },
      "awayTeam": { "id": 2, "name": "Team B", "coach": "Coach Name" },
      "field": "Field Name",
      "startTime": "ISO timestamp",
      "endTime": "ISO timestamp",
      "bracket": "Bracket Name",
      "round": "Group Stage/Quarterfinal/etc"
    }
  ],
  "qualityScore": 85,
  "bracketSchedules": [
    {
      "bracketId": 1,
      "bracketName": "U10 Elite",
      "format": "round_robin",
      "games": [game references]
    }
  ]
}

Make sure all times are valid ISO timestamp strings and don't schedule games outside the event dates. Include morning and afternoon games, with adequate breaks for lunch.
`;
  }
  
  /**
   * Generates a prompt for OpenAI to optimize an existing schedule
   * @param existingSchedule - Current schedule
   * @param teamsData - Teams data
   * @param eventData - Event data
   * @param options - Optimization options
   * @returns The generated prompt
   */
  private static generateOptimizationPrompt(existingSchedule: any, teamsData: any, eventData: any, options: OptimizationOptions) {
    return `
I need you to optimize an existing soccer tournament schedule to fix conflicts while making minimal changes.

EXISTING SCHEDULE:
${JSON.stringify(existingSchedule, null, 2)}

TEAMS INFORMATION:
${teamsData.map(team => `- Team ID: ${team.id}, Name: ${team.name}, Age Group: ${team.ageGroup}, Coach: ${team.coach || 'Unknown'}, Bracket: ${team.bracketId || 'Not assigned'}`).join('\n')}

EVENT INFORMATION:
- Name: ${eventData.event.name}
- Start Date: ${eventData.event.startDate}
- End Date: ${eventData.event.endDate}
- Available Fields: ${eventData.fields.map(f => f.name).join(', ')}

FIELD AVAILABILITY CONSTRAINTS:
${eventData.fields.map(f => `- ${f.name}: Open from ${f.openTime} to ${f.closeTime} ${f.complexName ? `(Complex: ${f.complexName}, Open from ${f.complexOpenTime} to ${f.complexCloseTime})` : ''}`).join('\n')}

OPTIMIZATION PRIORITIES:
- Resolve Coach Conflicts: ${options.resolveCoachConflicts ? 'Yes' : 'No'} (The same coach should not have overlapping games)
- Optimize Field Usage: ${options.optimizeFieldUsage ? 'Yes' : 'No'} (Distribute games evenly across fields)
- Minimize Travel: ${options.minimizeTravel ? 'Yes' : 'No'} (Keep a team's games on the same or nearby fields when possible)
- IMPORTANT: Only schedule games during the operating hours of each field
- IMPORTANT: Do not schedule games on fields where their complex is closed

OUTPUT REQUIREMENTS:
Generate a JSON with the optimized schedule with the following structure:
{
  "games": [
    {
      "id": "game_id",
      "homeTeam": { "id": 1, "name": "Team A", "coach": "Coach Name" },
      "awayTeam": { "id": 2, "name": "Team B", "coach": "Coach Name" },
      "field": "Field Name",
      "startTime": "ISO timestamp",
      "endTime": "ISO timestamp",
      "bracket": "Bracket Name",
      "round": "Group Stage/Quarterfinal/etc"
    }
  ],
  "qualityScore": 95,
  "changesApplied": [
    { "gameId": "game_id", "type": "field_change", "from": "Field A", "to": "Field B" },
    { "gameId": "game_id", "type": "time_change", "from": "ISO timestamp", "to": "ISO timestamp" }
  ]
}

Make only necessary changes to fix conflicts. Prioritize changing game times or fields over changing team matchups.
`;
  }
  
  /**
   * Generates a prompt for OpenAI to suggest bracket assignments
   * @param teamsWithoutBrackets - Teams without brackets
   * @param availableBrackets - Available brackets
   * @returns The generated prompt
   */
  private static generateBracketAssignmentPrompt(teamsWithoutBrackets: any, availableBrackets: any) {
    return `
I need you to suggest appropriate bracket assignments for soccer teams that don't have brackets assigned.

TEAMS WITHOUT BRACKET ASSIGNMENTS:
${teamsWithoutBrackets.map(team => `- Team ID: ${team.id}, Name: ${team.name}, Age Group: ${team.ageGroup}, Division Code: ${team.divisionCode || 'N/A'}`).join('\n')}

AVAILABLE BRACKETS:
${availableBrackets.map(bracket => `- Bracket ID: ${bracket.id}, Name: ${bracket.name}, Age Group ID: ${bracket.ageGroupId}, Description: ${bracket.description || 'N/A'}`).join('\n')}

ASSIGNMENT GUIDELINES:
1. Match teams with brackets appropriate for their age group
2. Use division codes to determine competitive level when available
3. Teams from the same club/organization with similar names should be in the same bracket if possible
4. If a team's age group doesn't match any bracket exactly, suggest the closest appropriate bracket

OUTPUT REQUIREMENTS:
Generate a JSON with suggested bracket assignments:
{
  "bracketAssignments": [
    {
      "teamId": 1,
      "teamName": "Team A",
      "suggestedBracketId": 3,
      "suggestedBracketName": "U10 Elite",
      "confidence": 0.85,
      "reasoning": "Based on division code and age group match"
    }
  ]
}

Provide a confidence score (0-1) and brief reasoning for each suggestion.
`;
  }
}

/**
 * Scheduling constraints interface
 */
interface ScheduleConstraints {
  maxGamesPerDay?: number;
  minutesPerGame?: number;
  breakBetweenGames?: number;
  minRestPeriod?: number;
  resolveCoachConflicts?: boolean;
  optimizeFieldUsage?: boolean;
  tournamentFormat?: string;
}

/**
 * Optimization options interface
 */
interface OptimizationOptions {
  resolveCoachConflicts?: boolean;
  optimizeFieldUsage?: boolean;
  minimizeTravel?: boolean;
}

/**
 * Schedule conflict interface
 */
interface ScheduleConflict {
  type: 'coach_conflict' | 'field_overbooked' | 'rest_period' | 'field_hours' | 'complex_closed' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedGames: string[];
}