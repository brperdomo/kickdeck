import { Router } from 'express';
import { db } from '../../../db';
import { eq, and, asc } from 'drizzle-orm';
import { events, eventGameFormats, eventScheduleConstraints } from '../../../db/schema';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * Get game metadata configuration for an event
 */
router.get('/:eventId/game-metadata', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Fetching game metadata for event:', eventId);

    // Get game format rules
    const gameFormats = await db
      .select()
      .from(eventGameFormats)
      .where(eq(eventGameFormats.eventId, parseInt(eventId)))
      .orderBy(asc(eventGameFormats.ageGroup));

    // Get schedule constraints
    const constraints = await db
      .select()
      .from(eventScheduleConstraints)
      .where(eq(eventScheduleConstraints.eventId, parseInt(eventId)))
      .limit(1);

    console.log('Game metadata results:', {
      gameFormatsCount: gameFormats.length,
      constraintsCount: constraints.length
    });

    res.json({
      gameFormats,
      constraints: constraints[0] || null,
      configured: gameFormats.length > 0 && constraints.length > 0
    });
  } catch (error) {
    console.error('Error fetching game metadata:', error);
    res.status(500).json({ error: 'Failed to fetch game metadata configuration' });
  }
});

/**
 * Update game format rules for an event
 */
router.put('/:eventId/game-formats', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { gameFormats } = req.body;

    if (!Array.isArray(gameFormats)) {
      return res.status(400).json({ error: 'Game formats must be an array' });
    }

    const eventIdInt = parseInt(eventId);
    console.log('Updating game formats for event:', eventIdInt);

    // Delete existing game formats for this event
    await db
      .delete(eventGameFormats)
      .where(eq(eventGameFormats.eventId, eventIdInt));

    // Insert new game formats
    if (gameFormats.length > 0) {
      await db
        .insert(eventGameFormats)
        .values(gameFormats.map(format => ({
          eventId: eventIdInt,
          ...format
        })));
    }

    console.log('Game formats updated successfully:', gameFormats.length);
    res.json({ success: true, message: 'Game formats updated successfully' });
  } catch (error) {
    console.error('Error updating game formats:', error);
    res.status(500).json({ error: 'Failed to update game formats' });
  }
});

/**
 * Update schedule constraints for an event
 */
router.put('/:eventId/schedule-constraints', async (req, res) => {
  try {
    const { eventId } = req.params;
    const constraints = req.body;

    const eventIdInt = parseInt(eventId);
    console.log('Updating schedule constraints for event:', eventIdInt);

    // Check if constraints already exist
    const existing = await db
      .select()
      .from(eventScheduleConstraints)
      .where(eq(eventScheduleConstraints.eventId, eventIdInt))
      .limit(1);

    if (existing.length > 0) {
      // Update existing constraints
      await db
        .update(eventScheduleConstraints)
        .set({
          ...constraints,
          updatedAt: new Date().toISOString()
        })
        .where(eq(eventScheduleConstraints.eventId, eventIdInt));
    } else {
      // Insert new constraints
      await db
        .insert(eventScheduleConstraints)
        .values({
          eventId: eventIdInt,
          ...constraints
        });
    }

    console.log('Schedule constraints updated successfully');
    res.json({ success: true, message: 'Schedule constraints updated successfully' });
  } catch (error) {
    console.error('Error updating schedule constraints:', error);
    res.status(500).json({ error: 'Failed to update schedule constraints' });
  }
});

/**
 * Get default game format templates
 */
router.get('/default-templates', async (req, res) => {
  try {
    const defaultTemplates = [
      {
        ageGroup: 'U6-U8',
        format: '4v4',
        gameLength: 40,
        halves: 2,
        halfLength: 20,
        halfTimeBreak: 5,
        bufferTime: 10,
        fieldSize: '7v7',
        allowsLights: false,
        surfacePreference: 'either'
      },
      {
        ageGroup: 'U9-U10',
        format: '7v7',
        gameLength: 50,
        halves: 2,
        halfLength: 25,
        halfTimeBreak: 5,
        bufferTime: 10,
        fieldSize: '7v7',
        allowsLights: true,
        surfacePreference: 'either'
      },
      {
        ageGroup: 'U11-U12',
        format: '9v9',
        gameLength: 60,
        halves: 2,
        halfLength: 30,
        halfTimeBreak: 10,
        bufferTime: 10,
        fieldSize: '9v9',
        allowsLights: true,
        surfacePreference: 'either'
      },
      {
        ageGroup: 'U13-U15',
        format: '11v11',
        gameLength: 70,
        halves: 2,
        halfLength: 35,
        halfTimeBreak: 10,
        bufferTime: 10,
        fieldSize: '11v11',
        allowsLights: true,
        surfacePreference: 'grass'
      },
      {
        ageGroup: 'U16-U19',
        format: '11v11',
        gameLength: 90,
        halves: 2,
        halfLength: 45,
        halfTimeBreak: 15,
        bufferTime: 10,
        fieldSize: '11v11',
        allowsLights: true,
        surfacePreference: 'grass'
      }
    ];

    res.json(defaultTemplates);
  } catch (error) {
    console.error('Error fetching default templates:', error);
    res.status(500).json({ error: 'Failed to fetch default templates' });
  }
});

/**
 * Validate game metadata configuration completeness
 */
router.get('/:eventId/validate', async (req, res) => {
  try {
    const { eventId } = req.params;

    const gameFormats = await db
      .select()
      .from(eventGameFormats)
      .where(eq(eventGameFormats.eventId, eventId));

    const constraints = await db
      .select()
      .from(eventScheduleConstraints)
      .where(eq(eventScheduleConstraints.eventId, eventId));

    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      gameFormatsConfigured: gameFormats.length > 0,
      constraintsConfigured: constraints.length > 0
    };

    if (gameFormats.length === 0) {
      validation.isValid = false;
      validation.errors.push('No game format rules configured');
    }

    if (constraints.length === 0) {
      validation.isValid = false;
      validation.errors.push('No schedule constraints configured');
    }

    // Validate individual game formats
    gameFormats.forEach((format, index) => {
      if (!format.gameLength || format.gameLength < 20) {
        validation.errors.push(`Game format ${index + 1}: Invalid game length`);
        validation.isValid = false;
      }
      if (!format.bufferTime || format.bufferTime < 5) {
        validation.warnings.push(`Game format ${index + 1}: Consider adding buffer time between games`);
      }
    });

    res.json(validation);
  } catch (error) {
    console.error('Error validating game metadata:', error);
    res.status(500).json({ error: 'Failed to validate game metadata' });
  }
});

export default router;