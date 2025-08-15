import { Router } from 'express';
import { db } from '@db';

const router = Router();

// POST /api/public/standings/:eventId/recalculate - Recalculate standings after score submission
router.post('/:eventId/recalculate', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    console.log(`[PUBLIC STANDINGS] Recalculating standings for event ${eventId}`);

    // Get all completed games for this event - using string interpolation for now
    const completedGamesQuery = `
      SELECT 
        id, home_team_id, away_team_id, home_score, away_score, 
        group_id as bracket_id, age_group_id
      FROM games 
      WHERE event_id = '${eventId}' AND status = 'completed'
    `;
    
    const completedGamesResult = await db.execute(completedGamesQuery);
    const completedGames = completedGamesResult.rows;

    console.log(`[PUBLIC STANDINGS] Found ${completedGames.length} completed games`);

    // Get all teams in this event
    const eventTeamsQuery = `
      SELECT id, name, bracket_id, age_group_id
      FROM teams 
      WHERE event_id = '${eventId}'
    `;
    
    const eventTeamsResult = await db.execute(eventTeamsQuery);
    const eventTeams = eventTeamsResult.rows;

    console.log(`[PUBLIC STANDINGS] Found ${eventTeams.length} teams in event`);

    // Calculate standings by bracket
    const standingsByBracket = new Map();

    // Initialize team stats
    eventTeams.forEach((team: any) => {
      const bracketId = team.bracket_id;
      if (bracketId && !standingsByBracket.has(bracketId)) {
        standingsByBracket.set(bracketId, new Map());
      }
      
      if (bracketId) {
        standingsByBracket.get(bracketId).set(team.id, {
          teamId: team.id,
          teamName: team.name,
          bracketId: bracketId,
          ageGroupId: team.age_group_id,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        });
      }
    });

    // Process completed games
    completedGames.forEach((game: any) => {
      const bracketId = game.bracket_id;
      const homeStats = standingsByBracket.get(bracketId)?.get(game.home_team_id);
      const awayStats = standingsByBracket.get(bracketId)?.get(game.away_team_id);

      if (homeStats && awayStats && game.home_score !== null && game.away_score !== null) {
        // Update games played
        homeStats.gamesPlayed++;
        awayStats.gamesPlayed++;

        // Update goals
        homeStats.goalsFor += parseInt(game.home_score);
        homeStats.goalsAgainst += parseInt(game.away_score);
        awayStats.goalsFor += parseInt(game.away_score);
        awayStats.goalsAgainst += parseInt(game.home_score);

        // Update goal difference
        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;

        // Update wins/losses/draws and points (using standard 3-1-0 system)
        if (parseInt(game.home_score) > parseInt(game.away_score)) {
          homeStats.wins++;
          homeStats.points += 3;
          awayStats.losses++;
        } else if (parseInt(game.away_score) > parseInt(game.home_score)) {
          awayStats.wins++;
          awayStats.points += 3;
          homeStats.losses++;
        } else {
          homeStats.draws++;
          awayStats.draws++;
          homeStats.points += 1;
          awayStats.points += 1;
        }
      }
    });

    // Convert to sorted arrays for each bracket
    const finalStandings: any = {};
    standingsByBracket.forEach((teams, bracketId) => {
      const standings = Array.from(teams.values()).sort((a: any, b: any) => {
        // Sort by: 1) Points desc, 2) Goal difference desc, 3) Goals for desc
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      finalStandings[bracketId] = standings;
    });

    console.log(`[PUBLIC STANDINGS] Calculated standings for ${Object.keys(finalStandings).length} brackets`);

    res.json({
      success: true,
      message: 'Standings recalculated successfully',
      standingsCount: Object.keys(finalStandings).length,
      gamesProcessed: completedGames.length,
      standings: finalStandings
    });

  } catch (error) {
    console.error('[PUBLIC STANDINGS] Error recalculating standings:', error);
    res.status(500).json({ error: 'Failed to recalculate standings', details: error.message });
  }
});

export default router;