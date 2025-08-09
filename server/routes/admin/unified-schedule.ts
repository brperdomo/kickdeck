import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { db } from '@db';
import { events, teams, complexes, fields, games, gameTimeSlots, eventAgeGroups } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Test endpoint to verify routing is working
router.get('/test-schedule', async (req, res) => {
  console.log('[Unified Schedule] Test endpoint hit');
  res.json({ message: 'Unified schedule router is working', timestamp: new Date().toISOString() });
});

// Generate unified schedule for a single age group
router.post('/events/:eventId/unified-schedule', requireAuth, async (req, res) => {
  console.log('[UNIFIED SCHEDULE] ===== REQUEST INTERCEPTED =====');
  console.log('[UNIFIED SCHEDULE] Route Hit! Event ID:', req.params.eventId);
  console.log('[UNIFIED SCHEDULE] Body Keys:', Object.keys(req.body || {}));
  console.log('[UNIFIED SCHEDULE] User:', req.user?.email || 'No user');
  
  try {
    console.log('[Unified Schedule API] POST request received:', {
      eventId: req.params.eventId,
      bodyKeys: Object.keys(req.body),
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      userEmail: req.user?.email
    });
    
    console.log('[Unified Schedule] REQUEST BODY:', JSON.stringify(req.body, null, 2));

    const { eventId } = req.params;
    const {
      selectedAgeGroup,
      gameFormat,
      teamNames,
      gameDuration,
      restPeriod,
      maxGamesPerDay,
      startDate,
      endDate,
      operatingStart,
      operatingEnd,
      availableFields,
      fieldType
    } = req.body;

    console.log(`[Unified Schedule] Generating schedule for event ${eventId}, age group: ${selectedAgeGroup}`);

    // Get the actual age group data
    const ageGroupId = parseInt(selectedAgeGroup);
    const ageGroup = await db.query.eventAgeGroups.findFirst({
      where: and(
        eq(eventAgeGroups.eventId, eventId), // eventAgeGroups.eventId is text, keep as string
        eq(eventAgeGroups.id, ageGroupId)
      )
    });

    if (!ageGroup) {
      return res.status(400).json({ error: 'Age group not found' });
    }

    // Get approved teams for this age group
    const approvedTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.ageGroupId, ageGroupId),
        eq(teams.status, 'approved')
      )
    });

    if (approvedTeams.length < 2) {
      return res.status(400).json({ 
        error: `At least 2 approved teams are required for schedule generation. Found ${approvedTeams.length} approved teams in ${ageGroup.ageGroup} (${ageGroup.gender})` 
      });
    }

    console.log(`[Unified Schedule] Teams in ${ageGroup.ageGroup} (${ageGroup.gender}): ${approvedTeams.length} approved teams`);

    // Get event data to validate  
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId)) // Convert to number to match events.id bigint schema
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get available fields for this event that match age group's field size
    const allEventFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.isOpen, true));

    // CRITICAL: Filter fields by age group's field size requirements
    const requiredFieldSize = ageGroup.fieldSize;
    const eventFields = allEventFields.filter(field => field.fieldSize === requiredFieldSize);
    
    console.log(`[Field Size Validation] Age group ${ageGroup.ageGroup} ${ageGroup.gender} requires ${requiredFieldSize} fields`);
    console.log(`[Field Size Validation] Found ${eventFields.length} compatible fields out of ${allEventFields.length} total fields`);
    console.log(`[Field Size Validation] Compatible fields:`, eventFields.map(f => `${f.name} (${f.fieldSize})`));

    if (eventFields.length === 0) {
      return res.status(400).json({ 
        error: `No ${requiredFieldSize} fields available for ${ageGroup.ageGroup} ${ageGroup.gender}. Available field sizes: ${Array.from(new Set(allEventFields.map(f => f.fieldSize))).join(', ')}` 
      });
    }

    console.log(`[Unified Schedule] Compatible fields: ${eventFields.length}`);

    // Generate games for this age group using smart tournament logic
    type GeneratedGame = {
      id: number;
      team1: string;
      team2: string;
      team1Id: number;
      team2Id: number;
      ageGroup: string;
      ageGroupId: number;
      format: string;
      duration: number;
      status: string;
    };
    
    const generatedGames: GeneratedGame[] = [];
    const gameId = Date.now(); // Simple ID generation for demo
    
    console.log(`[Schedule Logic] Age group has ${approvedTeams.length} teams`);
    
    // Smart tournament format selection based on team count
    let gameFormat_type = 'pool_play';
    let maxGamesPerTeam = 3; // Default reasonable limit
    
    if (approvedTeams.length <= 4) {
      // Small group: Round robin (every team plays every team)
      gameFormat_type = 'round_robin';
      maxGamesPerTeam = approvedTeams.length - 1;
    } else if (approvedTeams.length <= 8) {
      // Medium group: Pool play with 3-4 games per team
      gameFormat_type = 'pool_play';
      maxGamesPerTeam = 3;
    } else {
      // Large group: Pool play with 2-3 games per team
      gameFormat_type = 'pool_play';
      maxGamesPerTeam = 2;
    }
    
    console.log(`[Schedule Logic] Using ${gameFormat_type} format with max ${maxGamesPerTeam} games per team`);
    
    // Generate games based on format
    if (gameFormat_type === 'round_robin') {
      // Full round robin for small groups
      for (let i = 0; i < approvedTeams.length; i++) {
        for (let j = i + 1; j < approvedTeams.length; j++) {
          generatedGames.push({
            id: gameId + generatedGames.length,
            team1: approvedTeams[i].name,
            team2: approvedTeams[j].name,
            team1Id: approvedTeams[i].id,
            team2Id: approvedTeams[j].id,
            ageGroup: `${ageGroup.ageGroup} (${ageGroup.gender})`,
            ageGroupId: ageGroupId,
            format: gameFormat,
            duration: gameDuration,
            status: 'scheduled'
          });
        }
      }
    } else {
      // Pool play format - each team plays a limited number of opponents
      const teamGameCounts = new Array(approvedTeams.length).fill(0);
      
      // Try to create balanced matchups where each team gets maxGamesPerTeam games
      let attempts = 0;
      const maxAttempts = 1000; // Prevent infinite loops
      
      while (attempts < maxAttempts && teamGameCounts.some(count => count < maxGamesPerTeam)) {
        attempts++;
        
        // Find two teams that can both play another game
        for (let i = 0; i < approvedTeams.length; i++) {
          if (teamGameCounts[i] >= maxGamesPerTeam) continue;
          
          for (let j = i + 1; j < approvedTeams.length; j++) {
            if (teamGameCounts[j] >= maxGamesPerTeam) continue;
            
            // Check if these teams have already played each other
            const alreadyPlayed = generatedGames.some(game => 
              (game.team1Id === approvedTeams[i].id && game.team2Id === approvedTeams[j].id) ||
              (game.team1Id === approvedTeams[j].id && game.team2Id === approvedTeams[i].id)
            );
            
            if (!alreadyPlayed) {
              generatedGames.push({
                id: gameId + generatedGames.length,
                team1: approvedTeams[i].name,
                team2: approvedTeams[j].name,
                team1Id: approvedTeams[i].id,
                team2Id: approvedTeams[j].id,
                ageGroup: `${ageGroup.ageGroup} (${ageGroup.gender})`,
                ageGroupId: ageGroupId,
                format: gameFormat,
                duration: gameDuration,
                status: 'scheduled'
              });
              
              teamGameCounts[i]++;
              teamGameCounts[j]++;
              break;
            }
          }
        }
      }
    }
    
    console.log(`[Schedule Logic] Generated ${generatedGames.length} games using ${gameFormat_type} format`);
    console.log(`[Schedule Logic] Average games per team: ${(generatedGames.length * 2 / approvedTeams.length).toFixed(1)}`);

    // INTELLIGENT FIELD DISTRIBUTION ALGORITHM
    console.log(`[Smart Field Assignment] Distributing ${generatedGames.length} games across ${eventFields.length} available fields`);
    console.log(`[Smart Field Assignment] Available fields:`, eventFields.map(f => `${f.name} (${f.fieldSize}, ID: ${f.id})`));
    
    const scheduledGames = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Field utilization tracking - each field tracks its schedule
    const fieldSchedules = new Map();
    eventFields.forEach(field => {
      fieldSchedules.set(field.id, []);
    });
    
    let gameIndex = 0;
    let dayIndex = 0;
    
    while (currentDate <= endDateObj && gameIndex < generatedGames.length) {
      console.log(`[Smart Field Assignment] === Scheduling Day ${dayIndex + 1}: ${currentDate.toDateString()} ===`);
      
      // Parse operating hours
      const [startHour, startMinute] = operatingStart.split(':').map(Number);
      const [endHour, endMinute] = operatingEnd.split(':').map(Number);
      
      const dailyStartTime = startHour * 60 + startMinute; // Convert to minutes
      const dailyEndTime = endHour * 60 + endMinute;
      const availableMinutesPerDay = dailyEndTime - dailyStartTime;
      const gameSlotDuration = gameDuration + restPeriod;
      const maxSlotsPerFieldPerDay = Math.floor(availableMinutesPerDay / gameSlotDuration);
      
      console.log(`[Smart Field Assignment] Daily capacity: ${maxSlotsPerFieldPerDay} games per field × ${eventFields.length} fields = ${maxSlotsPerFieldPerDay * eventFields.length} total games per day`);
      
      // Reset field schedules for this day
      eventFields.forEach(field => {
        fieldSchedules.set(field.id, []);
      });
      
      let currentTimeSlot = 0;
      let gamesScheduledToday = 0;
      const maxGamesPerDay = maxSlotsPerFieldPerDay * eventFields.length;
      
      // Schedule games for current day using round-robin field assignment
      while (gameIndex < generatedGames.length && 
             currentTimeSlot < maxSlotsPerFieldPerDay && 
             gamesScheduledToday < maxGamesPerDay) {
        
        // Schedule games in parallel across all fields for this time slot
        for (let fieldIndex = 0; fieldIndex < eventFields.length && gameIndex < generatedGames.length; fieldIndex++) {
          const game = generatedGames[gameIndex];
          const selectedField = eventFields[fieldIndex];
          
          // Calculate time for this slot
          const slotStartTime = dailyStartTime + (currentTimeSlot * gameSlotDuration);
          const slotEndTime = slotStartTime + gameDuration;
          
          const startTimeHours = Math.floor(slotStartTime / 60);
          const startTimeMinutes = slotStartTime % 60;
          const endTimeHours = Math.floor(slotEndTime / 60);
          const endTimeMins = slotEndTime % 60;
          
          const scheduledGame = {
            ...game,
            date: currentDate.toISOString().split('T')[0],
            startTime: `${startTimeHours.toString().padStart(2, '0')}:${startTimeMinutes.toString().padStart(2, '0')}`,
            endTime: `${endTimeHours.toString().padStart(2, '0')}:${endTimeMins.toString().padStart(2, '0')}`,
            field: selectedField.name,
            fieldId: selectedField.id,
            complex: selectedField.complexName || 'Main Complex',
            timeSlot: currentTimeSlot,
            dayIndex: dayIndex
          };
          
          scheduledGames.push(scheduledGame);
          fieldSchedules.get(selectedField.id).push(scheduledGame);
          
          console.log(`[Smart Field Assignment] Game ${gameIndex + 1}: ${game.team1} vs ${game.team2} → ${selectedField.name} (ID: ${selectedField.id}) at ${scheduledGame.startTime}-${scheduledGame.endTime}`);
          
          gameIndex++;
          gamesScheduledToday++;
        }
        
        currentTimeSlot++;
      }
      
      console.log(`[Smart Field Assignment] Day ${dayIndex + 1} Complete: Scheduled ${gamesScheduledToday} games across ${eventFields.length} fields`);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }
    
    // Display final field distribution statistics
    console.log(`[Smart Field Assignment] === FINAL DISTRIBUTION SUMMARY ===`);
    eventFields.forEach(field => {
      const fieldGames = scheduledGames.filter(g => g.fieldId === field.id).length;
      console.log(`[Smart Field Assignment] ${field.name} (ID: ${field.id}): ${fieldGames} games scheduled`);
    });

    console.log(`[Unified Schedule] Generated ${scheduledGames.length} scheduled games`);

    // Save games to database with proper field assignments
    console.log(`[Database Save] Saving ${scheduledGames.length} games to database with distributed field assignments...`);
    
    const savedGames: any[] = [];
    for (const game of scheduledGames) {
      console.log(`[Database Save] Saving game: ${game.team1} vs ${game.team2} → Field ${game.field} (ID: ${game.fieldId}) at ${game.startTime}`);
      
      // CRITICAL FIX: Create time slot FIRST, then link the game to it
      const timeSlot = await db.insert(gameTimeSlots).values({
        eventId: eventId, // Keep as string to match schema
        fieldId: game.fieldId, // Use the intelligently distributed field ID
        startTime: game.startTime,
        endTime: game.endTime,
        dayIndex: game.dayIndex, // Use the actual day index from scheduling
        isAvailable: false
      }).returning();
      
      console.log(`[Database Save] Created time slot ID ${timeSlot[0].id} for field ${game.fieldId} at ${game.startTime}`);

      // Randomize Home/Away team assignments for game card generation
      const randomizeHomeAway = Math.random() < 0.5;
      const homeTeamId = randomizeHomeAway ? game.team1Id : game.team2Id;
      const awayTeamId = randomizeHomeAway ? game.team2Id : game.team1Id;

      // Now save the game with proper field_id and time_slot_id linkage
      const savedGame = await db.insert(games).values({
        eventId: eventId, // Keep as string to match schema
        ageGroupId: game.ageGroupId,
        homeTeamId: homeTeamId, // Randomized
        awayTeamId: awayTeamId, // Randomized
        fieldId: game.fieldId, // CRITICAL: Use the distributed field ID, not a fallback
        timeSlotId: timeSlot[0].id, // Link to the created time slot
        status: 'scheduled',
        round: 1,
        matchNumber: savedGames.length + 1,
        duration: game.duration,
        breakTime: restPeriod
      }).returning();

      console.log(`[Database Save] Saved game ID ${savedGame[0].id} linked to time slot ${timeSlot[0].id} on field ${game.fieldId}`);
      savedGames.push(savedGame[0]);
    }

    console.log(`[Database Save] Successfully saved ${savedGames.length} games to database`);

    // Return the generated schedule with database IDs
    res.json({
      success: true,
      ageGroup: `${ageGroup.ageGroup} (${ageGroup.gender})`,
      ageGroupId: ageGroupId,
      gamesCount: savedGames.length,
      teamsCount: approvedTeams.length,
      schedule: scheduledGames,
      savedGames: savedGames.map(g => ({ id: g.id, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, matchNumber: g.matchNumber })),
      teams: approvedTeams.map(team => ({ id: team.id, name: team.name })),
      summary: {
        totalGames: savedGames.length,
        teamsInvolved: approvedTeams.length,
        daysUsed: Math.ceil(savedGames.length / (availableFields * 6)),
        fieldsUsed: Math.min(availableFields, savedGames.length),
        format: gameFormat,
        duration: gameDuration,
        tournamentDates: `${startDate} to ${endDate}`,
        operatingHours: `${operatingStart} - ${operatingEnd}`,
        databaseSaved: true,
        message: `Generated and saved ${savedGames.length} games to database - you can now view them in the Master Schedule!`
      }
    });

  } catch (error) {
    console.error('[Unified Schedule API] ❌ CRITICAL ERROR occurred:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      eventId: req.params.eventId,
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      requestBody: req.body
    });
    
    // Log the exact line where error occurred
    if (error instanceof Error && error.stack) {
      console.error('[Unified Schedule API] 🔍 ERROR STACK TRACE:');
      console.error(error.stack);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      debug: {
        eventId: req.params.eventId,
        hasUser: !!req.user,
        userId: req.user?.id
      }
    });
  }
});

export default router;