/**
 * Fix Game Time Slots Script
 * 
 * This script creates proper gameTimeSlots records for the 7 games 
 * that exist but lack time slot data, then links them via timeSlotId.
 * 
 * The correct database structure uses:
 * - gameTimeSlots table for start/end times
 * - timeSlotId in games table to link to time slots
 */

import { db } from './db/index.ts';
import { games, gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fixGameTimeSlots() {
  try {
    const eventId = '1656618593';
    
    console.log('🔍 Finding games without time slots...');
    
    // Get all games for the event that lack timeSlotId
    const gamesWithoutTimeSlots = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));
      
    const gamesNeedingTimeSlots = gamesWithoutTimeSlots.filter(game => !game.timeSlotId);
    
    console.log(`📊 Found ${gamesNeedingTimeSlots.length} games needing time slots`);
    
    if (gamesNeedingTimeSlots.length === 0) {
      console.log('✅ All games already have time slots!');
      return;
    }
    
    // Generate systematic time scheduling starting Saturday 8 AM PT
    const startDate = new Date('2025-07-05T08:00:00-07:00'); // 8 AM Pacific Time
    const gameDurationMinutes = 90; // 90 minute games
    const breakTimeMinutes = 15; // 15 minute breaks
    const totalSlotMinutes = gameDurationMinutes + breakTimeMinutes; // 105 minutes per slot
    
    console.log('⏰ Creating time slots and linking games...');
    
    for (let i = 0; i < gamesNeedingTimeSlots.length; i++) {
      const game = gamesNeedingTimeSlots[i];
      
      // Calculate this game's time slot
      const gameStartTime = new Date(startDate);
      gameStartTime.setMinutes(gameStartTime.getMinutes() + (i * totalSlotMinutes));
      
      const gameEndTime = new Date(gameStartTime);
      gameEndTime.setMinutes(gameEndTime.getMinutes() + gameDurationMinutes);
      
      console.log(`🎮 Processing Game ${game.id} (${game.matchNumber}):`);
      console.log(`   Field ID: ${game.fieldId}`);
      console.log(`   Time: ${gameStartTime.toLocaleString()} - ${gameEndTime.toLocaleString()}`);
      
      // Create the time slot record
      const timeSlotResult = await db.insert(gameTimeSlots).values({
        eventId: eventId,
        fieldId: game.fieldId,
        startTime: gameStartTime.toISOString(),
        endTime: gameEndTime.toISOString(),
        dayIndex: 0, // First day of tournament
        isAvailable: false, // Already assigned to this game
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();
      
      const timeSlot = timeSlotResult[0];
      console.log(`   ✓ Created time slot ${timeSlot.id}`);
      
      // Link the game to the time slot
      await db.update(games)
        .set({
          timeSlotId: timeSlot.id,
          updatedAt: new Date().toISOString()
        })
        .where(eq(games.id, game.id));
        
      console.log(`   ✓ Linked game ${game.id} to time slot ${timeSlot.id}`);
    }
    
    console.log('\n🎉 All games now have proper time slots!');
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifyGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));
      
    const stillMissingTimeSlots = verifyGames.filter(game => !game.timeSlotId);
    
    if (stillMissingTimeSlots.length === 0) {
      console.log('✅ Verification successful - all games now have time slots!');
      console.log(`📅 Scheduled ${gamesNeedingTimeSlots.length} games starting Saturday 8 AM PT`);
      console.log(`⏱️  ${gameDurationMinutes} minute games with ${breakTimeMinutes} minute breaks`);
    } else {
      console.log(`❌ ${stillMissingTimeSlots.length} games still missing time slots`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing game time slots:', error);
    process.exit(1);
  }
}

// Run the fix
fixGameTimeSlots()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });