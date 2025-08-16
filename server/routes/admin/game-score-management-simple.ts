import express from 'express';
import { db } from '@db';
import { games, teams, fields, eventAgeGroups } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const router = express.Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// Get all games for an event with scoring information - SIMPLIFIED VERSION
router.get('/events/:eventId/games', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`[Game Score Management Simple] Fetching games for event ${eventId}`);

    // Get games with team names and field information
    const gameResults = await db
      .select({
        id: games.id,
        matchNumber: games.matchNumber,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamName: homeTeamTable.name,
        awayTeamName: awayTeamTable.name,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        homeYellowCards: games.homeYellowCards,
        awayYellowCards: games.awayYellowCards,
        homeRedCards: games.homeRedCards,
        awayRedCards: games.awayRedCards,
        fieldId: games.fieldId,
        fieldName: fields.name,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        status: games.status,
        scoreEnteredBy: games.scoreEnteredBy,
        scoreEnteredAt: games.scoreEnteredAt,
        scoreNotes: games.scoreNotes,
        isScoreLocked: games.isScoreLocked,
        round: games.round,
        ageGroupId: games.ageGroupId,
        groupId: games.groupId
      })
      .from(games)
      .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
      .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(eq(games.eventId, parseInt(eventId)))
      .orderBy(games.scheduledDate, games.scheduledTime);

    console.log(`[Game Score Management Simple] Found ${gameResults.length} games`);

    // Get age group information
    const ageGroups = await db
      .select({
        id: eventAgeGroups.id,
        name: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        divisionCode: eventAgeGroups.divisionCode
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, parseInt(eventId)));

    // Create age group lookup
    const ageGroupMap = new Map();
    ageGroups.forEach(ag => {
      ageGroupMap.set(ag.id, `${ag.name} ${ag.gender || ''} ${ag.divisionCode || ''}`.trim());
    });

    // Format games with bracket names
    const formattedGames = gameResults.map(game => ({
      id: game.id,
      gameNumber: game.matchNumber || game.id,
      homeTeamId: game.homeTeamId,
      homeTeamName: game.homeTeamName || 'TBD',
      awayTeamId: game.awayTeamId,
      awayTeamName: game.awayTeamName || 'TBD',
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeYellowCards: game.homeYellowCards || 0,
      awayYellowCards: game.awayYellowCards || 0,
      homeRedCards: game.homeRedCards || 0,
      awayRedCards: game.awayRedCards || 0,
      fieldId: game.fieldId,
      fieldName: game.fieldName || 'Field TBD',
      scheduledDate: game.scheduledDate,
      scheduledTime: game.scheduledTime,
      status: game.status || 'scheduled',
      scoreEnteredBy: game.scoreEnteredBy,
      scoreEnteredAt: game.scoreEnteredAt,
      scoreNotes: game.scoreNotes,
      isScoreLocked: game.isScoreLocked || false,
      bracketName: ageGroupMap.get(game.ageGroupId) || 'Unknown',
      round: game.round || 1,
      enteredByName: null // Will be populated if needed
    }));

    console.log(`[Game Score Management Simple] Returning ${formattedGames.length} formatted games`);

    res.json({
      success: true,
      games: formattedGames,
      totalGames: formattedGames.length
    });

  } catch (error) {
    console.error('[Game Score Management Simple] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update game score
router.put('/games/:gameId/score', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { homeScore, awayScore, homeYellowCards, awayYellowCards, homeRedCards, awayRedCards, scoreNotes } = req.body;

    console.log(`[Game Score Management Simple] Updating score for game ${gameId}`);

    await db
      .update(games)
      .set({
        homeScore: parseInt(homeScore) || 0,
        awayScore: parseInt(awayScore) || 0,
        homeYellowCards: parseInt(homeYellowCards) || 0,
        awayYellowCards: parseInt(awayYellowCards) || 0,
        homeRedCards: parseInt(homeRedCards) || 0,
        awayRedCards: parseInt(awayRedCards) || 0,
        scoreNotes: scoreNotes || null,
        status: 'completed',
        scoreEnteredAt: new Date(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)));

    console.log(`[Game Score Management Simple] Score updated for game ${gameId}`);

    res.json({
      success: true,
      message: 'Score updated successfully'
    });

  } catch (error) {
    console.error('[Game Score Management Simple] Error updating score:', error);
    res.status(500).json({ 
      error: 'Failed to update score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;