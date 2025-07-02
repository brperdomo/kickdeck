/**
 * Fix Reasonable Schedule
 * 
 * This script redistributes games to reasonable hours (8 AM - 8 PM)
 * spreading across multiple days when necessary.
 */

import { db } from './db/index.ts';
import { gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fixReasonableSchedule() {
  try {
    const eventId = '1656618593';
    
    console.log('🔍 Finding all time slots for event...');
    
    // Get all time slots for the event
    const timeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.id);
      
    console.log(`📊 Found ${timeSlots.length} time slots to reschedule`);
    
    if (timeSlots.length === 0) {
      console.log('✅ No time slots found!');
      return;
    }
    
    // Define reasonable scheduling parameters
    const startDate = new Date('2025-07-05T08:00:00-07:00'); // 8 AM Pacific Time
    const gameDurationMinutes = 90; // 90 minute games
    const breakTimeMinutes = 15; // 15 minute breaks
    const totalSlotMinutes = gameDurationMinutes + breakTimeMinutes; // 105 minutes per slot
    
    // Operating hours: 8 AM to 8 PM = 12 hours = 720 minutes
    const operatingHours = 12 * 60; // 720 minutes
    const maxGamesPerDay = Math.floor(operatingHours / totalSlotMinutes); // 6 games per day
    
    console.log(`⏰ Scheduling parameters:`);
    console.log(`   Operating hours: 8 AM - 8 PM (${operatingHours} minutes)`);
    console.log(`   Game duration: ${gameDurationMinutes} minutes`);
    console.log(`   Break time: ${breakTimeMinutes} minutes`);
    console.log(`   Max games per day: ${maxGamesPerDay} games`);
    console.log(`   Tournament will span ${Math.ceil(timeSlots.length / maxGamesPerDay)} days`);
    
    for (let i = 0; i < timeSlots.length; i++) {
      const timeSlot = timeSlots[i];
      
      // Calculate which day and game slot within that day
      const dayIndex = Math.floor(i / maxGamesPerDay);
      const gameIndexInDay = i % maxGamesPerDay;
      
      // Calculate the actual start time
      const gameDate = new Date(startDate);
      gameDate.setDate(gameDate.getDate() + dayIndex); // Add days for multi-day tournaments
      gameDate.setMinutes(gameDate.getMinutes() + (gameIndexInDay * totalSlotMinutes));
      
      const gameEndTime = new Date(gameDate);
      gameEndTime.setMinutes(gameEndTime.getMinutes() + gameDurationMinutes);
      
      console.log(`🎮 Updating Time Slot ${timeSlot.id}:`);
      console.log(`   Day ${dayIndex + 1}, Game ${gameIndexInDay + 1} of day`);
      console.log(`   Time: ${gameDate.toLocaleString()} - ${gameEndTime.toLocaleString()}`);
      
      // Update the time slot
      await db.update(gameTimeSlots)
        .set({
          startTime: gameDate.toISOString(),
          endTime: gameEndTime.toISOString(),
          dayIndex: dayIndex,
          updatedAt: new Date().toISOString()
        })
        .where(eq(gameTimeSlots.id, timeSlot.id));
        
      console.log(`   ✓ Updated time slot ${timeSlot.id}`);
    }
    
    console.log('\n🎉 All time slots rescheduled to reasonable hours!');
    
    // Show the final schedule summary
    console.log('\n📅 Final Schedule Summary:');
    const updatedTimeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.startTime);
      
    let currentDay = null;
    updatedTimeSlots.forEach((slot, index) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const dayStr = startTime.toDateString();
      
      if (currentDay !== dayStr) {
        console.log(`\n   📅 ${dayStr}:`);
        currentDay = dayStr;
      }
      
      console.log(`      Game ${index + 1}: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing schedule:', error);
    process.exit(1);
  }
}

// Run the fix
fixReasonableSchedule()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });