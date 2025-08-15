import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@db';
import { games } from '@db/schema';

const router = Router();

// GET /api/public/games/:gameId - Get public game information
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    // Use Drizzle ORM properly
    const gameResult = await db
      .select({
        id: games.id,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        status: games.status,
        isScoreLocked: games.isScoreLocked,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        fieldId: games.fieldId,
        ageGroupId: games.ageGroupId,
        eventId: games.eventId
      })
      .from(games)
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);
    
    if (gameResult.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const gameData = gameResult[0];

    // Get additional data with separate queries to avoid join issues
    const [homeTeamResult, awayTeamResult, fieldResult, ageGroupResult] = await Promise.all([
      gameData.homeTeamId ? db.execute(`SELECT name FROM teams WHERE id = ${gameData.homeTeamId}`) : Promise.resolve({ rows: [] }),
      gameData.awayTeamId ? db.execute(`SELECT name FROM teams WHERE id = ${gameData.awayTeamId}`) : Promise.resolve({ rows: [] }),
      gameData.fieldId ? db.execute(`SELECT f.name FROM fields f JOIN event_field_configurations efc ON f.id = efc.field_id WHERE efc.field_id = ${gameData.fieldId} AND efc.event_id = ${gameData.eventId}`) : Promise.resolve({ rows: [] }),
      gameData.ageGroupId ? db.execute(`SELECT age_group FROM event_age_groups WHERE id = ${gameData.ageGroupId}`) : Promise.resolve({ rows: [] })
    ]);

    const result = {
      rows: [{
        ...gameData,
        home_team_name: homeTeamResult.rows?.[0]?.name || 'TBD',
        away_team_name: awayTeamResult.rows?.[0]?.name || 'TBD', 
        field_name: fieldResult.rows?.[0]?.name || 'Field TBD',
        age_group_name: ageGroupResult.rows?.[0]?.age_group || 'Age Group'
      }]
    };

    const finalGameData = result.rows[0];

    const game = {
      id: gameData.id,
      homeTeam: {
        id: gameData.home_team_id,
        name: gameData.home_team_name || 'TBD'
      },
      awayTeam: {
        id: gameData.away_team_id,
        name: gameData.away_team_name || 'TBD'
      },
      homeScore: gameData.home_score,
      awayScore: gameData.away_score,
      startTime: `${gameData.scheduledDate} ${gameData.scheduledTime}`,
      field: {
        name: gameData.field_name || 'Field TBD'
      },
      status: gameData.status || 'scheduled',
      ageGroup: {
        ageGroup: gameData.age_group_name || 'Age Group'
      },
      isCompleted: gameData.status === 'completed',
      isScoreLocked: gameData.is_score_locked || false
    };

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/public/games/:gameId/score - Update game score (open submission)
router.post('/:gameId/score', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { homeScore, awayScore } = req.body;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || 
        homeScore < 0 || awayScore < 0) {
      return res.status(400).json({ error: 'Invalid scores. Scores must be non-negative numbers.' });
    }

    // Check if game exists and is not locked using Drizzle
    const gameCheckResult = await db
      .select({
        id: games.id,
        isScoreLocked: games.isScoreLocked,
        status: games.status,
        eventId: games.eventId
      })
      .from(games)
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);

    if (gameCheckResult.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const gameCheck = gameCheckResult[0];
    if (gameCheck.isScoreLocked) {
      return res.status(403).json({ 
        error: 'This game\'s score has been locked by tournament administrators. Contact event staff to make changes.' 
      });
    }

    // Update the game score using Drizzle ORM
    await db
      .update(games)
      .set({
        homeScore,
        awayScore,
        status: 'completed',
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)));

    // Trigger standings recalculation
    try {
      const standingsResponse = await fetch(`http://localhost:5000/api/admin/events/${gameCheck.eventId}/standings/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (standingsResponse.ok) {
        console.log(`[STANDINGS] Recalculated standings for event ${gameCheck.eventId} after game ${gameId} score update`);
      }
    } catch (standingsError) {
      console.warn(`[STANDINGS] Failed to recalculate standings: ${standingsError.message}`);
      // Don't fail the score update if standings calculation fails
    }

    // Log the score update
    console.log(`[PUBLIC SCORE UPDATE] Game ${gameId}: ${homeScore}-${awayScore} (IP: ${req.ip})`);

    res.json({ 
      success: true, 
      message: 'Score updated successfully',
      gameId: parseInt(gameId),
      homeScore,
      awayScore
    });

  } catch (error) {
    console.error('Error updating game score:', error);
    res.status(500).json({ error: 'Failed to update score. Please try again.' });
  }
});

export default router;