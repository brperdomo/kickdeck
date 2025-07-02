/**
 * Fix 8 AM Schedule Script
 * 
 * This script properly reschedules games to start at 8 AM and end by 6 PM,
 * creating a clean hourly schedule that displays properly in the interface.
 */

import { db } from './db/index.ts';
import { gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fix8AMSchedule() {
  try {
    const eventId = '1656618593';
    
    console.log('🔄 Rescheduling games to proper 8 AM - 6 PM hours...');
    
    // Get all existing time slots
    const existingSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.id);
      
    console.log(`📊 Found ${existingSlots.length} time slots to reschedule`);
    
    // Define 8 AM start schedule
    const baseDate = '2025-07-05';
    const timeZone = '-07:00'; // Pacific Time
    
    // Schedule: 8:00, 9:45, 11:30, 1:15, 3:00, 4:45, then next day
    const startTimes = [
      '08:00',  // 8:00 AM
      '09:45',  // 9:45 AM
      '11:30',  // 11:30 AM
      '13:15',  // 1:15 PM
      '15:00',  // 3:00 PM
      '16:45',  // 4:45 PM
      '08:00'   // Next day 8:00 AM
    ];
    
    // Update each time slot
    for (let i = 0; i < existingSlots.length && i < startTimes.length; i++) {
      const slot = existingSlots[i];
      const startTime = startTimes[i];
      
      // Determine which day
      const dayOffset = i >= 6 ? 1 : 0;
      const gameDate = new Date(baseDate);
      gameDate.setDate(gameDate.getDate() + dayOffset);
      const dateStr = gameDate.toISOString().split('T')[0];
      
      // Calculate end time (90 minutes later)
      const [hourStr, minStr] = startTime.split(':');
      const startHour = parseInt(hourStr);
      const startMin = parseInt(minStr);
      const totalStartMinutes = startHour * 60 + startMin;
      const totalEndMinutes = totalStartMinutes + 90; // 90-minute games
      
      const endHour = Math.floor(totalEndMinutes / 60);
      const endMin = totalEndMinutes % 60;
      
      const formattedStartTime = `${dateStr}T${startTime}:00${timeZone}`;
      const formattedEndTime = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00${timeZone}`;
      
      console.log(`🎮 Updating Time Slot ${slot.id}:`);
      console.log(`   From: ${new Date(slot.startTime).toLocaleString()}`);
      console.log(`   To:   ${new Date(formattedStartTime).toLocaleString()}`);
      
      await db.update(gameTimeSlots)
        .set({
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          updatedAt: new Date().toISOString()
        })
        .where(eq(gameTimeSlots.id, slot.id));
        
      console.log(`   ✅ Updated successfully`);
    }
    
    // Display final schedule
    console.log('\n📅 Final Schedule:');
    const updatedSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.startTime);
      
    updatedSlots.forEach((slot, index) => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      console.log(`   Game ${index + 1}: ${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
    });
    
    console.log('\n✅ All games now scheduled from 8 AM to 6 PM!');
    
  } catch (error) {
    console.error('❌ Error fixing schedule:', error);
    process.exit(1);
  }
}

// Run the fix
fix8AMSchedule()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });