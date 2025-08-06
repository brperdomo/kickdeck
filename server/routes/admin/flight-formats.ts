import { Router } from 'express';
import { db } from '../../../db/index.js';
import { 
  events, 
  eventAgeGroups, 
  teams, 
  eventBrackets,
  eventGameFormats,
  formatTemplates,
  gameFormats
} from '../../../db/schema.js';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { isAdmin } from '../../middleware';

const router = Router();

// Get flights ready for format configuration (flights must be locked first)
router.get('/events/:eventId/flight-formats', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`[Flight Formats] Fetching formats for event ${eventId}`);

    // Get all flights (brackets) with their teams and format configurations, including field size from age group
    const flightsWithTeams = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        ageGroupFieldSize: eventAgeGroups.fieldSize, // Get field size from age group for defaults
        currentFormat: {
          id: gameFormats.id,
          gameLength: gameFormats.gameLength,
          fieldSize: gameFormats.fieldSize,
          bufferTime: gameFormats.bufferTime,
          restPeriod: gameFormats.restPeriod,
          maxGamesPerDay: gameFormats.maxGamesPerDay,
          templateName: gameFormats.templateName
        }
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .leftJoin(gameFormats, eq(gameFormats.bracketId, eventBrackets.id))
      .where(eq(eventBrackets.eventId, eventId));

    // Get team counts for each flight
    const flightData = await Promise.all(
      flightsWithTeams.map(async (flight) => {
        const teamCount = await db
          .select()
          .from(teams)
          .where(
            and(
              eq(teams.bracketId, flight.flightId),
              eq(teams.status, 'approved')
            )
          );

        // Map flight names to proper levels
        let level = 'other';
        let displayLevel = flight.flightName;
        
        if (flight.flightName.toLowerCase().includes('elite')) {
          level = 'top_flight';
          displayLevel = 'Top Flight';
        } else if (flight.flightName.toLowerCase().includes('premier')) {
          level = 'middle_flight';
          displayLevel = 'Middle Flight';
        } else if (flight.flightName.toLowerCase().includes('classic')) {
          level = 'bottom_flight';
          displayLevel = 'Bottom Flight';
        }

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          ageGroup: flight.ageGroup,
          gender: flight.gender,
          teamCount: teamCount.length,
          ageGroupFieldSize: flight.ageGroupFieldSize, // Include age group field size for frontend defaults
          currentFormat: flight.currentFormat?.id ? flight.currentFormat : undefined,
          level: level,
          displayName: `${flight.ageGroup} ${flight.gender} - ${displayLevel}` // Use proper flight level name
        };
      })
    );

    console.log(`[Flight Formats] Returning ${flightData.length} flights, ${flightData.filter(f => f.currentFormat).length} configured`);
    res.json(flightData);
  } catch (error) {
    console.error('Error fetching flight formats:', error);
    res.status(500).json({ error: 'Failed to fetch flight format data' });
  }
});

// Get format templates - auto-create defaults if none exist
router.get('/format-templates', async (req, res) => {
  try {
    // Check if templates exist, if not create default ones
    const existingTemplates = await db.select().from(formatTemplates);
    
    if (existingTemplates.length === 0) {
      console.log('Creating default format templates...');
      
      const defaultTemplates = [
        {
          name: '11v11 Older',
          description: 'Standard 11v11 format for older age groups with full-size fields',
          gameLength: 40,
          fieldSize: '11v11',
          bufferTime: 15,
          restPeriod: 120,
          maxGamesPerDay: 2,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: '9v9 Standard',
          description: 'Standard 9v9 format for middle age groups',
          gameLength: 35,
          fieldSize: '9v9',
          bufferTime: 10,
          restPeriod: 90,
          maxGamesPerDay: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: '7v7 Youth',
          description: 'Youth 7v7 format for younger age groups',
          gameLength: 30,
          fieldSize: '7v7',
          bufferTime: 10,
          restPeriod: 60,
          maxGamesPerDay: 4,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: '11v11 Elite',
          description: 'Elite level 11v11 with extended game time and rest',
          gameLength: 40,
          fieldSize: '11v11',
          bufferTime: 20,
          restPeriod: 150,
          maxGamesPerDay: 2,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: '9v9 Classic',
          description: 'Classic recreational 9v9 format',
          gameLength: 30,
          fieldSize: '9v9',
          bufferTime: 10,
          restPeriod: 75,
          maxGamesPerDay: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      await db.insert(formatTemplates).values(defaultTemplates);
      console.log('Default format templates created successfully');
    }

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

// Save format configuration for a flight
router.post('/events/:eventId/flights/:flightId/format', async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    const { gameLength, fieldSize, bufferTime, restPeriod, maxGamesPerDay, templateName } = req.body;

    // Validate required fields
    if (!gameLength || !fieldSize || !bufferTime || !restPeriod || !maxGamesPerDay) {
      return res.status(400).json({ error: 'All format fields are required' });
    }

    // Check if format already exists for this flight
    const existingFormat = await db
      .select()
      .from(gameFormats)
      .where(eq(gameFormats.bracketId, parseInt(flightId)))
      .limit(1);

    if (existingFormat.length > 0) {
      // Update existing format
      await db
        .update(gameFormats)
        .set({
          gameLength: parseInt(gameLength),
          fieldSize,
          bufferTime: parseInt(bufferTime),
          restPeriod: parseInt(restPeriod),
          maxGamesPerDay: parseInt(maxGamesPerDay),
          templateName: templateName || null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(gameFormats.bracketId, parseInt(flightId)));
    } else {
      // Create new format
      await db
        .insert(gameFormats)
        .values({
          bracketId: parseInt(flightId),
          gameLength: parseInt(gameLength),
          fieldSize,
          bufferTime: parseInt(bufferTime),
          restPeriod: parseInt(restPeriod),
          maxGamesPerDay: parseInt(maxGamesPerDay),
          templateName: templateName || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }

    // Fetch the saved format and return it
    const savedFormat = await db
      .select()
      .from(gameFormats)
      .where(eq(gameFormats.bracketId, parseInt(flightId)))
      .limit(1);

    console.log(`[Flight Format Save] Format saved for flight ${flightId}, returning data:`, savedFormat[0]);
    
    res.json({ 
      success: true, 
      message: 'Format configuration saved successfully',
      flightId: parseInt(flightId),
      format: savedFormat[0]
    });
  } catch (error) {
    console.error('Error saving format configuration:', error);
    res.status(500).json({ error: 'Failed to save format configuration' });
  }
});

// Lock all formats and proceed to bracket creation
router.post('/events/:eventId/flight-formats/lock', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`[Lock Formats] Attempting to lock formats for event ${eventId}`);

    // Check that all flights have format configurations
    const flightsWithoutFormats = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .leftJoin(gameFormats, eq(gameFormats.bracketId, eventBrackets.id))
      .where(
        and(
          eq(eventAgeGroups.eventId, eventId),
          isNull(gameFormats.id) // No format configuration
        )
      );

    console.log(`[Lock Formats] Found ${flightsWithoutFormats.length} flights without formats`);

    // Check if there are any configured flights at all
    const configuredFlights = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .innerJoin(gameFormats, eq(gameFormats.bracketId, eventBrackets.id))
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log(`[Lock Formats] Found ${configuredFlights.length} configured flights`);

    if (configuredFlights.length === 0) {
      return res.status(400).json({ 
        error: 'At least one flight must have format configuration before locking',
        unconfiguredFlights: flightsWithoutFormats.map(f => f.flightName)
      });
    }

    // Mark event as having locked formats in details field
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update event details to include locked status
    const updatedDetails = event.details?.includes('[FORMATS_LOCKED]') 
      ? event.details 
      : `${event.details || ''} [FORMATS_LOCKED]`;

    await db
      .update(events)
      .set({ 
        details: updatedDetails,
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, parseInt(eventId)));

    console.log(`[Lock Formats] Successfully locked formats for event ${eventId}`);

    res.json({ 
      success: true, 
      message: 'All formats locked successfully',
      nextStep: 'bracket_creation' 
    });
  } catch (error) {
    console.error('Error locking formats:', error);
    res.status(500).json({ error: 'Failed to lock formats' });
  }
});

export default router;