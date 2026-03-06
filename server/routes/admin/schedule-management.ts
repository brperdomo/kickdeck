import { Router } from 'express';
import { db } from '@db';
import { games, gameTimeSlots, gameScoreAudit } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const router = Router();

// Bulk delete games - no middleware here since isAdmin is applied at router level
// NOTE: This route must come BEFORE the individual game route to avoid route conflicts
router.delete('/events/:eventId/games/bulk', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { gameIds } = req.body;
    
    console.log(`[Schedule Management] Deleting game bulk from event ${eventId}`);
    
    // If no gameIds provided, delete ALL games for the event
    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      console.log(`[Schedule Management] No gameIds provided, deleting ALL games for event ${eventId}`);
      
      // Get count first
      const existingGames = await db.select().from(games).where(eq(games.eventId, eventId));
      const gameCount = existingGames.length;
      
      if (gameCount === 0) {
        return res.json({
          success: true,
          message: 'No games to delete',
          deletedCount: 0
        });
      }
      
      // Get all game IDs first for cascading deletions
      const gameIdsToDelete = existingGames.map(g => g.id);
      
      // Delete game score audit records first (to avoid foreign key constraint violations)
      if (gameIdsToDelete.length > 0) {
        const auditDeleteResult = await db.delete(gameScoreAudit)
          .where(inArray(gameScoreAudit.gameId, gameIdsToDelete));
        console.log(`[Schedule Management] Deleted ${auditDeleteResult} game score audit records`);
      }
      
      // Then delete games
      await db.delete(games).where(eq(games.eventId, eventId));
      
      // Then delete associated time slots (eventId is text field)
      const timeSlotDeletionResult = await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
      console.log(`[Schedule Management] Deleted time slots for event ${eventId}`);
      
      console.log(`[Schedule Management] Successfully deleted all ${gameCount} games`);
      
      return res.json({
        success: true,
        message: `Successfully deleted all ${gameCount} games from tournament`,
        deletedCount: gameCount
      });
    }
    
    // If specific gameIds provided, delete only those games
    console.log(`[Schedule Management] Bulk deleting ${gameIds.length} specific games from event ${eventId}`);
    
    const gameIdsAsInts = gameIds.map(id => parseInt(id));
    
    // Delete game score audit records first (to avoid foreign key constraint violations)
    const auditDeleteResult = await db.delete(gameScoreAudit)
      .where(inArray(gameScoreAudit.gameId, gameIdsAsInts));
    console.log(`[Schedule Management] Deleted ${auditDeleteResult} game score audit records for specific games`);
    
    // Then delete the games
    const deletedGames = await db.delete(games).where(
      and(
        eq(games.eventId, eventId),
        inArray(games.id, gameIdsAsInts)
      )
    ).returning();
    
    // Note: We're not deleting time slots for bulk delete since other games might use them
    
    console.log(`[Schedule Management] Successfully deleted ${deletedGames.length} games`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${deletedGames.length} games`,
      deletedCount: deletedGames.length,
      deletedGames: deletedGames.map(g => ({ id: g.id, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId }))
    });
    
  } catch (error) {
    console.error('[Schedule Management] Error deleting game:', error);
    res.status(500).json({ 
      error: 'Failed to delete game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete individual game - no middleware here since isAdmin is applied at router level
router.delete('/events/:eventId/games/:gameId', async (req, res) => {
  try {
    const { eventId, gameId } = req.params;
    
    console.log(`[Schedule Management] Deleting game ${gameId} from event ${eventId}`);
    
    // For individual game deletion, we need to handle timeSlotId reference
    // First get the game to see if it has a timeSlotId
    const gameToDelete = await db.select().from(games).where(
      and(
        eq(games.eventId, eventId),
        eq(games.id, parseInt(gameId))
      )
    ).limit(1);
    
    if (gameToDelete.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Delete the game first
    const deletedGame = await db.delete(games).where(
      and(
        eq(games.eventId, eventId),
        eq(games.id, parseInt(gameId))
      )
    ).returning();
    
    // If the game had a timeSlotId, we can optionally clean up unused time slots
    // For now, we'll leave time slots since they might be reused
    
    // Game deletion handled above
    
    console.log(`[Schedule Management] Successfully deleted game ${gameId}`);
    
    res.json({
      success: true,
      message: 'Game deleted successfully',
      deletedGame: deletedGame[0]
    });
    
  } catch (error) {
    console.error('[Schedule Management] Error deleting game:', error);
    res.status(500).json({ 
      error: 'Failed to delete game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



// Delete all games for an event (primary endpoint) - no middleware here since isAdmin is applied at router level
router.delete('/events/:eventId/games/all', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Schedule Management] Deleting ALL games for event ${eventId}`);
    
    // Get count first
    const existingGames = await db.select().from(games).where(eq(games.eventId, eventId));
    const gameCount = existingGames.length;
    
    if (gameCount === 0) {
      return res.json({
        success: true,
        message: 'No games to delete',
        deletedCount: 0
      });
    }
    
    // Delete games first (to avoid foreign key constraint violations)
    await db.delete(games).where(eq(games.eventId, eventId));
    
    // Then delete associated time slots
    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
    
    console.log(`[Schedule Management] Successfully deleted all ${gameCount} games`);
    
    res.json({
      success: true,
      message: `Successfully deleted all ${gameCount} games from tournament`,
      deletedCount: gameCount
    });
    
  } catch (error) {
    console.error('[Schedule Management] Error deleting all games:', error);
    res.status(500).json({ 
      error: 'Failed to delete all games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete all games for an event (alternative endpoint to match frontend) - no middleware here since isAdmin is applied at router level
router.delete('/events/:eventId/games/delete-all', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Schedule Management] Deleting ALL games for event ${eventId} (delete-all endpoint)`);
    
    // Get count first
    const existingGames = await db.select().from(games).where(eq(games.eventId, eventId));
    const gameCount = existingGames.length;
    
    if (gameCount === 0) {
      return res.json({
        success: true,
        message: 'No games to delete',
        deletedCount: 0
      });
    }
    
    // Delete games first (to avoid foreign key constraint violations)
    await db.delete(games).where(eq(games.eventId, eventId));
    
    // Then delete associated time slots
    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
    
    console.log(`[Schedule Management] Successfully deleted all ${gameCount} games via delete-all endpoint`);
    
    res.json({
      success: true,
      message: `Successfully deleted all ${gameCount} games from tournament`,
      deletedCount: gameCount
    });
    
  } catch (error) {
    console.error('[Schedule Management] Error deleting all games (delete-all):', error);
    res.status(500).json({ 
      error: 'Failed to delete all games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Individual game reschedule endpoint for drag-and-drop calendar
router.put('/games/:gameId/reschedule', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fieldId, startTime } = req.body;

    console.log(`[RESCHEDULE] Game ${gameId} -> Field ${fieldId} at ${startTime}`);
    console.log(`[RESCHEDULE] Request body:`, req.body);

    // Validate input
    if (!fieldId || !startTime) {
      return res.status(400).json({ error: 'Field ID and start time are required' });
    }

    // Look up the game's actual duration (don't hardcode 90 minutes)
    const gameRecord = await db.query.games.findFirst({
      where: eq(games.id, parseInt(gameId)),
      columns: { duration: true }
    });
    const gameDuration = gameRecord?.duration || 90;

    // Calculate end time using string math — DO NOT use new Date() which applies timezone conversion
    const [datePart, timePart] = startTime.split('T');
    const [startH, startM] = timePart.split(':').map(Number);
    const endTotalMin = startH * 60 + startM + gameDuration;
    const endH = Math.floor(endTotalMin / 60).toString().padStart(2, '0');
    const endM = (endTotalMin % 60).toString().padStart(2, '0');
    const endTimeStr = `${datePart}T${endH}:${endM}:00`;

    // Extract date and time by string splitting — DO NOT use new Date().toISOString()
    const scheduledDate = startTime.split('T')[0]; // "2026-04-02"
    const scheduledTime = startTime.split('T')[1];  // "08:00:00"

    // Update the game in the database with both field and time information
    const updatedGame = await db.update(games)
      .set({
        fieldId: parseInt(fieldId),
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)))
      .returning();

    // Find and update the associated time slot if it exists
    const existingSlot = await db.select()
      .from(gameTimeSlots)
      .where(and(
        eq(gameTimeSlots.fieldId, parseInt(fieldId)),
        eq(gameTimeSlots.startTime, startTime)
      ))
      .limit(1);

    if (existingSlot.length === 0) {
      // Create new time slot for this game
      await db.insert(gameTimeSlots).values({
        eventId: updatedGame[0]?.eventId?.toString() || '1074883084',
        fieldId: parseInt(fieldId),
        startTime: startTime,
        endTime: endTimeStr,
        dayIndex: 0,
        isAvailable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`[RESCHEDULE] Successfully updated game ${gameId}:`, {
      gameId: updatedGame[0]?.id,
      fieldId: updatedGame[0]?.fieldId,
      scheduledDate: updatedGame[0]?.scheduledDate,
      scheduledTime: updatedGame[0]?.scheduledTime
    });

    res.json({
      success: true,
      message: 'Game rescheduled successfully',
      game: updatedGame[0],
      debug: {
        originalRequest: { fieldId, startTime },
        calculatedTimes: {
          startTime: startTime,
          endTime: endTimeStr
        }
      }
    });
  } catch (error) {
    console.error('[RESCHEDULE ERROR]:', error);
    res.status(500).json({ 
      error: 'Failed to reschedule game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;