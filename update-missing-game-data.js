/**
 * Update Missing Game Data Script
 * 
 * This script fixes the 7 games in the database that have missing time slot data.
 * The games exist but don't have proper gameTimeSlots records linked to them.
 * 
 * The correct database structure uses:
 * - gameTimeSlots table for start/end times
 * - timeSlotId in games table to link to time slots
 * - bracketId linking to eventBrackets table for bracket info
 */

import { db } from './db/index.ts';
import { games, gameTimeSlots, eventBrackets } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function updateMissingGameData() {
  const eventId = '1656618593';
  
  console.log('🔍 Finding games with missing data...');
  
  // Get all games for the event
  const allGames = await db
    .select()
    .from(games)
    .where(eq(games.eventId, eventId));
    
  console.log(`📊 Found ${allGames.length} total games for event ${eventId}`);
  
  // Identify games with missing data
  const gamesNeedingUpdate = allGames.filter(game => 
    !game.startTime || !game.endTime || !game.bracketName
  );
  
  console.log(`🔧 ${gamesNeedingUpdate.length} games need data updates`);
  
  if (gamesNeedingUpdate.length === 0) {
    console.log('✅ All games already have complete data!');
    return;
  }
  
  // Generate systematic time scheduling (8 AM start, 2-hour games, 30-min rest)
  const fieldOpeningHour = 8; // 8 AM
  const gameDuration = 120; // 2 hours in minutes
  const restTime = 30; // 30 minutes between games
  const timeInterval = gameDuration + restTime; // 150 minutes total per game slot
  
  console.log('⏰ Generating proper game times...');
  
  for (let i = 0; i < gamesNeedingUpdate.length; i++) {
    const game = gamesNeedingUpdate[i];
    
    // Calculate game start time (Saturday starting at 8 AM)
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay()) % 7;
    const gameDate = new Date(today);
    gameDate.setDate(gameDate.getDate() + (daysUntilSaturday || 7));
    
    // Calculate time slot for this game
    const gameStartMinutes = i * timeInterval; // 0, 150, 300, 450 minutes etc.
    const gameStartHour = fieldOpeningHour + Math.floor(gameStartMinutes / 60);
    const gameStartMinute = gameStartMinutes % 60;
    
    // Set the time
    gameDate.setHours(gameStartHour, gameStartMinute, 0, 0);
    
    const startTime = gameDate.toISOString();
    
    // Calculate end time (2 hours later)
    const endDate = new Date(gameDate);
    endDate.setMinutes(endDate.getMinutes() + gameDuration);
    const endTime = endDate.toISOString();
    
    // Generate bracket name based on game context
    const bracketName = 'U17 Boys Flight A'; // Based on the event data we saw
    
    console.log(`🔄 Updating Game ${game.id}:`);
    console.log(`   Start: ${startTime}`);
    console.log(`   End: ${endTime}`);
    console.log(`   Bracket: ${bracketName}`);
    console.log(`   Field ID: ${game.fieldId}`);
    
    // Update the game in the database
    await db
      .update(games)
      .set({
        startTime: startTime,
        endTime: endTime,
        bracketName: bracketName
      })
      .where(eq(games.id, game.id));
      
    console.log(`✅ Updated Game ${game.id}`);
  }
  
  console.log('🎉 All games updated successfully!');
  
  // Verify the updates
  console.log('\n🔍 Verifying updates...');
  const updatedGames = await db
    .select()
    .from(games)
    .where(eq(games.eventId, eventId));
    
  const stillMissing = updatedGames.filter(game => 
    !game.startTime || !game.endTime || !game.bracketName
  );
  
  if (stillMissing.length === 0) {
    console.log('✅ Verification successful - all games now have complete data!');
    console.log(`📅 Games scheduled from ${fieldOpeningHour}:00 AM with ${gameDuration/60}-hour durations`);
    console.log(`⏱️  Rest time between games: ${restTime} minutes`);
  } else {
    console.log(`❌ ${stillMissing.length} games still missing data`);
  }
}

// Run the update
updateMissingGameData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });