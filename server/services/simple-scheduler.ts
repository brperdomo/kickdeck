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
        // Convert workflow game to database format
        const game = {
          eventId,
          ageGroupId: 0, // Will be resolved during database insertion
          homeTeamId: workflowGame.homeTeamId,
          awayTeamId: workflowGame.awayTeamId,
          duration: workflowGame.duration || 90,
          gameNumber: gameCounter++,
          round: 1, // Simplified round numbering
          gameType: workflowGame.gameType || 'pool_play',
          notes: `${workflowGame.round} - ${bracketData.bracketName}`,
          status: 'scheduled' as const,
          breakTime: 15,
          bracketId: bracketData.bracketId, // Include bracket ID for lookup
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
}