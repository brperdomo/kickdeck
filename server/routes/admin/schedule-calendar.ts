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

    // Get all games with team and field information
    const gamesWithDetails = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        status: games.status,
        duration: games.duration,
        round: games.round,
        matchNumber: games.matchNumber,
        // Team names
        homeTeamName: teams.name,
        awayTeamName: teams.name,
        // Age group info
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        // Time slot info
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime,
        fieldId: gameTimeSlots.fieldId,
        // Field info
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name
      })
      .from(games)
      .leftJoin(teams, eq(games.homeTeamId, teams.id))
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .leftJoin(gameTimeSlots, and(
        eq(gameTimeSlots.eventId, eventId),
        eq(games.eventId, gameTimeSlots.eventId)
      ))
      .leftJoin(fields, eq(gameTimeSlots.fieldId, fields.id))
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(games.eventId, eventId));

    console.log(`[Schedule Calendar] Found ${gamesWithDetails.length} games`);

    // Process games to get both home and away team names
    const processedGames = [];
    
    for (const game of gamesWithDetails) {
      // Get home team name
      const homeTeam = await db.query.teams.findFirst({
        where: eq(teams.id, game.homeTeamId!)
      });
      
      // Get away team name  
      const awayTeam = await db.query.teams.findFirst({
        where: eq(teams.id, game.awayTeamId!)
      });

      processedGames.push({
        id: game.gameId,
        homeTeamName: homeTeam?.name || 'Team ' + game.homeTeamId,
        awayTeamName: awayTeam?.name || 'Team ' + game.awayTeamId,
        ageGroup: `${game.ageGroup} ${game.gender}`.trim(),
        startTime: game.startTime,
        endTime: game.endTime,
        fieldName: game.fieldName || 'Field ' + game.fieldId,
        fieldId: game.fieldId || 8, // Default field ID
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