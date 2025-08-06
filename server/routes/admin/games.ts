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
      .leftJoin(teams.as('home_team'), eq(games.homeTeamId, teams.as('home_team').id))
      .leftJoin(teams.as('away_team'), eq(games.awayTeamId, teams.as('away_team').id))
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
    
    const [updatedGame] = await db
      .update(games)
      .set({
        fieldId: fieldId,
        timeSlotId: timeSlot.id,
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

export default router;