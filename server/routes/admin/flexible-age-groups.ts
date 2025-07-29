import { Router } from 'express';
import { db } from '@db';
import { 
  eventAgeGroups,
  teams,
  games,
  gameTimeSlots
} from '@db/schema';
import { eq, and, count } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// GET /api/admin/events/:eventId/age-groups-status
// Returns status of configured age groups vs available team groups
router.get('/events/:eventId/age-groups-status', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    // Get configured age groups using existing schema
    const configuredAgeGroups = await db.select({
      id: eventAgeGroups.id,
      ageGroup: eventAgeGroups.ageGroup,
      gender: eventAgeGroups.gender,
      fieldSize: eventAgeGroups.fieldSize,
      createdAt: eventAgeGroups.createdAt
    }).from(eventAgeGroups)
    .where(eq(eventAgeGroups.eventId, eventId.toString()));

    // Get teams grouped by age group ID (teams don't have gender field)
    const teamsInEvent = await db.select({
      ageGroupId: teams.ageGroupId,
      teamCount: count()
    }).from(teams)
    .where(eq(teams.eventId, eventId.toString()))
    .groupBy(teams.ageGroupId);

    // Check which age groups have schedules generated
    const ageGroupsWithSchedules = new Set();
    for (const ageGroup of configuredAgeGroups) {
      const existingGames = await db.select({ count: count() })
        .from(games)
        .where(and(
          eq(games.eventId, eventId.toString()),
          eq(games.ageGroupId, ageGroup.id)
        ));
      
      if (existingGames[0]?.count > 0) {
        ageGroupsWithSchedules.add(ageGroup.id);
      }
    }

    // Format configured age groups with status
    const configuredWithStatus = await Promise.all(configuredAgeGroups.map(async (ageGroup) => {
      const teamData = teamsInEvent.find(t => 
        t.ageGroupId === ageGroup.id
      );
      
      const hasSchedule = ageGroupsWithSchedules.has(ageGroup.id);
      const teamCount = teamData?.teamCount || 0;
      
      return {
        id: ageGroup.id.toString(),
        name: `${ageGroup.ageGroup} ${ageGroup.gender}`,
        gender: ageGroup.gender,
        format: ageGroup.fieldSize,
        teamCount,
        hasSchedule,
        canSchedule: teamCount > 0 && !hasSchedule,
        status: hasSchedule ? 'scheduled' : (teamCount > 0 ? 'configured' : 'pending'),
        lastUpdated: ageGroup.createdAt
      };
    }));

    // Find age groups that have teams but no configuration yet
    const configuredAgeGroupIds = new Set(configuredAgeGroups.map(ag => ag.id));
    
    const availableFromTeams = teamsInEvent
      .filter(team => !configuredAgeGroupIds.has(team.ageGroupId))
      .map(team => ({
        ageGroupId: team.ageGroupId,
        teamCount: team.teamCount
      }));

    res.json({
      configured: configuredWithStatus,
      availableFromTeams,
      summary: {
        totalConfigured: configuredAgeGroups.length,
        totalScheduled: ageGroupsWithSchedules.size,
        totalAvailable: teamsInEvent.length,
        readyToSchedule: configuredWithStatus.filter(ag => ag.canSchedule).length
      }
    });

  } catch (error) {
    console.error('Error fetching age groups status:', error);
    res.status(500).json({ error: 'Failed to fetch age groups status' });
  }
});

// POST /api/admin/events/:eventId/age-groups
// Add individual age group configuration
router.post('/events/:eventId/age-groups', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { name, gender, format, gameLength } = req.body;

    // Parse age group from name (e.g., "U12 Boys" -> "U12")
    const ageGroupMatch = name.match(/U(\d+)/);
    const ageNumber = ageGroupMatch ? parseInt(ageGroupMatch[1]) : 12;
    const ageGroup = `U${ageNumber}`;

    // Check if this combination already exists
    const existing = await db.select()
      .from(eventAgeGroups)
      .where(and(
        eq(eventAgeGroups.eventId, eventId.toString()),
        eq(eventAgeGroups.ageGroup, ageGroup),
        eq(eventAgeGroups.gender, gender)
      ));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'This age group configuration already exists' });
    }

    // Calculate birth year (approximate)
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - ageNumber;

    // Add the age group using existing schema
    const result = await db.insert(eventAgeGroups).values({
      eventId: eventId.toString(),
      ageGroup,
      birthYear,
      gender,
      fieldSize: format,
      projectedTeams: 8,
      scoringRule: 'standard',
      amountDue: 0,
      divisionCode: `${ageGroup}${gender.charAt(0)}`,
      createdAt: new Date().toISOString()
    }).returning();

    res.json({ 
      success: true, 
      ageGroup: result[0],
      message: `Age group ${name} added successfully`
    });

  } catch (error) {
    console.error('Error adding age group:', error);
    res.status(500).json({ error: 'Failed to add age group' });
  }
});

// POST /api/admin/events/:eventId/age-groups/:ageGroupId/schedule
// Generate schedule for individual age group
router.post('/events/:eventId/age-groups/:ageGroupId/schedule', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const ageGroupId = parseInt(req.params.ageGroupId);

    // Get the age group configuration
    const ageGroup = await db.select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.id, ageGroupId))
      .then(results => results[0]);

    if (!ageGroup) {
      return res.status(404).json({ error: 'Age group not found' });
    }

    // Get teams for this age group
    const ageGroupTeams = await db.select()
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId.toString()),
        eq(teams.ageGroupId, ageGroupId)
      ));

    if (ageGroupTeams.length < 2) {
      return res.status(400).json({ 
        error: 'Need at least 2 teams to generate schedule',
        teamCount: ageGroupTeams.length
      });
    }

    // Simple round-robin schedule generation for this age group
    const generatedGames = [];
    const gameDate = new Date();
    gameDate.setDate(gameDate.getDate() + 7); // Next week

    for (let i = 0; i < ageGroupTeams.length; i++) {
      for (let j = i + 1; j < ageGroupTeams.length; j++) {
        const gameTime = new Date(gameDate);
        gameTime.setHours(9 + (generatedGames.length * 2)); // 2 hour slots

        // Create time slot using correct schema
        const timeSlot = await db.insert(gameTimeSlots).values({
          eventId: eventId.toString(),
          fieldId: 1, // Default field for now
          startTime: gameTime.toTimeString().split(' ')[0],
          endTime: new Date(gameTime.getTime() + 90 * 60000).toTimeString().split(' ')[0],
          dayIndex: 0,
          isAvailable: false
        }).returning();

        // Create game using correct schema
        const game = await db.insert(games).values({
          eventId: eventId.toString(),
          ageGroupId: ageGroupId,
          homeTeamId: ageGroupTeams[i].id,
          awayTeamId: ageGroupTeams[j].id,
          timeSlotId: timeSlot[0].id,
          fieldId: 1,
          status: 'scheduled',
          round: 1,
          matchNumber: generatedGames.length + 1,
          duration: 90
        }).returning();

        generatedGames.push(game[0]);
      }
    }

    res.json({
      success: true,
      ageGroup: `${ageGroup.ageGroup} ${ageGroup.gender}`,
      gamesGenerated: generatedGames.length,
      teamCount: ageGroupTeams.length,
      message: `Schedule generated for ${ageGroup.ageGroup} ${ageGroup.gender} with ${generatedGames.length} games`
    });

  } catch (error) {
    console.error('Error generating age group schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

export default router;