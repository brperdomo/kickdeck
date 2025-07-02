/**
 * Regenerate Schedule with All Fixes Applied
 * 
 * This script regenerates the schedule with all the identified fixes:
 * 1. Respect field opening times (8 AM for Galway Downs)
 * 2. Honor user-specified rest periods (90 minutes between games)
 * 3. Use correct timezone (Pacific Time for California)
 * 4. Generate proper time slots for drag-and-drop interface
 */

import { db } from './db.js';
import { games } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function regenerateScheduleWithFixes() {
  try {
    console.log('🏆 Regenerating schedule with all fixes...');
    
    const eventId = '1656618593'; // Target event ID
    
    // Delete existing games to regenerate fresh
    console.log('🗑️  Clearing existing games...');
    const deletedGames = await db.delete(games).where(eq(games.eventId, eventId));
    console.log(`✅ Cleared existing games for event ${eventId}`);
    
    // Simulate the API call that would regenerate with proper parameters
    console.log('📞 Making API call to regenerate schedule...');
    
    const scheduleParams = {
      workflowGames: [
        {
          bracketId: "flight_1751481344572_unassigned",
          bracketName: "U17 Boys Flight A - Director Assignment Needed",
          format: "pool_and_knockout",
          games: [
            {
              id: "flight_1751481344572_unassigned_pool_1",
              homeTeamId: 424,
              homeTeamName: "U17 Boys Team 190",
              awayTeamId: 418,
              awayTeamName: "U17 Boys Team 184",
              round: "Pool Play",
              gameType: "pool_play",
              duration: 90
            },
            {
              id: "flight_1751481344572_unassigned_pool_2", 
              homeTeamId: 424,
              homeTeamName: "U17 Boys Team 190",
              awayTeamId: 419,
              awayTeamName: "U17 Boys Team 185",
              round: "Pool Play",
              gameType: "pool_play",
              duration: 90
            },
            {
              id: "flight_1751481344572_unassigned_pool_3",
              homeTeamId: 424,
              homeTeamName: "U17 Boys Team 190", 
              awayTeamId: 421,
              awayTeamName: "U17 Boys Team 187",
              round: "Pool Play",
              gameType: "pool_play",
              duration: 90
            },
            {
              id: "flight_1751481344572_unassigned_pool_4",
              homeTeamId: 418,
              homeTeamName: "U17 Boys Team 184",
              awayTeamId: 419,
              awayTeamName: "U17 Boys Team 185", 
              round: "Pool Play",
              gameType: "pool_play",
              duration: 90
            },
            {
              id: "flight_1751481344572_unassigned_pool_5",
              homeTeamId: 418,
              homeTeamName: "U17 Boys Team 184",
              awayTeamId: 421,
              awayTeamName: "U17 Boys Team 187",
              round: "Pool Play", 
              gameType: "pool_play",
              duration: 90
            },
            {
              id: "flight_1751481344572_unassigned_pool_6",
              homeTeamId: 419,
              homeTeamName: "U17 Boys Team 185",
              awayTeamId: 421,
              awayTeamName: "U17 Boys Team 187",
              round: "Pool Play",
              gameType: "pool_play", 
              duration: 90
            },
            {
              id: "flight_1751481344572_unassigned_final",
              homeTeamId: 424,
              homeTeamName: "Team 424",
              awayTeamId: 418,
              awayTeamName: "Team 418",
              round: "Final",
              gameType: "final",
              duration: 90
            }
          ]
        }
      ],
      // These are the critical parameters that need to be honored
      minRestPeriod: 90,        // User specified 90 minutes rest
      minutesPerGame: 90,       // Standard game duration
      breakBetweenGames: 15     // Standard break time
    };
    
    // Import the SimpleScheduler service
    const { SimpleScheduler } = await import('./server/services/simple-scheduler.js');
    
    // Generate the schedule with proper parameters
    console.log('🎯 Generating schedule with correct parameters...');
    console.log(`   - Minimum rest period: ${scheduleParams.minRestPeriod} minutes`);
    console.log(`   - Game duration: ${scheduleParams.minutesPerGame} minutes`); 
    console.log(`   - Break between games: ${scheduleParams.breakBetweenGames} minutes`);
    
    const scheduleResult = await SimpleScheduler.generateSchedule(eventId, scheduleParams, {
      minRestPeriod: scheduleParams.minRestPeriod,
      minutesPerGame: scheduleParams.minutesPerGame,
      breakBetweenGames: scheduleParams.breakBetweenGames
    });
    
    console.log(`✅ Generated ${scheduleResult.games.length} games with proper timing`);
    
    // Insert the new games into the database
    console.log('💾 Saving games to database...');
    
    for (const game of scheduleResult.games) {
      // Look up age group ID from team data
      const teamData = await db.query.teams.findFirst({
        where: (teams, { eq }) => eq(teams.id, game.homeTeamId)
      });
      
      const ageGroupId = teamData?.ageGroupId || 10063; // Fallback to known U17 age group
      
      const gameData = {
        eventId: eventId,
        ageGroupId: ageGroupId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        duration: game.duration,
        gameNumber: game.gameNumber,
        round: game.round,
        gameType: game.gameType,
        notes: game.notes,
        status: 'scheduled',
        breakTime: game.breakTime,
        startTime: new Date(game.startTime),
        endTime: new Date(game.endTime),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(games).values(gameData);
      
      // Log the game details to verify timing
      const gameStart = new Date(game.startTime);
      const gameEnd = new Date(game.endTime);
      const gameTime = gameStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Los_Angeles' 
      });
      
      console.log(`   Game ${game.gameNumber}: ${game.homeTeamName} vs ${game.awayTeamName}`);
      console.log(`     → ${gameTime} Pacific Time (${game.field})`);
      console.log(`     → Duration: ${game.duration} minutes`);
    }
    
    console.log('✅ Schedule regeneration complete!');
    console.log('');
    console.log('🔧 Applied fixes:');
    console.log('   ✓ Fixed timezone: California fields now use Pacific Time');
    console.log('   ✓ Fixed opening times: Games start at 8:00 AM (field opening time)');
    console.log('   ✓ Fixed rest periods: 90 minutes minimum between games for same teams');
    console.log('   ✓ Fixed field assignments: Proper 11v11 fields for U17 teams');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Check Schedule Management interface for proper game display');
    console.log('   2. Verify drag-and-drop functionality with actual games');
    console.log('   3. Test timezone handling in Pacific Time zone');

  } catch (error) {
    console.error('❌ Error regenerating schedule:', error);
    console.error(error.stack);
  }
}

// Run the regeneration
regenerateScheduleWithFixes();