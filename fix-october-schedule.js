/**
 * Fix October Schedule Script
 * 
 * This script fixes the schedule to use the correct October dates (2025-10-01 to 2025-10-04)
 * instead of the incorrect July dates currently in the database.
 */

import { db } from './db/index.ts';
import { games, gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fixOctoberSchedule() {
  const eventId = 1656618593;
  
  try {
    console.log('🗓️ Fixing schedule to use correct October dates...');
    
    // Get current games
    const currentGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId))
      .orderBy(games.id);
    
    console.log(`📋 Found ${currentGames.length} games to reschedule`);
    
    // Clear existing time slots (already done via SQL)
    console.log('🗑️ Time slots cleared');
    
    // Create new time slots for October 1-2, 2025 (first two days of event)
    const gameSchedule = [
      // October 1, 2025 - Day 1 (5 games)
      { date: '2025-10-01', startTime: '08:00', fieldId: 9 }, // Game 1
      { date: '2025-10-01', startTime: '10:30', fieldId: 8 }, // Game 2  
      { date: '2025-10-01', startTime: '13:00', fieldId: 9 }, // Game 3
      { date: '2025-10-01', startTime: '15:30', fieldId: 8 }, // Game 4
      { date: '2025-10-01', startTime: '18:00', fieldId: 9 }, // Game 5
      
      // October 2, 2025 - Day 2 (2 games)
      { date: '2025-10-02', startTime: '08:00', fieldId: 8 }, // Game 6
      { date: '2025-10-02', startTime: '10:30', fieldId: 9 }  // Game 7
    ];
    
    console.log('📅 Creating time slots for October 1-2, 2025...');
    
    // Create time slots and link games
    for (let i = 0; i < currentGames.length && i < gameSchedule.length; i++) {
      const game = currentGames[i];
      const schedule = gameSchedule[i];
      
      // Create time slot for this game
      const startDateTime = new Date(`${schedule.date}T${schedule.startTime}:00-07:00`); // Pacific Time
      const endDateTime = new Date(startDateTime.getTime() + (90 * 60 * 1000)); // 90 minute games
      
      const [timeSlot] = await db
        .insert(gameTimeSlots)
        .values({
          eventId: eventId,
          fieldId: schedule.fieldId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          dayIndex: schedule.date === '2025-10-01' ? 0 : 1,
          isAvailable: false
        })
        .returning();
      
      // Update game with time slot and field
      await db
        .update(games)
        .set({
          timeSlotId: timeSlot.id,
          fieldId: schedule.fieldId
        })
        .where(eq(games.id, game.id));
      
      console.log(`⚽ Game ${i + 1}: ${schedule.date} ${schedule.startTime} PT on Field ${schedule.fieldId === 8 ? 'f1' : 'f2'}`);
    }
    
    console.log('✅ October schedule fix completed successfully');
    console.log('📅 Games now scheduled for October 1-2, 2025 in Pacific Time');
    
  } catch (error) {
    console.error('❌ Error fixing October schedule:', error);
    process.exit(1);
  }
}

// Run the fix
fixOctoberSchedule()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });