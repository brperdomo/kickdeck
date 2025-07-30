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
    
    // Delete associated time slots first (foreign key constraint)
    // Note: gameTimeSlots table doesn't have gameId field, so we'll delete by eventId and find related slots
    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
    
    // Delete the game
    const deletedGame = await db.delete(games).where(
      and(
        eq(games.eventId, eventId),
        eq(games.id, parseInt(gameId))
      )
    ).returning();
    
    if (deletedGame.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
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
    
    // Delete associated time slots first (no gameId field in gameTimeSlots)
    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
    
    // Delete the games
    const deletedGames = await db.delete(games).where(
      and(
        eq(games.eventId, eventId),
        inArray(games.id, gameIds.map(id => parseInt(id)))
      )
    ).returning();
    
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

// Delete all games for an event
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
    
    // Delete associated time slots first
    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
    
    // Delete all games
    await db.delete(games).where(eq(games.eventId, eventId));
    
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

export default router;