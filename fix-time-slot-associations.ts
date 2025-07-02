/**
 * Fix Time Slot Associations
 * 
 * This script fixes the issue where games aren't properly linked to their time slots,
 * causing all games to show the current timestamp instead of scheduled times.
 */

import { db } from './db/index.ts';
import { games, gameTimeSlots } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function fixTimeSlotAssociations() {
  try {
    const eventId = 1656618593;
    
    console.log('=== FIXING TIME SLOT ASSOCIATIONS ===\n');
    
    // 1. First, check current game data
    console.log('1. Checking current games:');
    const currentGames = await db
      .select({
        id: games.id,
        matchNumber: games.matchNumber,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId
      })
      .from(games)
      .where(eq(games.eventId, eventId));
      
    console.log(`Found ${currentGames.length} games:`);
    currentGames.forEach((game, i) => {
      console.log(`Game ${i + 1}: ID=${game.id}, Match#=${game.matchNumber}, Field=${game.fieldId}, TimeSlot=${game.timeSlotId}`);
    });
    
    // 2. Check existing time slots
    console.log('\n2. Checking time slots:');
    const timeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId));
      
    console.log(`Found ${timeSlots.length} time slots:`);
    timeSlots.forEach((slot, i) => {
      console.log(`Slot ${i + 1}: ID=${slot.id}, Start=${slot.startTime}, End=${slot.endTime}`);
    });
    
    if (timeSlots.length === 0) {
      console.log('\n⚠️  No time slots found! Creating time slots for games...');
      
      // Create time slots based on the game schedule pattern
      const gameTimeStamps = [
        { start: '08:00:00', end: '09:30:00' },
        { start: '09:30:00', end: '11:00:00' },
        { start: '10:30:00', end: '12:00:00' },
        { start: '12:00:00', end: '13:30:00' },
        { start: '13:00:00', end: '14:30:00' },
        { start: '14:30:00', end: '16:00:00' },
        { start: '15:30:00', end: '17:00:00' }
      ];
      
      const eventDate = '2025-07-06'; // Based on the screenshot
      const timezone = 'America/Los_Angeles';
      
      for (let i = 0; i < currentGames.length && i < gameTimeStamps.length; i++) {
        const timeStamp = gameTimeStamps[i];
        const startTime = new Date(`${eventDate}T${timeStamp.start}`);
        const endTime = new Date(`${eventDate}T${timeStamp.end}`);
        
        console.log(`Creating time slot ${i + 1}: ${startTime.toISOString()} - ${endTime.toISOString()}`);
        
        // Insert time slot
        const [newTimeSlot] = await db
          .insert(gameTimeSlots)
          .values({
            eventId: eventId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            timezone: timezone,
            label: `Game ${i + 1} Time`,
            fieldConstraints: null,
            isFlexible: false
          })
          .returning({ id: gameTimeSlots.id });
          
        // Update the corresponding game to use this time slot
        const gameToUpdate = currentGames[i];
        await db
          .update(games)
          .set({ timeSlotId: newTimeSlot.id })
          .where(eq(games.id, gameToUpdate.id));
          
        console.log(`✅ Updated Game ${gameToUpdate.id} to use TimeSlot ${newTimeSlot.id}`);
      }
      
    } else {
      console.log('\n3. Time slots exist, checking game associations...');
      
      // Check if games have proper time slot IDs
      const gamesWithoutTimeSlots = currentGames.filter(game => !game.timeSlotId);
      
      if (gamesWithoutTimeSlots.length > 0) {
        console.log(`⚠️  Found ${gamesWithoutTimeSlots.length} games without time slots. Associating them...`);
        
        for (let i = 0; i < gamesWithoutTimeSlots.length && i < timeSlots.length; i++) {
          const game = gamesWithoutTimeSlots[i];
          const timeSlot = timeSlots[i];
          
          await db
            .update(games)
            .set({ timeSlotId: timeSlot.id })
            .where(eq(games.id, game.id));
            
          console.log(`✅ Associated Game ${game.id} with TimeSlot ${timeSlot.id}`);
        }
      } else {
        console.log('✅ All games have time slot associations');
      }
    }
    
    // 4. Verify the fix
    console.log('\n4. Verifying the fix:');
    const verification = await db
      .select({
        gameId: games.id,
        matchNumber: games.matchNumber,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime,
        timeSlotExists: gameTimeSlots.id
      })
      .from(games)
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .where(eq(games.eventId, eventId));
      
    console.log(`Verification - ${verification.length} games with time data:`);
    verification.forEach((item, i) => {
      const status = item.timeSlotExists ? '✅' : '❌';
      console.log(`${status} Game ${i + 1}: ID=${item.gameId}, Field=${item.fieldId}, Time=${item.startTime || 'MISSING'}`);
    });
    
    console.log('\n=== TIME SLOT FIX COMPLETE ===');
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixTimeSlotAssociations();