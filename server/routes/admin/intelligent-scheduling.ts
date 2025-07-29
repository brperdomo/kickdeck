import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { db } from '@db';
import { 
  teams, 
  fields, 
  complexes, 
  eventComplexes, 
  games, 
  eventAgeGroups,
  events 
} from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const router = Router();

interface SchedulingConstraints {
  startTime: string;
  endTime: string;
  gameDuration: number;
  restTime: number;
  maxGamesPerTeam: number;
  preventCoachConflicts: boolean;
  respectFieldSizes: boolean;
}

interface TeamData {
  id: number;
  name: string;
  ageGroupId: number;
  ageGroup: string;
  coach: any;
  fieldSize: string;
}

interface FieldData {
  id: number;
  name: string;
  fieldSize: string;
  complexName: string;
  openTime: string;
  closeTime: string;
  hasLights: boolean;
}

// Get teams for event with coach and age group info
router.get('/events/:eventId/teams', requireAuth, requirePermission('view_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        coach: teams.coach,
        status: teams.status,
        ageGroupName: eventAgeGroups.ageGroup,
        fieldSize: eventAgeGroups.fieldSize,
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    // Transform coach data and structure response
    const formattedTeams = teamsData.map(team => {
      let coachInfo = { name: '', email: '' };
      
      if (team.coach) {
        try {
          const coachData = typeof team.coach === 'string' ? JSON.parse(team.coach) : team.coach;
          coachInfo = {
            name: coachData.headCoachName || coachData.name || '',
            email: coachData.headCoachEmail || coachData.email || ''
          };
        } catch (e) {
          console.error('Error parsing coach data:', e);
        }
      }

      return {
        id: team.id,
        name: team.name,
        ageGroupId: team.ageGroupId,
        ageGroup: team.ageGroupName,
        coach: coachInfo,
        fieldSize: team.fieldSize || '11v11'
      };
    });

    res.json(formattedTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get fields for event with complex info
router.get('/events/:eventId/fields', requireAuth, requirePermission('view_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const fieldsData = await db
      .select({
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        hasLights: fields.hasLights,
        isOpen: fields.isOpen,
        fieldOpenTime: fields.openTime,
        fieldCloseTime: fields.closeTime,
        complexId: complexes.id,
        complexName: complexes.name,
        complexOpenTime: complexes.openTime,
        complexCloseTime: complexes.closeTime,
      })
      .from(eventComplexes)
      .innerJoin(complexes, eq(eventComplexes.complexId, complexes.id))
      .leftJoin(fields, eq(complexes.id, fields.complexId))
      .where(and(
        eq(eventComplexes.eventId, eventId),
        eq(fields.isOpen, true)
      ));

    const formattedFields = fieldsData
      .filter(field => field.fieldId) // Only include rows with actual fields
      .map(field => ({
        id: field.fieldId,
        name: field.fieldName,
        fieldSize: field.fieldSize || '11v11',
        complexName: field.complexName,
        openTime: field.fieldOpenTime || field.complexOpenTime || '08:00',
        closeTime: field.fieldCloseTime || field.complexCloseTime || '18:00',
        hasLights: field.hasLights || false
      }));

    res.json(formattedFields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Get existing games for event
router.get('/events/:eventId/games', requireAuth, requirePermission('view_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const gamesData = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));

    // For now, return empty array - will implement full game loading with team/field data
    res.json([]);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Generate intelligent schedule
router.post('/events/:eventId/generate-intelligent-schedule', requireAuth, requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { teams: providedTeams, fields: providedFields, constraints } = req.body;

    console.log(`Generating intelligent schedule for event ${eventId}`);
    console.log(`Teams: ${providedTeams?.length || 0}, Fields: ${providedFields?.length || 0}`);

    // Get event dates
    const eventData = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);

    if (eventData.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventData[0];
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    // Use provided data or fetch from database
    let teamsData: TeamData[] = providedTeams;
    let fieldsData: FieldData[] = providedFields;

    if (!teamsData || teamsData.length === 0) {
      // Fetch teams if not provided
      const teamsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/events/${eventId}/teams`, {
        headers: { cookie: req.headers.cookie || '' }
      });
      if (teamsResponse.ok) {
        teamsData = await teamsResponse.json();
      }
    }

    if (!fieldsData || fieldsData.length === 0) {
      // Fetch fields if not provided
      const fieldsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/events/${eventId}/fields`, {
        headers: { cookie: req.headers.cookie || '' }
      });
      if (fieldsResponse.ok) {
        fieldsData = await fieldsResponse.json();
      }
    }

    if (teamsData.length === 0) {
      return res.status(400).json({ error: 'No approved teams found for scheduling' });
    }

    if (fieldsData.length === 0) {
      return res.status(400).json({ error: 'No available fields found for scheduling' });
    }

    // Generate schedule using intelligent algorithm
    const schedule = await generateIntelligentSchedule(
      teamsData,
      fieldsData,
      { startDate, endDate },
      constraints
    );

    res.json({
      games: schedule.games,
      summary: schedule.summary,
      conflicts: schedule.conflicts
    });

  } catch (error) {
    console.error('Error generating intelligent schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// Save schedule changes
router.post('/events/:eventId/save-schedule', requireAuth, requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { games: gamesList } = req.body;

    // Delete existing games for this event
    await db.delete(games).where(eq(games.eventId, eventId));

    // Insert new games
    if (gamesList.length > 0) {
      const gamesData = gamesList.map((game: any) => ({
        eventId: eventId,
        homeTeamId: game.homeTeam.id,
        awayTeamId: game.awayTeam.id,
        fieldId: game.fieldId,
        gameDate: game.date,
        gameTime: game.startTime,
        duration: game.duration || 90,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      }));

      await db.insert(games).values(gamesData);
    }

    res.json({ success: true, message: 'Schedule saved successfully' });
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

// Intelligent scheduling algorithm
async function generateIntelligentSchedule(
  teams: TeamData[],
  fields: FieldData[],
  eventDates: { startDate: Date; endDate: Date },
  constraints: SchedulingConstraints
) {
  const generatedGames: any[] = [];
  const conflicts: any[] = [];
  
  // Group teams by age group and field size
  const ageGroups = teams.reduce((acc, team) => {
    const key = team.ageGroup;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {} as Record<string, TeamData[]>);

  // Group fields by size
  const fieldsBySize = fields.reduce((acc, field) => {
    const size = field.fieldSize;
    if (!acc[size]) acc[size] = [];
    acc[size].push(field);
    return acc;
  }, {} as Record<string, FieldData[]>);

  console.log(`Age groups: ${Object.keys(ageGroups).length}`);
  console.log(`Field sizes available: ${Object.keys(fieldsBySize).join(', ')}`);

  // Generate games for each age group
  for (const [ageGroupName, ageGroupTeams] of Object.entries(ageGroups)) {
    if (ageGroupTeams.length < 2) continue;

    const fieldSize = ageGroupTeams[0].fieldSize;
    const availableFields = fieldsBySize[fieldSize] || fieldsBySize['11v11'] || fields;

    if (availableFields.length === 0) {
      conflicts.push({
        type: 'field',
        severity: 'high',
        description: `No ${fieldSize} fields available for ${ageGroupName}`,
        suggestion: `Add ${fieldSize} fields or modify age group field requirements`
      });
      continue;
    }

    // Generate round-robin or bracket games
    const ageGroupGames = generateGamesForAgeGroup(
      ageGroupTeams,
      availableFields,
      eventDates,
      constraints,
      ageGroupName
    );

    generatedGames.push(...ageGroupGames);
  }

  // Detect conflicts
  const detectedConflicts = detectSchedulingConflicts(generatedGames, constraints);
  conflicts.push(...detectedConflicts);

  return {
    games: generatedGames,
    summary: {
      totalGames: generatedGames.length,
      ageGroups: Object.keys(ageGroups).length,
      fieldsUsed: new Set(generatedGames.map(g => g.fieldId)).size,
      daysSpanned: getDaysSpanned(generatedGames)
    },
    conflicts
  };
}

function generateGamesForAgeGroup(
  teams: TeamData[],
  availableFields: FieldData[],
  eventDates: { startDate: Date; endDate: Date },
  constraints: SchedulingConstraints,
  ageGroupName: string
) {
  const games: any[] = [];
  const gameSlotMinutes = constraints.gameDuration + constraints.restTime;

  // Generate round-robin matchups
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const homeTeam = teams[i];
      const awayTeam = teams[j];

      // Find available field and time slot
      const assignment = findAvailableSlot(
        availableFields,
        eventDates,
        constraints,
        games
      );

      if (assignment) {
        const gameId = `${homeTeam.id}-${awayTeam.id}-${Date.now()}-${Math.random()}`;
        
        games.push({
          id: gameId,
          homeTeam,
          awayTeam,
          fieldId: assignment.field.id,
          field: assignment.field,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          date: assignment.date,
          duration: constraints.gameDuration,
          conflicts: [],
          status: 'scheduled',
          ageGroup: ageGroupName
        });
      }
    }
  }

  return games;
}

function findAvailableSlot(
  fields: FieldData[],
  eventDates: { startDate: Date; endDate: Date },
  constraints: SchedulingConstraints,
  existingGames: any[]
) {
  const startTime = parseTime(constraints.startTime);
  const endTime = parseTime(constraints.endTime);
  const gameSlotMinutes = constraints.gameDuration + constraints.restTime;

  // Try each day of the event
  for (let date = new Date(eventDates.startDate); date <= eventDates.endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Try each field
    for (const field of fields) {
      const fieldStartTime = parseTime(field.openTime) || startTime;
      const fieldEndTime = parseTime(field.closeTime) || endTime;
      
      // Try each time slot
      for (let currentTime = Math.max(startTime, fieldStartTime); 
           currentTime + gameSlotMinutes <= Math.min(endTime, fieldEndTime); 
           currentTime += gameSlotMinutes) {
        
        const startTimeStr = formatTime(currentTime);
        const endTimeStr = formatTime(currentTime + constraints.gameDuration);
        
        // Check if slot is available
        const isSlotAvailable = !existingGames.some(game => 
          game.fieldId === field.id && 
          game.date === dateStr && 
          timeOverlaps(game.startTime, game.endTime, startTimeStr, endTimeStr)
        );
        
        if (isSlotAvailable) {
          return {
            field,
            date: dateStr,
            startTime: startTimeStr,
            endTime: endTimeStr
          };
        }
      }
    }
  }
  
  return null;
}

function detectSchedulingConflicts(games: any[], constraints: SchedulingConstraints) {
  const conflicts: any[] = [];
  
  if (!constraints.preventCoachConflicts) return conflicts;

  // Check for coach conflicts
  const coachGameMap = new Map<string, any[]>();
  
  games.forEach(game => {
    const homeCoach = game.homeTeam.coach.email;
    const awayCoach = game.awayTeam.coach.email;
    
    if (homeCoach) {
      if (!coachGameMap.has(homeCoach)) coachGameMap.set(homeCoach, []);
      coachGameMap.get(homeCoach)?.push(game);
    }
    
    if (awayCoach && awayCoach !== homeCoach) {
      if (!coachGameMap.has(awayCoach)) coachGameMap.set(awayCoach, []);
      coachGameMap.get(awayCoach)?.push(game);
    }
  });

  // Find overlapping games for same coach
  coachGameMap.forEach((coachGames, coachEmail) => {
    for (let i = 0; i < coachGames.length; i++) {
      for (let j = i + 1; j < coachGames.length; j++) {
        const game1 = coachGames[i];
        const game2 = coachGames[j];
        
        if (game1.date === game2.date && 
            timeOverlaps(game1.startTime, game1.endTime, game2.startTime, game2.endTime)) {
          conflicts.push({
            type: 'coach',
            severity: 'high',
            description: `Coach ${coachEmail} has overlapping games`,
            suggestion: 'Reschedule one of the games to a different time slot',
            games: [game1.id, game2.id]
          });
        }
      }
    }
  });

  return conflicts;
}

// Utility functions
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  
  return s1 < e2 && s2 < e1;
}

function getDaysSpanned(games: any[]): number {
  const dates = new Set(games.map(game => game.date));
  return dates.size;
}

export default router;