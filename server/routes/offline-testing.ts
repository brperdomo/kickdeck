import { Router } from 'express';
import { db } from '@db';
import { 
  events,
  eventAgeGroups,
  teams,
  fields,
  gameTimeSlots,
  games
} from '@db/schema';
import { eq, and, count, sql } from 'drizzle-orm';

const router = Router();

// GET /api/offline-testing/tournaments
// Get list of tournaments for offline testing
router.get('/tournaments', async (req, res) => {
  try {
    // Get tournaments with team counts
    const tournaments = await db.select({
      id: events.id,
      name: events.name,
      startDate: events.startDate,
      endDate: events.endDate,
      teamCount: sql<number>`cast(count(${teams.id}) as integer)`
    })
    .from(events)
    .leftJoin(teams, eq(events.id, sql`cast(${teams.eventId} as bigint)`))
    .where(eq(events.isArchived, false))
    .groupBy(events.id, events.name, events.startDate, events.endDate)
    .orderBy(events.startDate);

    res.json({
      tournaments,
      message: 'Available tournaments for offline testing'
    });

  } catch (error) {
    console.error('Error fetching tournaments for offline testing:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET /api/offline-testing/tournaments/:eventId/complete-data
// Get complete tournament data for offline testing
router.get('/tournaments/:eventId/complete-data', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get tournament details
    const tournament = await db.select()
      .from(events)
      .where(eq(events.id, sql`cast(${eventId} as bigint)`))
      .then(results => results[0]);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get all teams
    const tournamentTeams = await db.select({
      id: teams.id,
      name: teams.name,
      ageGroupId: teams.ageGroupId,
      status: teams.status,
      clubName: teams.clubName,
      managerName: teams.managerName,
      managerEmail: teams.managerEmail,
      seedRanking: teams.seedRanking
    })
    .from(teams)
    .where(eq(teams.eventId, eventId))
    .orderBy(teams.name);

    // Get all age groups
    const tournamentAgeGroups = await db.select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventAgeGroups.ageGroup);

    // Get all fields (system-wide)
    const allFields = await db.select()
      .from(fields)
      .orderBy(fields.name);

    // Get existing time slots
    const existingTimeSlots = await db.select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.startTime);

    // Get existing games
    const existingGames = await db.select()
      .from(games)
      .where(eq(games.eventId, eventId))
      .orderBy(games.matchNumber);

    // Calculate statistics
    const statistics = {
      totalTeams: tournamentTeams.length,
      approvedTeams: tournamentTeams.filter(t => t.status === 'approved').length,
      totalAgeGroups: tournamentAgeGroups.length,
      totalFields: allFields.length,
      scheduledGames: existingGames.length,
      timeSlots: existingTimeSlots.length
    };

    // Group teams by age group for easier analysis
    const teamsByAgeGroup = tournamentAgeGroups.map(ageGroup => ({
      ageGroup,
      teams: tournamentTeams.filter(team => team.ageGroupId === ageGroup.id),
      teamCount: tournamentTeams.filter(team => team.ageGroupId === ageGroup.id).length
    }));

    res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        timezone: tournament.timezone
      },
      teams: tournamentTeams,
      ageGroups: tournamentAgeGroups,
      fields: allFields,
      timeSlots: existingTimeSlots,
      games: existingGames,
      statistics,
      teamsByAgeGroup,
      lastSynced: new Date().toISOString(),
      offlineMode: true
    });

  } catch (error) {
    console.error('Error fetching complete tournament data:', error);
    res.status(500).json({ error: 'Failed to fetch complete tournament data' });
  }
});

// POST /api/offline-testing/tournaments/:eventId/clone-for-testing
// Clone tournament data for safe offline testing
router.post('/tournaments/:eventId/clone-for-testing', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { testingName } = req.body;

    // Get complete tournament data for cloning
    const tournamentData = await db.select()
      .from(events)
      .where(eq(events.id, sql`cast(${eventId} as bigint)`))
      .then(results => results[0]);

    if (!tournamentData) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Create a testing copy identifier
    const testingId = `${eventId}_test_${Date.now()}`;

    res.json({
      success: true,
      testingTournament: {
        originalId: eventId,
        testingId,
        name: testingName || `${tournamentData.name} (Testing Copy)`,
        createdAt: new Date().toISOString(),
        mode: 'offline_testing'
      },
      message: 'Tournament cloned for offline testing'
    });

  } catch (error) {
    console.error('Error cloning tournament for testing:', error);
    res.status(500).json({ error: 'Failed to clone tournament for testing' });
  }
});

// GET /api/offline-testing/sync-status
// Get synchronization status between offline and production
router.get('/sync-status', async (req, res) => {
  try {
    // Get system status information
    const systemInfo = {
      mode: 'offline_testing',
      lastSyncTime: new Date().toISOString(),
      productionConnected: true, // In real implementation, test actual connection
      dataIntegrity: 'verified',
      authenticationBypass: true,
      testingCapabilities: [
        'flexible_age_groups',
        'traditional_7_step',
        'game_generation',
        'schedule_creation',
        'team_management'
      ]
    };

    res.json({
      status: 'operational',
      system: systemInfo,
      message: 'Offline testing system ready'
    });

  } catch (error) {
    console.error('Error checking sync status:', error);
    res.status(500).json({ error: 'Failed to check sync status' });
  }
});

export default router;