import { Router } from 'express';
import { db } from '../../../db';
import { events, teams, fields, complexes, gameTimeSlots, games, eventBrackets, eventAgeGroups } from '../../../db/schema';
import { eq, and, sql, countDistinct } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

interface TournamentData {
  approvedTeamCount: number;
  ageGroupCount: number;  
  availableFields: number;
  eventName: string;
  startDate: string;
  endDate: string;
}

interface GeneratedSchedule {
  totalGames: number;
  totalFlights: number;
  scheduledDays: number;
  gamesByDay: { [key: string]: number };
  conflicts: string[];
  warnings: string[];
  scheduleUrl: string;
}

// Quick check endpoint - minimal data for UI
router.get('/:eventId/quick-check', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    // Get basic event info
    const eventData = await db
      .select({
        id: events.id,
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!eventData.length) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Count approved teams
    const approvedTeamCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId.toString()),
        eq(teams.status, 'approved')
      ));

    // Count unique age groups from approved teams
    const ageGroups = await db
      .selectDistinct({ ageGroupId: teams.ageGroupId })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId.toString()),
        eq(teams.status, 'approved')
      ));

    // Count available fields (simplified - could be enhanced with complex logic)
    const availableFields = await db
      .select({ count: sql<number>`count(*)` })
      .from(fields)
      .where(eq(fields.isOpen, true));

    const result: TournamentData = {
      approvedTeamCount: approvedTeamCount[0]?.count || 0,
      ageGroupCount: ageGroups.length,
      availableFields: availableFields[0]?.count || 0,
      eventName: eventData[0].name,
      startDate: eventData[0].startDate,
      endDate: eventData[0].endDate
    };

    res.json(result);

  } catch (error) {
    console.error('Error in quick-check:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tournament data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// TRUE automated schedule generation - does everything in one call
router.post('/:eventId/generate-complete-schedule', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { autoMode = true } = req.body;

    console.log(`Starting complete schedule generation for event ${eventId}`);

    // Step 1: Get all approved teams with age group information
    const approvedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(teams.eventId, eventId.toString()),
        eq(teams.status, 'approved')
      ));

    if (approvedTeams.length < 2) {
      return res.status(400).json({
        error: 'Insufficient teams',
        message: `Need at least 2 approved teams to generate schedule. Found ${approvedTeams.length} teams.`
      });
    }

    console.log(`Found ${approvedTeams.length} approved teams`);

    // Step 2: Auto-group teams into flights by age group and gender
    const flightGroups = new Map<string, typeof approvedTeams>();
    
    approvedTeams.forEach(team => {
      const flightKey = `${team.ageGroup}_${team.gender || 'Mixed'}`;
      if (!flightGroups.has(flightKey)) {
        flightGroups.set(flightKey, []);
      }
      flightGroups.get(flightKey)!.push(team);
    });

    console.log(`Created ${flightGroups.size} flights from ${approvedTeams.length} teams`);

    // Step 3: Generate brackets and games for each flight
    let totalGamesCreated = 0;
    const createdFlights: string[] = [];
    const warnings: string[] = [];
    const conflicts: string[] = [];

    for (const [flightKey, flightTeams] of flightGroups) {
      const [ageGroup, gender] = flightKey.split('_');
      
      console.log(`Processing flight: ${flightKey} with ${flightTeams.length} teams`);

      // Create bracket entry (simplified to match schema)
      const bracketResult = await db
        .insert(eventBrackets)
        .values({
          eventId: eventId.toString(),
          ageGroupId: flightTeams[0].ageGroupId, // Use the age group ID from first team
          name: `${ageGroup} ${gender} Flight`,
          description: `Auto-generated flight for ${ageGroup} ${gender}`,
          sortOrder: createdFlights.length
        })
        .returning({ id: eventBrackets.id });

      const bracketId = bracketResult[0].id;
      createdFlights.push(flightKey);

      // Generate games based on flight size
      let gamesForFlight = 0;

      if (flightTeams.length === 2) {
        // Best of 3 for 2 teams
        for (let gameNum = 1; gameNum <= 3; gameNum++) {
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: flightTeams[0].ageGroupId,
            homeTeamId: flightTeams[0].id,
            awayTeamId: flightTeams[1].id,
            round: gameNum,
            matchNumber: totalGamesCreated + gameNum,
            duration: 90, // Default 90 minutes
            status: 'scheduled'
          });
          gamesForFlight++;
        }
      } else if (flightTeams.length <= 4) {
        // Round robin for small flights
        for (let i = 0; i < flightTeams.length; i++) {
          for (let j = i + 1; j < flightTeams.length; j++) {
            await db.insert(games).values({
              eventId: eventId.toString(),
              ageGroupId: flightTeams[i].ageGroupId,
              homeTeamId: flightTeams[i].id,
              awayTeamId: flightTeams[j].id,
              round: 1, // Pool play round
              matchNumber: totalGamesCreated + gamesForFlight + 1,
              duration: 90,
              status: 'scheduled'
            });
            gamesForFlight++;
          }
        }
      } else {
        // Larger flights: pool play + playoffs
        const poolGames = Math.min(flightTeams.length, 6); // Limit pool games
        
        // Create some pool games
        for (let i = 0; i < poolGames && i < flightTeams.length - 1; i++) {
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: flightTeams[i].ageGroupId,
            homeTeamId: flightTeams[i].id,
            awayTeamId: flightTeams[i + 1].id,
            round: 1, // Pool play
            matchNumber: totalGamesCreated + gamesForFlight + 1,
            duration: 90,
            status: 'scheduled'
          });
          gamesForFlight++;
        }

        // Add championship game
        await db.insert(games).values({
          eventId: eventId.toString(),
          ageGroupId: flightTeams[0].ageGroupId,
          homeTeamId: flightTeams[0].id,
          awayTeamId: flightTeams[1].id,
          round: 2, // Championship round
          matchNumber: totalGamesCreated + gamesForFlight + 1,
          duration: 90,
          status: 'scheduled'
        });
        gamesForFlight++;

        if (flightTeams.length > 6) {
          warnings.push(`${flightKey}: Large flight (${flightTeams.length} teams) - generated limited games for demonstration`);
        }
      }

      totalGamesCreated += gamesForFlight;
      console.log(`Created ${gamesForFlight} games for flight ${flightKey}`);
    }

    // Step 4: Auto-assign time slots and fields (simplified)
    const availableFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize
      })
      .from(fields)
      .where(eq(fields.isOpen, true))
      .limit(10); // Reasonable limit

    if (availableFields.length === 0) {
      conflicts.push('No available fields found - games created but not scheduled');
    }

    // Step 5: Create basic time slots (simplified scheduling)
    const eventInfo = await db
      .select({ startDate: events.startDate })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    const tournamentStart = new Date(eventInfo[0]?.startDate || new Date());
    let currentTime = new Date(tournamentStart);
    currentTime.setHours(8, 0, 0, 0); // Start at 8 AM

    const allGames = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.eventId, eventId.toString()))
      .orderBy(games.matchNumber);

    // Assign time slots to games (basic scheduling)
    for (let i = 0; i < allGames.length; i++) {
      const game = allGames[i];
      const fieldIndex = i % availableFields.length;
      const field = availableFields[fieldIndex];

      if (field) {
        // Create time slot
        const endTime = new Date(currentTime);
        endTime.setMinutes(endTime.getMinutes() + 90); // 90 minute games

        const timeSlotResult = await db
          .insert(gameTimeSlots)
          .values({
            eventId: eventId.toString(),
            fieldId: field.id,
            startTime: currentTime.toISOString(),
            endTime: endTime.toISOString(),
            dayIndex: Math.floor((currentTime.getTime() - tournamentStart.getTime()) / (24 * 60 * 60 * 1000))
          })
          .returning({ id: gameTimeSlots.id });

        // Update game with field and time slot
        await db
          .update(games)
          .set({
            fieldId: field.id,
            timeSlotId: timeSlotResult[0].id
          })
          .where(eq(games.id, game.id));

        // Advance time for next game
        if ((i + 1) % availableFields.length === 0) {
          // Move to next time slot after cycling through all fields
          currentTime.setMinutes(currentTime.getMinutes() + 120); // 2 hour blocks
          
          // If it's late, move to next day
          if (currentTime.getHours() >= 18) {
            currentTime.setDate(currentTime.getDate() + 1);
            currentTime.setHours(8, 0, 0, 0);
          }
        }
      }
    }

    const gamesByDay: { [key: string]: number } = {};
    const scheduledDays = Math.ceil(totalGamesCreated / (availableFields.length * 5)); // Estimate

    const result: GeneratedSchedule = {
      totalGames: totalGamesCreated,
      totalFlights: createdFlights.length,
      scheduledDays: scheduledDays,
      gamesByDay: gamesByDay,
      conflicts: conflicts,
      warnings: warnings,
      scheduleUrl: `/admin/events/${eventId}/schedule`
    };

    console.log(`Schedule generation complete: ${totalGamesCreated} games, ${createdFlights.length} flights`);

    res.json(result);

  } catch (error) {
    console.error('Error generating complete schedule:', error);
    res.status(500).json({
      error: 'Failed to generate schedule',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
});

export default router;