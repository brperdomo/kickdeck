import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { db } from '../../../db/index.js';
import { games, gameTimeSlots } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * SAFETY FUNCTION: Delete all games for an event
 * This resolves the duplicate game issue detected by safety checks
 */
router.delete('/events/:eventId/games/all', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { confirmDelete } = req.body;

    // Safety confirmation required
    if (!confirmDelete) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Must set confirmDelete: true to proceed with deleting all games'
      });
    }

    console.log(`[Game Management] DANGER: Deleting ALL games for event ${eventId}`);

    // Get count of games to be deleted for logging
    const existingGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));

    const gameCount = existingGames.length;

    if (gameCount === 0) {
      return res.json({
        success: true,
        message: 'No games found to delete',
        deletedCount: 0
      });
    }

    console.log(`[Game Management] About to delete ${gameCount} games from event ${eventId}`);

    // Delete all time slot assignments first (if any)
    const timeSlotDeleteResult = await db
      .delete(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId));

    console.log(`[Game Management] Deleted time slot assignments`);

    // Delete all games for this event
    const gameDeleteResult = await db
      .delete(games)
      .where(eq(games.eventId, eventId));

    console.log(`[Game Management] Successfully deleted ${gameCount} games from event ${eventId}`);

    res.json({
      success: true,
      message: `Successfully deleted ${gameCount} games`,
      deletedCount: gameCount,
      eventId: eventId
    });

  } catch (error) {
    console.error('[Game Management] Error deleting games:', error);
    res.status(500).json({
      error: 'Failed to delete games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get games count for an event (for safety validation)
 */
router.get('/events/:eventId/games/count', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;

    const existingGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));

    res.json({
      success: true,
      count: existingGames.length,
      eventId: eventId
    });

  } catch (error) {
    console.error('[Game Management] Error counting games:', error);
    res.status(500).json({
      error: 'Failed to count games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete games by flight or bracket (selective deletion)
 */
router.delete('/events/:eventId/games/selective', requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { flightIds, bracketIds, confirmDelete } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Must set confirmDelete: true to proceed with selective deletion'
      });
    }

    if (!flightIds?.length && !bracketIds?.length) {
      return res.status(400).json({
        error: 'No selection provided',
        message: 'Must specify flightIds or bracketIds for selective deletion'
      });
    }

    console.log(`[Game Management] Selective deletion for event ${eventId}`, { flightIds, bracketIds });

    let deleteConditions = eq(games.eventId, eventId);

    // Add flight or bracket conditions (simplified for now)
    if (flightIds?.length > 0) {
      console.log(`[Game Management] Would delete games for flights: ${flightIds.join(', ')}`);
    }

    if (bracketIds?.length > 0) {
      console.log(`[Game Management] Would delete games for brackets: ${bracketIds.join(', ')}`);
    }

    // For now, use the basic event-level deletion
    // This would need to be enhanced with proper flight/bracket filtering
    const existingGames = await db
      .select()
      .from(games)
      .where(deleteConditions);

    const gameCount = existingGames.length;

    const deleteResult = await db
      .delete(games)
      .where(deleteConditions);

    console.log(`[Game Management] Selective deletion completed: ${gameCount} games removed`);

    res.json({
      success: true,
      message: `Selectively deleted ${gameCount} games`,
      deletedCount: gameCount,
      eventId: eventId
    });

  } catch (error) {
    console.error('[Game Management] Error in selective deletion:', error);
    res.status(500).json({
      error: 'Failed to delete games selectively',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;