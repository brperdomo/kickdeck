/**
 * Script to assign U13 Boys Nike Classic games to appropriate 9v9 fields
 * This addresses the issue where games were generated but lack field/time assignments
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { games, gameTimeSlots, fields, eventAgeGroups, teams } from './db/schema.ts';
import { eq, and, isNull } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function assignU13GamesToFields() {
  try {
    console.log('🔍 Finding unassigned U13 Boys Nike Classic games...');
    
    // Find U13 Boys Nike Classic games without field assignments
    const unassignedGames = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        eventId: games.eventId,
        ageGroupId: games.ageGroupId
      })
      .from(games)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .leftJoin(teams, eq(games.homeTeamId, teams.id))
      .where(
        and(
          eq(eventAgeGroups.ageGroup, 'U13'),
          eq(eventAgeGroups.gender, 'Boys'),
          isNull(games.fieldId),
          isNull(games.timeSlotId)
        )
      );

    console.log(`📊 Found ${unassignedGames.length} unassigned U13 Boys games`);

    if (unassignedGames.length === 0) {
      console.log('✅ No unassigned U13 Boys games found');
      return;
    }

    // Get 9v9 fields (A1, A2) for U13 teams
    const compatibleFields = await db
      .select()
      .from(fields)
      .where(
        and(
          eq(fields.fieldSize, '9v9'),
          eq(fields.isOpen, true)
        )
      );

    console.log(`🏟️  Found ${compatibleFields.length} compatible 9v9 fields:`, 
      compatibleFields.map(f => f.name).join(', '));

    if (compatibleFields.length === 0) {
      console.error('❌ No compatible 9v9 fields found!');
      return;
    }

    // Event details for Empire Super Cup
    const eventId = '1844329078';
    const eventStartDate = '2025-08-16';
    const eventEndDate = '2025-08-17';
    const fieldOpenTime = '08:00';
    const fieldCloseTime = '18:00';
    const gameDuration = 90; // minutes
    const bufferTime = 15; // minutes between games

    console.log('🕐 Generating time slots for 9v9 fields...');

    // Clear existing time slots for this event
    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));

    // Generate time slots for compatible fields
    const timeSlotInserts = [];
    let slotId = 1;

    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) { // 2 days
      const currentDate = new Date(eventStartDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      for (const field of compatibleFields) {
        let currentTime = parseTime(fieldOpenTime);
        const endTime = parseTime(fieldCloseTime);
        
        while (currentTime + gameDuration <= endTime) {
          const startTimeStr = formatTime(currentTime);
          const endTimeStr = formatTime(currentTime + gameDuration);
          
          timeSlotInserts.push({
            eventId: eventId,
            fieldId: field.id,
            startTime: startTimeStr,
            endTime: endTimeStr,
            dayIndex: dayOffset,
            isAvailable: true
          });
          
          currentTime += gameDuration + bufferTime;
        }
      }
    }

    console.log(`📅 Created ${timeSlotInserts.length} time slots`);
    
    // Insert time slots
    await db.insert(gameTimeSlots).values(timeSlotInserts);

    // Get available time slots
    const availableTimeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.eventId, eventId),
          eq(gameTimeSlots.isAvailable, true)
        )
      )
      .orderBy(gameTimeSlots.dayIndex, gameTimeSlots.startTime);

    console.log(`⏰ Found ${availableTimeSlots.length} available time slots`);

    // Assign games to time slots
    let assignmentCount = 0;
    
    for (let i = 0; i < Math.min(unassignedGames.length, availableTimeSlots.length); i++) {
      const game = unassignedGames[i];
      const timeSlot = availableTimeSlots[i];
      
      await db
        .update(games)
        .set({
          fieldId: timeSlot.fieldId,
          timeSlotId: timeSlot.id,
          updatedAt: new Date().toISOString()
        })
        .where(eq(games.id, game.gameId));

      // Mark time slot as used
      await db
        .update(gameTimeSlots)
        .set({ isAvailable: false })
        .where(eq(gameTimeSlots.id, timeSlot.id));

      assignmentCount++;
    }

    console.log(`✅ Successfully assigned ${assignmentCount} games to fields and time slots`);
    
    // Verify assignments
    const assignedGames = await db
      .select({
        gameId: games.id,
        fieldName: fields.name,
        startTime: gameTimeSlots.startTime,
        dayIndex: gameTimeSlots.dayIndex
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          eq(eventAgeGroups.ageGroup, 'U13'),
          eq(eventAgeGroups.gender, 'Boys'),
          eq(games.eventId, eventId)
        )
      )
      .limit(5);

    console.log('🔍 Sample assigned games:');
    assignedGames.forEach(game => {
      console.log(`  Game ${game.gameId}: ${game.fieldName} at ${game.startTime} (Day ${game.dayIndex + 1})`);
    });

    console.log('🎉 U13 Boys Nike Classic games successfully assigned to 9v9 fields!');
    
  } catch (error) {
    console.error('❌ Error assigning games to fields:', error);
  } finally {
    await sql.end();
  }
}

// Helper functions
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Run the assignment
assignU13GamesToFields();