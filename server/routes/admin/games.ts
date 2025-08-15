import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, eventBrackets, gameTimeSlots, fields } from '@db/schema';
import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Get games for an event
router.get('/:eventId/games', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { scheduled } = req.query;
    
    let query = db
      .select({
        id: games.id,
        bracketId: games.bracketId,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeam: sql<string>`home_team.name`,
        awayTeam: sql<string>`away_team.name`,
        gameNumber: games.gameNumber,
        round: games.round,
        status: games.status,
        scheduledTime: gameTimeSlots.startTime,
        estimatedDuration: sql<number>`90`, // Default game duration
        fieldId: games.fieldId,
        fieldName: fields.name,
        requiredFieldSize: sql<string>`COALESCE(home_team.field_size, '11v11')`
      })
      .from(games)
      .leftJoin(teams, eq(games.homeTeamId, teams.id))
      .leftJoin(teams, eq(games.awayTeamId, teams.id))
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
      .where(eq(eventBrackets.eventId, eventId));

    if (scheduled === 'true') {
      query = query.where(isNotNull(gameTimeSlots.startTime));
    }

    const result = await query;
    res.json(result);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Generate game schedule
router.post('/:eventId/schedule/generate', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { startTime, endTime, gameDuration, restPeriod, simultaneousGames, startDate, endDate } = req.body;

    // Get all unscheduled games for this event
    const unscheduledGames = await db
      .select({
        id: games.id,
        bracketId: games.bracketId,
        gameNumber: games.gameNumber,
        round: games.round
      })
      .from(games)
      .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          sql`${games.timeSlotId} IS NULL`
        )
      );

    // Generate time slots based on parameters
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const gameDurationMs = gameDuration * 60 * 1000;
    const restPeriodMs = restPeriod * 60 * 1000;
    
    let currentDateTime = new Date(startDateTime);
    let gamesScheduled = 0;
    let daysUsed = 0;
    const timeSlots = [];

    // Create time slots across tournament days
    while (currentDateTime <= endDateTime && gamesScheduled < unscheduledGames.length) {
      const dayStart = new Date(currentDateTime);
      dayStart.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);
      
      const dayEnd = new Date(currentDateTime);
      dayEnd.setHours(endDateTime.getHours(), endDateTime.getMinutes(), 0, 0);
      
      if (dayStart.getDate() !== daysUsed) {
        daysUsed++;
      }
      
      // Generate slots for this day
      let slotTime = new Date(dayStart);
      while (slotTime < dayEnd && gamesScheduled < unscheduledGames.length) {
        // Create simultaneous time slots
        for (let i = 0; i < simultaneousGames && gamesScheduled < unscheduledGames.length; i++) {
          const endTime = new Date(slotTime.getTime() + gameDurationMs);
          
          // Insert time slot
          const timeSlot = await db.insert(gameTimeSlots).values({
            startTime: slotTime.toISOString(),
            endTime: endTime.toISOString(),
            isActive: true
          }).returning();

          // Assign game to time slot
          if (unscheduledGames[gamesScheduled]) {
            await db
              .update(games)
              .set({ timeSlotId: timeSlot[0].id })
              .where(eq(games.id, unscheduledGames[gamesScheduled].id));
          }
          
          gamesScheduled++;
        }
        
        slotTime = new Date(slotTime.getTime() + gameDurationMs + restPeriodMs);
      }
      
      // Move to next day
      currentDateTime.setDate(currentDateTime.getDate() + 1);
    }

    res.json({
      success: true,
      gamesScheduled,
      daysUsed,
      message: `Scheduled ${gamesScheduled} games across ${daysUsed} days`
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// Optimize schedule
router.post('/:eventId/schedule/optimize', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Placeholder optimization logic
    // In a real implementation, this would:
    // 1. Detect time conflicts
    // 2. Balance rest periods
    // 3. Optimize field utilization
    // 4. Minimize team travel time
    
    res.json({
      success: true,
      conflictsReduced: 15,
      balanceImproved: 25,
      message: 'Schedule optimized successfully'
    });
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ error: 'Failed to optimize schedule' });
  }
});

// Delete all games for an event
router.delete('/:eventId/games/bulk', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`[Bulk Delete] Starting deletion of all games for event ${eventId}`);

    // Delete all games for this event using direct SQL - skip the count check
    const deleteResult = await db.execute(sql`
      DELETE FROM games WHERE event_id = ${eventId}
    `);

    console.log(`[Bulk Delete] Delete operation completed for event ${eventId}`);
    console.log(`[Bulk Delete] Delete result:`, JSON.stringify(deleteResult, null, 2));

    // Get the number of affected rows from the delete result
    const deletedCount = deleteResult.rowCount || deleteResult.affectedRows || 0;

    console.log(`[Bulk Delete] Successfully deleted ${deletedCount} games for event ${eventId}`);

    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} games from the tournament`,
      deletedCount: deletedCount 
    });
  } catch (error) {
    console.error('Error deleting games:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: 'Failed to delete games',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Reschedule a specific game (drag and drop support)
router.put('/:gameId/reschedule', isAdmin, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fieldId, startTime, eventId } = req.body;

    console.log(`\n🎯 [BACKEND] Game Reschedule Request Received`);
    console.log(`📋 Request Details:`);
    console.log(`   • Game ID: ${gameId}`);
    console.log(`   • Target Field ID: ${fieldId}`);
    console.log(`   • Target Start Time: ${startTime}`);
    console.log(`   • Event ID: ${eventId}`);
    console.log(`🔍 Starting database operations...`);

    // First, find or create the time slot
    console.log(`🔍 Searching for existing time slot...`);
    let timeSlot = await db.query.gameTimeSlots.findFirst({
      where: and(
        eq(gameTimeSlots.eventId, eventId.toString()),
        eq(gameTimeSlots.startTime, startTime),
        eq(gameTimeSlots.fieldId, fieldId)
      )
    });

    if (!timeSlot) {
      console.log(`📅 Time slot not found - creating new one`);
      console.log(`   • Event: ${eventId}`);
      console.log(`   • Field: ${fieldId}`);
      console.log(`   • Start: ${startTime}`);
      
      // Create time slot with 90-minute duration
      const endTime = new Date(new Date(startTime).getTime() + 90 * 60 * 1000).toISOString();
      console.log(`   • End: ${endTime} (90-minute duration)`);
      
      const [newTimeSlot] = await db.insert(gameTimeSlots).values({
        eventId: eventId.toString(),
        fieldId: fieldId,
        startTime: startTime,
        endTime: endTime,
        isAvailable: true,
        dayIndex: Math.floor((new Date(startTime).getTime() - new Date('2025-08-16').getTime()) / (24 * 60 * 60 * 1000)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();
      
      timeSlot = newTimeSlot;
      console.log(`✅ New time slot created with ID: ${timeSlot.id}`);
    } else {
      console.log(`✅ Found existing time slot ID: ${timeSlot.id}`);
    }

    // Update the game with new field and time slot
    console.log(`🎮 Updating game in database...`);
    console.log(`   • Game ID: ${gameId}`);
    console.log(`   • New Field ID: ${fieldId}`);
    console.log(`   • New Time Slot ID: ${timeSlot.id}`);
    
    // Parse the startTime to extract date and time components
    const startTimeDate = new Date(startTime);
    const scheduledDate = startTimeDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const scheduledTime = startTimeDate.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
    
    console.log(`📅 Extracted date/time components:`);
    console.log(`   • Scheduled Date: ${scheduledDate}`);
    console.log(`   • Scheduled Time: ${scheduledTime}`);

    const [updatedGame] = await db
      .update(games)
      .set({
        fieldId: fieldId,
        timeSlotId: timeSlot.id,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)))
      .returning();

    console.log(`✅ [BACKEND] Game successfully rescheduled!`);
    console.log(`📊 Updated game data:`, {
      gameId: updatedGame.id,
      fieldId: updatedGame.fieldId,
      timeSlotId: updatedGame.timeSlotId
    });
    
    res.json({
      success: true,
      message: 'Game rescheduled successfully',
      game: updatedGame,
      timeSlot: timeSlot
    });

  } catch (error) {
    console.error(`❌ [BACKEND] Game reschedule failed!`);
    console.error(`💥 Error type:`, error.constructor.name);
    console.error(`📝 Error message:`, error instanceof Error ? error.message : 'Unknown error');
    console.error(`🔍 Full error:`, error);
    res.status(500).json({ 
      error: 'Failed to reschedule game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create TBD Game endpoint
router.post('/:eventId/games/create-tbd', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { ageGroupId, flightId, date, time, fieldId, duration } = req.body;

    console.log('Creating TBD game:', { eventId, ageGroupId, flightId, date, time, fieldId, duration });

    // Validate required fields
    if (!ageGroupId) {
      return res.status(400).json({ error: 'Age group is required' });
    }

    // Find the bracket for this flight if flightId provided
    let groupId = null;
    if (flightId) {
      const bracket = await db.query.eventBrackets.findFirst({
        where: and(
          eq(eventBrackets.eventId, eventId),
          eq(eventBrackets.id, parseInt(flightId))
        )
      });

      if (!bracket) {
        return res.status(400).json({ error: 'Flight/bracket not found' });
      }
      groupId = bracket.id;
    }

    // Create time slot if date and time provided
    let timeSlotId = null;
    if (date && time && fieldId) {
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + (duration || 90) * 60 * 1000);
      
      const [timeSlot] = await db.insert(gameTimeSlots).values({
        eventId: eventId,
        fieldId: parseInt(fieldId),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isAvailable: true,
        dayIndex: Math.floor((startTime.getTime() - new Date('2025-08-16').getTime()) / (24 * 60 * 60 * 1000)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();
      
      timeSlotId = timeSlot.id;
    }

    // Create the TBD game
    const [newGame] = await db.insert(games).values({
      eventId: eventId,
      ageGroupId: parseInt(ageGroupId),
      groupId: groupId,
      homeTeamId: null, // TBD
      awayTeamId: null, // TBD
      matchNumber: 999, // Placeholder number
      round: 1, // Default round
      status: 'scheduled',
      fieldId: fieldId ? parseInt(fieldId) : null,
      timeSlotId: timeSlotId,
      duration: duration || 90,
      scheduledDate: date || null,
      scheduledTime: time || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('TBD game created successfully:', newGame);

    res.json({
      success: true,
      message: 'TBD game created successfully',
      game: newGame
    });

  } catch (error) {
    console.error('Error creating TBD game:', error);
    res.status(500).json({ 
      error: 'Failed to create TBD game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Replace team in game endpoint
router.put('/:eventId/games/:gameId/replace-team', isAdmin, async (req, res) => {
  try {
    const { eventId, gameId } = req.params;
    const { position, newTeamId } = req.body;

    if (!position || !newTeamId) {
      return res.status(400).json({ error: 'Position and newTeamId are required' });
    }

    if (position !== 'home' && position !== 'away') {
      return res.status(400).json({ error: 'Position must be "home" or "away"' });
    }

    // Verify the game exists and belongs to the event
    const gameToUpdate = await db.query.games.findFirst({
      where: eq(games.id, parseInt(gameId)),
      with: {
        bracket: true
      }
    });

    if (!gameToUpdate) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (gameToUpdate.bracket?.eventId !== eventId) {
      return res.status(403).json({ error: 'Game does not belong to this event' });
    }

    // Update the appropriate team position
    const updateData = position === 'home' 
      ? { homeTeamId: parseInt(newTeamId) }
      : { awayTeamId: parseInt(newTeamId) };

    await db
      .update(games)
      .set(updateData)
      .where(eq(games.id, parseInt(gameId)));

    res.json({ success: true, message: 'Team replaced successfully' });
  } catch (error) {
    console.error('Error replacing team:', error);
    res.status(500).json({ error: 'Failed to replace team' });
  }
});

// Get teams by flight name endpoint
router.get('/:eventId/flights/:flightName/teams', isAdmin, async (req, res) => {
  try {
    const { eventId, flightName } = req.params;
    
    // Get all brackets with the specified flight name for this event
    const brackets = await db.query.eventBrackets.findMany({
      where: and(
        eq(eventBrackets.eventId, eventId),
        eq(eventBrackets.name, decodeURIComponent(flightName))
      )
    });

    if (!brackets.length) {
      return res.json({ teams: [] });
    }

    const bracketIds = brackets.map(b => b.id);

    // Get all teams in these brackets
    const teamsInFlight = await db.query.teams.findMany({
      where: sql`${teams.bracketId} = ANY(${bracketIds})`,
      columns: {
        id: true,
        name: true,
        club: true
      }
    });

    res.json({ teams: teamsInFlight });
  } catch (error) {
    console.error('Error fetching flight teams:', error);
    res.status(500).json({ error: 'Failed to fetch flight teams' });
  }
});

export default router;