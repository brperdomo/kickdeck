/**
 * Debug Schedule Data
 * 
 * This script investigates the game and time slot data to identify
 * why games aren't showing up properly in the schedule interface.
 */

import { db } from './db/index.js';
import { games, gameTimeSlots, fields } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function debugScheduleData() {
  try {
    const eventId = 1656618593;
    
    console.log('=== DEBUGGING SCHEDULE DATA ===\n');
    
    // 1. Check games in database
    console.log('1. GAMES IN DATABASE:');
    const gameData = await db
      .select({
        id: games.id,
        matchNumber: games.matchNumber,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        eventId: games.eventId
      })
      .from(games)
      .where(eq(games.eventId, eventId));
      
    console.log(`Found ${gameData.length} games:`);
    gameData.forEach((game, i) => {
      console.log(`Game ${i + 1}: ID=${game.id}, Match#=${game.matchNumber}, Field=${game.fieldId}, TimeSlot=${game.timeSlotId}`);
    });
    
    // 2. Check time slots
    console.log('\n2. TIME SLOTS IN DATABASE:');
    const timeSlotData = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId));
      
    console.log(`Found ${timeSlotData.length} time slots:`);
    timeSlotData.forEach((slot, i) => {
      console.log(`Slot ${i + 1}: ID=${slot.id}, Start=${slot.startTime}, End=${slot.endTime}`);
    });
    
    // 3. Check fields
    console.log('\n3. FIELDS IN DATABASE:');
    const fieldData = await db
      .select({
        id: fields.id,
        name: fields.name,
        complexId: fields.complexId,
        isOpen: fields.isOpen
      })
      .from(fields)
      .where(eq(fields.isOpen, true));
      
    console.log(`Found ${fieldData.length} open fields:`);
    fieldData.forEach((field, i) => {
      console.log(`Field ${i + 1}: ID=${field.id}, Name=${field.name}, Complex=${field.complexId}`);
    });
    
    // 4. Test the API query that's being used
    console.log('\n4. SIMULATING API QUERY:');
    const schedule = await db
      .select({
        gameId: games.id,
        matchNumber: games.matchNumber,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime,
        fieldName: fields.name
      })
      .from(games)
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(eq(games.eventId, eventId));
      
    console.log(`API would return ${schedule.length} games with times:`);
    schedule.forEach((item, i) => {
      console.log(`Game ${i + 1}: ID=${item.gameId}, Match#=${item.matchNumber}, Field=${item.fieldName}(${item.fieldId}), Time=${item.startTime} - ${item.endTime}`);
    });
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugScheduleData();