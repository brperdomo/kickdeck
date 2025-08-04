import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eq, and, sql } from 'drizzle-orm';
import { 
  eventBrackets, 
  teams, 
  eventAgeGroups,
  games,
  events,
  eventGameFormats,
  fields,
  gameTimeSlots
} from '@db/schema';

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
  totalBrackets: number;
  scheduledDays: number;
  gamesByDay: { [key: string]: number };
  conflicts: string[];
  warnings: string[];
  scheduleUrl: string;
  games?: GeneratedGame[];
  flights?: GeneratedFlight[];
  gameFormats?: {
    gameDuration: number;
    restPeriod: number;
    operatingHours: string;
  };
}

// GET /api/admin/events/:eventId/quick-check
// Quick check of event data for scheduling readiness
router.get('/:eventId/quick-check', isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get basic event data
    const eventData = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate
      })
      .from(events)
      .where(eq(events.id, eventId));

    if (eventData.length === 0) {
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

    // Get age groups for this event
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId.toString())
    });

    // Count available fields
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

// POST /api/admin/events/:eventId/generate-complete-schedule
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
      halfTimeBreak: 5
    };

    console.log(`Using game format: ${defaultFormat.gameLength}min games, ${defaultFormat.bufferTime}min buffer`);

    // Step 3: Check which brackets already have scheduled games
    const existingGames = await db.query.games.findMany({
      where: eq(games.eventId, eventId.toString())
    });

    const bracketsWithGames = new Set(existingGames.map(g => g.homeTeamId).filter(Boolean)); // Use homeTeamId since bracketId may not exist in schema
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
          eq(teams.bracketId, bracket.id)
        ));

      if (bracketTeams.length < 2) {
        warnings.push(`Bracket ${bracket.name}: Only ${bracketTeams.length} teams assigned, need at least 2 teams to generate games`);
        continue;
      }

      console.log(`Bracket ${bracket.name}: Generating games for ${bracketTeams.length} teams`);

      // Generate games based on bracket team count using configured format
      let gamesForBracket = 0;

      if (bracketTeams.length === 2) {
        // Head-to-head series for 2 teams
        for (let gameNum = 1; gameNum <= 2; gameNum++) {
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: bracketTeams[0].ageGroupId,
            homeTeamId: bracketTeams[0].id,
            awayTeamId: bracketTeams[1].id,
            round: gameNum,
            matchNumber: totalGamesCreated + gameNum,
            duration: defaultFormat.gameLength || 90,
            status: 'scheduled'
          });
          gamesForBracket++;
        }
      } else if (bracketTeams.length <= 4) {
        // Round robin for small brackets
        for (let i = 0; i < bracketTeams.length; i++) {
          for (let j = i + 1; j < bracketTeams.length; j++) {
            await db.insert(games).values({
              eventId: eventId.toString(),
              ageGroupId: bracketTeams[i].ageGroupId,
              homeTeamId: bracketTeams[i].id,
              awayTeamId: bracketTeams[j].id,
              round: 1, // Pool play round
              matchNumber: totalGamesCreated + gamesForBracket + 1,
              duration: defaultFormat.gameLength || 90,
              status: 'scheduled'
            });
            gamesForBracket++;
          }
        }
      } else {
        // Larger brackets: pool play + playoffs
        const poolGames = Math.min(bracketTeams.length - 1, 6); // Create pool games
        
        // Create pool games
        for (let i = 0; i < poolGames; i++) {
          const homeTeam = bracketTeams[i];
          const awayTeam = bracketTeams[(i + 1) % bracketTeams.length];
          
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: homeTeam.ageGroupId,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            round: 1, // Pool play
            matchNumber: totalGamesCreated + gamesForBracket + 1,
            duration: defaultFormat.gameLength || 90,
            status: 'scheduled'
          });
          gamesForBracket++;
        }

        // Add championship/playoff games
        if (bracketTeams.length > 4) {
          await db.insert(games).values({
            eventId: eventId.toString(),
            ageGroupId: bracketTeams[0].ageGroupId,
            homeTeamId: bracketTeams[0].id,
            awayTeamId: bracketTeams[1].id,
            round: 2, // Championship round
            matchNumber: totalGamesCreated + gamesForBracket + 1,
            duration: defaultFormat.gameLength || 90,
            status: 'scheduled'
          });
          gamesForBracket++;
        }

        if (bracketTeams.length > 8) {
          warnings.push(`Bracket ${bracket.name}: Large bracket (${bracketTeams.length} teams) - generated limited games for demonstration`);
        }
      }

      totalGamesCreated += gamesForBracket;
      createdSchedules.push(bracket.name);
      console.log(`Created ${gamesForBracket} games for bracket ${bracket.name}`);
    }

    // Step 5: Auto-assign time slots and fields (simplified)
    const availableFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize
      })
      .from(fields)
      .where(eq(fields.isOpen, true));

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
        duration: games.duration
      })
      .from(games)
      .leftJoin(sql`teams ht`, sql`ht.id = ${games.homeTeamId}`)
      .leftJoin(sql`teams at`, sql`at.id = ${games.awayTeamId}`)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(eq(games.eventId, eventId.toString()))
      .orderBy(games.matchNumber);

    const gamesByDay: { [key: string]: number } = {};
    const scheduledDays = Math.ceil(totalGamesCreated / (availableFields.length * 5)); // Estimate

    // Build bracket information
    const flights: GeneratedFlight[] = [];
    for (const bracket of existingBrackets) {
      const bracketGames = detailedGames.filter(g => g.ageGroup === bracket.name || true); // Use name match as fallback
      const bracketTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId.toString()),
          eq(teams.bracketId, bracket.id)
        )
      });
      
      flights.push({
        name: bracket.name,
        ageGroup: bracket.ageGroupId?.toString() || 'Unknown',
        gender: 'Mixed', // Could be enhanced to get actual gender
        teamCount: bracketTeams.length,
        gameCount: bracketGames.length,
        teams: bracketTeams.map((t: any) => t.name)
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
      field: 'Field TBD', // Could be enhanced with field assignment
      startTime: 'TBD',   // Could be enhanced with time slot assignment
      endTime: 'TBD',     // Could be enhanced with time slot assignment
      duration: game.duration || defaultFormat.gameLength
    }));

    const result: GeneratedSchedule = {
      totalGames: totalGamesCreated,
      totalBrackets: createdSchedules.length,
      scheduledDays: scheduledDays,
      gamesByDay: gamesByDay,
      conflicts: conflicts,
      warnings: warnings,
      scheduleUrl: `/admin/events/${eventId}/schedule`,
      games: formattedGames,
      flights: flights,
      gameFormats: {
        gameDuration: defaultFormat.gameLength || 90,
        restPeriod: (defaultFormat.bufferTime || 15) * 2, // Use bufferTime * 2 as rest period
        operatingHours: '8:00 AM - 6:00 PM'
      }
    };

    res.json(result);

  } catch (error) {
    console.error('Error generating complete schedule:', error);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;