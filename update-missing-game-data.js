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
import { games, gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function updateMissingGameData() {
  try {
    const eventId = '1656618593';
    
    console.log('🔍 Checking current games and time slot data...');
    
    // Get all games for the event
    const eventGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId))
      .orderBy(games.id);
      
    console.log(`📊 Found ${eventGames.length} games for event ${eventId}`);
    
    // Get all time slots for the event
    const timeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.id);
      
    console.log(`⏰ Found ${timeSlots.length} time slots for event ${eventId}`);
    
    if (eventGames.length === 0) {
      console.log('❌ No games found for this event!');
      return;
    }
    
    if (timeSlots.length === 0) {
      console.log('❌ No time slots found for this event!');
      return;
    }
    
    // Display current game data
    console.log('\n📋 Current Games:');
    eventGames.forEach(game => {
      console.log(`   Game ${game.id}: Match ${game.matchNumber || 'N/A'} | Field ID: ${game.fieldId || 'None'} | Time Slot ID: ${game.timeSlotId || 'None'}`);
    });
    
    // Display time slot data
    console.log('\n⏰ Current Time Slots:');
    timeSlots.forEach(slot => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      console.log(`   Slot ${slot.id}: ${start.toLocaleString()} - ${end.toLocaleString()}`);
    });
    
    // Link games to time slots if they don't have timeSlotId
    console.log('\n🔗 Linking games to time slots...');
    
    for (let i = 0; i < eventGames.length && i < timeSlots.length; i++) {
      const game = eventGames[i];
      const timeSlot = timeSlots[i];
      
      if (!game.timeSlotId) {
        console.log(`🔗 Linking Game ${game.id} to Time Slot ${timeSlot.id}`);
        
        await db.update(games)
          .set({
            timeSlotId: timeSlot.id,
            updatedAt: new Date().toISOString()
          })
          .where(eq(games.id, game.id));
          
        console.log(`   ✓ Updated Game ${game.id} with Time Slot ${timeSlot.id}`);
      } else {
        console.log(`   ℹ️ Game ${game.id} already has Time Slot ID: ${game.timeSlotId}`);
      }
    }
    
    // Show final status
    console.log('\n📋 Final Status:');
    const updatedGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId))
      .orderBy(games.id);
      
    updatedGames.forEach(game => {
      console.log(`   Game ${game.id}: Field ${game.fieldId || 'Unassigned'} | Time Slot ${game.timeSlotId || 'None'}`);
    });
    
    console.log('\n✅ Game-Time Slot linking complete!');
    
  } catch (error) {
    console.error('❌ Error updating game data:', error);
    process.exit(1);
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