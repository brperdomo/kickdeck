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
    console.log(`Starting schedule generation for event ${req.params.eventId}, age group ${req.params.ageGroupId}`);
    const eventId = parseInt(req.params.eventId);
    const ageGroupId = parseInt(req.params.ageGroupId);
    
    console.log(`Parsed IDs: eventId=${eventId}, ageGroupId=${ageGroupId}`);
    
    // Validate input parameters
    if (isNaN(eventId) || isNaN(ageGroupId)) {
      console.log(`Invalid parameters: eventId=${req.params.eventId}, ageGroupId=${req.params.ageGroupId}`);
      return res.status(400).json({ 
        error: 'Invalid event ID or age group ID',
        providedEventId: req.params.eventId,
        providedAgeGroupId: req.params.ageGroupId
      });
    }

    // Get the age group configuration
    console.log(`Looking up age group with ID: ${ageGroupId}`);
    const ageGroup = await db.select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.id, ageGroupId))
      .then(results => {
        console.log(`Age group query results:`, results);
        return results[0];
      });

    if (!ageGroup) {
      console.log(`Age group ${ageGroupId} not found in database`);
      return res.status(404).json({ error: 'Age group not found' });
    }
    
    console.log(`Age group found: ${ageGroup.ageGroup} ${ageGroup.gender}`);

    // Get teams for this age group
    console.log(`Looking up teams for event ${eventId.toString()}, age group ${ageGroupId}`);
    const ageGroupTeams = await db.select()
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId.toString()),
        eq(teams.ageGroupId, ageGroupId)
      ));
    
    console.log(`Found ${ageGroupTeams.length} teams for this age group`);

    if (ageGroupTeams.length < 2) {
      return res.status(400).json({ 
        error: 'Need at least 2 teams to generate schedule',
        teamCount: ageGroupTeams.length
      });
    }

    // Simple round-robin schedule generation for this age group
    const generatedGames = [];
    
    // Check if required tables exist before proceeding
    try {
      console.log('Checking database table accessibility...');
      await db.select().from(gameTimeSlots).limit(1);
      await db.select().from(games).limit(1);
      console.log('Database tables accessible');
    } catch (tableError: any) {
      console.error('Database table check failed:', tableError);
      return res.status(500).json({ 
        error: 'Database schema issue - required tables not accessible',
        details: tableError.message,
        suggestion: 'This may be a production environment schema difference'
      });
    }
    
    // Get event details for proper tournament dates
    console.log(`Looking up event with ID: ${eventId}`);
    const event = await db.select()
      .from(events)
      .where(eq(events.id, eventId))
      .then(results => {
        console.log(`Event query results:`, results);
        return results[0];
      });
    
    if (!event) {
      console.log(`Event ${eventId} not found in database`);
      return res.status(404).json({ error: 'Event not found' });
    }
    
    console.log(`Event found: ${event.name}, start date: ${event.startDate}`);

    // Use tournament start date instead of next week
    const tournamentStartDate = new Date(event.startDate);
    let gameCounter = 0;

    for (let i = 0; i < ageGroupTeams.length; i++) {
      for (let j = i + 1; j < ageGroupTeams.length; j++) {
        // Calculate game time (distribute throughout tournament days)
        const gameDate = new Date(tournamentStartDate);
        const dayOffset = Math.floor(gameCounter / 8); // 8 games per day
        const hourOffset = gameCounter % 8; // Games throughout the day
        
        gameDate.setDate(gameDate.getDate() + dayOffset);
        gameDate.setHours(8 + hourOffset, 0, 0, 0); // Start at 8 AM
        
        const endTime = new Date(gameDate.getTime() + 90 * 60000); // 90 minutes later

        // Try to create time slot with error handling
        let timeSlot;
        try {
          console.log(`Creating time slot for game ${gameCounter + 1}`);
          timeSlot = await db.insert(gameTimeSlots).values({
            eventId: eventId.toString(),
            fieldId: 1, // Default field for now
            startTime: gameDate.toISOString(),
            endTime: endTime.toISOString(),
            dayIndex: dayOffset,
            isAvailable: false
          }).returning();
          console.log(`Time slot created successfully: ${timeSlot[0].id}`);
        } catch (timeSlotError: any) {
          console.error(`Error creating time slot:`, timeSlotError);
          throw new Error(`Failed to create time slot: ${timeSlotError.message}`);
        }

        // Try to create game with error handling
        let game;
        try {
          console.log(`Creating game between teams ${ageGroupTeams[i].id} and ${ageGroupTeams[j].id}`);
          game = await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: ageGroupId,
            homeTeamId: ageGroupTeams[i].id,
            awayTeamId: ageGroupTeams[j].id,
            timeSlotId: timeSlot[0].id,
            fieldId: 1,
            status: 'scheduled',
            round: 1,
            matchNumber: gameCounter + 1,
            duration: 90
          }).returning();
          console.log(`Game created successfully: ${game[0].id}`);
        } catch (gameError: any) {
          console.error(`Error creating game:`, gameError);
          throw new Error(`Failed to create game: ${gameError.message}`);
        }

        generatedGames.push(game[0]);
        gameCounter++;
      }
    }

    res.json({
      success: true,
      ageGroup: `${ageGroup.ageGroup} ${ageGroup.gender}`,
      gamesGenerated: generatedGames.length,
      teamCount: ageGroupTeams.length,
      message: `Schedule generated for ${ageGroup.ageGroup} ${ageGroup.gender} with ${generatedGames.length} games`
    });

  } catch (error: any) {
    console.error('Error generating age group schedule:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      eventIdParam: req.params.eventId,
      ageGroupIdParam: req.params.ageGroupId,
      errorType: error?.constructor?.name || 'Unknown'
    });
    res.status(500).json({ 
      error: 'Failed to generate schedule', 
      details: error?.message || 'Unknown error',
      eventId: req.params.eventId,
      ageGroupId: req.params.ageGroupId
    });
  }
});

export default router;