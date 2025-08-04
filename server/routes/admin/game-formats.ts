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

    console.log(`[Flight Formats] Found ${flights.length} flights`);

    // Get all game formats for flights in this event
    const gameFormatsQuery = await db.query.gameFormats.findMany({
      where: sql`bracket_id IN (SELECT id FROM event_brackets WHERE event_id = ${eventId})`
    });

    console.log(`[Flight Formats] Found ${gameFormatsQuery.length} game formats`);

    // Get flight templates for proper display names
    const flightTemplates = await db.execute(sql`
      SELECT level, display_name FROM event_flight_templates 
      WHERE event_id = ${eventId} AND is_active = true
    `);

    const flightLevelMap = new Map();
    flightTemplates.rows.forEach(template => {
      flightLevelMap.set(template.level, template.display_name);
    });

    const flightData = await Promise.all(flights.map(async flight => {
      // Find matching game format by bracket ID
      const matchingFormat = gameFormatsQuery.find(format => 
        format.bracketId === flight.id
      );

      const teamCount = await getTeamCountForFlight(eventId, flight.id);

      // Extract components from flight name
      // The flight name might just be "Nike Elite" without age group info
      // We need to get age group from the flight's relationship or description
      
      // Try to extract age group from name first
      const ageGroupMatch = flight.name.match(/(U\d+)/i);
      const genderMatch = flight.name.match(/(Boys|Girls|Mixed)/i);
      
      // If no age group in name, we need to look up the actual age group
      // For now, let's get the age group from the flight's associated teams
      let ageGroup = ageGroupMatch ? ageGroupMatch[1] : null;
      let gender = genderMatch ? genderMatch[1] : null;
      
      // If we don't have age group/gender from the flight name, 
      // try to get it from the teams in this flight
      if (!ageGroup || !gender) {
        const flightTeams = await db.execute(sql`
          SELECT DISTINCT 
            eag.age_group as age_group_name,
            eag.gender
          FROM teams t
          JOIN event_age_groups eag ON t.age_group_id = eag.id
          WHERE t.event_id = ${eventId} 
          AND t.bracket_id = ${flight.id}
          AND t.status = 'approved'
          LIMIT 1
        `);
        
        if (flightTeams.rows.length > 0) {
          const teamInfo = flightTeams.rows[0] as any;
          ageGroup = ageGroup || teamInfo.age_group_name;
          // The database already stores 'Boys'/'Girls' correctly
          gender = gender || (teamInfo.gender as string) || 'Mixed';
        }
      }
      
      // Fallback values
      ageGroup = ageGroup || 'Unknown Age';
      gender = gender || 'Mixed';
      
      // The flight name is typically the flight name itself (Nike Elite, etc.)
      let flightName = flight.name;
      
      // Only remove age group and gender if they were actually in the name
      if (ageGroupMatch) {
        flightName = flightName.replace(ageGroupMatch[0], '').trim();
      }
      if (genderMatch) {
        flightName = flightName.replace(genderMatch[0], '').trim();
      }
      
      // Get flight level display name (Top Flight, Middle Flight, etc.)
      const flightLevelDisplay = flightLevelMap.get(flight.level) || flight.level;
      
      // Create comprehensive display name: "U17 Boys Nike Elite - Top Flight"
      const displayName = flightName 
        ? `${ageGroup} ${gender} ${flightName} - ${flightLevelDisplay}`
        : `${ageGroup} ${gender} - ${flightLevelDisplay}`;

      console.log(`[Flight Formats] Flight ${flight.id} (${flight.level}): teams=${teamCount}, hasFormat=${!!matchingFormat}`);

      return {
        flightId: flight.id,
        flightName: flightName || flight.name, // The flight name (Nike Elite, etc.)
        ageGroup: ageGroup,
        gender: gender,
        level: flight.level,
        displayName: displayName,
        teamCount,
        currentFormat: matchingFormat ? {
          id: matchingFormat.id,
          gameLength: matchingFormat.gameLength,
          fieldSize: matchingFormat.fieldSize,
          bufferTime: matchingFormat.bufferTime,
          restPeriod: matchingFormat.restPeriod || 90, // Use saved rest period or default
          maxGamesPerDay: matchingFormat.maxGamesPerDay || 3, // Use saved max games or default
          templateName: matchingFormat.templateName || `${matchingFormat.fieldSize} ${matchingFormat.gameLength}min`
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

// GET /api/admin/format-templates/debug  
// Debug endpoint to test templates without authentication
router.get('/format-templates/debug', async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(formatTemplates)
      .where(eq(formatTemplates.isActive, true))
      .orderBy(formatTemplates.name);

    res.json({ debug: true, templates, count: templates.length });
  } catch (error) {
    console.error('Error fetching format templates (debug):', error);
    res.status(500).json({ error: 'Failed to fetch format templates', debug: true });
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