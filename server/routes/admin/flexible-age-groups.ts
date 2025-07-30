import { Router } from 'express';
import { db } from '@db';
import { 
  eventAgeGroups,
  teams,
  games,
  gameTimeSlots,
  events
} from '@db/schema';
import { eq, and, count } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';
import { IntelligentSchedulingEngine } from '../../utils/schedulingEngine';

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
// Generate schedule for individual age group using intelligent scheduling engine
router.post('/events/:eventId/age-groups/:ageGroupId/schedule', isAdmin, async (req, res) => {
  try {
    console.log(`=== INTELLIGENT SCHEDULE GENERATION START ===`);
    console.log(`Event: ${req.params.eventId}, Age Group: ${req.params.ageGroupId}`);
    
    const eventId = parseInt(req.params.eventId);
    const ageGroupId = parseInt(req.params.ageGroupId);
    
    // Validate input parameters
    if (isNaN(eventId) || isNaN(ageGroupId)) {
      console.log(`Invalid parameters: eventId=${req.params.eventId}, ageGroupId=${req.params.ageGroupId}`);
      return res.status(400).json({ 
        error: 'Invalid event ID or age group ID',
        providedEventId: req.params.eventId,
        providedAgeGroupId: req.params.ageGroupId
      });
    }

    // Initialize intelligent scheduling engine
    console.log('Initializing intelligent scheduling engine...');
    const schedulingEngine = new IntelligentSchedulingEngine(eventId);
    await schedulingEngine.initialize();
    
    console.log('Scheduling engine initialized successfully');
    
    // Get scheduling analysis
    const analysis = schedulingEngine.getSchedulingAnalysis();
    console.log('Scheduling analysis:', analysis);
    
    // Generate schedule for this age group with constraints
    console.log(`Generating constraint-aware schedule for age group ${ageGroupId}...`);
    const generatedGames = await schedulingEngine.generateAgeGroupScheduleWithConstraints(ageGroupId);
    
    console.log(`Generated ${generatedGames.length} games successfully`);

    // Save games to database
    const savedGames = [];
    for (const gameData of generatedGames) {
      // Create time slot
      const timeSlot = await db.insert(gameTimeSlots).values({
        eventId: eventId.toString(),
        fieldId: gameData.field.id,
        startTime: gameData.timeSlot.startTime.toISOString(),
        endTime: gameData.timeSlot.endTime.toISOString(),
        dayIndex: 0,
        isAvailable: false
      }).returning();

      // Create game
      const game: any = await db.insert(games).values({
        eventId: eventId.toString(),
        ageGroupId: ageGroupId,
        homeTeamId: gameData.homeTeam.id,
        awayTeamId: gameData.awayTeam.id,
        timeSlotId: timeSlot[0].id,
        fieldId: gameData.field.id,
        status: 'scheduled',
        round: 1,
        matchNumber: savedGames.length + 1,
        duration: gameData.gameFormat.gameLength
      }).returning();

      savedGames.push(game[0]);
    }

    console.log(`=== INTELLIGENT SCHEDULE GENERATION COMPLETE ===`);
    
    res.json({ 
      success: true, 
      gamesGenerated: savedGames.length,
      analysis,
      games: savedGames,
      message: `Generated ${savedGames.length} games using intelligent scheduling engine`
    });

  } catch (error: any) {
    console.error('=== INTELLIGENT SCHEDULE GENERATION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    console.error('=== ERROR END ===');
    
    res.status(500).json({ 
      error: 'Failed to generate intelligent schedule', 
      details: error?.message || 'Unknown error',
      suggestion: 'Check that game formats and constraints are properly configured'
    });
  }
});

export default router;