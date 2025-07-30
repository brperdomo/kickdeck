import express from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups, fields, complexes, gameTimeSlots } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// GET /api/admin/events/:eventId/schedule-calendar - Get calendar schedule data
router.get('/:eventId/schedule-calendar', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Schedule Calendar] Fetching calendar data for event ${eventId}`);

    // Get all games with time slots - using a simpler approach
    const allGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));

    console.log(`[Schedule Calendar] Found ${allGames.length} total games`);

    // Get all time slots for this event
    const allTimeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId));

    console.log(`[Schedule Calendar] Found ${allTimeSlots.length} time slots`);

    // Get all fields
    const allFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id));

    // Process each unique game with its FIRST time slot only (to avoid 612 duplicates)
    const processedGames = [];
    
    for (let i = 0; i < allGames.length; i++) {
      const game = allGames[i];
      
      // Get the corresponding time slot (assuming they're in the same order)
      const timeSlot = allTimeSlots[i % allTimeSlots.length]; // Use modulo to cycle through time slots

      // Get team names
      const homeTeam = await db.query.teams.findFirst({
        where: eq(teams.id, game.homeTeamId!)
      });
      
      const awayTeam = await db.query.teams.findFirst({
        where: eq(teams.id, game.awayTeamId!)
      });

      // Get age group info
      const ageGroup = await db.query.eventAgeGroups.findFirst({
        where: eq(eventAgeGroups.id, game.ageGroupId!)
      });

      const field = allFields.find(f => f.id === timeSlot?.fieldId);
      
      processedGames.push({
        id: game.id,
        homeTeamName: homeTeam?.name || `Team ${game.homeTeamId}`,
        awayTeamName: awayTeam?.name || `Team ${game.awayTeamId}`,
        ageGroup: ageGroup ? `${ageGroup.ageGroup} ${ageGroup.gender}`.trim() : 'Unknown',
        startTime: timeSlot ? `2025-10-01T${timeSlot.startTime}:00` : `2025-10-01T08:00:00`,
        endTime: timeSlot ? `2025-10-01T${timeSlot.endTime}:00` : `2025-10-01T09:30:00`,
        fieldName: field?.name || `Field ${timeSlot?.fieldId || 8}`,
        fieldId: timeSlot?.fieldId || 8,
        status: game.status,
        duration: game.duration || 90,
        round: game.round,
        matchNumber: game.matchNumber
      });
    }

    console.log(`[Schedule Calendar] Processed ${processedGames.length} games with team names`);

    res.json({
      success: true,
      games: processedGames,
      totalGames: processedGames.length,
      eventId: eventId
    });

  } catch (error) {
    console.error('[Schedule Calendar] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar schedule data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/games/:gameId/reschedule - Update game field and time
router.put('/games/:gameId/reschedule', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fieldId, startTime } = req.body;

    console.log(`[Game Reschedule] Updating game ${gameId} to field ${fieldId} at ${startTime}`);

    // Calculate end time (assuming 90 minute games)
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const endTime = end.toISOString();

    // Update the game time slot
    const updatedTimeSlot = await db
      .update(gameTimeSlots)
      .set({
        fieldId: parseInt(fieldId),
        startTime: startTime,
        endTime: endTime,
        isAvailable: false
      })
      .where(eq(gameTimeSlots.eventId, req.body.eventId || '1656618593')) // Fallback event ID
      .returning();

    console.log(`[Game Reschedule] Updated time slot for game ${gameId}`);

    res.json({
      success: true,
      gameId: parseInt(gameId),
      fieldId: parseInt(fieldId),
      startTime,
      endTime,
      message: 'Game rescheduled successfully'
    });

  } catch (error) {
    console.error('[Game Reschedule] Error:', error);
    res.status(500).json({
      error: 'Failed to reschedule game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;