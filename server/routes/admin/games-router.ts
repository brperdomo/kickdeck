import { Router } from 'express';
import { db } from '../../../db';
import { eq, inArray } from 'drizzle-orm';
import { games } from '../../../db/schema';
import { hasEventAccess } from '../../middleware/event-access';

// Create router for games management
const router = Router();

/**
 * Delete a game
 * 
 * DELETE /api/admin/games/:gameId
 */
router.delete('/:gameId', hasEventAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json({ message: "Game ID is required" });
    }
    
    // Parse gameId to number
    const parsedGameId = parseInt(gameId);
    
    if (isNaN(parsedGameId)) {
      return res.status(400).json({ message: "Invalid game ID format" });
    }
    
    // Get the game to make sure it exists and to check event access
    const [gameToDelete] = await db
      .select()
      .from(games)
      .where(eq(games.id, parsedGameId))
      .limit(1);
    
    if (!gameToDelete) {
      return res.status(404).json({ message: "Game not found" });
    }
    
    // Delete the game
    await db
      .delete(games)
      .where(eq(games.id, parsedGameId));
    
    return res.json({ 
      success: true,
      message: "Game successfully deleted",
      deletedGameId: parsedGameId
    });
  } catch (error) {
    console.error("Error deleting game:", error);
    return res.status(500).json({ message: "Failed to delete game" });
  }
});

/**
 * Batch delete games
 * 
 * POST /api/admin/games/batch-delete
 */
router.post('/batch-delete', hasEventAccess, async (req, res) => {
  try {
    const { gameIds } = req.body;
    
    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ message: "Game IDs array is required" });
    }
    
    // Parse all game IDs to numbers
    const parsedGameIds = gameIds.map(id => parseInt(id));
    
    // Validate all IDs are valid numbers
    if (parsedGameIds.some(id => isNaN(id))) {
      return res.status(400).json({ message: "Invalid game ID format in the array" });
    }
    
    // Delete all specified games
    // We need to use the inArray operator for multiple values
    const result = await db
      .delete(games)
      .where(inArray(games.id, parsedGameIds));
    
    return res.json({ 
      success: true,
      message: `Successfully deleted ${parsedGameIds.length} games`,
      deletedGameIds: parsedGameIds
    });
  } catch (error) {
    console.error("Error batch deleting games:", error);
    return res.status(500).json({ message: "Failed to delete games" });
  }
});

/**
 * Delete all games for an event
 * 
 * DELETE /api/admin/events/:eventId/games/delete-all
 */
router.delete('/:eventId/games/delete-all', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`Deleting all games for event: ${eventId}`);
    
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    
    // Delete all games for this event (eventId is stored as string)
    const result = await db
      .delete(games)
      .where(eq(games.eventId, eventId));
    
    console.log(`Deleted games result:`, result);
    
    return res.json({ 
      success: true,
      message: "All games successfully deleted for event",
      eventId: eventId
    });
  } catch (error) {
    const { eventId } = req.params;
    console.error("Error deleting all games for event", eventId, ":", error);
    return res.status(500).json({ 
      message: "Failed to delete all games", 
      error: error instanceof Error ? error.message : String(error),
      eventId: eventId
    });
  }
});

/**
 * Bulk delete games (alternative endpoint)
 * 
 * DELETE /api/admin/events/:eventId/games/bulk
 */
router.delete('/:eventId/games/bulk', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { gameIds } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    
    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ message: "Game IDs array is required" });
    }
    
    // Parse all game IDs to numbers
    const parsedGameIds = gameIds.map(id => parseInt(id));
    
    // Validate all IDs are valid numbers
    if (parsedGameIds.some(id => isNaN(id))) {
      return res.status(400).json({ message: "Invalid game ID format in the array" });
    }
    
    // Delete all specified games for this event
    const result = await db
      .delete(games)
      .where(inArray(games.id, parsedGameIds));
    
    return res.json({ 
      success: true,
      message: `Successfully deleted ${parsedGameIds.length} games`,
      deletedGameIds: parsedGameIds,
      eventId: eventId
    });
  } catch (error) {
    console.error("Error bulk deleting games:", error);
    return res.status(500).json({ message: "Failed to bulk delete games" });
  }
});

export default router;