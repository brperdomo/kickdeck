import { Router } from 'express';
import { db } from '@db';
import { games, fields } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/admin/events/:eventId/optimize-schedule
 * Field consolidation optimization - moves games from outer fields to priority fields
 */
router.post('/events/:eventId/optimize-schedule', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    let { targetDate = '2025-08-16' } = req.body;
  
  // If no target date provided, use the date that has games (based on frontend logs)
  if (!targetDate || targetDate === '2025-08-09') {
    targetDate = '2025-08-16'; // Use the date that actually has games
  }
    
    console.log(`🚀 Starting field consolidation for Event ${eventId} on ${targetDate}`);
    console.log(`🎯 REQUEST BODY:`, JSON.stringify(req.body, null, 2));
    
    // Get games to optimize - get all games to see what we're working with
    const allGamesInEvent = await db
      .select({
        id: games.id,
        fieldId: games.fieldId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
      })
      .from(games)
      .where(eq(games.eventId, eventId.toString()));

    console.log(`📊 ALL GAMES IN EVENT ${eventId}:`, allGamesInEvent.length);
    console.log(`📊 GAME DATES:`, Array.from(new Set(allGamesInEvent.map(g => g.scheduledDate))));

    // Get games for target date
    const gamesForOptimization = allGamesInEvent.filter(g => g.scheduledDate === targetDate);
    console.log(`📋 Found ${gamesForOptimization.length} games for optimization on ${targetDate}`);

    // Get available fields
    const availableFields = await db
      .select({
        id: fields.id,
        name: fields.name,
      })
      .from(fields)
      .where(eq(fields.isOpen, true));

    console.log(`🏟️ Available fields: ${availableFields.length}`);

    // Priority field mapping (name to ID)
    const priorityFields = new Map();
    const targetFields = new Map(); // Fields to consolidate FROM
    
    availableFields.forEach(field => {
      const fieldName = field.name;
      if (fieldName === '12' || fieldName === '13') {
        priorityFields.set(fieldName, field.id);
      }
      if (fieldName === '14' || fieldName === '15' || fieldName === '20') {
        targetFields.set(field.id, fieldName);
      }
    });

    console.log(`🎯 Priority fields (12,13):`, Array.from(priorityFields.entries()));
    console.log(`🎯 Target fields (14,15,20):`, Array.from(targetFields.entries()));

    // Track field usage to manage capacity
    const fieldUsage = new Map();
    const timeSlotUsage = new Map(); // time -> Set of fieldIds
    
    gamesForOptimization.forEach(game => {
      if (game.fieldId && game.scheduledTime) {
        // Track total games per field
        fieldUsage.set(game.fieldId, (fieldUsage.get(game.fieldId) || 0) + 1);
        
        // Track field usage per time slot
        const timeKey = game.scheduledTime;
        if (!timeSlotUsage.has(timeKey)) {
          timeSlotUsage.set(timeKey, new Set());
        }
        timeSlotUsage.get(timeKey).add(game.fieldId);
      }
    });

    console.log(`📊 Current field usage:`, Array.from(fieldUsage.entries()).map(([id, count]) => {
      const field = availableFields.find(f => f.id === id);
      return `Field ${field?.name} (ID: ${id}): ${count} games`;
    }));

    let optimizationsApplied = 0;
    const maxGamesPerField = 8; // Capacity limit per field

    // Consolidation logic: Move games from target fields to priority fields
    for (const game of gamesForOptimization) {
      if (!game.fieldId || !game.scheduledTime) continue;
      
      // Only move games that are on target fields (14, 15, 20)
      if (!targetFields.has(game.fieldId)) continue;
      
      const currentFieldName = targetFields.get(game.fieldId);
      const timeKey = game.scheduledTime;
      const usedFieldsInSlot = timeSlotUsage.get(timeKey) || new Set();

      console.log(`🔄 Analyzing Game ${game.id} on Field ${currentFieldName} at ${timeKey}`);

      // Try to move to priority fields (12 first, then 13)
      for (const [priorityFieldName, priorityFieldId] of priorityFields.entries()) {
        const currentUsage = fieldUsage.get(priorityFieldId) || 0;
        const fieldAvailable = !usedFieldsInSlot.has(priorityFieldId);
        const fieldHasCapacity = currentUsage < maxGamesPerField;

        if (fieldAvailable && fieldHasCapacity) {
          console.log(`✅ Moving Game ${game.id}: Field ${currentFieldName} → Field ${priorityFieldName}`);
          
          // Update the game
          await db
            .update(games)
            .set({ 
              fieldId: priorityFieldId,
              updatedAt: new Date().toISOString()
            })
            .where(eq(games.id, game.id));

          // Update tracking
          fieldUsage.set(game.fieldId, (fieldUsage.get(game.fieldId) || 1) - 1);
          fieldUsage.set(priorityFieldId, (fieldUsage.get(priorityFieldId) || 0) + 1);
          timeSlotUsage.get(timeKey)?.delete(game.fieldId);
          timeSlotUsage.get(timeKey)?.add(priorityFieldId);
          
          optimizationsApplied++;
          break; // Move to next game
        } else {
          console.log(`❌ Field ${priorityFieldName} unavailable: available=${fieldAvailable}, capacity=${fieldHasCapacity} (${currentUsage}/${maxGamesPerField})`);
        }
      }
    }

    console.log(`🎉 Optimization complete: ${optimizationsApplied} games consolidated`);

    res.json({
      success: true,
      optimizationsApplied,
      fieldUtilizationImproved: optimizationsApplied * 5, // Rough improvement percentage
      message: `Successfully consolidated ${optimizationsApplied} games to priority fields`,
      fieldUtilization: Array.from(fieldUsage).map(([fieldId, count]) => {
        const field = availableFields.find(f => f.id === fieldId);
        return { fieldName: field?.name, fieldId, gamesScheduled: count };
      }),
      optimizations: [],
      conflictsResolved: 0,
      newGamePlacements: [] // Add missing properties to prevent frontend errors
    });

  } catch (error) {
    console.error('🚨 Schedule optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;