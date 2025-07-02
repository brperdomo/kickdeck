/**
 * Fix Time Slot Associations - Permanent Solution
 * 
 * This script permanently links games to their proper time slots
 * and ensures the associations persist.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { games, gameTimeSlots } from './db/schema';
import { eq, and } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

async function fixTimeSlotAssociations() {
  try {
    console.log('🔄 Starting permanent time slot association fix...');
    
    // Get all games for event 1656618593
    const eventGames = await db.select().from(games).where(eq(games.eventId, 1656618593));
    console.log(`Found ${eventGames.length} games for event 1656618593`);
    
    // Get all time slots
    const timeSlots = await db.select().from(gameTimeSlots).orderBy(gameTimeSlots.startTime);
    console.log(`Found ${timeSlots.length} time slots available`);
    
    // Log the time slots
    for (const slot of timeSlots) {
      console.log(`Time Slot ${slot.id}: ${slot.startTime} - ${slot.endTime}`);
    }
    
    // Assign games to time slots in chronological order
    const gameTimeAssignments = [
      { gameId: 273, timeSlotId: timeSlots[0]?.id }, // Game 1 -> First slot
      { gameId: 274, timeSlotId: timeSlots[1]?.id }, // Game 2 -> Second slot  
      { gameId: 275, timeSlotId: timeSlots[2]?.id }, // Game 3 -> Third slot
      { gameId: 276, timeSlotId: timeSlots[3]?.id }, // Game 4 -> Fourth slot
      { gameId: 277, timeSlotId: timeSlots[4]?.id }, // Game 5 -> Fifth slot
      { gameId: 278, timeSlotId: timeSlots[5]?.id }, // Game 6 -> Sixth slot
      { gameId: 279, timeSlotId: timeSlots[6]?.id }, // Game 7 -> Seventh slot
    ];
    
    // Update each game with its time slot
    for (const assignment of gameTimeAssignments) {
      if (assignment.timeSlotId) {
        const result = await db
          .update(games)
          .set({ timeSlotId: assignment.timeSlotId })
          .where(eq(games.id, assignment.gameId));
        
        console.log(`✅ Updated Game ${assignment.gameId} -> Time Slot ${assignment.timeSlotId}`);
      }
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying time slot associations...');
    const updatedGames = await db
      .select({
        gameId: games.id,
        matchNumber: games.matchNumber,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime,
      })
      .from(games)
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .where(eq(games.eventId, 1656618593))
      .orderBy(gameTimeSlots.startTime);
    
    console.log('\nFinal Game Schedule:');
    for (const game of updatedGames) {
      console.log(`Game ${game.matchNumber}: Field ${game.fieldId}, Time: ${game.startTime} - ${game.endTime}`);
    }
    
    console.log('\n✅ Time slot associations fixed permanently!');
    
  } catch (error) {
    console.error('❌ Error fixing time slot associations:', error);
  } finally {
    await sql.end();
  }
}

fixTimeSlotAssociations();