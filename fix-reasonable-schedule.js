/**
 * Fix Reasonable Schedule Script
 * 
 * This script reschedules all 7 games to reasonable hours (8 AM - 6 PM)
 * instead of the current 3 PM - 1:15 AM schedule that creates display issues.
 * 
 * The goal is to have games scheduled during normal operating hours
 * so they display properly in the scheduling interface grid.
 */

import { db } from './db/index.ts';
import { gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fixReasonableSchedule() {
  try {
    const eventId = '1656618593';
    
    console.log('🔍 Finding all time slots for event...');
    
    // Get all existing time slots for the event
    const existingSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.id);
      
    console.log(`📊 Found ${existingSlots.length} time slots to reschedule`);
    
    // Define proper schedule starting at 8 AM with 90-minute games and 15-minute breaks
    const baseDate = '2025-07-05'; // Saturday
    const timeZone = '-07:00'; // Pacific Time
    
    // Calculate operating hours and capacity
    const operatingHours = 12; // 8 AM to 8 PM = 12 hours = 720 minutes
    const gameDuration = 90; // minutes
    const breakTime = 15; // minutes between games
    const slotDuration = gameDuration + breakTime; // 105 minutes per slot
    const maxGamesPerDay = Math.floor((operatingHours * 60) / slotDuration); // 6 games per day
    
    console.log('⏰ Scheduling parameters:');
    console.log(`   Operating hours: 8 AM - 8 PM (${operatingHours * 60} minutes)`);
    console.log(`   Game duration: ${gameDuration} minutes`);
    console.log(`   Break time: ${breakTime} minutes`);
    console.log(`   Max games per day: ${maxGamesPerDay} games`);
    
    const totalGames = existingSlots.length;
    const daysNeeded = Math.ceil(totalGames / maxGamesPerDay);
    console.log(`   Tournament will span ${daysNeeded} days`);
    
    // Generate new schedule
    const newSchedule = [];
    
    for (let gameIndex = 0; gameIndex < totalGames; gameIndex++) {
      const dayIndex = Math.floor(gameIndex / maxGamesPerDay);
      const gameOfDay = gameIndex % maxGamesPerDay;
      
      // Calculate start time: 8 AM + (game number * slot duration)
      const startMinutes = 8 * 60 + (gameOfDay * slotDuration); // Start at 8 AM
      const endMinutes = startMinutes + gameDuration;
      
      const startHour = Math.floor(startMinutes / 60);
      const startMin = startMinutes % 60;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      // Create date for this day
      const gameDate = new Date(baseDate);
      gameDate.setDate(gameDate.getDate() + dayIndex);
      const dateStr = gameDate.toISOString().split('T')[0];
      
      const startTime = `${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00${timeZone}`;
      const endTime = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00${timeZone}`;
      
      newSchedule.push({
        startTime,
        endTime,
        dayIndex,
        gameOfDay: gameOfDay + 1
      });
    }
    
    // Update each time slot with reasonable hours
    for (let i = 0; i < existingSlots.length; i++) {
      const slot = existingSlots[i];
      const newTime = newSchedule[i];
      
      console.log(`🎮 Updating Time Slot ${slot.id}:`);
      console.log(`   Day ${newTime.dayIndex + 1}, Game ${newTime.gameOfDay} of day`);
      console.log(`   Time: ${new Date(slot.startTime).toLocaleString()} - ${new Date(slot.endTime).toLocaleString()}`);
      
      await db.update(gameTimeSlots)
        .set({
          startTime: newTime.startTime,
          endTime: newTime.endTime,
          updatedAt: new Date().toISOString()
        })
        .where(eq(gameTimeSlots.id, slot.id));
        
      console.log(`   ✓ Updated time slot ${slot.id}`);
    }
    
    console.log('\n🎉 All time slots rescheduled to reasonable hours!');
    
    // Display final schedule
    console.log('\n📅 Final Schedule Summary:');
    
    const updatedSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.startTime);
    
    // Group by day
    const scheduleByDay = {};
    updatedSlots.forEach(slot => {
      const startDate = new Date(slot.startTime);
      const dayKey = startDate.toDateString();
      
      if (!scheduleByDay[dayKey]) {
        scheduleByDay[dayKey] = [];
      }
      
      scheduleByDay[dayKey].push({
        gameNumber: scheduleByDay[dayKey].length + 1,
        startTime: startDate.toLocaleTimeString(),
        endTime: new Date(slot.endTime).toLocaleTimeString()
      });
    });
    
    Object.keys(scheduleByDay).forEach(day => {
      console.log(`\n   📅 ${day}:`);
      scheduleByDay[day].forEach(game => {
        console.log(`      Game ${game.gameNumber}: ${game.startTime} - ${game.endTime}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error fixing schedule:', error);
    process.exit(1);
  }
}

// Run the fix
fixReasonableSchedule()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });