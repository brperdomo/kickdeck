import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, eventBrackets } from '@db/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';
import { resolveChampionshipGames } from '../../services/championship-resolver.js';

const router = Router();

// Calculate standings and update championship games for ALL brackets in an event
router.post('/:eventId/update-championship-teams', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get all brackets/flights for this event
    const brackets = await db.select().from(eventBrackets).where(eq(eventBrackets.eventId, eventId));

    const allResults = [];
    const errors = [];

    for (const bracket of brackets) {
      try {
        const result = await resolveChampionshipGames(bracket.id, eventId);
        if (result.success) {
          allResults.push(...result.updatedGames);
        } else if (result.message.includes('No pending championship')) {
          // Skip brackets without championship games (normal)
          continue;
        } else {
          errors.push(`${bracket.name}: ${result.message}`);
        }
      } catch (err) {
        errors.push(`${bracket.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      message: `Updated ${allResults.length} championship games${errors.length > 0 ? `. Issues: ${errors.join('; ')}` : ''}`,
      updatedGames: allResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error updating championship teams:', error);
    res.status(500).json({ error: 'Failed to update championship teams' });
  }
});

// Manual override for championship game teams
router.put('/:eventId/championship/:gameId/teams', isAdmin, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { homeTeamId, awayTeamId, reason } = req.body;

    // Validate that the teams exist
    const homeTeam = await db.select().from(teams).where(eq(teams.id, homeTeamId)).limit(1);
    const awayTeam = await db.select().from(teams).where(eq(teams.id, awayTeamId)).limit(1);

    if (!homeTeam.length || !awayTeam.length) {
      return res.status(400).json({ error: 'Invalid team IDs provided' });
    }

    // Update the championship game
    const [updatedGame] = await db.update(games)
      .set({
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        homeTeamName: homeTeam[0].name,
        awayTeamName: awayTeam[0].name,
        isPending: false,
        notes: `Manual override: ${reason || 'Administrator assignment'}`
      })
      .where(and(
        eq(games.id, parseInt(gameId)),
        or(eq(games.gameType, 'final'), eq(games.gameType, 'championship'))
      ))
      .returning();

    if (!updatedGame) {
      return res.status(404).json({ error: 'Championship game not found' });
    }

    res.json({
      success: true,
      message: 'Championship teams manually assigned',
      game: updatedGame
    });

  } catch (error) {
    console.error('Error manually assigning championship teams:', error);
    res.status(500).json({ error: 'Failed to assign championship teams' });
  }
});

// Get championship games status for an event
router.get('/:eventId/championship-status', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get all championship/final games for this event's brackets
    const championshipGames = await db.select({
      id: games.id,
      bracketId: games.bracketId,
      homeTeamId: games.homeTeamId,
      awayTeamId: games.awayTeamId,
      homeTeamName: games.homeTeamName,
      awayTeamName: games.awayTeamName,
      isPending: games.isPending,
      gameType: games.gameType,
      status: games.status,
      notes: games.notes,
    })
    .from(games)
    .where(and(
      eq(games.eventId, eventId),
      or(eq(games.gameType, 'final'), eq(games.gameType, 'championship'))
    ));

    // Enrich with bracket names
    const enriched = [];
    for (const game of championshipGames) {
      let bracketName = 'Unknown';
      if (game.bracketId) {
        const bracket = await db.query.eventBrackets.findFirst({
          where: eq(eventBrackets.id, game.bracketId)
        });
        bracketName = bracket?.name || `Bracket ${game.bracketId}`;
      }
      enriched.push({ ...game, bracketName });
    }

    res.json(enriched);

  } catch (error) {
    console.error('Error fetching championship status:', error);
    res.status(500).json({ error: 'Failed to fetch championship status' });
  }
});

export default router;
