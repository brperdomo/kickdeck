import express from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups, fields, complexes, gameTimeSlots, events } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// GET /api/admin/events/:eventId/schedule-calendar - Get calendar schedule data  
router.get('/:eventId/schedule-calendar', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Schedule Calendar] Fetching calendar data for event ${eventId}`);

    // Get event details first to get proper dates  
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventStartDate = event.startDate; // Use actual tournament start date (2025-08-16)
    console.log(`[Schedule Calendar] Using event start date: ${eventStartDate}`);

    // Get games with proper age group information using JOIN first
    const gamesWithDetails = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        status: games.status,
        duration: games.duration,
        round: games.round,
        matchNumber: games.matchNumber,
        ageGroupName: eventAgeGroups.ageGroup,
        ageGroupGender: eventAgeGroups.gender
      })
      .from(games)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(eq(games.eventId, parseInt(eventId)));

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
    const processedGames = [];
    
    console.log(`[Schedule Calendar Direct] Found ${gamesWithDetails.length} total games`);
    console.log(`[Schedule Calendar Direct] Found ${allTimeSlots.length} time slots`);
    console.log(`[Schedule Calendar Direct] Using event start date: ${eventStartDate}`);
    
    // Only process real games that exist in the database
    for (let i = 0; i < gamesWithDetails.length; i++) {
      const game = gamesWithDetails[i];
      
      // Get actual time slot and field data from database using proper IDs
      const timeSlot = allTimeSlots.find(ts => ts.id === game.timeSlotId);
      const assignedField = allFields.find(f => f.id === game.fieldId);
      
      // Process games even without time slots or field assignments for now
      // This allows us to see the games in the calendar interface
      if (!timeSlot) {
        console.log(`[Schedule Calendar Direct] Game ${game.gameId} has no time slot assigned`);
      }
      if (!assignedField) {
        console.log(`[Schedule Calendar Direct] Game ${game.gameId} has no field assigned`);
      }
      
      console.log(`[Schedule Calendar Direct] Processing game ${game.gameId}: ${timeSlot.startTime} on ${assignedField.name}`);

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

      // Include all games - use "TBD" for championship games without teams
      const ageGroupDisplay = game.ageGroupName ? 
        `${game.ageGroupName}${game.ageGroupGender ? ` ${game.ageGroupGender}` : ''}`.trim() : 
        'Unknown';
        
      processedGames.push({
        id: game.gameId,
        homeTeamName: homeTeam?.name || 'TBD',
        awayTeamName: awayTeam?.name || 'TBD',
        ageGroup: ageGroupDisplay,
        startTime: timeSlot?.startTime || 'TBD',
        endTime: timeSlot?.endTime || 'TBD',
        fieldName: assignedField?.name || 'Unassigned',
        fieldId: assignedField?.id || null,
        status: game.status,
        duration: game.duration || 90,
        round: game.round,
        matchNumber: game.matchNumber,
        homeTeamCoach: homeTeamCoach,
        awayTeamCoach: awayTeamCoach
      });
    }

    console.log(`[Schedule Calendar] Processed ${processedGames.length} games with team names`);
    console.log(`[Schedule Calendar] Sample processed game:`, processedGames[0]);

    // Add fields data to response
    const responseFields = allFields.map(field => ({
      id: field.id,
      name: field.name,
      fieldSize: field.fieldSize || '11v11',
      complexName: field.complexName || 'Tournament Complex',
      isOpen: true
    }));

    res.json({
      success: true,
      games: processedGames,
      fields: responseFields,
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
          fieldId: parseInt(fieldId),
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

    // CRITICAL: Update the games table with field and time slot assignments
    const updatedGame = await db
      .update(games)
      .set({
        fieldId: parseInt(fieldId),
        timeSlotId: timeSlot?.id || null,
        // Update any other scheduling fields if needed
        status: 'scheduled'
      })
      .where(eq(games.id, parseInt(gameId)))
      .returning();

    console.log(`[Game Reschedule] FIXED: Updated games table for game ${gameId}`, updatedGame[0]);

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

export default router;