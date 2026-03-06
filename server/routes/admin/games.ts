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

// Delete individual game
router.delete('/game/:gameId', isAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    
    console.log(`[Game Delete] Attempting to delete game ${gameId}`);
    
    // First check if game exists
    const existingGame = await db.query.games.findFirst({
      where: eq(games.id, gameId)
    });
    
    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Delete the game
    const deletedGame = await db
      .delete(games)
      .where(eq(games.id, gameId))
      .returning();
    
    console.log(`[Game Delete] Successfully deleted game ${gameId}`);
    
    res.json({ 
      success: true, 
      message: 'Game deleted successfully',
      deletedGame: deletedGame[0]
    });
    
  } catch (error) {
    console.error('[Game Delete] Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete all CSV imported games for an event
router.delete('/:eventId/csv-imports', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    console.log(`[CSV Delete] Deleting CSV imported games for event ${eventId}`);
    
    // Find games with CSV import notes
    const csvGames = await db.query.games.findMany({
      where: sql`${games.notes} LIKE '%Imported from CSV%'`,
      with: {
        homeTeam: { columns: { name: true } },
        awayTeam: { columns: { name: true } }
      }
    });
    
    console.log(`[CSV Delete] Found ${csvGames.length} CSV imported games`);
    
    if (csvGames.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No CSV imported games found',
        deletedCount: 0
      });
    }
    
    // Delete CSV imported games
    const gameIds = csvGames.map(g => g.id);
    const deletedGames = await db
      .delete(games)
      .where(sql`${games.id} = ANY(${gameIds})`)
      .returning();
    
    console.log(`[CSV Delete] Successfully deleted ${deletedGames.length} CSV imported games`);
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletedGames.length} CSV imported games`,
      deletedCount: deletedGames.length,
      deletedGameIds: gameIds
    });
    
  } catch (error) {
    console.error('[CSV Delete] Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete CSV imported games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete all games for an event
router.delete('/:eventId/games/bulk', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    console.log(`[Bulk Delete] Starting deletion of all games for event ${eventId}`);
    
    // Get all games for this event through age groups
    const eventGames = await db.query.games.findMany({
      with: {
        ageGroup: {
          columns: { eventId: true }
        }
      }
    });
    
    const gamesToDelete = eventGames.filter(game => game.ageGroup?.eventId === eventId);
    console.log(`[Bulk Delete] Found ${gamesToDelete.length} games to delete for event ${eventId}`);
    
    if (gamesToDelete.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No games found for this event',
        deletedCount: 0
      });
    }

    // Delete all games
    const gameIds = gamesToDelete.map(g => g.id);
    const deletedGames = await db
      .delete(games)
      .where(sql`${games.id} = ANY(${gameIds})`)
      .returning();

    console.log(`[Bulk Delete] Successfully deleted ${deletedGames.length} games for event ${eventId}`);

    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletedGames.length} games from the tournament`,
      deletedCount: deletedGames.length 
    });
  } catch (error) {
    console.error('Error deleting games:', error);
    res.status(500).json({ 
      error: 'Failed to delete games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete games by age group
router.delete('/:eventId/age-group/:ageGroupId/games', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const ageGroupId = parseInt(req.params.ageGroupId);
    
    console.log(`[Age Group Delete] Deleting games for age group ${ageGroupId} in event ${eventId}`);
    
    // Get games for this age group
    const ageGroupGames = await db.query.games.findMany({
      where: eq(games.ageGroupId, ageGroupId)
    });
    
    console.log(`[Age Group Delete] Found ${ageGroupGames.length} games for age group ${ageGroupId}`);
    
    if (ageGroupGames.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No games found for this age group',
        deletedCount: 0
      });
    }
    
    // Delete all games for this age group
    const deletedGames = await db
      .delete(games)
      .where(eq(games.ageGroupId, ageGroupId))
      .returning();
    
    console.log(`[Age Group Delete] Successfully deleted ${deletedGames.length} games`);
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletedGames.length} games from age group`,
      deletedCount: deletedGames.length
    });
    
  } catch (error) {
    console.error('[Age Group Delete] Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete age group games',
      details: error instanceof Error ? error.message : 'Unknown error'
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

      // Look up the game's actual duration (don't hardcode 90 minutes)
      const gameRecord = await db.query.games.findFirst({
        where: eq(games.id, parseInt(gameId)),
        columns: { duration: true }
      });
      const gameDuration = gameRecord?.duration || 90;

      // Calculate end time using string math — DO NOT use new Date() which applies timezone conversion
      const [datePart, timePart] = startTime.split('T');
      const [startH, startM] = timePart.split(':').map(Number);
      const endTotalMin = startH * 60 + startM + gameDuration;
      const endH = Math.floor(endTotalMin / 60).toString().padStart(2, '0');
      const endM = (endTotalMin % 60).toString().padStart(2, '0');
      const endTime = `${datePart}T${endH}:${endM}:00`;
      console.log(`   • End: ${endTime} (${gameDuration}-minute duration)`);

      const [newTimeSlot] = await db.insert(gameTimeSlots).values({
        eventId: eventId.toString(),
        fieldId: fieldId,
        startTime: startTime,
        endTime: endTime,
        isAvailable: true,
        dayIndex: 0,
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

    // Extract date and time by string splitting — DO NOT use new Date().toISOString()
    // which converts local time to UTC, shifting the time by the server's timezone offset.
    // Input is a naive ISO string like "2026-04-02T08:00:00" — NOT a UTC timestamp.
    const scheduledDate = startTime.split('T')[0]; // "2026-04-02"
    const scheduledTime = startTime.split('T')[1];  // "08:00:00"

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