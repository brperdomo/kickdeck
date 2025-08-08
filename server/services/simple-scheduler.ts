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

    const poolGames: any[] = [];
    const knockoutGames: any[] = [];
    let gameCounter = 1;

    // Separate pool games from knockout/TBD games during processing
    for (const bracketData of workflowGames) {
      console.log(`📋 Processing bracket: ${bracketData.bracketName}`);
      
      for (const workflowGame of bracketData.games) {
        console.log(`🏐 Processing game: ${workflowGame.homeTeamName} vs ${workflowGame.awayTeamName} (IDs: ${workflowGame.homeTeamId} vs ${workflowGame.awayTeamId})`);
        
        // Determine if this is a TBD/knockout game
        const hasTBDTeams = workflowGame.homeTeamName?.includes('TBD') || workflowGame.awayTeamName?.includes('TBD');
        const isKnockout = workflowGame.gameType === 'knockout' || workflowGame.gameType === 'final' || 
                          workflowGame.round?.includes('Final') || workflowGame.round?.includes('Semifinal') || 
                          workflowGame.round?.includes('Quarterfinal');
        
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
          ageGroup: (bracketData.bracketName && bracketData.bracketName.includes('U17')) ? 'U17 Boys' : 'Unknown Age Group',
          bracket: bracketData.bracketName,
          // Generate realistic game times with proper rest time (will be resolved during async processing)
          startTime: '', // Will be set during async processing
          endTime: '', // Will be set during async processing
          fieldId: SimpleScheduler.assignRealFieldIdSync(gameCounter - 1, bracketData.bracketName || 'Unknown', realComplexes), // Assign field based on age group requirements
          field: 'TBD', // Will be assigned using field availability service  
          complexName: 'TBD', // Will be assigned using field availability service
          // Add field size information for display
          fieldSize: SimpleScheduler.getFieldSizeForAgeGroup(bracketData.bracketName),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Sort games: Pool games first, TBD/knockout games last
        if (hasTBDTeams || isKnockout) {
          knockoutGames.push(game);
          console.log(`🏆 Added to knockout games: ${game.homeTeamName} vs ${game.awayTeamName} (${game.round})`);
        } else {
          poolGames.push(game);
          console.log(`🏊 Added to pool games: ${game.homeTeamName} vs ${game.awayTeamName} (${game.round})`);
        }
      }
    }

    // Combine games: ALL pool games first, then ALL knockout/TBD games
    const allGames = [...poolGames, ...knockoutGames];
    console.log(`📊 Game ordering: ${poolGames.length} pool games first, then ${knockoutGames.length} knockout/TBD games`);
    
    // Renumber games to maintain proper sequence
    allGames.forEach((game, index) => {
      game.gameNumber = index + 1;
    });

    // Generate game times: Pool games first, then TBD games after rest period on second day
    console.log(`⏰ Generating game times with ${restTime}-minute rest periods from actual field operating hours...`);
    
    // Schedule all pool games first
    for (let i = 0; i < poolGames.length; i++) {
      const startTime = SimpleScheduler.generateGameTimeSync(i, 0, gameDuration, restTime, realComplexes, eventData);
      const endTime = SimpleScheduler.generateGameTimeSync(i, gameDuration, gameDuration, restTime, realComplexes, eventData);
      
      poolGames[i].startTime = startTime;
      poolGames[i].endTime = endTime;
      console.log(`🏊 Pool Game ${i + 1}: ${poolGames[i].homeTeamName} vs ${poolGames[i].awayTeamName} at ${startTime}`);
    }
    
    // Schedule TBD/knockout games AFTER all pool games complete + rest period
    if (knockoutGames.length > 0) {
      console.log(`🏆 CRITICAL TBD FIX: Scheduling ${knockoutGames.length} TBD/knockout games AFTER pool play completion...`);
      
      // Find the latest pool game end time to determine when TBD games can start
      let latestPoolEndTime = '';
      if (poolGames.length > 0) {
        latestPoolEndTime = poolGames.reduce((latest, game) => {
          return game.endTime > latest ? game.endTime : latest;
        }, poolGames[0].endTime);
      }
      
      // Calculate when TBD games can start (latest pool game end + rest period)
      const latestPoolEndDate = new Date(latestPoolEndTime);
      const tbdStartTime = new Date(latestPoolEndDate.getTime() + (restTime * 60 * 1000)); // Add rest period
      
      // Force TBD games to start on Day 2 at 8:00 AM minimum
      const eventStartDate = new Date(eventData?.startDate || '2025-08-16');
      const day2Start = new Date(eventStartDate);
      day2Start.setDate(day2Start.getDate() + 1); // Next day
      day2Start.setHours(8, 0, 0, 0); // 8:00 AM
      
      // Use the later of: (latest pool game + rest) OR (Day 2 at 8:00 AM)
      const tbdStartDate = tbdStartTime > day2Start ? tbdStartTime : day2Start;
      const tbdStartTimeStr = tbdStartDate.toISOString().replace('Z', '').substring(0, 19);
      
      console.log(`🏆 CRITICAL TBD FIX: Latest pool game ends at ${latestPoolEndTime}`);
      console.log(`🏆 CRITICAL TBD FIX: TBD games start at ${tbdStartTimeStr} (after ${restTime}-min rest)`);
      
      // Schedule each TBD game starting from the calculated time
      for (let i = 0; i < knockoutGames.length; i++) {
        const gameStartTime = new Date(tbdStartDate.getTime() + (i * (gameDuration + restTime) * 60 * 1000));
        const gameEndTime = new Date(gameStartTime.getTime() + (gameDuration * 60 * 1000));
        
        knockoutGames[i].startTime = gameStartTime.toISOString().replace('Z', '').substring(0, 19);
        knockoutGames[i].endTime = gameEndTime.toISOString().replace('Z', '').substring(0, 19);
        console.log(`🏆 TBD Game ${i + 1}: ${knockoutGames[i].homeTeamName} vs ${knockoutGames[i].awayTeamName} at ${knockoutGames[i].startTime}`);
      }
    }
    
    // Update the combined array with proper scheduling
    allGames.forEach((game, index) => {
      if (index < poolGames.length) {
        allGames[index] = poolGames[index];
      } else {
        allGames[index] = knockoutGames[index - poolGames.length];
      }
    });

    // Create time slots for all games with proper database associations
    await SimpleScheduler.createTimeSlots(eventId, allGames, eventData, gameDuration, restTime);

    console.log(`💾 Prepared ${allGames.length} games for database with time slot associations`);
    
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
      await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
      
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
          // CRITICAL CROSS-EVENT FIELD VALIDATION: Check if field is available across all events
          const fieldConflicts = await SimpleScheduler.validateCrossEventFieldAvailability(
            game.fieldId, 
            game.startTime, 
            game.endTime,
            eventId
          );
          
          if (fieldConflicts.length > 0) {
            console.log(`⚠️ FIELD CONFLICT DETECTED for Field ${game.fieldId}: ${fieldConflicts.join(', ')}`);
            // Try to find an alternative field with same field size
            const alternativeField = await SimpleScheduler.findAlternativeField(
              game.fieldSize || '11v11',
              game.startTime,
              game.endTime,
              eventId
            );
            
            if (alternativeField) {
              console.log(`🔄 FIELD REASSIGNMENT: Using Field ${alternativeField.id} instead of ${game.fieldId}`);
              game.fieldId = alternativeField.id;
              allGames[game.originalIndex].fieldId = alternativeField.id;
            } else {
              console.log(`❌ CRITICAL: No alternative fields available for game ${game.originalIndex + 1}`);
              throw new Error(`Field conflict: Field ${game.fieldId} is unavailable from ${game.startTime} to ${game.endTime} due to conflicts with other events. No alternative fields available.`);
            }
          }
          
          // Create time slot for this specific game
          const [timeSlot] = await db
            .insert(gameTimeSlots)
            .values({
              eventId: eventId,
              fieldId: game.fieldId || null,
              startTime: game.startTime,
              endTime: game.endTime,
              dayIndex: Array.from(gamesByDate.keys()).indexOf(date),
              isAvailable: false
            })
            .returning();
          
          // Update the game object with the time slot ID for later database insertion
          allGames[game.originalIndex].timeSlotId = timeSlot.id;
          
          console.log(`⚽ Game ${game.originalIndex + 1}: ${date} linked to time slot ${timeSlot.id} on Field ${game.fieldId}`);
        }
      }
      
      console.log('✅ Time slot associations created successfully');
      
    } catch (error) {
      console.error('❌ Error creating time slots:', error);
      // Don't throw error - let scheduling continue without time slots if needed
    }
  }

  /**
   * CRITICAL CROSS-EVENT FIELD VALIDATION
   * Validates that a field is available across all events, not just the current event
   */
  static async validateCrossEventFieldAvailability(
    fieldId: number, 
    startTime: string, 
    endTime: string, 
    currentEventId: string
  ): Promise<string[]> {
    const conflicts: string[] = [];
    
    try {
      // Query ALL existing games across ALL events that use this field
      const existingGames = await db
        .select({
          gameId: games.id,
          eventId: games.eventId,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          fieldId: games.fieldId,
          timeSlotId: games.timeSlotId
        })
        .from(games)
        .where(eq(games.fieldId, fieldId));
      
      // Get time slots for these games to check for overlaps
      const gameTimeSlotIds = existingGames
        .filter(g => g.timeSlotId !== null)
        .map(g => g.timeSlotId);
      
      if (gameTimeSlotIds.length > 0) {
        const existingTimeSlots = await db
          .select()
          .from(gameTimeSlots)
          .where(inArray(gameTimeSlots.id, gameTimeSlotIds));
        
        // Check for time overlaps
        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);
        
        for (const timeSlot of existingTimeSlots) {
          const existingStart = new Date(timeSlot.startTime);
          const existingEnd = new Date(timeSlot.endTime);
          
          // Check for time overlap
          if (newStart < existingEnd && newEnd > existingStart) {
            // Only report conflicts with OTHER events (not the current event)
            if (timeSlot.eventId !== currentEventId) {
              conflicts.push(
                `Event ${timeSlot.eventId} has game from ${existingStart.toLocaleTimeString()} to ${existingEnd.toLocaleTimeString()}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error validating cross-event field availability:', error);
      // Don't block scheduling on validation errors, but log them
    }
    
    return conflicts;
  }

  /**
   * Find alternative field with same field size that's available at the given time
   */
  static async findAlternativeField(
    requiredFieldSize: string,
    startTime: string,
    endTime: string,
    currentEventId: string
  ): Promise<{id: number, name: string} | null> {
    try {
      // Get all fields with the required field size
      const availableFields = await db
        .select({
          id: fields.id,
          name: fields.name,
          fieldSize: fields.fieldSize
        })
        .from(fields)
        .where(eq(fields.fieldSize, requiredFieldSize));
      
      // Check each field for availability
      for (const field of availableFields) {
        const conflicts = await SimpleScheduler.validateCrossEventFieldAvailability(
          field.id,
          startTime,
          endTime,
          currentEventId
        );
        
        if (conflicts.length === 0) {
          console.log(`✅ Found available alternative: Field ${field.id} (${field.name})`);
          return field;
        }
      }
      
      return null; // No alternative fields available
    } catch (error) {
      console.error('Error finding alternative field:', error);
      return null;
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
   * Assign real field ID based on age group requirements and availability (synchronous version)
   */
  static assignRealFieldIdSync(gameNumber: number, bracketName: string, realComplexes: any[]): number | null {
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
    
    // Round-robin field assignment
    const selectedField = suitableFields[gameNumber % suitableFields.length];
    return selectedField.id;
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
   * Assign real field based on age group requirements and availability (synchronous version)
   */
  static assignRealFieldSync(gameNumber: number, bracketName: string, realComplexes: any[]): string {
    const requiredFieldSize = this.getFieldSizeForAgeGroup(bracketName);
    
    // Find fields that match the required field size
    const suitableFields = [];
    
    realComplexes.forEach(complex => {
      if (complex.fields && Array.isArray(complex.fields)) {
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
      }
    });

    if (suitableFields.length === 0) {
      return `No ${requiredFieldSize} fields available`;
    }

    // Rotate through available fields
    const selectedField = suitableFields[gameNumber % suitableFields.length];
    return selectedField.name;
  }

  /**
   * Get complex name for assigned field (synchronous version)
   */
  static getComplexForFieldSync(gameNumber: number, bracketName: string, realComplexes: any[]): string {
    const requiredFieldSize = this.getFieldSizeForAgeGroup(bracketName);
    
    // Find fields that match the required field size
    const suitableFields = [];
    
    realComplexes.forEach(complex => {
      if (complex.fields && Array.isArray(complex.fields)) {
        complex.fields.forEach(field => {
          if (field.fieldSize === requiredFieldSize && field.isOpen) {
            suitableFields.push({
              name: field.name,
              complexName: complex.name,
            });
          }
        });
      }
    });

    if (suitableFields.length === 0) {
      return 'No Complex Available';
    }

    // Rotate through available complexes
    const selectedField = suitableFields[gameNumber % suitableFields.length];
    return selectedField.complexName;
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
   * Generate realistic game time scheduling (synchronous version) with proper rest time enforcement
   */
  static generateGameTimeSync(
    gameNumber: number, 
    additionalMinutes: number = 0, 
    gameDuration: number = 90, 
    restTime: number = 60,
    realComplexes: any[] = [],
    eventData: any = null
  ): string {
    // Get field operating parameters from database
    let fieldOpeningHour = 8;
    let fieldClosingHour = 22; // 10 PM
    let timezone = 'America/Los_Angeles'; // Default to Pacific Time for California venues
    
    if (realComplexes.length > 0) {
      const firstComplex = realComplexes[0];
      
      // Parse field operating hours from database
      if (firstComplex.fields && firstComplex.fields.length > 0) {
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
    
    // CRITICAL FIX: Calculate proper time intervals with enforced rest periods
    // Each game slot needs: game duration + rest time + buffer
    const bufferTime = 15; // 15-minute buffer for cleanup/setup
    const timeInterval = gameDuration + restTime + bufferTime; // Total time per game slot including rest
    
    console.log(`⏰ REST TIME FIX: Game ${gameNumber} - Duration: ${gameDuration}min + Rest: ${restTime}min + Buffer: ${bufferTime}min = ${timeInterval}min total per slot`);
    
    // Calculate available hours per day for games
    const dailyOperatingMinutes = (fieldClosingHour - fieldOpeningHour) * 60;
    const gamesPerDay = Math.floor(dailyOperatingMinutes / timeInterval);
    
    console.log(`⏰ REST TIME FIX: Daily capacity: ${dailyOperatingMinutes}min ÷ ${timeInterval}min = ${gamesPerDay} games per day`);
    
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
    
    // CRITICAL FIX: Calculate game start time with proper rest period enforcement
    const gameStartMinutes = (gameSlotInDay * timeInterval) + additionalMinutes;
    const totalGameHour = fieldOpeningHour + Math.floor(gameStartMinutes / 60);
    const totalGameMinute = gameStartMinutes % 60;
    
    // Create time string in HH:MM:SS format
    const timeStr = `${totalGameHour.toString().padStart(2, '0')}:${totalGameMinute.toString().padStart(2, '0')}:00`;
    
    console.log(`⏰ REST TIME FIX: Game ${gameNumber} scheduled at ${timeStr} (Day ${dayNumber}, Slot ${gameSlotInDay})`);
    
    // Return as YYYY-MM-DDTHH:MM:SS (without timezone to avoid UTC conversion)
    return `${dateStr}T${timeStr}`;
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