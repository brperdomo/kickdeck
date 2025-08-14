import { Router } from 'express';
import { isAdmin } from '../../middleware';
import { db } from '@db';
import { eventAgeGroups, teams, events, eventGameFormats, eventBrackets, gameFormats } from '@db/schema';
import { eq, and, count, isNotNull } from 'drizzle-orm';

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

    console.log(`[FLIGHT CONFIG] Event ${eventId} details:`, eventDetails);
    
    // Use the EXACT SAME data source as MasterSchedulePage
    // Query event_brackets (flights) with their game formats from the game_formats table
    console.log(`[FLIGHT CONFIG] About to query for eventId: ${eventId}`);
    const flightsWithFormats = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        level: eventBrackets.level,
        tournamentSettings: eventBrackets.tournamentSettings,
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
      .where(eq(eventBrackets.eventId, parseInt(eventId)));

    console.log(`Found ${flightsWithFormats.length} brackets/flights for event ${eventId}`);
    console.log(`[FLIGHT CONFIG DEBUG] First few raw flights:`, flightsWithFormats.slice(0, 3).map(f => ({ 
      flightName: f.flightName, 
      gender: f.gender, 
      ageGroup: f.ageGroup,
      ageGroupId: f.ageGroupId,
      rawObject: JSON.stringify(f).substring(0, 200)
    })));

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

    // Get scheduled games count for each bracket to determine "Scheduled" status
    const { games } = await import('../../../db/schema.js');
    const scheduledGames = await db
      .select({
        bracketId: teams.bracketId,
        gameCount: count(games.id),
      })
      .from(games)
      .innerJoin(teams, eq(teams.id, games.homeTeamId)) // Join to get bracket from team
      .where(and(
        eq(games.eventId, eventId),
        isNotNull(games.scheduledTime), // Games with scheduled start times
        isNotNull(games.fieldId),       // Games assigned to fields
        isNotNull(teams.bracketId)      // Teams assigned to brackets
      ))
      .groupBy(teams.bracketId);

    // Use event dates or fall back to defaults
    const startDate = eventDetails?.startDate || new Date().toISOString().split('T')[0];
    const endDate = eventDetails?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`[FLIGHT CONFIG] Using dates - Start: ${startDate}, End: ${endDate}`);

    const configuredFlights = flightsWithFormats.filter(f => f.gameFormatId !== null);
    console.log(`Found ${configuredFlights.length} flights with game formats out of ${flightsWithFormats.length} total`);

    // Transform into the expected response format
    const result = flightsWithFormats.map(flight => {
      const teamCountData = teamCounts.find(tc => tc.bracketId === flight.flightId);
      const gameCountData = scheduledGames.find(gc => gc.bracketId === flight.flightId);
      
      // Parse tournament_settings to get the correct rest period
      let restPeriodFromSettings = 90; // default
      if (flight.tournamentSettings) {
        try {
          const settings = typeof flight.tournamentSettings === 'string' ? 
            JSON.parse(flight.tournamentSettings) : flight.tournamentSettings;
          if (settings.restPeriodMinutes) {
            restPeriodFromSettings = settings.restPeriodMinutes;
          }
        } catch (e) {
          console.log(`Could not parse tournament settings for flight ${flight.flightId}, using default rest period`);
        }
      }
      
      // Check if the game format has all required values for scheduling
      const isCompletelyConfigured = flight.gameFormatId !== null && 
                                   flight.gameLength !== null && 
                                   flight.fieldSize !== null && 
                                   flight.bufferTime !== null;

      // Determine status: Scheduled > Ready > Needs Setup
      const hasScheduledGames = (gameCountData?.gameCount || 0) > 0;
      const status = hasScheduledGames ? 'scheduled' : (isCompletelyConfigured ? 'ready' : 'needs_setup');

      console.log(`Processing flight ${flight.flightName}: ${teamCountData?.teamCount || 0} teams, configured = ${isCompletelyConfigured}, gender = "${flight.gender}"`);

      // Get the proper game format data from event_game_formats table
      const halfLength = Math.floor((flight.gameLength || 90) / 2);
      const breakTime = 5; // Standard halftime break
      const paddingTime = flight.bufferTime || 15;
      // Use the rest period from tournament_settings (preferred) or fall back to game_formats table
      const restPeriod = restPeriodFromSettings || flight.restPeriod || 90; // Rest period between games
      const calculatedTotalTime = halfLength * 2 + breakTime + paddingTime;

      return {
        id: flight.flightId.toString(),
        divisionName: flight.flightName, // Just the flight name, we'll show full details in frontend
        startDate: startDate,
        endDate: endDate,
        matchCount: 2, // Default halves
        matchTime: halfLength, // Half time length (what frontend expects)
        breakTime: breakTime,
        paddingTime: paddingTime,
        restPeriod: restPeriod, // Rest period between games
        totalTime: calculatedTotalTime, // Properly calculated total
        formatName: flight.templateName || (isCompletelyConfigured ? 'Configured' : 'Not Configured'),
        teamCount: teamCountData?.teamCount || 0,
        ageGroupId: flight.ageGroupId,
        isConfigured: isCompletelyConfigured,
        status: status, // Add the new status field
        scheduledGames: gameCountData?.gameCount || 0, // Add scheduled games count
        ageGroup: flight.ageGroup,
        gender: flight.gender,
        birthYear: flight.birthYear || '2024',
        fieldSize: flight.fieldSize || '7v7',
        flightName: flight.flightName,
        level: flight.level
      };
    });

    // Sort flights by age (oldest to youngest) and then by gender (Boys first, then Girls)
    result.sort((a, b) => {
      // Extract numeric age from age group (e.g., "U10" -> 10)
      const ageA = parseInt(a.ageGroup.replace(/[^\d]/g, '')) || 0;
      const ageB = parseInt(b.ageGroup.replace(/[^\d]/g, '')) || 0;
      
      // First sort by age (descending for oldest to youngest)
      if (ageA !== ageB) {
        return ageB - ageA;
      }
      
      // Then sort by gender (Boys first, then Girls)
      if (a.gender !== b.gender) {
        return a.gender === 'Boys' ? -1 : 1;
      }
      
      // Finally sort by flight name
      return a.flightName.localeCompare(b.flightName);
    });

    console.log(`[FLIGHT CONFIG] Returning ${result.length} sorted flights for event ${eventId}`);
    console.log(`[FLIGHT CONFIG] First few flights:`, result.slice(0, 3).map(f => ({ ageGroup: f.ageGroup, gender: f.gender, flightName: f.flightName })));

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
    
    // Get the existing game format for this flight/bracket
    const existingFormat = await db.query.gameFormats.findFirst({
      where: eq(gameFormats.bracketId, parseInt(flightId))
    });

    if (existingFormat) {
      // Update existing game format
      const updateData: any = {};
      
      // Map frontend field names to database field names
      // matchTime in frontend is half-time length, gameLength in DB is full game length
      if (updates.matchTime !== undefined) updateData.gameLength = updates.matchTime * 2;
      if (updates.breakTime !== undefined) updateData.restPeriod = updates.breakTime;
      if (updates.paddingTime !== undefined) updateData.bufferTime = updates.paddingTime;
      if (updates.restPeriod !== undefined) updateData.restPeriod = updates.restPeriod;
      if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
      if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
      if (updates.formatName !== undefined) updateData.templateName = updates.formatName;
      if (updates.fieldSize !== undefined) updateData.fieldSize = updates.fieldSize;

      await db.update(gameFormats)
        .set(updateData)
        .where(eq(gameFormats.id, existingFormat.id));
        
      console.log(`[FLIGHT CONFIG] Updated existing game format for bracketId ${parseInt(flightId)}:`, updateData);
      console.log(`[FLIGHT CONFIG] Template name set to: "${updates.formatName}" -> "${updateData.templateName}"`);

      // BI-DIRECTIONAL SYNC: Update the corresponding age group field size when flight config changes
      if (updates.fieldSize !== undefined) {
        const bracket = await db.query.eventBrackets.findFirst({
          where: eq(eventBrackets.id, parseInt(flightId))
        });

        if (bracket && bracket.ageGroupId) {
          await db.update(eventAgeGroups)
            .set({ fieldSize: updates.fieldSize })
            .where(eq(eventAgeGroups.id, bracket.ageGroupId));
            
          console.log(`[BI-DIRECTIONAL SYNC] Updated age group ${bracket.ageGroupId} field size to ${updates.fieldSize}`);
        }
      }

      // BIDIRECTIONAL SYNC: Update the corresponding event_brackets.tournament_settings
      // This ensures the scheduling engine gets the updated rest period values
      if (updates.restPeriod !== undefined) {
        const bracket = await db.query.eventBrackets.findFirst({
          where: eq(eventBrackets.id, parseInt(flightId))
        });

        if (bracket) {
          let currentSettings: any = {};
          try {
            currentSettings = bracket.tournamentSettings ? 
              (typeof bracket.tournamentSettings === 'string' ? 
                JSON.parse(bracket.tournamentSettings) : 
                bracket.tournamentSettings) : {};
          } catch (e) {
            console.log('Could not parse existing tournament settings, using empty object');
          }

          const updatedSettings = {
            ...currentSettings,
            restPeriodMinutes: updates.restPeriod,
            maxGamesPerTeam: currentSettings.maxGamesPerTeam || 4,
            enableChampionship: currentSettings.enableChampionship || true
          };

          await db.update(eventBrackets)
            .set({ tournamentSettings: JSON.stringify(updatedSettings) })
            .where(eq(eventBrackets.id, parseInt(flightId)));

          console.log(`[FLIGHT CONFIG] Updated tournament_settings for bracket ${flightId}:`, updatedSettings);
        }
      }

      // Also update the corresponding event_game_formats if it exists
      if (updates.matchTime !== undefined || updates.breakTime !== undefined || updates.paddingTime !== undefined) {
        const eventGameFormat = await db.query.eventGameFormats.findFirst({
          where: eq(eventGameFormats.eventId, parseInt(eventId))
        });

        if (eventGameFormat) {
          const eventFormatUpdates: any = {};
          if (updates.matchTime !== undefined) {
            eventFormatUpdates.gameLength = updates.matchTime * 2;
            eventFormatUpdates.halfLength = updates.matchTime;
          }
          if (updates.breakTime !== undefined) eventFormatUpdates.halfTimeBreak = updates.breakTime;
          if (updates.paddingTime !== undefined) eventFormatUpdates.bufferTime = updates.paddingTime;
          if (updates.restPeriod !== undefined) eventFormatUpdates.restPeriod = updates.restPeriod;

          await db.update(eventGameFormats)
            .set(eventFormatUpdates)
            .where(eq(eventGameFormats.id, eventGameFormat.id));
          
          console.log('Updated event game format:', eventFormatUpdates);
        }
      }
    } else {
      // Create new game format for this bracket
      const newFormatData = {
        bracketId: parseInt(flightId),
        gameLength: (updates.matchTime || 45) * 2, // matchTime is half-time, gameLength is full game
        restPeriod: updates.restPeriod || 90,
        bufferTime: updates.paddingTime || 15,
        fieldSize: updates.fieldSize || '7v7', // Default based on most common youth soccer format
        maxGamesPerDay: 3, // Default
        templateName: updates.formatName || 'Custom'
      };

      await db.insert(gameFormats).values(newFormatData);
      console.log(`[FLIGHT CONFIG] Created new game format for bracketId ${parseInt(flightId)}:`, newFormatData);
      console.log(`[FLIGHT CONFIG] Template name set to: "${updates.formatName}" -> "${newFormatData.templateName}"`);

      // BI-DIRECTIONAL SYNC: Update the corresponding age group field size for new format
      if (updates.fieldSize !== undefined) {
        const bracket = await db.query.eventBrackets.findFirst({
          where: eq(eventBrackets.id, parseInt(flightId))
        });

        if (bracket && bracket.ageGroupId) {
          await db.update(eventAgeGroups)
            .set({ fieldSize: updates.fieldSize })
            .where(eq(eventAgeGroups.id, bracket.ageGroupId));
            
          console.log(`[BI-DIRECTIONAL SYNC] Updated age group ${bracket.ageGroupId} field size to ${updates.fieldSize} for new format`);
        }
      }

      // BIDIRECTIONAL SYNC: Also update event_brackets.tournament_settings for new format
      if (updates.restPeriod !== undefined) {
        const bracket = await db.query.eventBrackets.findFirst({
          where: eq(eventBrackets.id, parseInt(flightId))
        });

        if (bracket) {
          let currentSettings: any = {};
          try {
            currentSettings = bracket.tournamentSettings ? 
              (typeof bracket.tournamentSettings === 'string' ? 
                JSON.parse(bracket.tournamentSettings) : 
                bracket.tournamentSettings) : {};
          } catch (e) {
            console.log('Could not parse existing tournament settings, using empty object');
          }

          const updatedSettings = {
            ...currentSettings,
            restPeriodMinutes: updates.restPeriod,
            maxGamesPerTeam: currentSettings.maxGamesPerTeam || 4,
            enableChampionship: currentSettings.enableChampionship || true
          };

          await db.update(eventBrackets)
            .set({ tournamentSettings: JSON.stringify(updatedSettings) })
            .where(eq(eventBrackets.id, parseInt(flightId)));

          console.log(`[FLIGHT CONFIG] Updated tournament_settings for new bracket ${flightId}:`, updatedSettings);
        }
      }
    }
    
    res.json({ success: true, message: 'Flight configuration updated successfully' });
  } catch (error) {
    console.error('Error updating flight configuration:', error);
    res.status(500).json({ error: 'Failed to update flight configuration' });
  }
});

// Get games count per flight for status indicators
router.get('/events/:eventId/flight-game-counts', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Import games schema
    const { games } = await import('../../../db/schema.js');
    
    // Get games count for each bracket/flight
    const gameCountsByFlight = await db
      .select({
        bracketId: eventBrackets.id,
        gameCount: count(games.id),
      })
      .from(eventBrackets)
      .leftJoin(teams, eq(teams.bracketId, eventBrackets.id))
      .leftJoin(games, eq(games.homeTeamId, teams.id))
      .where(eq(eventBrackets.eventId, eventId))
      .groupBy(eventBrackets.id);

    // Convert to object with flightId as key
    const flightGameCounts: Record<string, number> = {};
    gameCountsByFlight.forEach(item => {
      if (item.bracketId) {
        flightGameCounts[item.bracketId.toString()] = item.gameCount || 0;
      }
    });

    res.json({ flightGameCounts });
  } catch (error) {
    console.error('Error fetching flight game counts:', error);
    res.status(500).json({ error: 'Failed to fetch flight game counts' });
  }
});

export default router;