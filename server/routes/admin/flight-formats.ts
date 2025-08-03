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

    // Get all flights (brackets) with their teams
    const flightsWithTeams = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        currentFormat: {
          id: eventGameFormats.id,
          gameLength: eventGameFormats.gameLength,
          fieldSize: eventGameFormats.fieldSize,
          bufferTime: eventGameFormats.bufferTime,
          ageGroup: eventGameFormats.ageGroup,
          format: eventGameFormats.format
        }
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .leftJoin(eventGameFormats, eq(eventGameFormats.eventId, parseInt(eventId)))
      .where(
        and(
          eq(eventAgeGroups.eventId, eventId),
          isNotNull(eventBrackets.id) // Only include brackets that exist (flights are locked)
        )
      );

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

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          ageGroup: flight.ageGroup,
          gender: flight.gender,
          teamCount: teamCount.length,
          currentFormat: flight.currentFormat?.id ? flight.currentFormat : undefined
        };
      })
    );

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
router.post('/events/:eventId/flights/:flightId/format', isAdmin, async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    const { gameLength, fieldSize, bufferTime, restPeriod, maxGamesPerDay, templateName } = req.body;
    
    console.log(`[Flight Formats] Saving format for event ${eventId}, flight ${flightId}:`, {
      gameLength, fieldSize, bufferTime, restPeriod, maxGamesPerDay, templateName
    });

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

    console.log(`[Flight Formats] Format configuration saved successfully for flight ${flightId}`);
    res.json({ success: true, message: 'Format configuration saved successfully' });
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

    if (flightsWithoutFormats.length > 0) {
      return res.status(400).json({ 
        error: 'All flights must have format configurations before locking',
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