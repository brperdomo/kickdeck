/**
 * Regenerate Games with Time Slot Associations
 * 
 * This script regenerates the tournament games using the fixed SimpleScheduler
 * that properly creates time slot associations for Step 7 display.
 */

import { SimpleScheduler } from './server/services/simple-scheduler.ts';
import { db } from './db/index.ts';
import { games, gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function regenerateGamesWithTimeSlots() {
  const eventId = '1656618593';
  
  console.log('🔄 Regenerating games with time slot associations...');
  
  try {
    // Clear existing games for this event
    console.log('🗑️ Clearing existing games...');
    await db.delete(games).where(eq(games.eventId, parseInt(eventId)));
    
    // Mock workflow data based on the current tournament setup
    const workflowData = {
      workflowGames: [{
        bracketName: 'U17 Boys A - Director Assignment Needed',
        bracketId: 'flight_1751566231507_unassigned',
        games: [
          {
            homeTeamId: 419,
            homeTeamName: 'U17 Boys Team 189',
            awayTeamId: 420,
            awayTeamName: 'U17 Boys Team 187',
            gameType: 'pool_play',
            poolId: 'pool_1',
            poolName: 'Pool A'
          },
          {
            homeTeamId: 423,
            homeTeamName: 'U17 Boys Team 184',
            awayTeamId: 424,
            awayTeamName: 'U17 Boys Team 186',
            gameType: 'pool_play',
            poolId: 'pool_1',
            poolName: 'Pool A'
          },
          {
            homeTeamId: 419,
            homeTeamName: 'U17 Boys Team 189',
            awayTeamId: 423,
            awayTeamName: 'U17 Boys Team 184',
            gameType: 'pool_play',
            poolId: 'pool_1',
            poolName: 'Pool A'
          },
          {
            homeTeamId: 420,
            homeTeamName: 'U17 Boys Team 187',
            awayTeamId: 424,
            awayTeamName: 'U17 Boys Team 186',
            gameType: 'pool_play',
            poolId: 'pool_1',
            poolName: 'Pool A'
          },
          {
            homeTeamId: 419,
            homeTeamName: 'U17 Boys Team 189',
            awayTeamId: 424,
            awayTeamName: 'U17 Boys Team 186',
            gameType: 'pool_play',
            poolId: 'pool_1',
            poolName: 'Pool A'
          },
          {
            homeTeamId: 420,
            homeTeamName: 'U17 Boys Team 187',
            awayTeamId: 423,
            awayTeamName: 'U17 Boys Team 184',
            gameType: 'pool_play',
            poolId: 'pool_1',
            poolName: 'Pool A'
          },
          {
            homeTeamId: null, // Will be determined by pool standings
            homeTeamName: 'Pool Winner',
            awayTeamId: null, // Will be determined by pool standings
            awayTeamName: 'Pool Runner-up',
            gameType: 'final',
            poolId: null,
            poolName: null
          }
        ]
      }]
    };
    
    // Generate schedule with time slot associations
    console.log('⚽ Generating new schedule with SimpleScheduler...');
    const scheduledGames = await SimpleScheduler.generateSchedule(eventId, workflowData, {
      minRestPeriod: 60,
      minutesPerGame: 90,
      breakBetweenGames: 15
    });
    
    console.log(`✅ Generated ${scheduledGames.games.length} games with time slot associations`);
    
    // Insert games into database
    console.log('💾 Saving games to database...');
    for (const game of scheduledGames.games) {
      await db.insert(games).values(game);
    }
    
    console.log('🎉 Games regenerated successfully with time slot associations!');
    console.log(`📊 Summary: ${scheduledGames.games.length} games created for October 1-2, 2025`);
    
    // Verify time slot associations
    const gamesList = await db.select().from(games).where(eq(games.eventId, parseInt(eventId)));
    const gamesWithTimeSlots = gamesList.filter(g => g.timeSlotId !== null);
    
    console.log(`✅ Verification: ${gamesWithTimeSlots.length}/${gamesList.length} games have time slot associations`);
    
  } catch (error) {
    console.error('❌ Error regenerating games:', error);
  }
}

regenerateGamesWithTimeSlots();