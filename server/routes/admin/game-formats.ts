import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eq, and, sql, ne } from 'drizzle-orm';
import { 
  eventBrackets, 
  eventGameFormats,
  events,
  teams,
  formatTemplates,
  gameFormats
} from '@db/schema';

const router = Router();

// Interface for bracket structure
interface BracketStructure {
  type: 'round_robin_final' | 'cross_flight_play' | 'dual_flight_championship';
  teamCount: number;
  flightConfiguration?: {
    flightA: number;
    flightB: number;
  };
  gameDistribution: {
    saturday: number;
    sunday: number;
    total: number;
  };
  playoffStructure: {
    hasPlayoffs: boolean;
    finalsDay: 'saturday' | 'sunday';
    qualificationMethod: 'top_points' | 'cross_flight_top';
  };
  description: string;
}

interface GameFormat {
  id?: number;
  gameLength: number;
  fieldSize: string;
  bufferTime: number;
  restPeriod: number;
  maxGamesPerDay: number;
  templateName?: string;
  bracketStructure?: BracketStructure;
}

// GET /api/admin/events/:eventId/flight-formats
// Fetch flights with their current format configurations
router.get('/events/:eventId/flight-formats', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`[Flight Formats] Fetching data for event ${eventId}`);

    // Get all flights for this event
    const flights = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId)
    });

    console.log(`[Flight Formats] Found ${flights.length} flights/brackets`);

    // Get all game formats for this event
    const gameFormats = await db.query.eventGameFormats.findMany({
      where: eq(eventGameFormats.eventId, parseInt(eventId))
    });

    console.log(`[Flight Formats] Found ${gameFormats.length} game formats`);

    const flightData = await Promise.all(flights.map(async bracket => {
      // Find matching game format by age group (bracket.level)
      const matchingFormat = gameFormats.find(format => 
        format.ageGroup === bracket.level || 
        format.ageGroup.includes(bracket.level) ||
        bracket.level.includes(format.ageGroup)
      );

      const teamCount = await getTeamCountForFlight(eventId, bracket.id);

      console.log(`[Flight Formats] Bracket ${bracket.id} (${bracket.level}): teams=${teamCount}, hasFormat=${!!matchingFormat}`);

      return {
        flightId: bracket.id,
        flightName: bracket.name,
        ageGroup: bracket.level,
        gender: 'Mixed', // Default gender, could be extracted from description
        teamCount,
        currentFormat: matchingFormat ? {
          id: matchingFormat.id,
          gameLength: matchingFormat.gameLength,
          fieldSize: matchingFormat.fieldSize,
          bufferTime: matchingFormat.bufferTime,
          restPeriod: 90, // Default rest period (not in eventGameFormats schema)
          maxGamesPerDay: 3, // Default max games per day (not in eventGameFormats schema)
          templateName: `${matchingFormat.format} ${matchingFormat.gameLength}min`
        } : undefined
      };
    }));

    console.log(`[Flight Formats] Configured flights: ${flightData.filter(f => f.currentFormat).length}/${flightData.length}`);

    res.json(flightData);
  } catch (error) {
    console.error('[Flight Formats] Error fetching flight formats:', error);
    res.status(500).json({ error: 'Failed to fetch flight formats' });
  }
});

// GET /api/admin/format-templates
// Fetch available format templates from database
router.get('/format-templates', isAdmin, async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(formatTemplates)
      .where(eq(formatTemplates.isActive, true))
      .orderBy(formatTemplates.name);

    res.json(templates);
  } catch (error) {
    console.error('Error fetching format templates:', error);
    res.status(500).json({ error: 'Failed to fetch format templates' });
  }
});

// POST /api/admin/format-templates
// Create new format template
router.post('/format-templates', isAdmin, async (req, res) => {
  try {
    const { name, description, gameLength, fieldSize, bufferTime, restPeriod, maxGamesPerDay } = req.body;

    // Validate required fields
    if (!name || !description || !gameLength || !fieldSize || !bufferTime || !restPeriod || !maxGamesPerDay) {
      return res.status(400).json({ error: 'All template fields are required' });
    }

    // Check for duplicate names
    const existingTemplate = await db
      .select()
      .from(formatTemplates)
      .where(eq(formatTemplates.name, name))
      .limit(1);

    if (existingTemplate.length > 0) {
      return res.status(400).json({ error: 'Template name already exists' });
    }

    const [newTemplate] = await db
      .insert(formatTemplates)
      .values({
        name,
        description,
        gameLength: parseInt(gameLength),
        fieldSize,
        bufferTime: parseInt(bufferTime),
        restPeriod: parseInt(restPeriod),
        maxGamesPerDay: parseInt(maxGamesPerDay),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    res.json({ success: true, template: newTemplate });
  } catch (error) {
    console.error('Error creating format template:', error);
    res.status(500).json({ error: 'Failed to create format template' });
  }
});

// PUT /api/admin/format-templates/:id
// Update existing format template
router.put('/format-templates/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, gameLength, fieldSize, bufferTime, restPeriod, maxGamesPerDay } = req.body;

    // Validate required fields
    if (!name || !description || !gameLength || !fieldSize || !bufferTime || !restPeriod || !maxGamesPerDay) {
      return res.status(400).json({ error: 'All template fields are required' });
    }

    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(formatTemplates)
      .where(eq(formatTemplates.id, parseInt(id)))
      .limit(1);

    if (existingTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check for duplicate names (excluding current template)
    const duplicateName = await db
      .select()
      .from(formatTemplates)
      .where(and(
        eq(formatTemplates.name, name),
        ne(formatTemplates.id, parseInt(id))
      ))
      .limit(1);

    if (duplicateName.length > 0) {
      return res.status(400).json({ error: 'Template name already exists' });
    }

    const [updatedTemplate] = await db
      .update(formatTemplates)
      .set({
        name,
        description,
        gameLength: parseInt(gameLength),
        fieldSize,
        bufferTime: parseInt(bufferTime),
        restPeriod: parseInt(restPeriod),
        maxGamesPerDay: parseInt(maxGamesPerDay),
        updatedAt: new Date().toISOString()
      })
      .where(eq(formatTemplates.id, parseInt(id)))
      .returning();

    res.json({ success: true, template: updatedTemplate });
  } catch (error) {
    console.error('Error updating format template:', error);
    res.status(500).json({ error: 'Failed to update format template' });
  }
});

// DELETE /api/admin/format-templates/:id
// Soft delete format template (mark as inactive)
router.delete('/format-templates/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(formatTemplates)
      .where(eq(formatTemplates.id, parseInt(id)))
      .limit(1);

    if (existingTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await db
      .update(formatTemplates)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(formatTemplates.id, parseInt(id)));

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting format template:', error);
    res.status(500).json({ error: 'Failed to delete format template' });
  }
});

// POST /api/admin/events/:eventId/flights/:flightId/format
// Save format configuration for a specific flight
router.post('/events/:eventId/flights/:flightId/format', isAdmin, async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    const format: GameFormat = req.body;

    // Validate required fields
    if (!format.gameLength || !format.fieldSize || !format.bufferTime || 
        !format.restPeriod || !format.maxGamesPerDay) {
      return res.status(400).json({ error: 'Missing required format fields' });
    }

    // Check if flight exists and belongs to event
    const flight = await db.query.eventBrackets.findFirst({
      where: and(
        eq(eventBrackets.id, parseInt(flightId)),
        eq(eventBrackets.eventId, eventId)
      )
    });

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Check if format already exists for this flight
    let gameFormat = await db.query.gameFormats.findFirst({
      where: eq(gameFormats.bracketId, parseInt(flightId))
    });

    const formatData = {
      bracketId: parseInt(flightId),
      gameLength: format.gameLength,
      fieldSize: format.fieldSize,
      bufferTime: format.bufferTime,
      restPeriod: format.restPeriod,
      maxGamesPerDay: format.maxGamesPerDay,
      templateName: format.templateName || null
      // bracketStructure will be added when we extend the schema
    };

    if (gameFormat) {
      // Update existing format
      await db.update(gameFormats)
        .set(formatData)
        .where(eq(gameFormats.id, gameFormat.id));
      
      res.json({ success: true, id: gameFormat.id });
    } else {
      // Create new format
      const [newFormat] = await db.insert(gameFormats)
        .values(formatData)
        .returning();
      
      res.json({ success: true, id: newFormat.id });
    }
  } catch (error) {
    console.error('Error saving format configuration:', error);
    res.status(500).json({ error: 'Failed to save format configuration' });
  }
});

// POST /api/admin/events/:eventId/flight-formats/lock
// Lock all formats and proceed to bracket creation phase
router.post('/events/:eventId/flight-formats/lock', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify all flights have format configurations
    const flights = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId),
      with: {
        gameFormat: true
      }
    });

    const unconfiguredFlights = flights.filter(f => !f.gameFormat);
    
    if (unconfiguredFlights.length > 0) {
      return res.status(400).json({ 
        error: 'All flights must have format configurations before locking',
        unconfiguredFlights: unconfiguredFlights.map(f => f.name)
      });
    }

    // For now, we'll just return success without updating event status
    // TODO: Add a status field to events table when needed

    res.json({ success: true, message: 'All formats locked successfully' });
  } catch (error) {
    console.error('Error locking formats:', error);
    res.status(500).json({ error: 'Failed to lock formats' });
  }
});

// Helper function to get team count for a specific flight
async function getTeamCountForFlight(eventId: string, flightId: number): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.bracketId, flightId),
        eq(teams.status, 'approved')
      ));
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error counting teams for flight:', error);
    return 0;
  }
}

export default router;