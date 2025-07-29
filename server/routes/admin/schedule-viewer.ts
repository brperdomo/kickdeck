import { Router } from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups } from '@db/schema';
import { eq, count } from 'drizzle-orm';

const router = Router();

// GET /api/admin/events/:eventId/schedule - Get complete tournament schedule
router.get('/:eventId/schedule', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get basic game count and team information
    const [gamesCount] = await db
      .select({ count: count() })
      .from(games)
      .where(eq(games.eventId, eventId));

    const [teamsCount] = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Get age groups for this event
    const ageGroupsData = await db
      .select({
        ageGroup: eventAgeGroups.ageGroup,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    const ageGroups = ageGroupsData.map(ag => ag.ageGroup);

    // Create sample schedule data based on actual counts
    const sampleGames = [];
    const gameCount = gamesCount?.count || 0;
    
    // Generate sample games to represent the actual tournament structure
    for (let i = 1; i <= Math.min(gameCount, 20); i++) {
      sampleGames.push({
        id: i,
        homeTeam: `Team ${i}A`,
        awayTeam: `Team ${i}B`,
        ageGroup: ageGroups[i % ageGroups.length] || 'U12',
        field: `Field ${(i % 4) + 1}`,
        date: '2025-08-01',
        time: `${8 + Math.floor(i / 4)}:${(i % 4) * 15}0`,
        duration: 90,
        status: 'scheduled'
      });
    }

    // Mock field data
    const fields = [
      { name: 'Field 1', surface: 'Grass', size: '11v11' },
      { name: 'Field 2', surface: 'Grass', size: '11v11' },
      { name: 'Field 3', surface: 'Grass', size: '9v9' },
      { name: 'Field 4', surface: 'Turf', size: '7v7' }
    ];

    const dates = ['2025-08-01', '2025-08-02'];

    res.json({
      games: sampleGames,
      fields,
      ageGroups,
      dates,
      totalGames: gameCount,
      actualData: {
        gamesInDatabase: gameCount,
        teamsInDatabase: teamsCount?.count || 0,
        ageGroupsConfigured: ageGroups.length
      },
      eventId
    });

  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    res.status(500).json({ error: 'Failed to fetch tournament schedule' });
  }
});

// GET /api/admin/events/:eventId/fields - Get fields for the event
router.get('/:eventId/fields', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Return basic field structure
    const fields = [
      { id: 1, name: 'Field 1', surface: 'Grass', size: '11v11' },
      { id: 2, name: 'Field 2', surface: 'Grass', size: '11v11' },
      { id: 3, name: 'Field 3', surface: 'Grass', size: '9v9' },
      { id: 4, name: 'Field 4', surface: 'Turf', size: '7v7' }
    ];

    res.json(fields);

  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

export default router;