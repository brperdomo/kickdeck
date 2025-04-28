/**
 * Test Schedule Generation
 * This script tests the schedule generation functionality
 */

import { db } from './db/index.js';
import { eq } from 'drizzle-orm';
import { events, games } from './db/schema.js';
import { SoccerSchedulerAI } from './server/services/openai-service.js';

async function testScheduleGeneration() {
  try {
    console.log('Testing schedule generation functionality...');
    
    // Get the first event from the database
    const allEvents = await db.select().from(events).limit(1);
    
    if (allEvents.length === 0) {
      console.log('No events found in the database');
      return;
    }
    
    const testEvent = allEvents[0];
    console.log(`Using event for testing: ID ${testEvent.id}, Name: ${testEvent.name}`);
    
    // Create schedule constraints
    const constraints = {
      maxGamesPerDay: 3,
      minutesPerGame: 60,
      breakBetweenGames: 15,
      minRestPeriod: 2,
      resolveCoachConflicts: true,
      optimizeFieldUsage: true,
      tournamentFormat: 'round_robin_knockout'
    };
    
    console.log('Generating schedule with constraints:', constraints);
    
    try {
      // Call the OpenAI service to generate a schedule
      const generatedSchedule = await SoccerSchedulerAI.generateSchedule(testEvent.id, constraints);
      
      console.log(`Schedule generated successfully with ${generatedSchedule.schedule.length} games`);
      console.log(`Quality score: ${generatedSchedule.qualityScore}`);
      console.log(`Conflicts detected: ${generatedSchedule.conflicts.length}`);
      
      if (generatedSchedule.schedule.length > 0) {
        // Display a sample game from the schedule
        console.log('Sample game from generated schedule:');
        console.log(JSON.stringify(generatedSchedule.schedule[0], null, 2));
      }
      
      // Check if games were saved to the database
      const savedGames = await db.select().from(games).where(eq(games.eventId, testEvent.id));
      console.log(`Number of games in database for this event: ${savedGames.length}`);
      
      if (savedGames.length > 0) {
        console.log('Sample game from database:');
        console.log(JSON.stringify(savedGames[0], null, 2));
      }
      
      console.log('Schedule generation test completed successfully!');
    } catch (openaiError) {
      console.error('Error during schedule generation:', openaiError.message);
      console.error('Do you have a valid OpenAI API key configured?');
    }
  } catch (error) {
    console.error('Error testing schedule generation:', error);
  } finally {
    // Close the database connection
    await db.end?.();
  }
}

// Run the test
testScheduleGeneration();