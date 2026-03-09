import { Router } from 'express';
import { db } from '@db';
import { games, teams, eventBrackets } from '@db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
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

// Add placeholder team to bracket
router.post('/events/:eventId/brackets/:bracketId/add-placeholder', async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    const { placeholderName } = req.body;

    console.log(`[Placeholder] Adding placeholder "${placeholderName}" to bracket ${bracketId}`);

    // Create a placeholder team entry
    const placeholderTeam = await db.insert(teams).values({
      eventId: eventId,
      name: placeholderName || 'Placeholder Team',
      bracketId: parseInt(bracketId),
      status: 'approved', // Approve automatically so it can be scheduled
      isPlaceholder: true, // Add flag to identify placeholders
      clubName: 'TBD',
      submitterEmail: 'placeholder@kickdeck.xyz',
      submitterName: 'System Generated',
      selectedFeeIds: '[]',
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log(`[Placeholder] Created placeholder team:`, placeholderTeam[0]);

    res.json({
      success: true,
      team: placeholderTeam[0],
      message: `Placeholder team "${placeholderName}" added successfully`
    });

  } catch (error) {
    console.error('Error adding placeholder team:', error);
    res.status(500).json({ 
      error: 'Failed to add placeholder team',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Replace placeholder team with real team
router.post('/events/:eventId/teams/:placeholderTeamId/replace-with/:realTeamId', async (req, res) => {
  try {
    const { eventId, placeholderTeamId, realTeamId } = req.params;

    console.log(`[Replace Placeholder] Replacing team ${placeholderTeamId} with team ${realTeamId}`);

    // Get the placeholder team details
    const placeholderTeam = await db.query.teams.findFirst({
      where: and(eq(teams.id, parseInt(placeholderTeamId)), eq(teams.eventId, eventId))
    });

    if (!placeholderTeam) {
      return res.status(404).json({ error: 'Placeholder team not found' });
    }

    // Get the real team details
    const realTeam = await db.query.teams.findFirst({
      where: and(eq(teams.id, parseInt(realTeamId)), eq(teams.eventId, eventId))
    });

    if (!realTeam) {
      return res.status(404).json({ error: 'Real team not found' });
    }

    // Update all games that reference the placeholder team
    const updatedGames = await db
      .update(games)
      .set({
        homeTeamId: sql`CASE WHEN ${games.homeTeamId} = ${placeholderTeam.id} THEN ${realTeam.id} ELSE ${games.homeTeamId} END`,
        awayTeamId: sql`CASE WHEN ${games.awayTeamId} = ${placeholderTeam.id} THEN ${realTeam.id} ELSE ${games.awayTeamId} END`,
        homeTeam: sql`CASE WHEN ${games.homeTeamId} = ${placeholderTeam.id} THEN '${realTeam.name}' ELSE ${games.homeTeam} END`,
        awayTeam: sql`CASE WHEN ${games.awayTeamId} = ${placeholderTeam.id} THEN '${realTeam.name}' ELSE ${games.awayTeam} END`,
        updatedAt: new Date()
      })
      .where(and(
        eq(games.eventId, eventId),
        or(
          eq(games.homeTeamId, placeholderTeam.id),
          eq(games.awayTeamId, placeholderTeam.id)
        )
      ))
      .returning();

    // Update the real team's bracket assignment
    await db
      .update(teams)
      .set({
        bracketId: placeholderTeam.bracketId,
        groupId: placeholderTeam.groupId,
        updatedAt: new Date()
      })
      .where(eq(teams.id, realTeam.id));

    // Delete the placeholder team
    await db.delete(teams).where(eq(teams.id, placeholderTeam.id));

    console.log(`[Replace Placeholder] Updated ${updatedGames.length} games and replaced placeholder`);

    res.json({
      success: true,
      updatedGames: updatedGames.length,
      message: `Placeholder replaced with ${realTeam.name}. ${updatedGames.length} games updated.`
    });

  } catch (error) {
    console.error('Error replacing placeholder team:', error);
    res.status(500).json({ 
      error: 'Failed to replace placeholder team',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;