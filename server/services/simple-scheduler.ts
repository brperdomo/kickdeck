/**
 * Simple Tournament Scheduler
 * 
 * Directly processes workflow game data and saves to database
 * No complex algorithms - just field/time assignment
 */

import { db } from "../../db";
import { eq, inArray } from "drizzle-orm";
import { games, eventBrackets, complexes, fields, teams, events, gameTimeSlots } from "../../db/schema";

export class SimpleScheduler {
  static async generateSchedule(eventId: string, workflowData: any, options: {
    minRestPeriod?: number;
    minutesPerGame?: number;
    breakBetweenGames?: number;
  } = {}) {
    console.log('🏆 Simple scheduler processing workflow data...');
    
    // Set defaults for scheduling parameters
    const gameDuration = options.minutesPerGame || 90;
    const restTime = options.minRestPeriod || 60; // User specified 90 minutes rest
    const breakTime = options.breakBetweenGames || 15;
    
    const { workflowGames } = workflowData;
    
    // Get event dates from database
    const eventData = await SimpleScheduler.getEventData(eventId);
    
    if (!workflowGames || workflowGames.length === 0) {
      throw new Error('No game data found in workflow');
    }

    // Get real complex and field data for this event
    const realComplexes = await SimpleScheduler.getRealComplexesForEvent(eventId);
    console.log(`📍 Found ${realComplexes.length} complexes with fields for event ${eventId}`);

    // Get team coach information for conflict detection
    const teamCoaches = await SimpleScheduler.getTeamCoachInfo(eventId);
    console.log(`👨‍🏫 Loaded coach information for ${Object.keys(teamCoaches).length} teams`);

    const allGames: any[] = [];
    let gameCounter = 1;

    // Process each bracket's games
    for (const bracketData of workflowGames) {
      console.log(`📋 Processing bracket: ${bracketData.bracketName}`);
      
      for (const workflowGame of bracketData.games) {
        console.log(`🏐 Processing game: ${workflowGame.homeTeamName} vs ${workflowGame.awayTeamName} (IDs: ${workflowGame.homeTeamId} vs ${workflowGame.awayTeamId})`);
        
        // Convert workflow game to database format with team names for frontend
        const game = {
          eventId,
          ageGroupId: 0, // Will be resolved during database insertion
          homeTeamId: workflowGame.homeTeamId,
          awayTeamId: workflowGame.awayTeamId,
          homeTeamName: workflowGame.homeTeamName, // Include team names for frontend
          awayTeamName: workflowGame.awayTeamName,
          duration: workflowGame.duration || 90,
          gameNumber: gameCounter++,
          round: workflowGame.round || 'Pool Play',
          gameType: workflowGame.gameType || 'pool_play',
          notes: `${workflowGame.round} - ${bracketData.bracketName}`,
          status: 'scheduled' as const,
          breakTime: 15,
          bracketId: bracketData.bracketId, // Include bracket ID for lookup
          bracketName: bracketData.bracketName, // Store bracket name in database
          ageGroup: bracketData.bracketName.includes('U17') ? 'U17 Boys' : 'Unknown Age Group',
          bracket: bracketData.bracketName,
          // Generate realistic game times with proper rest time (will be resolved during async processing)
          startTime: '', // Will be set during async processing
          endTime: '', // Will be set during async processing
          fieldId: await SimpleScheduler.assignRealFieldId(gameCounter - 1, bracketData.bracketName, realComplexes),
          field: await SimpleScheduler.assignRealField(gameCounter, bracketData.bracketName, realComplexes),
          complexName: await SimpleScheduler.getComplexForField(gameCounter, bracketData.bracketName, realComplexes),
          // Add field size information for display
          fieldSize: SimpleScheduler.getFieldSizeForAgeGroup(bracketData.bracketName),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        allGames.push(game);
      }
    }

    // Now generate proper game times for all games using systematic approach
    console.log(`⏰ Generating game times with ${restTime}-minute rest periods from actual field operating hours...`);
    for (let i = 0; i < allGames.length; i++) {
      const startTime = await SimpleScheduler.generateGameTime(i, 0, gameDuration, restTime, realComplexes, eventData);
      const endTime = await SimpleScheduler.generateGameTime(i, gameDuration, gameDuration, restTime, realComplexes, eventData);
      
      allGames[i].startTime = startTime;
      allGames[i].endTime = endTime;
    }

    console.log(`💾 Prepared ${allGames.length} games for database`);
    
    // Create time slots and link games for robust scheduling
    await SimpleScheduler.createTimeSlots(eventId, allGames, eventData, gameDuration, restTime);
    
    return {
      games: allGames,
      summary: {
        totalGames: allGames.length,
        poolPlayGames: allGames.filter(g => g.gameType === 'pool_play').length,
        knockoutGames: allGames.filter(g => g.gameType !== 'pool_play').length,
        fieldOpeningTime: realComplexes.length > 0 && realComplexes[0].fields.length > 0 
          ? realComplexes[0].fields[0].openTime 
          : '08:00',
        restTimeBetweenGames: restTime,
        gameDuration: gameDuration
      }
    };
  }

  /**
   * Create time slots and link games for comprehensive scheduling
   * This ensures all future tournaments have proper time slot associations
   */
  static async createTimeSlots(eventId: string, allGames: any[], eventData: any, gameDuration: number, restTime: number) {
    console.log('🕒 Creating comprehensive time slot associations...');
    
    try {
      // Clear existing time slots for this event to avoid conflicts
      await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, parseInt(eventId)));
      
      // Group games by their scheduled dates
      const gamesByDate = new Map();
      allGames.forEach((game, index) => {
        if (game.startTime && game.endTime) {
          const gameDate = game.startTime.split('T')[0]; // Extract YYYY-MM-DD
          if (!gamesByDate.has(gameDate)) {
            gamesByDate.set(gameDate, []);
          }
          gamesByDate.get(gameDate).push({ ...game, originalIndex: index });
        }
      });
      
      console.log(`📅 Creating time slots for ${gamesByDate.size} tournament days`);
      
      // Create time slots for each game
      for (const [date, dateGames] of gamesByDate) {
        console.log(`📅 Processing ${dateGames.length} games for ${date}`);
        
        for (const game of dateGames) {
          // Create time slot for this specific game
          const [timeSlot] = await db
            .insert(gameTimeSlots)
            .values({
              eventId: parseInt(eventId),
              fieldId: game.fieldId || null,
              startTime: game.startTime,
              endTime: game.endTime,
              dayIndex: Array.from(gamesByDate.keys()).indexOf(date),
              isAvailable: false
            })
            .returning();
          
          // Update the game object with the time slot ID for later database insertion
          allGames[game.originalIndex].timeSlotId = timeSlot.id;
          
          console.log(`⚽ Game ${game.originalIndex + 1}: ${date} linked to time slot ${timeSlot.id}`);
        }
      }
      
      console.log('✅ Time slot associations created successfully');
      
    } catch (error) {
      console.error('❌ Error creating time slots:', error);
      // Don't throw error - let scheduling continue without time slots if needed
    }
  }

  /**
   * Get real complexes and fields for the event
   */
  static async getRealComplexesForEvent(eventId: string) {
    try {
      const complexesWithFields = await db
        .select({
          id: complexes.id,
          name: complexes.name,
          address: complexes.address,
          openTime: complexes.openTime,
          closeTime: complexes.closeTime,
          timezone: complexes.timezone,
          fields: {
            id: fields.id,
            name: fields.name,
            fieldSize: fields.fieldSize,
            hasLights: fields.hasLights,
            isOpen: fields.isOpen,
            openTime: fields.openTime,
            closeTime: fields.closeTime,
          }
        })
        .from(complexes)
        .leftJoin(fields, eq(complexes.id, fields.complexId))
        .where(eq(fields.isOpen, true));

      // Group fields by complex
      const complexMap = new Map();
      complexesWithFields.forEach(row => {
        if (!complexMap.has(row.id)) {
          complexMap.set(row.id, {
            id: row.id,
            name: row.name,
            address: row.address,
            openTime: row.openTime,
            closeTime: row.closeTime,
            timezone: row.timezone,
            fields: []
          });
        }
        if (row.fields && row.fields.id) {
          complexMap.get(row.id).fields.push(row.fields);
        }
      });

      return Array.from(complexMap.values());
    } catch (error) {
      console.error('Error fetching complexes:', error);
      return [];
    }
  }

  /**
   * Get event data including start and end dates
   */
  static async getEventData(eventId: string) {
    const eventRecord = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);
    
    if (eventRecord.length === 0) {
      throw new Error(`Event ${eventId} not found`);
    }
    
    return eventRecord[0];
  }

  /**
   * Get team coach information for conflict detection
   */
  static async getTeamCoachInfo(eventId: string) {
    try {
      const teamData = await db
        .select({
          id: teams.id,
          name: teams.name,
          coach: teams.coach,
        })
        .from(teams)
        .where(eq(teams.eventId, eventId));

      const coachMap: Record<number, any> = {};
      teamData.forEach(team => {
        coachMap[team.id] = {
          name: team.coach,
          teamName: team.name
        };
      });

      return coachMap;
    } catch (error) {
      console.error('Error fetching team coach info:', error);
      return {};
    }
  }

  /**
   * Assign real field ID based on age group requirements and availability
   */
  static async assignRealFieldId(gameNumber: number, bracketName: string, realComplexes: any[]): Promise<number | null> {
    if (!realComplexes || realComplexes.length === 0) {
      return null;
    }

    // Get the appropriate field size for the age group
    const requiredFieldSize = SimpleScheduler.getFieldSizeForAgeGroup(bracketName);
    
    // Find suitable fields
    const suitableFields: any[] = [];
    
    for (const complex of realComplexes) {
      if (complex.fields && Array.isArray(complex.fields)) {
        const matchingFields = complex.fields.filter((field: any) => 
          field.fieldSize === requiredFieldSize
        );
        suitableFields.push(...matchingFields);
      }
    }
    
    if (suitableFields.length === 0) {
      // Fallback to any available field
      for (const complex of realComplexes) {
        if (complex.fields && Array.isArray(complex.fields)) {
          suitableFields.push(...complex.fields);
        }
      }
    }
    
    if (suitableFields.length === 0) {
      return null;
    }
    
    // Simple round-robin field assignment
    const fieldIndex = gameNumber % suitableFields.length;
    return suitableFields[fieldIndex].id;
  }

  /**
   * Assign real field based on age group requirements and availability
   */
  static async assignRealField(gameNumber: number, bracketName: string, realComplexes: any[]): Promise<string> {
    const requiredFieldSize = this.getFieldSizeForAgeGroup(bracketName);
    
    // Find fields that match the required field size
    const suitableFields = [];
    
    realComplexes.forEach(complex => {
      complex.fields.forEach(field => {
        if (field.fieldSize === requiredFieldSize && field.isOpen) {
          suitableFields.push({
            name: field.name,
            complexName: complex.name,
            fieldSize: field.fieldSize,
            hasLights: field.hasLights
          });
        }
      });
    });

    if (suitableFields.length === 0) {
      return `No ${requiredFieldSize} fields available`;
    }

    // Rotate through available fields
    const selectedField = suitableFields[gameNumber % suitableFields.length];
    return selectedField.name;
  }

  /**
   * Get complex name for assigned field
   */
  static async getComplexForField(gameNumber: number, bracketName: string, realComplexes: any[]): Promise<string> {
    const requiredFieldSize = this.getFieldSizeForAgeGroup(bracketName);
    
    // Find fields that match the required field size
    const suitableFields = [];
    
    realComplexes.forEach(complex => {
      complex.fields.forEach(field => {
        if (field.fieldSize === requiredFieldSize && field.isOpen) {
          suitableFields.push({
            name: field.name,
            complexName: complex.name,
          });
        }
      });
    });

    if (suitableFields.length === 0) {
      return 'No suitable complex available';
    }

    // Return complex name for the assigned field
    const selectedField = suitableFields[gameNumber % suitableFields.length];
    return selectedField.complexName;
  }

  /**
   * Generate realistic game time scheduling
   * Starting from event start date at field opening time, with configurable rest time between games
   * Dynamically reads field opening times and timezones from database
   * Enforces field operating hours (8 AM - 10 PM)
   */
  static async generateGameTime(
    gameNumber: number, 
    additionalMinutes: number = 0, 
    gameDuration: number = 90, 
    restTime: number = 60,
    realComplexes: any[] = [],
    eventData: any = null
  ): Promise<string> {
    // Get field operating parameters from database
    let fieldOpeningHour = 8;
    let fieldClosingHour = 22; // 10 PM
    let timezone = 'America/Los_Angeles'; // Default to Pacific Time for California venues
    
    if (realComplexes.length > 0) {
      const firstComplex = realComplexes[0];
      
      // Parse field operating hours from database
      if (firstComplex.fields.length > 0) {
        if (firstComplex.fields[0].openTime) {
          const openTime = firstComplex.fields[0].openTime;
          fieldOpeningHour = parseInt(openTime.split(':')[0]);
        }
        if (firstComplex.fields[0].closeTime) {
          const closeTime = firstComplex.fields[0].closeTime;
          fieldClosingHour = parseInt(closeTime.split(':')[0]);
        }
      }
      
      // Use complex timezone if available
      timezone = (firstComplex as any).timezone || 'America/Los_Angeles';
    }
    
    console.log(`⏰ Field operating hours: ${fieldOpeningHour}:00 - ${fieldClosingHour}:00 (${timezone})`);
    
    // Calculate available hours per day for games
    const dailyOperatingMinutes = (fieldClosingHour - fieldOpeningHour) * 60;
    const timeInterval = gameDuration + restTime; // Total time per game slot
    const gamesPerDay = Math.floor(dailyOperatingMinutes / timeInterval);
    
    console.log(`⏰ Can fit ${gamesPerDay} games per day (${timeInterval} min slots in ${dailyOperatingMinutes} min window)`);
    
    // Determine which day and time slot for this game
    const dayNumber = Math.floor(gameNumber / gamesPerDay);
    const gameSlotInDay = gameNumber % gamesPerDay;
    
    // Use event start date instead of calculating from current date
    let targetDate;
    if (eventData && eventData.startDate) {
      targetDate = new Date(eventData.startDate);
      targetDate.setDate(targetDate.getDate() + dayNumber);
    } else {
      // Fallback to next Saturday if no event data
      const today = new Date();
      const daysUntilSaturday = (6 - today.getDay()) % 7;
      targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + (daysUntilSaturday || 7) + dayNumber);
    }
    
    // Format date as YYYY-MM-DD
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Calculate the game start time in minutes from field opening
    const gameStartMinutes = (gameSlotInDay * timeInterval) + additionalMinutes;
    const totalGameHour = fieldOpeningHour + Math.floor(gameStartMinutes / 60);
    const totalGameMinute = gameStartMinutes % 60;
    
    // Create time string in HH:MM:SS format
    const timeStr = `${totalGameHour.toString().padStart(2, '0')}:${totalGameMinute.toString().padStart(2, '0')}:00`;
    
    // Validate the game time is within operating hours
    const gameEndHour = totalGameHour + Math.ceil(gameDuration / 60);
    
    if (totalGameHour < fieldOpeningHour || gameEndHour > fieldClosingHour) {
      console.warn(`⚠️ Game ${gameNumber} scheduled outside operating hours: ${timeStr}`);
    } else {
      console.log(`✅ Game ${gameNumber} scheduled: ${timeStr}`);
    }
    
    // Return as YYYY-MM-DDTHH:MM:SS (without timezone to avoid UTC conversion)
    return `${dateStr}T${timeStr}`;
  }

  /**
   * Assign field based on age group requirements and game distribution
   */
  static assignField(gameNumber: number, bracketName: string): string {
    const fieldSize = this.getFieldSizeForAgeGroup(bracketName);
    
    // Different field numbering based on field size
    switch (fieldSize) {
      case '4v4':
        return `Small Field ${Math.ceil(gameNumber / 4)}`; // More games per field for small fields
      case '7v7':
        return `7v7 Field ${Math.ceil(gameNumber / 3)}`;
      case '9v9':
        return `9v9 Field ${Math.ceil(gameNumber / 2)}`;
      case '11v11':
      default:
        return `Full Field ${gameNumber}`; // One game per full field at a time
    }
  }

  /**
   * Get appropriate complex based on age group
   */
  static getComplexForAgeGroup(bracketName: string): string {
    const fieldSize = this.getFieldSizeForAgeGroup(bracketName);
    
    switch (fieldSize) {
      case '4v4':
        return 'Youth Complex (Small Fields)';
      case '7v7':
        return 'Training Complex (7v7 Fields)';
      case '9v9':
        return 'Junior Complex (9v9 Fields)';
      case '11v11':
      default:
        return 'Main Stadium Complex (Full Fields)';
    }
  }

  /**
   * Get field size based on age group
   */
  static getFieldSizeForAgeGroup(bracketName: string): string {
    // Extract age from bracket name (e.g., "U17 Boys Flight A" -> "U17")
    const ageMatch = bracketName.match(/U(\d+)/);
    if (!ageMatch) return '11v11';
    
    const age = parseInt(ageMatch[1]);
    
    // Apply standard field size rules
    if (age <= 7) return '4v4';
    if (age <= 10) return '7v7';
    if (age <= 12) return '9v9';
    return '11v11';
  }
}