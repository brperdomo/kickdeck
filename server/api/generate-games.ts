import { Request, Response } from 'express';
import { generateGamesForEvent } from '../services/tournament-scheduler';
import { db } from '../../db/index.js';
import { 
  eventBrackets,
  teams,
  games,
  fields,
  eventComplexes,
  gameTimeSlots
} from '@db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Flight-specific game generation function (copied from bracket-creation route)
export async function generateGamesForFlight(eventId: string, flightId: number) {
  console.log(`🏀 [Game Generation] Starting flight-specific generation for flight ${flightId} in event ${eventId}`);
  
  // Get the flight data for this specific flight
  const flightData = await db
    .select({
      flightId: eventBrackets.id,
      name: eventBrackets.name,
      format: eventBrackets.format
    })
    .from(eventBrackets)
    .where(and(
      eq(eventBrackets.eventId, eventId),
      eq(eventBrackets.id, flightId)
    ));

  if (flightData.length === 0) {
    throw new Error(`Flight ${flightId} not found in event ${eventId}`);
  }

  const flight = flightData[0];
  console.log(`🏀 [Game Generation] Found flight: ${flight.name} with format: ${flight.format}`);

  // Get teams for this flight
  const flightTeams = await db
    .select()
    .from(teams)
    .where(and(
      eq(teams.eventId, eventId),
      eq(teams.bracketId, flightId)
    ));

  if (flightTeams.length === 0) {
    throw new Error(`No teams found in flight ${flightId}`);
  }

  console.log(`🏀 [Game Generation] Found ${flightTeams.length} teams in flight ${flight.name}`);

  // Generate games for this bracket using the tournament scheduler
  const generatedGames = await generateGamesForEvent(eventId, [flight]);
  console.log(`🏀 [Game Generation] Generated ${generatedGames.length} games for flight ${flight.name}`);

  // Now schedule the games with field and time assignment
  await scheduleGeneratedGames(eventId, generatedGames);

  return generatedGames;
}

// Schedule generated games with field and time assignments
async function scheduleGeneratedGames(eventId: string, generatedGames: any[]) {
  console.log(`📅 [Game Scheduling] Starting field and time assignment for ${generatedGames.length} games...`);
  
  try {
    // Get available fields for this event
    const fieldsData = await db
      .select({
        id: fields.id,
        name: fields.name,
        complexId: fields.complexId
      })
      .from(fields)
      .innerJoin(eventComplexes, eq(fields.complexId, eventComplexes.complexId))
      .where(eq(eventComplexes.eventId, parseInt(eventId)));

    console.log(`📅 [Game Scheduling] Found ${fieldsData.length} available fields`);

    // Get available time slots for this event
    const timeSlotsData = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, parseInt(eventId)));

    console.log(`📅 [Game Scheduling] Found ${timeSlotsData.length} available time slots`);

    if (fieldsData.length === 0 || timeSlotsData.length === 0) {
      console.log(`⚠️ [Game Scheduling] No fields or time slots available, games will be created without scheduling`);
      return;
    }

    // Simple assignment: cycle through fields and time slots
    for (let i = 0; i < generatedGames.length; i++) {
      const game = generatedGames[i];
      const field = fieldsData[i % fieldsData.length];
      const timeSlot = timeSlotsData[i % timeSlotsData.length];
      
      // Update the game with field and time assignment
      await db
        .update(games)
        .set({
          fieldId: field.id,
          scheduledDate: new Date(timeSlot.date).toISOString().split('T')[0],
          scheduledTime: timeSlot.startTime
        })
        .where(eq(games.id, game.id));

      console.log(`📅 [Game Scheduling] Assigned game ${game.id} to field ${field.name} at ${timeSlot.startTime}`);
    }

    console.log(`✅ [Game Scheduling] Successfully scheduled ${generatedGames.length} games with fields and times`);
  } catch (error) {
    console.error(`❌ [Game Scheduling] Failed to schedule games:`, error);
    // Don't throw - games are still created, just without scheduling
  }
}

/**
 * Standalone API endpoint for game generation
 * This bypasses the complex routes.ts file to avoid compilation issues
 */
export async function handleGenerateGames(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    const { flightId } = req.body;
    
    console.log(`🚀 [STANDALONE API] Game generation requested for event ${eventId}`);
    console.log(`🔍 [STANDALONE API] Request body:`, req.body);
    console.log(`🔍 [STANDALONE API] Extracted flightId:`, flightId, `(type: ${typeof flightId})`);
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }
    
    if (flightId) {
      console.log(`🚀 [STANDALONE API] Starting generateGamesForFlight for flight ${flightId}...`);
      await generateGamesForFlight(eventId, flightId);
      
      console.log(`✅ [STANDALONE API] Game generation completed for flight ${flightId} in event ${eventId}`);
      res.json({
        success: true,
        message: 'Games generated successfully for the selected flight'
      });
    } else {
      console.log(`🚀 [STANDALONE API] Starting generateGamesForEvent for all brackets...`);
      await generateGamesForEvent(eventId);
      
      console.log(`✅ [STANDALONE API] Game generation completed for event ${eventId}`);
      res.json({
        success: true,
        message: 'Games generated successfully for all brackets in the event'
      });
    }
    
  } catch (error) {
    console.error(`❌ [STANDALONE API] Game generation failed for event ${req.params.eventId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate games',
      details: (error as Error).message
    });
  }
}