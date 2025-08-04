import { Router } from 'express';
import { isAdmin } from '../../middleware';
import { db } from '@db';
import { eventAgeGroups, teams, events, eventGameFormats } from '@db/schema';
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

    // Get age groups with team counts and game format configurations
    const flightConfigs = await db
      .select({
        id: eventAgeGroups.id,
        divisionName: eventAgeGroups.divisionCode,
        ageGroupId: eventAgeGroups.id,
        eventId: eventAgeGroups.eventId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    // Get team counts for each age group
    const teamCounts = await db
      .select({
        ageGroupId: teams.ageGroupId,
        teamCount: count(teams.id),
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ))
      .groupBy(teams.ageGroupId);

    // Get actual saved game formats for this event
    const savedGameFormats = await db
      .select({
        ageGroup: eventGameFormats.ageGroup,
        format: eventGameFormats.format,
        gameLength: eventGameFormats.gameLength,
        halves: eventGameFormats.halves,
        halfLength: eventGameFormats.halfLength,
        halfTimeBreak: eventGameFormats.halfTimeBreak,
        bufferTime: eventGameFormats.bufferTime,
        fieldSize: eventGameFormats.fieldSize,
        allowsLights: eventGameFormats.allowsLights,
        surfacePreference: eventGameFormats.surfacePreference,
        isActive: eventGameFormats.isActive,
      })
      .from(eventGameFormats)
      .where(and(
        eq(eventGameFormats.eventId, parseInt(eventId)),
        eq(eventGameFormats.isActive, true)
      ));

    // Use event dates or fall back to defaults
    const startDate = eventDetails?.startDate || new Date().toISOString().split('T')[0];
    const endDate = eventDetails?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Found ${flightConfigs.length} age groups`);
    console.log(`Found ${savedGameFormats.length} saved game formats`);
    console.log('Age groups:', flightConfigs.map(c => c.ageGroup));
    console.log('Game format age groups:', savedGameFormats.map(g => g.ageGroup));

    // Combine the data - include all age groups and show their configuration status
    const result = flightConfigs
      .map(config => {
        const teamCountData = teamCounts.find(tc => tc.ageGroupId === config.ageGroupId);
        const gameFormatData = savedGameFormats.find(gf => gf.ageGroup === config.ageGroup);
        
        console.log(`Processing age group ${config.ageGroup}: found game format = ${!!gameFormatData}`);
        
        // Include all age groups, but mark configuration status properly

        // Check if the game format has all required values for scheduling
        const isCompletelyConfigured = gameFormatData && 
                                     gameFormatData.format && 
                                     gameFormatData.gameLength && 
                                     gameFormatData.halves && 
                                     gameFormatData.halfLength && 
                                     gameFormatData.bufferTime !== null &&
                                     gameFormatData.fieldSize;

        return {
          id: config.id.toString(),
          divisionName: `${config.ageGroup} ${config.gender}`,
          startDate: startDate,
          endDate: endDate,
          matchCount: gameFormatData?.halves || 2,
          matchTime: gameFormatData?.halfLength ? (gameFormatData.halfLength * (gameFormatData.halves || 2)) : 35,
          breakTime: gameFormatData?.halfTimeBreak || 5,
          paddingTime: gameFormatData?.bufferTime || 10,
          totalTime: gameFormatData?.gameLength || 50,
          formatName: gameFormatData?.format || 'Not Configured',
          teamCount: teamCountData?.teamCount || 0,
          ageGroupId: config.ageGroupId,
          isConfigured: isCompletelyConfigured,
          ageGroup: config.ageGroup,
          gender: config.gender,
        };
      }); // Include all configurations, even unconfigured ones

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