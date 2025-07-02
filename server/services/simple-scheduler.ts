/**
 * Simple Tournament Scheduler
 * 
 * Directly processes workflow game data and saves to database
 * No complex algorithms - just field/time assignment
 */

import { db } from "../../db";
import { eq, inArray } from "drizzle-orm";
import { games, eventBrackets, complexes, fields, teams } from "../../db/schema";

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
          ageGroup: bracketData.bracketName.includes('U17') ? 'U17 Boys' : 'Unknown Age Group',
          bracket: bracketData.bracketName,
          // Generate realistic game times with proper rest time (will be resolved during async processing)
          startTime: '', // Will be set during async processing
          endTime: '', // Will be set during async processing
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
      const startTime = await SimpleScheduler.generateGameTime(i, 0, gameDuration, restTime, realComplexes);
      const endTime = await SimpleScheduler.generateGameTime(i, gameDuration, gameDuration, restTime, realComplexes);
      
      allGames[i].startTime = startTime;
      allGames[i].endTime = endTime;
    }

    console.log(`💾 Prepared ${allGames.length} games for database`);
    
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
          // timezone: complexes.timezone, // Remove until schema is updated
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
   * Starting from next Saturday at field opening time, with configurable rest time between games
   * Dynamically reads field opening times and timezones from database
   */
  static async generateGameTime(
    gameNumber: number, 
    additionalMinutes: number = 0, 
    gameDuration: number = 90, 
    restTime: number = 60,
    realComplexes: any[] = []
  ): Promise<string> {
    const nextSaturday = new Date();
    const daysUntilSaturday = (6 - nextSaturday.getDay()) % 7;
    nextSaturday.setDate(nextSaturday.getDate() + (daysUntilSaturday || 7));
    
    // Get field opening time from the first available complex, or default to 8 AM
    let fieldOpeningHour = 8;
    let timezone = 'America/New_York'; // Default timezone
    
    if (realComplexes.length > 0) {
      const firstComplex = realComplexes[0];
      
      // Parse field opening time from database (format: "08:00")
      if (firstComplex.fields.length > 0 && firstComplex.fields[0].openTime) {
        const openTime = firstComplex.fields[0].openTime;
        fieldOpeningHour = parseInt(openTime.split(':')[0]);
      }
      
      // Use complex timezone if available, otherwise default to Pacific Time  
      // Note: timezone column may not exist in all database schemas
      timezone = (firstComplex as any).timezone || 'America/Los_Angeles';
    }
    
    // Set to field opening time
    nextSaturday.setHours(fieldOpeningHour, 0, 0, 0);
    
    // Calculate time interval: game duration + minimum rest time
    const timeInterval = gameDuration + restTime;
    const gameTime = new Date(nextSaturday.getTime() + (gameNumber * timeInterval * 60 * 1000) + (additionalMinutes * 60 * 1000));
    
    return gameTime.toISOString();
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