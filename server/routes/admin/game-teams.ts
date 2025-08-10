import { Router } from 'express';
import { db } from '@db';
import { games, teams, eventBrackets } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();

// Apply admin authentication to all routes
router.use(isAdmin);

// Update teams for a specific game
router.put('/events/:eventId/games/:gameId/teams', async (req, res) => {
  try {
    const { eventId, gameId } = req.params;
    const { homeTeamId, awayTeamId } = req.body;

    console.log(`[Game Teams Update] Updating game ${gameId} teams: home=${homeTeamId}, away=${awayTeamId}`);

    // Validate that both teams exist and belong to the event
    const homeTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, homeTeamId),
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      )
    });

    const awayTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, awayTeamId),
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      )
    });

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ 
        error: 'Invalid team selection',
        details: {
          homeTeamFound: !!homeTeam,
          awayTeamFound: !!awayTeam
        }
      });
    }

    // Validate that teams are from the same flight (bracket)
    if (homeTeam.bracketId !== awayTeam.bracketId) {
      return res.status(400).json({ 
        error: 'Teams must be from the same flight',
        details: {
          homeTeamFlight: homeTeam.bracketId,
          awayTeamFlight: awayTeam.bracketId
        }
      });
    }

    // Update the game with new team IDs and names
    const updatedGame = await db
      .update(games)
      .set({
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        updatedAt: new Date()
      })
      .where(and(
        eq(games.id, parseInt(gameId)),
        eq(games.eventId, eventId)
      ))
      .returning();

    if (updatedGame.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log(`[Game Teams Update] Successfully updated game ${gameId}`);

    res.json({
      success: true,
      game: updatedGame[0],
      message: `Game updated: ${homeTeam.name} vs ${awayTeam.name}`
    });

  } catch (error) {
    console.error('Error updating game teams:', error);
    res.status(500).json({ 
      error: 'Failed to update game teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get teams for a specific bracket/flight
router.get('/events/:eventId/brackets/:bracketId/teams', async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;

    console.log(`[Flight Teams] Fetching teams for bracket ${bracketId} in event ${eventId}`);

    // Get teams for this specific bracket/flight
    const flightTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.bracketId, parseInt(bracketId)),
        eq(teams.status, 'approved')
      ),
      with: {
        bracket: true
      }
    });

    // Format response with flight information
    const formattedTeams = flightTeams.map(team => ({
      id: team.id,
      name: team.name,
      clubName: team.clubName,
      flightName: team.bracket?.name || 'Unknown Flight'
    }));

    console.log(`[Flight Teams] Found ${formattedTeams.length} teams in flight`);

    res.json(formattedTeams);

  } catch (error) {
    console.error('Error fetching flight teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flight teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;