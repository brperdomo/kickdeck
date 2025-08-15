import { Router } from 'express';
import { db } from '../../../db';
import { events, teams, fields, complexes, gameTimeSlots, games, eventBrackets, eventAgeGroups, eventFieldConfigurations } from '../../../db/schema';
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

interface GeneratedGame {
  id: number;
  homeTeam: string;
  awayTeam: string;
  ageGroup: string;
  gender: string;
  round: number;
  field: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface GeneratedFlight {
  name: string;
  ageGroup: string;
  gender: string;
  teamCount: number;
  gameCount: number;
  teams: string[];
}

interface GeneratedSchedule {
  totalGames: number;
  totalFlights: number;
  scheduledDays: number;
  gamesByDay: { [key: string]: number };
  conflicts: string[];
  warnings: string[];
  scheduleUrl: string;
  games: GeneratedGame[];
  flights: GeneratedFlight[];
  gameFormats: {
    gameDuration: number;
    restPeriod: number;
    operatingHours: string;
  };
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

// Tournament-Aware automated schedule generation - integrates with existing workflow
router.post('/:eventId/generate-complete-schedule', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { autoMode = true } = req.body;

    console.log(`Starting tournament-aware schedule generation for event ${eventId}`);

    // Step 1: Check existing brackets/flights (from Create Brackets workflow step)
    const existingBrackets = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId.toString())
    });

    if (existingBrackets.length === 0) {
      return res.status(400).json({
        error: 'No brackets configured',
        message: 'Please complete the Game Formats → Flight Assignment → Create Brackets workflow steps first. Then use this Tournament-Aware Auto Scheduler to generate the schedule.'
      });
    }

    console.log(`Found ${existingBrackets.length} existing brackets from workflow`);

    // Step 2: Get game format configurations for this event
    const gameFormats = await db.query.eventGameFormats.findMany({
      where: eq(eventGameFormats.eventId, eventId)
    });

    const defaultFormat = gameFormats[0] || {
      gameLength: 90,
      bufferTime: 15,
      restPeriod: 60,
      maxGamesPerDay: 3
    };

    console.log(`Using game format: ${defaultFormat.gameLength}min games, ${defaultFormat.restPeriod}min rest`);

    // Step 3: Check which brackets already have scheduled games
    const existingGames = await db.query.games.findMany({
      where: eq(games.eventId, eventId.toString())
    });

    const bracketsWithGames = new Set(existingGames.map(g => g.bracketId).filter(Boolean));
    const bracketsNeedingSchedules = existingBrackets.filter(b => !bracketsWithGames.has(b.id));

    if (bracketsNeedingSchedules.length === 0) {
      return res.status(200).json({
        message: 'All brackets already have schedules',
        totalGames: existingGames.length,
        totalBrackets: existingBrackets.length,
        warnings: ['All configured brackets already have games scheduled. No new games created.']
      });
    }

    console.log(`${bracketsNeedingSchedules.length} brackets need schedules, ${bracketsWithGames.size} already scheduled`);

    // Step 4: Generate games for brackets that need schedules
    let totalGamesCreated = 0;
    const createdSchedules: string[] = [];
    const warnings: string[] = [];
    const conflicts: string[] = [];

    for (const bracket of bracketsNeedingSchedules) {
      console.log(`Processing bracket: ${bracket.name} (ID: ${bracket.id})`);

      // Get teams assigned to this bracket
      const bracketTeams = await db
        .select({
          id: teams.id,
          name: teams.name,
          ageGroupId: teams.ageGroupId
        })
        .from(teams)
        .where(and(
          eq(teams.eventId, eventId.toString()),
          eq(teams.status, 'approved'),
          eq(teams.flightId, bracket.id)
        ));

      if (bracketTeams.length < 2) {
        warnings.push(`Bracket ${bracket.name}: Only ${bracketTeams.length} teams assigned, need at least 2 teams to generate games`);
        continue;
      }

      console.log(`Bracket ${bracket.name}: Generating games for ${bracketTeams.length} teams`);

      // Generate games based on bracket team count using configured format
      let gamesForBracket = 0;

      if (bracketTeams.length === 2) {
        // Best of 3 for 2 teams
        for (let gameNum = 1; gameNum <= 3; gameNum++) {
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: bracketTeams[0].ageGroupId,
            homeTeamId: bracketTeams[0].id,
            awayTeamId: bracketTeams[1].id,
            round: gameNum,
            matchNumber: totalGamesCreated + gameNum,
            duration: 90, // Default 90 minutes
            status: 'scheduled'
          });
          gamesForBracket++;
        }
      } else if (bracketTeams.length <= 4) {
        // Round robin for small flights
        for (let i = 0; i < bracketTeams.length; i++) {
          for (let j = i + 1; j < bracketTeams.length; j++) {
            await db.insert(games).values({
              eventId: eventId.toString(),
              ageGroupId: bracketTeams[i].ageGroupId,
              homeTeamId: bracketTeams[i].id,
              awayTeamId: bracketTeams[j].id,
              round: 1, // Pool play round
              matchNumber: totalGamesCreated + gamesForBracket + 1,
              duration: 90,
              status: 'scheduled'
            });
            gamesForBracket++;
          }
        }
      } else {
        // Larger flights: Generate complete round-robin schedule
        console.log(`Generating complete round-robin schedule for ${bracketTeams.length} teams`);
        
        // Create ALL round-robin pool games (every team plays every other team)
        for (let i = 0; i < bracketTeams.length; i++) {
          for (let j = i + 1; j < bracketTeams.length; j++) {
            await db.insert(games).values({
              eventId: eventId.toString(),
              ageGroupId: bracketTeams[i].ageGroupId,
              homeTeamId: bracketTeams[i].id,
              awayTeamId: bracketTeams[j].id,
              round: 1, // Pool play round
              matchNumber: totalGamesCreated + gamesForBracket + 1,
              duration: 90,
              status: 'scheduled'
            });
            gamesForBracket++;
          }
        }

        // Generate playoff/knockout games for top teams
        if (bracketTeams.length >= 4) {
          // Semifinals (top 4 teams based on seeding)
          const topTeams = bracketTeams.slice(0, 4);
          
          // Semifinal 1: 1st seed vs 4th seed
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: topTeams[0].ageGroupId,
            homeTeamId: topTeams[0].id,
            awayTeamId: topTeams[3].id,
            round: 2, // Semifinal round
            matchNumber: totalGamesCreated + gamesForBracket + 1,
            duration: 90,
            status: 'scheduled'
          });
          gamesForBracket++;

          // Semifinal 2: 2nd seed vs 3rd seed  
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: topTeams[1].ageGroupId,
            homeTeamId: topTeams[1].id,
            awayTeamId: topTeams[2].id,
            round: 2, // Semifinal round
            matchNumber: totalGamesCreated + gamesForBracket + 1,
            duration: 90,
            status: 'scheduled'
          });
          gamesForBracket++;

          // Championship final (TBD teams from semifinals)
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: topTeams[0].ageGroupId,
            homeTeamId: null, // TBD - winner of semifinal 1
            awayTeamId: null, // TBD - winner of semifinal 2
            round: 3, // Championship round
            matchNumber: totalGamesCreated + gamesForBracket + 1,
            duration: 90,
            status: 'scheduled'
          });
          gamesForBracket++;

          // 3rd place game (TBD teams from semifinals)
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: topTeams[0].ageGroupId,
            homeTeamId: null, // TBD - loser of semifinal 1
            awayTeamId: null, // TBD - loser of semifinal 2
            round: 3, // 3rd place round
            matchNumber: totalGamesCreated + gamesForBracket + 1,
            duration: 90,
            status: 'scheduled'
          });
          gamesForBracket++;
        }

        console.log(`Generated complete schedule: ${gamesForBracket} games for ${bracketTeams.length} teams`);
      }

      totalGamesCreated += gamesForBracket;
      console.log(`Created ${gamesForBracket} games for bracket ${bracket.name}`);
    }

    // Step 4: Auto-assign time slots and fields using event-specific field configurations
    const availableFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: sql`COALESCE(${eventFieldConfigurations.fieldSize}, ${fields.fieldSize})`.as('fieldSize'),
        sortOrder: sql`COALESCE(${eventFieldConfigurations.sortOrder}, 999)`.as('sortOrder')
      })
      .from(fields)
      .leftJoin(eventFieldConfigurations, and(
        eq(eventFieldConfigurations.fieldId, fields.id),
        eq(eventFieldConfigurations.eventId, eventId)
      ))
      .where(and(
        eq(fields.isOpen, true),
        sql`COALESCE(${eventFieldConfigurations.isActive}, true) = true`
      ))
      .orderBy(sql`COALESCE(${eventFieldConfigurations.sortOrder}, 999)`);

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

    // Get detailed game information for display
    const detailedGames = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamName: sql<string>`ht.name`.as('homeTeamName'),
        awayTeamName: sql<string>`at.name`.as('awayTeamName'),
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        round: games.round,
        duration: games.duration,
        fieldId: games.fieldId,
        fieldName: sql<string>`f.name`.as('fieldName'),
        timeSlotId: games.timeSlotId,
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime
      })
      .from(games)
      .leftJoin(sql`teams ht`, sql`ht.id = ${games.homeTeamId}`)
      .leftJoin(sql`teams at`, sql`at.id = ${games.awayTeamId}`)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .leftJoin(sql`fields f`, sql`f.id = ${games.fieldId}`)
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .where(eq(games.eventId, eventId.toString()))
      .orderBy(games.matchNumber);

    const gamesByDay: { [key: string]: number } = {};
    const scheduledDays = Math.ceil(totalGamesCreated / (availableFields.length * 5)); // Estimate

    // Build flight information
    const flights: GeneratedFlight[] = [];
    for (const [flightKey, flightTeams] of flightGroups.entries()) {
      const [ageGroup, gender] = flightKey.split('_');
      const flightGames = detailedGames.filter(g => g.ageGroup === ageGroup && g.gender === gender);
      
      flights.push({
        name: `${ageGroup} ${gender} Flight`,
        ageGroup: ageGroup,
        gender: gender,
        teamCount: flightTeams.length,
        gameCount: flightGames.length,
        teams: flightTeams.map((t: any) => t.name)
      });
    }

    // Format games for frontend display
    const formattedGames: GeneratedGame[] = detailedGames.map(game => ({
      id: game.gameId,
      homeTeam: game.homeTeamName || 'TBD',
      awayTeam: game.awayTeamName || 'TBD',
      ageGroup: game.ageGroup || 'Unknown',
      gender: game.gender || 'Mixed',
      round: game.round || 1,
      field: game.fieldName || 'Field TBD',
      startTime: game.startTime || 'TBD',
      endTime: game.endTime || 'TBD',
      duration: game.duration || 90
    }));

    const result: GeneratedSchedule = {
      totalGames: totalGamesCreated,
      totalFlights: createdFlights.length,
      scheduledDays: scheduledDays,
      gamesByDay: gamesByDay,
      conflicts: conflicts,
      warnings: warnings,
      scheduleUrl: `/admin/events/${eventId}/schedule`,
      games: formattedGames,
      flights: flights,
      gameFormats: {
        gameDuration: 90, // Default values - could be enhanced to read from event settings
        restPeriod: 30,
        operatingHours: '8:00 AM - 8:00 PM'
      }
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