import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { db } from '../../../db/index.js';
import { eventAgeGroups, teams } from '../../../db/schema.js';
import { eq, and, count } from 'drizzle-orm';

const router = Router();

// Get flight configurations for an event
router.get('/events/:eventId/flight-configurations', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get age groups with team counts and game format configurations
    const flightConfigs = await db
      .select({
        id: eventAgeGroups.id,
        divisionName: eventAgeGroups.divisionCode,
        ageGroupId: eventAgeGroups.id,
        eventId: eventAgeGroups.eventId,
        // Default values for now
        startDate: eventAgeGroups.startDate,
        endDate: eventAgeGroups.endDate,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, parseInt(eventId)));

    // Get team counts for each age group
    const teamCounts = await db
      .select({
        ageGroupId: teams.ageGroupId,
        teamCount: count(teams.id),
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, parseInt(eventId)),
        eq(teams.status, 'approved')
      ))
      .groupBy(teams.ageGroupId);

    // Combine the data
    const result = flightConfigs.map(config => {
      const teamCountData = teamCounts.find(tc => tc.ageGroupId === config.ageGroupId);
      
      return {
        id: config.id.toString(),
        divisionName: config.divisionName || `Division ${config.id}`,
        startDate: config.startDate || new Date().toISOString().split('T')[0],
        endDate: config.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        matchCount: 2, // Default - could be calculated based on format
        matchTime: 35, // Default values
        breakTime: 5,
        paddingTime: 10,
        totalTime: 50, // 35 + 5 + 10
        formatName: 'Group of 4',
        teamCount: teamCountData?.teamCount || 0,
        ageGroupId: config.ageGroupId,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching flight configurations:', error);
    res.status(500).json({ error: 'Failed to fetch flight configurations' });
  }
});

// Update flight configuration
router.patch('/events/:eventId/flight-configurations/:flightId', requireAuth, requirePermission('manage_scheduling'), async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    const updates = req.body;

    console.log('Updating flight configuration:', { eventId, flightId, updates });

    // For now, we'll update the age_groups table for basic fields
    // and the game_formats table for timing configurations
    
    const allowedFields = ['startDate', 'endDate', 'matchTime', 'breakTime', 'paddingTime', 'formatName', 'matchCount'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update age group fields
    const ageGroupFields = ['startDate', 'endDate'];
    const ageGroupUpdates = Object.keys(filteredUpdates)
      .filter(key => ageGroupFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = filteredUpdates[key];
        return obj;
      }, {} as any);

    if (Object.keys(ageGroupUpdates).length > 0) {
      await db
        .update(ageGroups)
        .set(ageGroupUpdates)
        .where(and(
          eq(ageGroups.id, parseInt(flightId)),
          eq(ageGroups.eventId, parseInt(eventId))
        ));
    }

    // Handle game format updates
    const gameFormatFields = ['matchTime', 'breakTime', 'paddingTime', 'formatName'];
    const gameFormatUpdates = Object.keys(filteredUpdates)
      .filter(key => gameFormatFields.includes(key))
      .reduce((obj, key) => {
        // Map field names to database columns
        switch (key) {
          case 'matchTime':
            obj.matchDurationMinutes = filteredUpdates[key];
            break;
          case 'breakTime':
            obj.breakDurationMinutes = filteredUpdates[key];
            break;
          case 'paddingTime':
            obj.paddingTimeMinutes = filteredUpdates[key];
            break;
          case 'formatName':
            obj.formatName = filteredUpdates[key];
            break;
        }
        return obj;
      }, {} as any);

    if (Object.keys(gameFormatUpdates).length > 0) {
      // Check if game format exists for this age group
      const existingFormat = await db
        .select()
        .from(gameFormats)
        .where(eq(gameFormats.ageGroupId, parseInt(flightId)))
        .limit(1);

      if (existingFormat.length > 0) {
        // Update existing format
        await db
          .update(gameFormats)
          .set(gameFormatUpdates)
          .where(eq(gameFormats.ageGroupId, parseInt(flightId)));
      } else {
        // Create new format
        await db
          .insert(gameFormats)
          .values({
            ageGroupId: parseInt(flightId),
            eventId: parseInt(eventId),
            templateName: `${filteredUpdates.formatName || 'Custom'} Format`,
            ...gameFormatUpdates,
          });
      }
    }

    res.json({ success: true, message: 'Flight configuration updated successfully' });
  } catch (error) {
    console.error('Error updating flight configuration:', error);
    res.status(500).json({ error: 'Failed to update flight configuration' });
  }
});

export default router;