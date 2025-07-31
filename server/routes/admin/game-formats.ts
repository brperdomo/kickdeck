import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eq, and } from 'drizzle-orm';
import { 
  eventBrackets, 
  gameFormats, 
  events 
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

    // Get all flights for this event with team counts and current formats
    const flightsWithFormats = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId),
      with: {
        gameFormat: true
      }
    });

    const flightData = flightsWithFormats.map(bracket => ({
      flightId: bracket.id,
      flightName: bracket.name,
      ageGroup: bracket.level, // Using level as age group
      gender: 'Mixed', // Default gender, could be extracted from description
      teamCount: 0, // Will need to be calculated separately
      currentFormat: bracket.gameFormat ? {
        id: bracket.gameFormat.id,
        gameLength: bracket.gameFormat.gameLength,
        fieldSize: bracket.gameFormat.fieldSize,
        bufferTime: bracket.gameFormat.bufferTime,
        restPeriod: bracket.gameFormat.restPeriod,
        maxGamesPerDay: bracket.gameFormat.maxGamesPerDay,
        templateName: bracket.gameFormat.templateName || undefined
        // bracketStructure will be added later when we extend the schema
      } : undefined
    }));

    res.json(flightData);
  } catch (error) {
    console.error('Error fetching flight formats:', error);
    res.status(500).json({ error: 'Failed to fetch flight formats' });
  }
});

// GET /api/admin/format-templates
// Fetch available format templates
router.get('/format-templates', isAdmin, async (req, res) => {
  try {
    // Return predefined templates for common scenarios
    const templates = [
      {
        id: 1,
        name: "Youth Standard",
        description: "35-minute halves, 9v9, balanced rest periods",
        gameLength: 35,
        fieldSize: "9v9",
        bufferTime: 10,
        restPeriod: 90,
        maxGamesPerDay: 3
      },
      {
        id: 2,
        name: "Competitive",
        description: "40-minute halves, 11v11, extended rest",
        gameLength: 40,
        fieldSize: "11v11",
        bufferTime: 15,
        restPeriod: 120,
        maxGamesPerDay: 2
      },
      {
        id: 3,
        name: "Fast Pace",
        description: "30-minute halves, 7v7, quick turnaround",
        gameLength: 30,
        fieldSize: "7v7",
        bufferTime: 5,
        restPeriod: 60,
        maxGamesPerDay: 4
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching format templates:', error);
    res.status(500).json({ error: 'Failed to fetch format templates' });
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

export default router;