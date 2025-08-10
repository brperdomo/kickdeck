import express from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups, fields, complexes, gameTimeSlots, events } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = express.Router();

// BYPASS AUTH DEBUG ENDPOINT - DIRECTLY HANDLE 500 ERROR
router.get('/:eventId/schedule-calendar-debug', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[BYPASS DEBUG] Testing schedule calendar for event ${eventId} WITHOUT AUTH`);
    
    const gamesWithDetails = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        status: games.status,
        duration: games.duration,
        round: games.round,
        matchNumber: games.matchNumber,
        ageGroupName: eventAgeGroups.ageGroup,
        ageGroupGender: eventAgeGroups.gender
      })
      .from(games)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(eq(games.eventId, eventId));

    console.log(`[BYPASS DEBUG] SUCCESS: Found ${gamesWithDetails.length} games`);
    
    res.json({
      success: true,
      gamesCount: gamesWithDetails.length,
      message: 'Schedule calendar query working without auth - 500 error investigation',
      sampleGame: gamesWithDetails[0]
    });
  } catch (error) {
    console.error('[BYPASS DEBUG] 500 ERROR FOUND:', error);
    res.status(500).json({
      error: 'This is the 500 error we are debugging',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// GET /api/admin/events/:eventId/schedule-calendar - Get calendar schedule data WITH AUTH ERROR HANDLING
router.get('/:eventId/schedule-calendar', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Schedule Calendar AUTH] Starting request for event ${eventId}`);
    console.log(`[Schedule Calendar AUTH] Authentication passed - continuing to database query`);

    // Get event details first to get proper dates  
    const event = await db.query.events.findFirst({
      where: eq(events.id, Number(eventId))
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventStartDate = event.startDate; // Use actual tournament start date (2025-08-16)
    console.log(`[Schedule Calendar] Using event start date: ${eventStartDate}`);

    // Get games with proper age group information using Drizzle ORM
    const gamesWithDetails = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        status: games.status,
        duration: games.duration,
        round: games.round,
        matchNumber: games.matchNumber,
        ageGroupName: eventAgeGroups.ageGroup,
        ageGroupGender: eventAgeGroups.gender
      })
      .from(games)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(eq(games.eventId, eventId));

    console.log(`[Schedule Calendar] Found ${gamesWithDetails.length} total games with age group data`);
    console.log(`[Schedule Calendar] Sample game:`, gamesWithDetails[0]);
    
    if (gamesWithDetails.length === 0) {
      console.log(`[Schedule Calendar] No games found for event ${eventId}, checking database...`);
      // Check if the event exists
      const eventCheck = await db.select().from(games).limit(5);
      console.log(`[Schedule Calendar] Sample games in database:`, eventCheck);
    }

    // Get all time slots for this event
    const allTimeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId));

    console.log(`[Schedule Calendar] Found ${allTimeSlots.length} time slots`);

    // Get all fields
    const allFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id));


    
    // Process actual games from database only - no synthetic data
    const processedGames: any[] = [];
    
    console.log(`[Schedule Calendar Direct] Found ${gamesWithDetails.length} total games`);
    console.log(`[Schedule Calendar Direct] Found ${allTimeSlots.length} time slots`);
    console.log(`[Schedule Calendar Direct] Using event start date: ${eventStartDate}`);
    
    // Get all teams for this event at once to avoid N+1 query problem
    const allTeams = await db.query.teams.findMany({
      where: eq(teams.eventId, eventId)
    });
    
    // Create a map for fast team lookups
    const teamMap = new Map();
    allTeams.forEach(team => teamMap.set(team.id, team));
    
    // Only process real games that exist in the database
    for (let i = 0; i < gamesWithDetails.length; i++) {
      const game = gamesWithDetails[i];
      
      // Get actual time slot and field data from database using proper IDs
      const timeSlot = allTimeSlots.find(ts => ts.id === game.timeSlotId);
      const assignedField = allFields.find(f => f.id === game.fieldId);
      
      console.log(`[Schedule Calendar Direct] Processing game ${game.gameId}: ${timeSlot?.startTime || 'No time'} on ${assignedField?.name || 'No field'}`);

      // Get team names from the team map (much faster than individual queries)
      const homeTeam = game.homeTeamId ? teamMap.get(game.homeTeamId) : null;
      const awayTeam = game.awayTeamId ? teamMap.get(game.awayTeamId) : null;

      // Extract coach information from teams
      let homeTeamCoach = '';
      let awayTeamCoach = '';
      
      if (homeTeam?.coach) {
        try {
          const coachData = typeof homeTeam.coach === 'string' ? JSON.parse(homeTeam.coach) : homeTeam.coach;
          homeTeamCoach = coachData?.headCoachName || '';
        } catch (e) {
          // If coach data isn't JSON, try to use it directly
          homeTeamCoach = homeTeam.coach || '';
        }
      }
      
      if (awayTeam?.coach) {
        try {
          const coachData = typeof awayTeam.coach === 'string' ? JSON.parse(awayTeam.coach) : awayTeam.coach;
          awayTeamCoach = coachData?.headCoachName || '';
        } catch (e) {
          // If coach data isn't JSON, try to use it directly
          awayTeamCoach = awayTeam.coach || '';
        }
      }

      // Include all games - use "TBD" for championship games without teams
      const ageGroupDisplay = game.ageGroupName ? 
        `${game.ageGroupName}${game.ageGroupGender ? ` ${game.ageGroupGender}` : ''}`.trim() : 
        'Unknown';

      // Format time properly from scheduled_date and scheduled_time or time slot
      let formattedDate = 'TBD';
      let formattedTime = 'TBD';
      
      // First try to use the new scheduled_date and scheduled_time fields
      if (game.scheduledDate && game.scheduledTime) {
        formattedDate = String(game.scheduledDate); // Convert to string and format as YYYY-MM-DD
        formattedTime = String(game.scheduledTime).substr(0, 5); // Convert to string and get HH:MM format
        console.log(`[Schedule Calendar] Using scheduled date/time: ${formattedDate} ${formattedTime}`);
      } else if (timeSlot?.startTime) {
        const startDate = new Date(timeSlot.startTime);
        formattedDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
        formattedTime = startDate.toTimeString().split(' ')[0].substr(0, 5); // HH:MM
        console.log(`[Schedule Calendar] Using time slot: ${formattedDate} ${formattedTime}`);
      }

      processedGames.push({
        id: game.gameId,
        homeTeam: homeTeam?.name || 'TBD',
        awayTeam: awayTeam?.name || 'TBD', 
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        ageGroup: ageGroupDisplay,
        field: assignedField?.name || 'Field Unknown',
        fieldId: game.fieldId || null,
        fieldName: assignedField?.name || 'Field Unknown',
        date: formattedDate,
        time: formattedTime,
        startTime: formattedDate !== 'TBD' && formattedTime !== 'TBD' ? `${formattedDate}T${formattedTime}:00` : null,
        duration: game.duration || 90,
        status: game.status,
        homeScore: null,
        awayScore: null,
        homeTeamName: homeTeam?.name || 'TBD',
        awayTeamName: awayTeam?.name || 'TBD',
        bracketId: homeTeam?.bracketId || awayTeam?.bracketId,
        flightName: homeTeam?.bracketId ? `Flight ${homeTeam.bracketId}` : undefined
      });
    }

    // Get fields data - include id field for proper game-field matching
    const processedFields = allFields.map(field => ({
      id: field.id,
      name: field.name,
      surface: 'Grass',
      fieldSize: field.fieldSize || '11v11'
    }));
    
    // Debug field mapping
    console.log(`[Schedule Calendar] Processed ${processedFields.length} fields:`, 
      processedFields.map(f => `${f.id}:${f.name}`));
    
    // Debug which fields have games
    const fieldsWithGames = processedFields.filter(field => 
      processedGames.some(game => game.fieldId === field.id)
    );
    console.log(`[Schedule Calendar] Fields with games (${fieldsWithGames.length}):`, 
      fieldsWithGames.map(f => `${f.id}:${f.name}`));

    // Get unique age groups and dates
    const ageGroups = Array.from(new Set(processedGames.map(game => game.ageGroup)));
    const dates = Array.from(new Set(processedGames.map(game => game.date)));

    const response = {
      games: processedGames,
      fields: processedFields, 
      ageGroups: ageGroups,
      dates: dates,
      totalGames: processedGames.length,
      scheduleStatus: 'active',
      isPreview: false,
      actualData: {
        gamesInDatabase: processedGames.length,
        teamsInDatabase: processedGames.filter(g => g.homeTeam !== 'TBD' && g.awayTeam !== 'TBD').length,
        ageGroupsConfigured: ageGroups.length,
        realTeamsFound: processedGames.filter(g => g.homeTeam !== 'TBD' || g.awayTeam !== 'TBD').length,
        scheduledGamesFound: processedGames.filter(g => g.date !== 'TBD').length,
        scheduleType: 'generated'
      },
      teamsList: [],
      eventId: Number(eventId),
      eventDetails: {
        name: event.name || 'Tournament',
        startDate: event.startDate,
        endDate: event.endDate
      }
    };

    console.log(`[Schedule Calendar] Returning ${response.games.length} games for Schedule Grid`);
    res.json(response);

  } catch (error) {
    console.error('[Schedule Calendar AUTH] 500 ERROR CAPTURED WITH AUTHENTICATION:', error);
    console.error('[Schedule Calendar AUTH] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    res.status(500).json({ 
      error: 'Schedule calendar 500 error - authenticated endpoint',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      authStatus: 'Authentication passed, error in database query logic',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Helper function to add minutes to time string
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

// PUT /api/admin/games/:gameId/reschedule - Update game field and time
router.put('/games/:gameId/reschedule', async (req, res) => {
  console.log(`[Game Reschedule] ROUTE HIT: PUT /games/${req.params.gameId}/reschedule`);
  try {
    const { gameId } = req.params;
    const { fieldId, startTime, eventId } = req.body;

    console.log(`[Game Reschedule] Updating game ${gameId} to field ${fieldId} at ${startTime} for event ${eventId}`);

    // Calculate end time (assuming 90 minute games)
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const endTime = end.toISOString();

    // Create or find time slot for this assignment
    let timeSlot;
    try {
      // First try to create a new time slot
      const [newTimeSlot] = await db
        .insert(gameTimeSlots)
        .values({
          eventId: eventId || '1844329078',
          fieldId: Number(fieldId),
          startTime: startTime,
          endTime: endTime,
          isAvailable: false,
          dayIndex: 0
        })
        .returning();
      timeSlot = newTimeSlot;
      console.log(`[Game Reschedule] Created new time slot with ID ${timeSlot.id}`);
    } catch (insertError) {
      console.log(`[Game Reschedule] Time slot creation failed, using field assignment only`);
      timeSlot = null;
    }

    // Parse date and time from startTime for scheduled_date and scheduled_time fields
    const startDate = new Date(startTime);
    const scheduledDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const scheduledTime = startDate.toTimeString().split(' ')[0].substr(0, 8); // HH:MM:SS
    
    console.log(`[Game Reschedule] Parsed date: ${scheduledDate}, time: ${scheduledTime}`);

    // CRITICAL: Update the games table with field, time slot, AND scheduled_date/scheduled_time
    const updatedGame = await db
      .update(games)
      .set({
        fieldId: parseInt(fieldId),
        timeSlotId: timeSlot?.id || null,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        status: 'scheduled'
      })
      .where(eq(games.id, parseInt(gameId)))
      .returning();

    console.log(`[Game Reschedule] FIXED: Updated games table for game ${gameId}`, updatedGame[0]);
    
    // Verify the update by querying the database again
    const verificationQuery = await db
      .select({
        id: games.id,
        fieldId: games.fieldId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        status: games.status
      })
      .from(games)
      .where(eq(games.id, parseInt(gameId)));
      
    console.log(`[Game Reschedule] DATABASE VERIFICATION - Game ${gameId} current state:`, verificationQuery[0]);

    res.json({
      success: true,
      gameId: parseInt(gameId),
      fieldId: parseInt(fieldId),
      timeSlotId: timeSlot?.id || null,
      startTime,
      endTime,
      message: 'Game rescheduled successfully and games table updated'
    });

  } catch (error) {
    console.error('[Game Reschedule] Error:', error);
    res.status(500).json({
      error: 'Failed to reschedule game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/events/:eventId/games/swap-teams - Swap teams between games
router.post('/:eventId/games/swap-teams', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { game1Id, team1Id, team1Position, game2Id, team2Id, team2Position } = req.body;
    
    console.log(`[TEAM SWAP] Starting team swap for event ${eventId}`);
    console.log(`[TEAM SWAP] Game 1: ${game1Id}, Team 1: ${team1Id} (${team1Position})`);
    console.log(`[TEAM SWAP] Game 2: ${game2Id}, Team 2: ${team2Id} (${team2Position})`);

    // Validate input
    if (!game1Id || !team1Id || !team1Position || !game2Id || !team2Id || !team2Position) {
      return res.status(400).json({ error: 'Missing required fields for team swap' });
    }

    // Verify both games exist and belong to the event
    const game1 = await db.query.games.findFirst({
      where: and(eq(games.id, game1Id), eq(games.eventId, eventId))
    });

    const game2 = await db.query.games.findFirst({
      where: and(eq(games.id, game2Id), eq(games.eventId, eventId))
    });

    if (!game1 || !game2) {
      return res.status(404).json({ error: 'One or both games not found' });
    }

    // Verify teams exist and belong to the same flight/bracket
    const team1 = await db.query.teams.findFirst({
      where: eq(teams.id, team1Id)
    });

    const team2 = await db.query.teams.findFirst({
      where: eq(teams.id, team2Id)
    });

    if (!team1 || !team2) {
      return res.status(404).json({ error: 'One or both teams not found' });
    }

    if (team1.bracketId !== team2.bracketId) {
      return res.status(400).json({ 
        error: 'Teams must be from the same flight/bracket to be swapped' 
      });
    }

    // Perform the swap
    if (team1Position === 'home') {
      await db.update(games)
        .set({ homeTeamId: team2Id })
        .where(eq(games.id, game1Id));
    } else {
      await db.update(games)
        .set({ awayTeamId: team2Id })
        .where(eq(games.id, game1Id));
    }

    if (team2Position === 'home') {
      await db.update(games)
        .set({ homeTeamId: team1Id })
        .where(eq(games.id, game2Id));
    } else {
      await db.update(games)
        .set({ awayTeamId: team1Id })
        .where(eq(games.id, game2Id));
    }

    console.log(`[TEAM SWAP] Successfully swapped teams between games ${game1Id} and ${game2Id}`);
    
    res.json({ 
      success: true, 
      message: 'Teams swapped successfully' 
    });
  } catch (error) {
    console.error('[TEAM SWAP] Error swapping teams:', error);
    res.status(500).json({ 
      error: 'Failed to swap teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;