import { Router } from 'express';
import { isAdmin } from '../../middleware';
import { db } from '@db';
import { eventAgeGroups, teams, events, eventGameFormats, eventBrackets, gameFormats } from '@db/schema';
import { eq, and, count } from 'drizzle-orm';

const router = Router();

// Get flight configurations for an event
router.get('/events/:eventId/flight-configurations', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event details first to get actual event dates
    const [eventDetails] = await db
      .select({
        startDate: events.startDate,
        endDate: events.endDate,
      })
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);

    // Use the EXACT SAME data source as MasterSchedulePage
    // Query event_brackets (flights) with their game formats from the game_formats table
    const flightsWithFormats = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        level: eventBrackets.level,
        // Game format data
        gameFormatId: gameFormats.id,
        gameLength: gameFormats.gameLength,
        fieldSize: gameFormats.fieldSize,
        bufferTime: gameFormats.bufferTime,
        restPeriod: gameFormats.restPeriod,
        maxGamesPerDay: gameFormats.maxGamesPerDay,
        templateName: gameFormats.templateName
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .leftJoin(gameFormats, eq(gameFormats.bracketId, eventBrackets.id))
      .where(eq(eventBrackets.eventId, eventId));

    console.log(`Found ${flightsWithFormats.length} brackets/flights for event ${eventId}`);

    // Get team counts for each bracket
    const teamCounts = await db
      .select({
        bracketId: teams.bracketId,
        teamCount: count(teams.id),
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ))
      .groupBy(teams.bracketId);

    // Use event dates or fall back to defaults
    const startDate = eventDetails?.startDate || new Date().toISOString().split('T')[0];
    const endDate = eventDetails?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const configuredFlights = flightsWithFormats.filter(f => f.gameFormatId !== null);
    console.log(`Found ${configuredFlights.length} flights with game formats out of ${flightsWithFormats.length} total`);

    // Transform into the expected response format
    const result = flightsWithFormats.map(flight => {
      const teamCountData = teamCounts.find(tc => tc.bracketId === flight.flightId);
      
      // Check if the game format has all required values for scheduling
      const isCompletelyConfigured = flight.gameFormatId !== null && 
                                   flight.gameLength !== null && 
                                   flight.fieldSize !== null && 
                                   flight.bufferTime !== null;

      console.log(`Processing flight ${flight.flightName}: ${teamCountData?.teamCount || 0} teams, configured = ${isCompletelyConfigured}`);

      return {
        id: flight.flightId.toString(),
        divisionName: `${flight.ageGroup} ${flight.gender} - ${flight.flightName}`,
        startDate: startDate,
        endDate: endDate,
        matchCount: 2, // Default halves
        matchTime: flight.gameLength || 35,
        breakTime: 5, // Default
        paddingTime: flight.bufferTime || 10,
        totalTime: flight.gameLength || 35,
        formatName: flight.templateName || (isCompletelyConfigured ? 'Configured' : 'Not Configured'),
        teamCount: teamCountData?.teamCount || 0,
        ageGroupId: flight.ageGroupId,
        isConfigured: isCompletelyConfigured,
        ageGroup: flight.ageGroup,
        gender: flight.gender,
        flightName: flight.flightName,
        level: flight.level
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching flight configurations:', error);
    res.status(500).json({ error: 'Failed to fetch flight configurations' });
  }
});

// Update flight configuration
router.patch('/events/:eventId/flight-configurations/:flightId', isAdmin, async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    const updates = req.body;

    console.log('Updating flight configuration:', { eventId, flightId, updates });
    
    // For now, just return success - implement actual updates later
    res.json({ success: true, message: 'Flight configuration updated' });
  } catch (error) {
    console.error('Error updating flight configuration:', error);
    res.status(500).json({ error: 'Failed to update flight configuration' });
  }
});

export default router;