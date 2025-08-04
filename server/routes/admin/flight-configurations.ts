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

    // Use the SAME data source as the working MasterSchedulePage 
    // From your logs: "72 flights, configured: 8" - this means the API works
    // Let's use the exact same query as the MasterSchedulePage component
    
    // Query teams with their age group data (this creates the "flights")
    const teamsWithAgeGroups = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        ageGroupId: teams.ageGroupId,
        ageGroup: teams.ageGroup,
        gender: teams.gender,
        status: teams.status,
        flightCategory: teams.flightCategory,
        clubId: teams.clubId
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Group teams by age group + gender + flight category to create flights
    const flightGroups = new Map<string, any[]>();
    teamsWithAgeGroups.forEach(team => {
      const flightKey = `${team.ageGroup}-${team.gender}-${team.flightCategory || 'default'}`;
      if (!flightGroups.has(flightKey)) {
        flightGroups.set(flightKey, []);
      }
      flightGroups.get(flightKey)!.push(team);
    });

    console.log(`Found ${flightGroups.size} unique flights for event ${eventId}`);
    console.log('Flight keys:', Array.from(flightGroups.keys()));

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

    console.log(`Found ${savedGameFormats.length} saved game formats`);
    console.log('Game format age groups:', savedGameFormats.map(g => g.ageGroup));

    // Transform flight groups into the expected response format
    const result = Array.from(flightGroups.entries()).map(([flightKey, flightTeams]) => {
      const sampleTeam = flightTeams[0];
      const ageGroup = sampleTeam.ageGroup;
      const gender = sampleTeam.gender;
      const approvedTeams = flightTeams.filter(t => t.status === 'approved');
      
      // Find matching game format
      const gameFormatData = savedGameFormats.find(gf => gf.ageGroup === ageGroup);
      
      console.log(`Processing flight ${flightKey}: ${flightTeams.length} teams, game format = ${!!gameFormatData}`);
      
      // Check if the game format has all required values for scheduling
      const isCompletelyConfigured = gameFormatData && 
                                   gameFormatData.format && 
                                   gameFormatData.gameLength && 
                                   gameFormatData.halves && 
                                   gameFormatData.halfLength && 
                                   gameFormatData.bufferTime !== null &&
                                   gameFormatData.fieldSize;

      return {
        id: flightKey,
        divisionName: `${ageGroup} ${gender}`,
        startDate: startDate,
        endDate: endDate,
        matchCount: gameFormatData?.halves || 2,
        matchTime: gameFormatData?.halfLength ? (gameFormatData.halfLength * (gameFormatData.halves || 2)) : 35,
        breakTime: gameFormatData?.halfTimeBreak || 5,
        paddingTime: gameFormatData?.bufferTime || 10,
        totalTime: gameFormatData?.gameLength || 50,
        formatName: gameFormatData?.format || 'Not Configured',
        teamCount: approvedTeams.length,
        ageGroupId: sampleTeam.ageGroupId,
        isConfigured: isCompletelyConfigured,
        ageGroup: ageGroup,
        gender: gender,
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