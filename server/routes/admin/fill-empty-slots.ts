import express from 'express';
import { db } from '@db';
import { games, gameTimeSlots, fields, eventAgeGroups } from '@db/schema';
import { eq, and, lt, gt, inArray, isNull, or } from 'drizzle-orm';

const router = express.Router();

// POST /api/admin/events/:eventId/games/fill-empty-slots
// Fill unscheduled games into next available time slots without affecting existing schedule
router.post('/:eventId/games/fill-empty-slots', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { gameIds } = req.body;

    console.log(`[Fill Empty Slots] Processing request for event ${eventId} with games:`, gameIds);

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ error: 'No game IDs provided' });
    }

    // Get the games that need to be scheduled
    const gamesToSchedule = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        duration: games.duration,
        fieldId: games.fieldId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        ageGroupName: eventAgeGroups.ageGroup,
        ageGroupGender: eventAgeGroups.gender
      })
      .from(games)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          eq(games.eventId, eventId),
          inArray(games.id, gameIds),
          or(
            isNull(games.scheduledDate),
            isNull(games.scheduledTime),
            isNull(games.fieldId),
            eq(games.scheduledDate, 'TBD'),
            eq(games.scheduledTime, 'TBD')
          )
        )
      );

    if (gamesToSchedule.length === 0) {
      return res.json({ 
        success: true, 
        scheduledCount: 0, 
        message: 'No unscheduled games found to process' 
      });
    }

    console.log(`[Fill Empty Slots] Found ${gamesToSchedule.length} unscheduled games to process`);

    // Get all available time slots for the event (sorted chronologically)
    const availableTimeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId))
      .orderBy(gameTimeSlots.startTime);

    // Get all available fields (prioritize Galway Downs 1-20)
    const availableFields = await db
      .select()
      .from(fields)
      .orderBy(fields.name); // This will naturally prioritize Galway Downs Field 1, 2, etc.

    // Get all currently scheduled games to avoid conflicts
    const scheduledGames = await db
      .select({
        fieldId: games.fieldId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        duration: games.duration
      })
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          // Only consider games that are actually scheduled (not TBD)
          games.fieldId !== null,
          games.scheduledDate !== null,
          games.scheduledTime !== null,
          games.scheduledDate !== 'TBD',
          games.scheduledTime !== 'TBD'
        )
      );

    console.log(`[Fill Empty Slots] Found ${scheduledGames.length} already scheduled games to avoid conflicts with`);
    console.log(`[Fill Empty Slots] Available time slots: ${availableTimeSlots.length}, Available fields: ${availableFields.length}`);

    // Helper function to check if a time slot is available on a field
    const isTimeSlotAvailable = (fieldId: number, date: string, startTime: string, duration: number = 90): boolean => {
      // Convert times to minutes for easy comparison
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + duration;

      // Check for conflicts with existing games
      const hasConflict = scheduledGames.some(game => {
        if (game.fieldId !== fieldId || game.scheduledDate !== date) {
          return false; // Different field or date, no conflict
        }

        const [gameHours, gameMinutes] = game.scheduledTime.split(':').map(Number);
        const gameStartMinutes = gameHours * 60 + gameMinutes;
        const gameEndMinutes = gameStartMinutes + (game.duration || 90);

        // Check for overlap: game overlaps if it starts before our game ends and ends after our game starts
        return !(gameEndMinutes <= startMinutes || gameStartMinutes >= endMinutes);
      });

      return !hasConflict;
    };

    const scheduledCount = { value: 0 };
    const updatePromises: Promise<any>[] = [];

    // Process each game to find the next available slot
    for (const game of gamesToSchedule) {
      let scheduled = false;

      // Try each time slot until we find an available one
      for (const timeSlot of availableTimeSlots) {
        if (scheduled) break;

        // Extract date/time by string splitting — DO NOT use new Date() which applies timezone conversion
        const slotDate = timeSlot.startTime.split('T')[0]; // YYYY-MM-DD
        const slotTime = timeSlot.startTime.split('T')[1]?.substring(0, 5) || '08:00'; // HH:MM

        // Try each field for this time slot (prioritize Galway Downs)
        for (const field of availableFields) {
          if (isTimeSlotAvailable(field.id, slotDate, slotTime, game.duration || 90)) {
            // Found an available slot! Schedule the game
            console.log(`[Fill Empty Slots] Scheduling game ${game.id} to ${field.name} at ${slotDate} ${slotTime}`);

            const updatePromise = db
              .update(games)
              .set({
                fieldId: field.id,
                scheduledDate: slotDate,
                scheduledTime: slotTime,
                timeSlotId: timeSlot.id
              })
              .where(eq(games.id, game.id));

            updatePromises.push(updatePromise);

            // Add this game to scheduled games to prevent future conflicts
            scheduledGames.push({
              fieldId: field.id,
              scheduledDate: slotDate,
              scheduledTime: slotTime,
              duration: game.duration || 90
            });

            scheduledCount.value++;
            scheduled = true;
            break;
          }
        }
      }

      if (!scheduled) {
        console.log(`[Fill Empty Slots] Could not find available slot for game ${game.id} (${game.ageGroupName})`);
      }
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`[Fill Empty Slots] Successfully scheduled ${scheduledCount.value} games`);
    }

    res.json({
      success: true,
      scheduledCount: scheduledCount.value,
      totalProcessed: gamesToSchedule.length,
      message: `Successfully scheduled ${scheduledCount.value} out of ${gamesToSchedule.length} games into available time slots`
    });

  } catch (error) {
    console.error('[Fill Empty Slots] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fill empty slots', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;