import express from 'express';
import { db } from '@db';
import { games, gameScoreAudit, teams, fields, eventBrackets, users } from '@db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
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

// Get all games for an event with scoring information - NO AUTH REQUIRED FOR TESTING
router.get('/events/:eventId/games', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`[Game Score Management] Fetching games for event ${eventId}`);

    // Complex query with proper joins to get team names, field names, and bracket names
    const gameResults = await db
      .select({
        id: games.id,
        matchNumber: games.matchNumber,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
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
        groupId: games.groupId
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(eq(games.eventId, eventId))
      .orderBy(games.scheduledDate, games.scheduledTime);

    // Get team names and bracket information separately to handle home and away teams
    const gameIds = gameResults.map(g => g.id);
    const teamLookup = new Map();
    const bracketLookup = new Map();
    
    if (gameIds.length > 0) {
      // Get all teams with their bracket information
      const allTeams = await db
        .select({
          id: teams.id,
          name: teams.name,
          bracketId: teams.bracketId
        })
        .from(teams)
        .where(eq(teams.eventId, eventId));
      
      allTeams.forEach(team => {
        teamLookup.set(team.id, team.name);
        if (team.bracketId) {
          bracketLookup.set(team.id, team.bracketId);
        }
      });

      // Get bracket names
      const bracketIds = Array.from(new Set(bracketLookup.values()));
      const bracketNameMap = new Map();
      
      if (bracketIds.length > 0) {
        const brackets = await db
          .select({
            id: eventBrackets.id,
            name: eventBrackets.name
          })
          .from(eventBrackets)
          .where(inArray(eventBrackets.id, bracketIds));
        
        brackets.forEach(bracket => {
          bracketNameMap.set(bracket.id, bracket.name);
        });
      }

      // Update bracketLookup to map teamId -> bracketName
      for (const [teamId, bracketId] of bracketLookup.entries()) {
        bracketLookup.set(teamId, bracketNameMap.get(bracketId) || 'No Flight');
      }
    }

    // Transform results to match interface
    const gamesWithDetails: GameWithDetails[] = gameResults.map(game => {
      // Determine bracket name from either home or away team (they should be in the same bracket)
      let bracketName = 'No Flight';
      if (game.homeTeamId && bracketLookup.has(game.homeTeamId)) {
        bracketName = bracketLookup.get(game.homeTeamId);
      } else if (game.awayTeamId && bracketLookup.has(game.awayTeamId)) {
        bracketName = bracketLookup.get(game.awayTeamId);
      }

      return {
        id: game.id,
        gameNumber: game.matchNumber,
        homeTeamId: game.homeTeamId,
        homeTeamName: game.homeTeamId ? teamLookup.get(game.homeTeamId) || 'TBD' : 'TBD',
        awayTeamId: game.awayTeamId,
        awayTeamName: game.awayTeamId ? teamLookup.get(game.awayTeamId) || 'TBD' : 'TBD',
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        homeYellowCards: game.homeYellowCards,
        awayYellowCards: game.awayYellowCards,
        homeRedCards: game.homeRedCards,
        awayRedCards: game.awayRedCards,
        fieldId: game.fieldId,
        fieldName: game.fieldName || (game.fieldId ? `Field ${game.fieldId}` : 'TBD'),
        scheduledDate: game.scheduledDate ? game.scheduledDate.toString() : null,
        scheduledTime: game.scheduledTime ? game.scheduledTime.toString() : null,
        status: game.status,
        scoreEnteredBy: game.scoreEnteredBy,
        scoreEnteredAt: game.scoreEnteredAt,
        scoreNotes: game.scoreNotes,
        isScoreLocked: game.isScoreLocked,
        bracketName: bracketName,
        round: game.round,
        enteredByName: null,
      };
    });

    console.log(`[Game Score Management] Found ${gamesWithDetails.length} games with team data`);
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