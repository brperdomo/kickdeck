import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@db';
import { games, teams, fields, eventAgeGroups } from '@db/schema';

const router = Router();

// GET /api/public/games/:gameId - Get public game information
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    // Get game data
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

    // Get additional data with proper Drizzle ORM queries
    const [homeTeamData, awayTeamData, fieldData, ageGroupData] = await Promise.all([
      gameData.homeTeamId ? db.select({ name: teams.name }).from(teams).where(eq(teams.id, gameData.homeTeamId)).limit(1) : Promise.resolve([]),
      gameData.awayTeamId ? db.select({ name: teams.name }).from(teams).where(eq(teams.id, gameData.awayTeamId)).limit(1) : Promise.resolve([]),
      gameData.fieldId ? db.select({ name: fields.name }).from(fields).where(eq(fields.id, gameData.fieldId)).limit(1) : Promise.resolve([]),
      gameData.ageGroupId ? db.select({ ageGroup: eventAgeGroups.ageGroup }).from(eventAgeGroups).where(eq(eventAgeGroups.id, gameData.ageGroupId)).limit(1) : Promise.resolve([])
    ]);

    const game = {
      id: gameData.id,
      homeTeam: {
        id: gameData.homeTeamId,
        name: homeTeamData[0]?.name || 'TBD'
      },
      awayTeam: {
        id: gameData.awayTeamId,
        name: awayTeamData[0]?.name || 'TBD'
      },
      homeScore: gameData.homeScore,
      awayScore: gameData.awayScore,
      startTime: `${gameData.scheduledDate} ${gameData.scheduledTime}`,
      field: {
        name: fieldData[0]?.name || 'Field TBD'
      },
      status: gameData.status || 'scheduled',
      ageGroup: {
        ageGroup: ageGroupData[0]?.ageGroup || 'Age Group'
      },
      isCompleted: gameData.status === 'completed',
      isScoreLocked: gameData.isScoreLocked || false,
      qrCodeUrl: `${req.protocol}://${req.get('host')}/game/${gameData.id}`
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

    // Validate scores
    if (typeof homeScore !== 'number' || typeof awayScore !== 'number' ||
        homeScore < 0 || awayScore < 0) {
      return res.status(400).json({ error: 'Invalid scores. Scores must be non-negative numbers.' });
    }

    // Check if game exists and is not locked
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

    // Update the game score
    await db
      .update(games)
      .set({
        homeScore,
        awayScore,
        status: 'completed',
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)));

    // Trigger standings recalculation via public endpoint
    try {
      const standingsResponse = await fetch(`http://localhost:5000/api/public/standings/${gameCheck.eventId}/recalculate`, {
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