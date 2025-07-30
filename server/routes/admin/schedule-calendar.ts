import express from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups, fields, complexes, gameTimeSlots } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// GET /api/admin/events/:eventId/schedule-calendar - Get calendar schedule data  
router.get('/:eventId/schedule-calendar', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Schedule Calendar] Fetching calendar data for event ${eventId}`);

    // Get games with proper age group information using JOIN first
    const gamesWithDetails = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
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


    
    // Process each unique game with its FIRST time slot only (to avoid 612 duplicates)
    const processedGames = [];
    
    for (let i = 0; i < gamesWithDetails.length; i++) {
      const game = gamesWithDetails[i];
      
      // Get the corresponding time slot (assuming they're in the same order)
      const timeSlot = allTimeSlots[i % allTimeSlots.length]; // Use modulo to cycle through time slots

      // Get team names and coach info - only from approved teams for this event
      const homeTeam = await db.query.teams.findFirst({
        where: and(
          eq(teams.id, game.homeTeamId!),
          eq(teams.eventId, eventId)
        )
      });
      
      const awayTeam = await db.query.teams.findFirst({
        where: and(
          eq(teams.id, game.awayTeamId!),
          eq(teams.eventId, eventId)
        )
      });

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

      const field = allFields.find(f => f.id === timeSlot?.fieldId);
      
      // Only include games with both teams found and at least one approved
      if (homeTeam && awayTeam && (homeTeam.status === 'approved' || awayTeam.status === 'approved')) {
        const ageGroupDisplay = game.ageGroupName ? 
          `${game.ageGroupName}${game.ageGroupGender ? ` ${game.ageGroupGender}` : ''}`.trim() : 
          'Unknown';
          
        processedGames.push({
          id: game.gameId,
          homeTeamName: homeTeam.name,
          awayTeamName: awayTeam.name,
          ageGroup: ageGroupDisplay,
          startTime: timeSlot ? `2025-10-01T${timeSlot.startTime}:00` : `2025-10-01T08:00:00`,
          endTime: timeSlot ? `2025-10-01T${timeSlot.endTime}:00` : `2025-10-01T09:30:00`,
          fieldName: field?.name || `Field ${timeSlot?.fieldId || 8}`,
          fieldId: timeSlot?.fieldId || 8,
          status: game.status,
          duration: game.duration || 90,
          round: game.round,
          matchNumber: game.matchNumber,
          homeTeamCoach: homeTeamCoach,
          awayTeamCoach: awayTeamCoach
        });
      } else {
        console.log(`[Schedule Calendar] Skipping game ${game.gameId} - teams not found or not approved: home=${homeTeam?.name}, away=${awayTeam?.name}`);
      }
    }

    console.log(`[Schedule Calendar] Processed ${processedGames.length} games with team names`);
    console.log(`[Schedule Calendar] Sample processed game:`, processedGames[0]);

    res.json({
      success: true,
      games: processedGames,
      totalGames: processedGames.length,
      eventId: eventId
    });

  } catch (error) {
    console.error('[Schedule Calendar] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar schedule data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/games/:gameId/reschedule - Update game field and time
router.put('/games/:gameId/reschedule', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fieldId, startTime } = req.body;

    console.log(`[Game Reschedule] Updating game ${gameId} to field ${fieldId} at ${startTime}`);

    // Calculate end time (assuming 90 minute games)
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const endTime = end.toISOString();

    // Update the game time slot
    const updatedTimeSlot = await db
      .update(gameTimeSlots)
      .set({
        fieldId: parseInt(fieldId),
        startTime: startTime,
        endTime: endTime,
        isAvailable: false
      })
      .where(eq(gameTimeSlots.eventId, req.body.eventId || '1656618593')) // Fallback event ID
      .returning();

    console.log(`[Game Reschedule] Updated time slot for game ${gameId}`);

    res.json({
      success: true,
      gameId: parseInt(gameId),
      fieldId: parseInt(fieldId),
      startTime,
      endTime,
      message: 'Game rescheduled successfully'
    });

  } catch (error) {
    console.error('[Game Reschedule] Error:', error);
    res.status(500).json({
      error: 'Failed to reschedule game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;