import express from 'express';
import { db } from '@db';
import { games, gameScoreAudit, teams, fields, gameTimeSlots, eventBrackets, users } from '@db/schema';
import { eq, and, desc, isNull, isNotNull, sql } from 'drizzle-orm';
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
    const { status, bracket, locked } = req.query;

    console.log(`[Game Score Management] Fetching games for event ${eventId}`);

    // Build the query with joins and aliases
    const homeTeam = teams;
    const awayTeam = teams;
    const scoreUser = users;
    
    let baseQuery = db
      .select({
        id: games.id,
        gameNumber: games.matchNumber,
        homeTeamId: games.homeTeamId,
        homeTeamName: sql<string>`COALESCE(teams.name, 'TBD')`,
        awayTeamId: games.awayTeamId,
        awayTeamName: sql<string>`'TBD'`,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        homeYellowCards: games.homeYellowCards,
        awayYellowCards: games.awayYellowCards,
        homeRedCards: games.homeRedCards,
        awayRedCards: games.awayRedCards,
        fieldId: games.fieldId,
        fieldName: sql<string>`COALESCE(fields.name, 'TBD')`,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        status: games.status,
        scoreEnteredBy: games.scoreEnteredBy,
        scoreEnteredAt: games.scoreEnteredAt,
        scoreNotes: games.scoreNotes,
        isScoreLocked: games.isScoreLocked,
        bracketName: sql<string>`COALESCE(event_brackets.name, 'General')`,
        round: games.round,
        enteredByName: sql<string>`COALESCE(users."firstName" || ' ' || users."lastName", 'System')`,
      })
      .from(games)
      .leftJoin(teams, eq(games.homeTeamId, teams.id))
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(eventBrackets, eq(games.groupId, eventBrackets.id))
      .leftJoin(users, eq(games.scoreEnteredBy, users.id))
      .where(eq(games.eventId, eventId));

    // Apply filters
    if (status && status !== 'all') {
      if (status === 'scored') {
        query = query.where(and(eq(games.eventId, eventId), isNotNull(games.homeScore), isNotNull(games.awayScore)));
      } else if (status === 'unscored') {
        query = query.where(and(eq(games.eventId, eventId), isNull(games.homeScore)));
      } else {
        query = query.where(and(eq(games.eventId, eventId), eq(games.status, status as string)));
      }
    }

    if (locked === 'true') {
      query = query.where(and(eq(games.eventId, eventId), eq(games.isScoreLocked, true)));
    } else if (locked === 'false') {
      query = query.where(and(eq(games.eventId, eventId), eq(games.isScoreLocked, false)));
    }

    // Execute query
    const gamesData = await query.orderBy(games.scheduledDate, games.scheduledTime, games.matchNumber);

    console.log(`[Game Score Management] Found ${gamesData.length} games`);

    res.json({
      success: true,
      games: gamesData,
      total: gamesData.length
    });

  } catch (error) {
    console.error('[Game Score Management] Error fetching games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get score audit history for a specific game
router.get('/games/:gameId/audit-history', async (req, res) => {
  try {
    const { gameId } = req.params;

    console.log(`[Game Score Management] Fetching audit history for game ${gameId}`);

    const auditHistory = await db
      .select({
        id: gameScoreAudit.id,
        homeScore: gameScoreAudit.homeScore,
        awayScore: gameScoreAudit.awayScore,
        homeYellowCards: gameScoreAudit.homeYellowCards,
        awayYellowCards: gameScoreAudit.awayYellowCards,
        homeRedCards: gameScoreAudit.homeRedCards,
        awayRedCards: gameScoreAudit.awayRedCards,
        changeType: gameScoreAudit.changeType,
        notes: gameScoreAudit.notes,
        isOverride: gameScoreAudit.isOverride,
        previousValues: gameScoreAudit.previousValues,
        userRole: gameScoreAudit.userRole,
        enteredAt: gameScoreAudit.enteredAt,
        enteredByName: sql<string>`users.firstName || ' ' || users.lastName`,
        enteredByEmail: users.email,
      })
      .from(gameScoreAudit)
      .leftJoin(users, eq(gameScoreAudit.enteredBy, users.id))
      .where(eq(gameScoreAudit.gameId, parseInt(gameId)))
      .orderBy(desc(gameScoreAudit.enteredAt));

    console.log(`[Game Score Management] Found ${auditHistory.length} audit entries`);

    res.json({
      success: true,
      history: auditHistory
    });

  } catch (error) {
    console.error('[Game Score Management] Error fetching audit history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit or update a game score
router.post('/games/:gameId/score', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { homeScore, awayScore, homeYellowCards = 0, awayYellowCards = 0, homeRedCards = 0, awayRedCards = 0, notes, forceOverride = false } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role || 'unknown';

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Validate scores
    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
      return res.status(400).json({
        success: false,
        error: 'Scores must be between 0 and 20'
      });
    }

    console.log(`[Game Score Management] Updating score for game ${gameId}: ${homeScore}-${awayScore} by user ${userId}`);

    // Get current game data
    const [currentGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, parseInt(gameId)));

    if (!currentGame) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Check if score is locked
    if (currentGame.isScoreLocked && !forceOverride) {
      return res.status(400).json({
        success: false,
        error: 'Score is locked. Use force override to change.',
        requiresOverride: true
      });
    }

    // Determine change type
    let changeType = 'initial_entry';
    let isOverride = false;
    const hasExistingScore = currentGame.homeScore !== null && currentGame.awayScore !== null;

    if (hasExistingScore) {
      if (forceOverride || currentGame.status === 'completed') {
        changeType = 'override';
        isOverride = true;
      } else {
        changeType = 'score_update';
      }
    }

    // Store previous values for audit
    const previousValues = {
      homeScore: currentGame.homeScore,
      awayScore: currentGame.awayScore,
      homeYellowCards: currentGame.homeYellowCards,
      awayYellowCards: currentGame.awayYellowCards,
      homeRedCards: currentGame.homeRedCards,
      awayRedCards: currentGame.awayRedCards,
      status: currentGame.status,
      scoreNotes: currentGame.scoreNotes,
    };

    // Determine new status
    let newStatus = 'completed';
    if (isOverride) {
      newStatus = 'overridden';
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update the game
      await tx
        .update(games)
        .set({
          homeScore,
          awayScore,
          homeYellowCards,
          awayYellowCards,
          homeRedCards,
          awayRedCards,
          status: newStatus,
          scoreEnteredBy: userId,
          scoreEnteredAt: new Date(),
          scoreNotes: notes || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(games.id, parseInt(gameId)));

      // Create audit trail entry
      await tx
        .insert(gameScoreAudit)
        .values({
          gameId: parseInt(gameId),
          homeScore,
          awayScore,
          homeYellowCards,
          awayYellowCards,
          homeRedCards,
          awayRedCards,
          enteredBy: userId,
          changeType,
          notes,
          isOverride,
          previousValues,
          userRole,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || null,
        });
    });

    console.log(`[Game Score Management] Score updated successfully for game ${gameId}`);

    // Return updated game data
    const [updatedGame] = await db
      .select({
        id: games.id,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        status: games.status,
        scoreEnteredBy: games.scoreEnteredBy,
        scoreEnteredAt: games.scoreEnteredAt,
        scoreNotes: games.scoreNotes,
        isScoreLocked: games.isScoreLocked,
      })
      .from(games)
      .where(eq(games.id, parseInt(gameId)));

    res.json({
      success: true,
      message: isOverride ? 'Score overridden successfully' : 'Score updated successfully',
      game: updatedGame,
      changeType,
      isOverride
    });

    // ─── Auto-trigger championship resolution after pool play completion ───
    // Run asynchronously after the response is sent (fire-and-forget)
    if (currentGame.bracketId && currentGame.gameType === 'pool_play') {
      setImmediate(async () => {
        try {
          const { resolveChampionshipGames } = await import('../../services/championship-resolver.js');
          const result = await resolveChampionshipGames(currentGame.bracketId!, currentGame.eventId.toString());
          if (result.success) {
            console.log(`[Game Score Management] 🏆 Auto-resolved championship: ${result.message}`);
          } else if (!result.message.includes('No pending') && !result.message.includes('Only')) {
            console.log(`[Game Score Management] Championship auto-resolve skipped: ${result.message}`);
          }
        } catch (autoResolveErr) {
          console.warn(`[Game Score Management] Championship auto-resolve error (non-critical):`, autoResolveErr);
        }
      });
    }

  } catch (error) {
    console.error('[Game Score Management] Error updating score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Lock or unlock a game score
router.post('/games/:gameId/lock', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { locked, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`[Game Score Management] ${locked ? 'Locking' : 'Unlocking'} score for game ${gameId}`);

    await db
      .update(games)
      .set({
        isScoreLocked: locked,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(games.id, parseInt(gameId)));

    // Create audit trail entry
    await db
      .insert(gameScoreAudit)
      .values({
        gameId: parseInt(gameId),
        enteredBy: userId,
        changeType: 'admin_correction',
        notes: `Score ${locked ? 'locked' : 'unlocked'}${reason ? `: ${reason}` : ''}`,
        isOverride: false,
        userRole: req.user?.role || 'unknown',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || null,
      });

    res.json({
      success: true,
      message: `Score ${locked ? 'locked' : 'unlocked'} successfully`
    });

  } catch (error) {
    console.error('[Game Score Management] Error locking/unlocking score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lock status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk operations for multiple games
router.post('/events/:eventId/games/bulk', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { operation, gameIds, data } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log(`[Game Score Management] Bulk operation ${operation} for ${gameIds.length} games`);

    let updatedCount = 0;

    await db.transaction(async (tx) => {
      for (const gameId of gameIds) {
        switch (operation) {
          case 'lock':
            await tx
              .update(games)
              .set({ isScoreLocked: true })
              .where(eq(games.id, gameId));

            await tx
              .insert(gameScoreAudit)
              .values({
                gameId,
                enteredBy: userId,
                changeType: 'admin_correction',
                notes: `Bulk lock operation: ${data.reason || 'No reason provided'}`,
                isOverride: false,
                userRole: req.user?.role || 'unknown',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent') || null,
              });
            break;

          case 'unlock':
            await tx
              .update(games)
              .set({ isScoreLocked: false })
              .where(eq(games.id, gameId));

            await tx
              .insert(gameScoreAudit)
              .values({
                gameId,
                enteredBy: userId,
                changeType: 'admin_correction',
                notes: `Bulk unlock operation: ${data.reason || 'No reason provided'}`,
                isOverride: false,
                userRole: req.user?.role || 'unknown',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent') || null,
              });
            break;

          case 'clear_scores':
            // Get current data for audit
            const [currentGame] = await tx
              .select()
              .from(games)
              .where(eq(games.id, gameId));

            if (currentGame && (currentGame.homeScore !== null || currentGame.awayScore !== null)) {
              const previousValues = {
                homeScore: currentGame.homeScore,
                awayScore: currentGame.awayScore,
                status: currentGame.status,
              };

              await tx
                .update(games)
                .set({
                  homeScore: null,
                  awayScore: null,
                  status: 'scheduled',
                  scoreEnteredBy: null,
                  scoreEnteredAt: null,
                  scoreNotes: null,
                })
                .where(eq(games.id, gameId));

              await tx
                .insert(gameScoreAudit)
                .values({
                  gameId,
                  enteredBy: userId,
                  changeType: 'admin_correction',
                  notes: `Bulk clear scores: ${data.reason || 'No reason provided'}`,
                  isOverride: true,
                  previousValues,
                  userRole: req.user?.role || 'unknown',
                  ipAddress: req.ip,
                  userAgent: req.get('User-Agent') || null,
                });
            }
            break;
        }
        updatedCount++;
      }
    });

    res.json({
      success: true,
      message: `Bulk operation completed successfully`,
      updatedCount
    });

  } catch (error) {
    console.error('[Game Score Management] Error in bulk operation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete bulk operation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;