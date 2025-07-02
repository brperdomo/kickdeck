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
import { gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fixGameTimeSlots() {
  try {
    const eventId = '1656618593';
    
    console.log('🔄 Updating time slots to reasonable hours (8 AM - 6 PM)...');
    
    // Define reasonable scheduling for all 7 games
    const newSchedule = [
      { startTime: '2025-07-05T08:00:00-07:00', endTime: '2025-07-05T09:30:00-07:00' }, // Game 1: 8:00 AM
      { startTime: '2025-07-05T09:45:00-07:00', endTime: '2025-07-05T11:15:00-07:00' }, // Game 2: 9:45 AM
      { startTime: '2025-07-05T11:30:00-07:00', endTime: '2025-07-05T13:00:00-07:00' }, // Game 3: 11:30 AM
      { startTime: '2025-07-05T13:15:00-07:00', endTime: '2025-07-05T14:45:00-07:00' }, // Game 4: 1:15 PM
      { startTime: '2025-07-05T15:00:00-07:00', endTime: '2025-07-05T16:30:00-07:00' }, // Game 5: 3:00 PM
      { startTime: '2025-07-05T16:45:00-07:00', endTime: '2025-07-05T18:15:00-07:00' }, // Game 6: 4:45 PM
      { startTime: '2025-07-06T08:00:00-07:00', endTime: '2025-07-06T09:30:00-07:00' }  // Game 7: Next day 8:00 AM
    ];
    
    // Get all existing time slots
    const existingSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.id);
      
    console.log(`📊 Found ${existingSlots.length} existing time slots`);
    
    // Update each time slot with reasonable hours
    for (let i = 0; i < existingSlots.length && i < newSchedule.length; i++) {
      const slot = existingSlots[i];
      const newTime = newSchedule[i];
      
      console.log(`⏰ Updating Time Slot ${slot.id}:`);
      console.log(`   From: ${new Date(slot.startTime).toLocaleString()}`);
      console.log(`   To:   ${new Date(newTime.startTime).toLocaleString()}`);
      
      await db.update(gameTimeSlots)
        .set({
          startTime: newTime.startTime,
          endTime: newTime.endTime,
          updatedAt: new Date().toISOString()
        })
        .where(eq(gameTimeSlots.id, slot.id));
        
      console.log(`   ✓ Updated successfully`);
    }
    
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
    
    console.log('\n✅ All time slots updated to reasonable hours!');
    
  } catch (error) {
    console.error('❌ Error fixing time slots:', error);
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