import express from 'express';
import { db } from '@db';
import { games, gameScoreAudit, teams, fields, eventBrackets, users } from '@db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requirePermission } from '../../middleware/permissions';

const router = express.Router();

interface GameWithDetails {
  id: number;
  gameNumber: number;
  homeTeamId: number | null;
  homeTeamName: string | null;
  awayTeamId: number | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  fieldId: number | null;
  fieldName: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string;
  scoreEnteredBy: number | null;
  scoreEnteredAt: Date | null;
  scoreNotes: string | null;
  isScoreLocked: boolean;
  bracketName: string | null;
  round: number;
  enteredByName: string | null;
}

// Get all games for an event with scoring information
router.get('/events/:eventId/games', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`[Game Score Management] Fetching games for event ${eventId}`);

    // Simple query without complex joins for now
    const gameResults = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId))
      .orderBy(games.scheduledDate, games.scheduledTime);

    // Transform results to match interface
    const gamesWithDetails: GameWithDetails[] = gameResults.map(game => ({
      id: game.id,
      gameNumber: game.matchNumber,
      homeTeamId: game.homeTeamId,
      homeTeamName: 'TBD', // Will be populated by separate queries
      awayTeamId: game.awayTeamId,
      awayTeamName: 'TBD',
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeYellowCards: game.homeYellowCards,
      awayYellowCards: game.awayYellowCards,
      homeRedCards: game.homeRedCards,
      awayRedCards: game.awayRedCards,
      fieldId: game.fieldId,
      fieldName: null,
      scheduledDate: game.scheduledDate ? game.scheduledDate.toString() : null,
      scheduledTime: game.scheduledTime ? game.scheduledTime.toString() : null,
      status: game.status,
      scoreEnteredBy: game.scoreEnteredBy,
      scoreEnteredAt: game.scoreEnteredAt,
      scoreNotes: game.scoreNotes,
      isScoreLocked: game.isScoreLocked,
      bracketName: null,
      round: game.round,
      enteredByName: null,
    }));

    console.log(`[Game Score Management] Found ${gamesWithDetails.length} games`);
    res.json({ success: true, games: gamesWithDetails });

  } catch (error) {
    console.error('[Game Score Management] Error fetching games:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update game score with audit trail
router.post('/games/:gameId/score', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { 
      homeScore, 
      awayScore, 
      homeYellowCards = 0, 
      awayYellowCards = 0, 
      homeRedCards = 0, 
      awayRedCards = 0, 
      notes, 
      forceOverride = false 
    } = req.body;

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`[Score Update] Game ${gameId} - Home: ${homeScore}, Away: ${awayScore}`);

    // Get current game state
    const currentGame = await db
      .select()
      .from(games)
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);

    if (currentGame.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = currentGame[0];

    // Check if score is locked
    if (game.isScoreLocked && !forceOverride) {
      return res.status(403).json({ 
        error: 'Score is locked',
        locked: true,
        message: 'This score has been locked and cannot be modified without override permission.'
      });
    }

    // Store previous values for audit
    const previousValues = {
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeYellowCards: game.homeYellowCards,
      awayYellowCards: game.awayYellowCards,
      homeRedCards: game.homeRedCards,
      awayRedCards: game.awayRedCards,
    };

    // Update the game
    await db
      .update(games)
      .set({
        homeScore: parseInt(homeScore) || null,
        awayScore: parseInt(awayScore) || null,
        homeYellowCards: parseInt(homeYellowCards) || 0,
        awayYellowCards: parseInt(awayYellowCards) || 0,
        homeRedCards: parseInt(homeRedCards) || 0,
        awayRedCards: parseInt(awayRedCards) || 0,
        scoreEnteredBy: user.id,
        scoreEnteredAt: new Date(),
        scoreNotes: notes || null,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(games.id, parseInt(gameId)));

    // Create audit entry
    await db.insert(gameScoreAudit).values({
      gameId: parseInt(gameId),
      homeScore: parseInt(homeScore) || null,
      awayScore: parseInt(awayScore) || null,
      homeYellowCards: parseInt(homeYellowCards) || 0,
      awayYellowCards: parseInt(awayYellowCards) || 0,
      homeRedCards: parseInt(homeRedCards) || 0,
      awayRedCards: parseInt(awayRedCards) || 0,
      changeType: forceOverride ? 'override' : 'update',
      notes: notes || null,
      isOverride: forceOverride,
      previousValues: previousValues,
      userRole: user.role || 'admin',
      enteredBy: user.id,
      enteredByName: `${user.firstName} ${user.lastName}`,
      enteredByEmail: user.email,
    });

    console.log(`[Score Update] Successfully updated game ${gameId}`);
    res.json({ 
      success: true, 
      message: 'Score updated successfully',
      gameId: parseInt(gameId)
    });

  } catch (error) {
    console.error('[Score Update] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get audit history for a game
router.get('/games/:gameId/audit-history', async (req, res) => {
  try {
    const { gameId } = req.params;

    const auditEntries = await db
      .select()
      .from(gameScoreAudit)
      .where(eq(gameScoreAudit.gameId, parseInt(gameId)))
      .orderBy(desc(gameScoreAudit.enteredAt));

    res.json({ success: true, history: auditEntries });

  } catch (error) {
    console.error('[Audit History] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit history' 
    });
  }
});

// Lock/unlock game score
router.post('/games/:gameId/lock', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { locked, reason } = req.body;
    const user = (req as any).user;

    await db
      .update(games)
      .set({
        isScoreLocked: locked,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(games.id, parseInt(gameId)));

    // Create audit entry for lock/unlock
    await db.insert(gameScoreAudit).values({
      gameId: parseInt(gameId),
      changeType: locked ? 'lock' : 'unlock',
      notes: reason,
      userRole: user?.role || 'admin',
      enteredBy: user?.id,
      enteredByName: user ? `${user.firstName} ${user.lastName}` : 'System',
      enteredByEmail: user?.email,
    });

    res.json({ 
      success: true, 
      message: `Score ${locked ? 'locked' : 'unlocked'} successfully` 
    });

  } catch (error) {
    console.error('[Lock/Unlock] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update lock status' 
    });
  }
});

// Bulk operations
router.post('/bulk-operations', async (req, res) => {
  try {
    const { operation, gameIds, reason } = req.body;
    const user = (req as any).user;

    console.log(`[Bulk Operation] ${operation} on ${gameIds.length} games`);

    for (const gameId of gameIds) {
      switch (operation) {
        case 'lock':
          await db
            .update(games)
            .set({ isScoreLocked: true })
            .where(eq(games.id, gameId));
          break;
        case 'unlock':
          await db
            .update(games)
            .set({ isScoreLocked: false })
            .where(eq(games.id, gameId));
          break;
        case 'clear_scores':
          await db
            .update(games)
            .set({ 
              homeScore: null, 
              awayScore: null,
              homeYellowCards: 0,
              awayYellowCards: 0,
              homeRedCards: 0,
              awayRedCards: 0,
              status: 'scheduled'
            })
            .where(eq(games.id, gameId));
          break;
      }

      // Create audit entry
      await db.insert(gameScoreAudit).values({
        gameId: gameId,
        changeType: operation,
        notes: reason,
        userRole: user?.role || 'admin',
        enteredBy: user?.id,
        enteredByName: user ? `${user.firstName} ${user.lastName}` : 'System',
        enteredByEmail: user?.email,
      });
    }

    res.json({ 
      success: true, 
      message: `Bulk operation ${operation} completed successfully`,
      affectedGames: gameIds.length
    });

  } catch (error) {
    console.error('[Bulk Operations] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform bulk operation' 
    });
  }
});

export default router;