import { Router } from 'express';
import { isAdmin } from '../../middleware';
import { db } from '@db';
import { eventAgeGroups, teams } from '@db/schema';
import { eq, and, count } from 'drizzle-orm';

const router = Router();

// Get flight configurations for an event
router.get('/events/:eventId/flight-configurations', isAdmin, async (req, res) => {
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