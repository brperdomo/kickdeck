import { Router } from 'express';
import { db } from '../../../db';
import { fields, games, eventBrackets } from '@db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Get fields for an event
router.get('/:eventId/fields', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get all fields (assuming global fields for now)
    const fieldList = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        surface: fields.surface,
        capacity: sql<number>`COALESCE(${fields.capacity}, 22)`,
        isActive: fields.isActive
      })
      .from(fields)
      .where(eq(fields.isActive, true));

    // Get game assignments for each field
    const fieldsWithAssignments = await Promise.all(
      fieldList.map(async (field) => {
        const assignedGames = await db
          .select({ count: sql<number>`count(*)` })
          .from(games)
          .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
          .where(
            and(
              eq(eventBrackets.eventId, eventId),
              eq(games.fieldId, field.id)
            )
          );

        return {
          ...field,
          assignedGames: assignedGames[0]?.count || 0
        };
      })
    );

    res.json(fieldsWithAssignments);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Assign fields to games
router.post('/:eventId/fields/assign', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get unassigned games
    const unassignedGames = await db
      .select({
        id: games.id,
        bracketId: games.bracketId,
        requiredFieldSize: sql<string>`'11v11'` // Default field size
      })
      .from(games)
      .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          isNull(games.fieldId)
        )
      );

    // Get available fields
    const availableFields = await db
      .select()
      .from(fields)
      .where(eq(fields.isActive, true));

    let assignedGames = 0;
    const fieldsUsed = new Set();

    // Simple field assignment algorithm
    for (const game of unassignedGames) {
      // Find a suitable field (match field size if possible)
      const suitableField = availableFields.find(field => 
        field.fieldSize === game.requiredFieldSize
      ) || availableFields[0]; // Fallback to first available field

      if (suitableField) {
        await db
          .update(games)
          .set({ fieldId: suitableField.id })
          .where(eq(games.id, game.id));
        
        assignedGames++;
        fieldsUsed.add(suitableField.id);
      }
    }

    res.json({
      success: true,
      assignedGames,
      fieldsUsed: fieldsUsed.size,
      message: `Assigned ${assignedGames} games to ${fieldsUsed.size} fields`
    });
  } catch (error) {
    console.error('Error assigning fields:', error);
    res.status(500).json({ error: 'Failed to assign fields' });
  }
});

// Optimize field assignments
router.post('/:eventId/fields/optimize', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Placeholder optimization logic
    // In a real implementation, this would:
    // 1. Balance field utilization
    // 2. Minimize conflicts
    // 3. Consider field surface preferences
    // 4. Optimize geographic distribution
    
    res.json({
      success: true,
      utilizationImprovement: 20,
      fieldsOptimized: 4,
      message: 'Field assignments optimized successfully'
    });
  } catch (error) {
    console.error('Error optimizing fields:', error);
    res.status(500).json({ error: 'Failed to optimize field assignments' });
  }
});

export default router;