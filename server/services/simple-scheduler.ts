/**
 * Simple Tournament Scheduler
 * 
 * Directly processes workflow game data and saves to database
 * No complex algorithms - just field/time assignment
 */

import { db } from "../../db";
import { eq } from "drizzle-orm";
import { games, eventBrackets } from "../../db/schema";

export class SimpleScheduler {
  static async generateSchedule(eventId: string, workflowData: any) {
    console.log('🏆 Simple scheduler processing workflow data...');
    
    const { workflowGames } = workflowData;
    
    if (!workflowGames || workflowGames.length === 0) {
      throw new Error('No game data found in workflow');
    }

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
          // Generate realistic game times starting from next Saturday 9 AM
          startTime: SimpleScheduler.generateGameTime(gameCounter),
          endTime: SimpleScheduler.generateGameTime(gameCounter, 90), // 90 minutes later
          field: SimpleScheduler.assignField(gameCounter, bracketData.bracketName),
          complexName: SimpleScheduler.getComplexForAgeGroup(bracketData.bracketName),
          // Add field size information for display
          fieldSize: SimpleScheduler.getFieldSizeForAgeGroup(bracketData.bracketName),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        allGames.push(game);
      }
    }

    console.log(`💾 Prepared ${allGames.length} games for database`);
    
    return {
      games: allGames,
      summary: {
        totalGames: allGames.length,
        poolPlayGames: allGames.filter(g => g.gameType === 'pool_play').length,
        knockoutGames: allGames.filter(g => g.gameType !== 'pool_play').length
      }
    };
  }

  /**
   * Generate realistic game time scheduling
   * Starting from next Saturday at 9 AM, games spaced 2 hours apart
   */
  static generateGameTime(gameNumber: number, additionalMinutes: number = 0): string {
    const nextSaturday = new Date();
    const daysUntilSaturday = (6 - nextSaturday.getDay()) % 7;
    nextSaturday.setDate(nextSaturday.getDate() + (daysUntilSaturday || 7));
    nextSaturday.setHours(9, 0, 0, 0); // Start at 9 AM
    
    // Add time for game number (2 hours between games)
    const gameTime = new Date(nextSaturday.getTime() + (gameNumber * 2 * 60 * 60 * 1000) + (additionalMinutes * 60 * 1000));
    
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