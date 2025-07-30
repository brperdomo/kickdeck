import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { db } from '@db';
import { games, gameTimeSlots } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const router = Router();

// Delete individual game
router.delete('/events/:eventId/games/:gameId', requireAuth, async (req, res) => {
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

// Bulk delete games
router.delete('/events/:eventId/games/bulk', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { gameIds } = req.body;
    
    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'gameIds array is required' });
    }
    
    console.log(`[Schedule Management] Bulk deleting ${gameIds.length} games from event ${eventId}`);
    
    // Delete the games first (to avoid foreign key constraint violations)
    const deletedGames = await db.delete(games).where(
      and(
        eq(games.eventId, eventId),
        inArray(games.id, gameIds.map(id => parseInt(id)))
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
    console.error('[Schedule Management] Error bulk deleting games:', error);
    res.status(500).json({ 
      error: 'Failed to bulk delete games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete all games for an event (primary endpoint)
router.delete('/events/:eventId/games/all', requireAuth, async (req, res) => {
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

// Delete all games for an event (alternative endpoint to match frontend)
router.delete('/events/:eventId/games/delete-all', requireAuth, async (req, res) => {
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

    // Validate input
    if (!fieldId || !startTime) {
      return res.status(400).json({ error: 'Field ID and start time are required' });
    }

    // Calculate end time (assuming 90-minute games)
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + 90 * 60 * 1000);

    // Update the game in the database
    const updatedGame = await db.update(games)
      .set({
        fieldId: parseInt(fieldId),
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)))
      .returning();

    // Find and update the associated time slot if it exists
    // Since gameTimeSlots doesn't have gameId, we need to find it by other means
    // For now, we'll create a new time slot if needed
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
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        dayIndex: 0,
        isAvailable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`[RESCHEDULE] Successfully updated game ${gameId}`);

    res.json({ 
      success: true, 
      message: 'Game rescheduled successfully',
      game: updatedGame[0]
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