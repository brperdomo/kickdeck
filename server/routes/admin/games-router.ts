import { Router } from 'express';
import { db } from '../../../db';
import { eq, inArray, and } from 'drizzle-orm';
import { games, gameTimeSlots } from '../../../db/schema';
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
    return res.status(500).json({ 
      error: "Failed to delete game",
      details: error instanceof Error ? error.message : String(error)
    });
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
      .where(eq(games.eventId, String(eventId)));
    
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

/**
 * Reschedule a game (update field and time)
 * 
 * PUT /api/admin/games/:gameId/reschedule
 */
router.put('/:gameId/reschedule', hasEventAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fieldId, startTime, eventId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ message: "Game ID is required" });
    }
    
    if (!fieldId || !startTime || !eventId) {
      return res.status(400).json({ 
        message: "Field ID, start time, and event ID are required" 
      });
    }
    
    // Parse gameId to number
    const parsedGameId = parseInt(gameId);
    const parsedFieldId = parseInt(fieldId);
    const parsedEventId = parseInt(eventId);
    
    if (isNaN(parsedGameId) || isNaN(parsedFieldId) || isNaN(parsedEventId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Get the game to make sure it exists and to check event access
    const [gameToUpdate] = await db
      .select()
      .from(games)
      .where(eq(games.id, parsedGameId))
      .limit(1);
    
    if (!gameToUpdate) {
      return res.status(404).json({ message: "Game not found" });
    }
    
    // Update the game with new field (note: games table doesn't have startTime field directly)
    await db
      .update(games)
      .set({
        fieldId: parsedFieldId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parsedGameId));
    
    // Find or create appropriate time slot for the new time and field
    try {
      // Calculate end time (assuming 90 minutes total: 70 min game + 20 min buffer)
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // 90 minutes later
      const endTimeStr = endDate.toISOString();
      
      // Get day index (days since start of event)
      const eventStartTime = new Date(startTime);
      const dayIndex = Math.floor((eventStartTime.getTime() - new Date(startTime.split('T')[0] + 'T00:00:00.000Z').getTime()) / (24 * 60 * 60 * 1000));
      
      // Look for an existing time slot that matches this field, time, and event
      const existingSlots = await db
        .select()
        .from(gameTimeSlots)
        .where(and(
          eq(gameTimeSlots.eventId, parsedEventId.toString()),
          eq(gameTimeSlots.fieldId, parsedFieldId),
          eq(gameTimeSlots.startTime, startTime)
        ));
      
      let timeSlotId;
      
      if (existingSlots.length > 0) {
        // Use existing time slot
        timeSlotId = existingSlots[0].id;
      } else {
        // Create new time slot
        const [newSlot] = await db
          .insert(gameTimeSlots)
          .values({
            eventId: parsedEventId.toString(),
            fieldId: parsedFieldId,
            startTime: startTime,
            endTime: endTimeStr,
            dayIndex: dayIndex,
            isAvailable: false, // Mark as not available since game is assigned
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .returning();
        
        timeSlotId = newSlot.id;
      }
      
      // Update the game to reference the time slot
      await db
        .update(games)
        .set({
          timeSlotId: timeSlotId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(games.id, parsedGameId));
        
    } catch (timeSlotError) {
      console.warn("Time slot creation/update failed (non-critical):", timeSlotError);
      // Continue - the field update was successful
    }
    
    return res.json({ 
      success: true,
      message: "Game rescheduled successfully",
      gameId: parsedGameId,
      fieldId: parsedFieldId,
      startTime: startTime
    });
  } catch (error) {
    console.error("Error rescheduling game:", error);
    return res.status(500).json({ 
      error: "Failed to reschedule game",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;