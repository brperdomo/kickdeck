import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, fields, eventBrackets, gameTimeSlots } from '@db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

const router = Router();

// GET /api/public/game-cards/:eventId - Get all games for game cards generation (no auth required)
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Game Cards] Fetching games for event ${eventId}`);

    // First get all age groups for this event
    const eventAgeGroups = await db
      .select({ ageGroupId: eventBrackets.ageGroupId })
      .from(eventBrackets)
      .where(eq(eventBrackets.eventId, eventId));

    const ageGroupIds = eventAgeGroups.map(ag => ag.ageGroupId);

    // Get all UNIQUE games for these age groups (avoiding duplicates from multiple brackets)
    const allGames = await db
      .selectDistinct({
        id: games.id,
        gameNumber: games.matchNumber,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        status: games.status,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        round: games.round,
        ageGroupId: games.ageGroupId
      })
      .from(games)
      .where(inArray(games.ageGroupId, ageGroupIds));

    // Get team names, field names, etc. separately
    const gamesResults = await Promise.all(
      allGames.map(async (game) => {
        const [homeTeam, awayTeam, field, timeSlot, bracket] = await Promise.all([
          game.homeTeamId ? db.query.teams.findFirst({ where: eq(teams.id, game.homeTeamId) }) : null,
          game.awayTeamId ? db.query.teams.findFirst({ where: eq(teams.id, game.awayTeamId) }) : null,
          game.fieldId ? db.query.fields.findFirst({ where: eq(fields.id, game.fieldId) }) : null,
          game.timeSlotId ? db.query.gameTimeSlots.findFirst({ where: eq(gameTimeSlots.id, game.timeSlotId) }) : null,
          db.query.eventBrackets.findFirst({ where: eq(eventBrackets.ageGroupId, game.ageGroupId) })
        ]);

        return {
          ...game,
          homeTeamName: homeTeam?.name || 'TBD',
          awayTeamName: awayTeam?.name || 'TBD',
          fieldName: field?.name || 'TBD',
          scheduledTime: timeSlot?.startTime || null,
          bracketName: bracket?.name || 'No Flight'
        };
      })
    );

    console.log(`[Game Cards] Found ${gamesResults.length} games`);
    console.log(`[Game Cards] Age Groups: ${ageGroupIds.length}, Raw Games: ${allGames.length}`);

    // Transform the data for frontend consumption
    const gamesData = gamesResults.map(game => ({
      id: game.id,
      gameNumber: game.gameNumber,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeTeamName: game.homeTeamName,
      awayTeamName: game.awayTeamName,
      fieldId: game.fieldId,
      fieldName: game.fieldName,
      scheduledTime: game.scheduledTime,
      status: game.status || 'scheduled',
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      round: game.round,
      bracketName: game.bracketName
    }));

    res.json(gamesData);

  } catch (error) {
    console.error('[Game Cards] Error fetching games:', error);
    res.status(500).json({ 
      error: 'Failed to fetch games for game cards',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;