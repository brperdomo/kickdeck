import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
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

    // Get all completed games for this event using raw SQL
    const completedGamesResult = await db.execute(`
      SELECT 
        id, home_team_id, away_team_id, home_score, away_score, 
        group_id as bracket_id, age_group_id
      FROM games 
      WHERE event_id = ${parseInt(eventId)} AND status = 'completed'
    `);

    const completedGames = completedGamesResult.rows;

    console.log(`[PUBLIC STANDINGS] Found ${completedGames.length} completed games`);

    // Get all teams in this event using raw SQL
    const eventTeamsResult = await db.execute(`
      SELECT id, name, bracket_id, age_group_id
      FROM teams 
      WHERE event_id = ${parseInt(eventId)}
    `);

    const eventTeams = eventTeamsResult.rows;

    console.log(`[PUBLIC STANDINGS] Found ${eventTeams.length} teams in event`);

    // Calculate standings by bracket
    const standingsByBracket = new Map();

    // Initialize team stats
    eventTeams.forEach((team: any) => {
      const bracketId = team.bracket_id;
      if (!standingsByBracket.has(bracketId)) {
        standingsByBracket.set(bracketId, new Map());
      }
      
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
    });

    // Process completed games
    completedGames.forEach((game: any) => {
      const homeStats = standingsByBracket.get(game.bracket_id)?.get(game.home_team_id);
      const awayStats = standingsByBracket.get(game.bracket_id)?.get(game.away_team_id);

      if (homeStats && awayStats && game.home_score !== null && game.away_score !== null) {
        // Update games played
        homeStats.gamesPlayed++;
        awayStats.gamesPlayed++;

        // Update goals
        homeStats.goalsFor += game.home_score;
        homeStats.goalsAgainst += game.away_score;
        awayStats.goalsFor += game.away_score;
        awayStats.goalsAgainst += game.home_score;

        // Update goal difference
        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;

        // Update wins/losses/draws and points (using standard 3-1-0 system)
        if (game.home_score > game.away_score) {
          homeStats.wins++;
          homeStats.points += 3;
          awayStats.losses++;
        } else if (game.away_score > game.home_score) {
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

    // Update TBD games based on standings
    await updateTBDGames(parseInt(eventId), finalStandings);

    res.json({
      success: true,
      message: 'Standings recalculated successfully',
      standingsCount: Object.keys(finalStandings).length,
      gamesProcessed: completedGames.length
    });

  } catch (error) {
    console.error('[PUBLIC STANDINGS] Error recalculating standings:', error);
    res.status(500).json({ error: 'Failed to recalculate standings' });
  }
});

// Helper function to update TBD games based on standings
async function updateTBDGames(eventId: number, standings: any) {
  try {
    console.log('[TBD RESOLUTION] Starting TBD game updates...');

    // Get all scheduled games for this event
    const scheduledGamesResult = await db.execute(`
      SELECT id, home_team_id, away_team_id, round, status
      FROM games 
      WHERE event_id = ${eventId} AND status = 'scheduled'
    `);

    // Get all teams for TBD resolution
    const allTeamsResult = await db.execute(`
      SELECT id, name FROM teams WHERE event_id = ${eventId}
    `);

    const tbdTeams = allTeamsResult.rows.filter((team: any) => 
      team.name.toLowerCase().includes('tbd') || 
      team.name.toLowerCase().includes('winner') ||
      team.name.toLowerCase().includes('1st place') ||
      team.name.toLowerCase().includes('2nd place')
    );

    console.log(`[TBD RESOLUTION] Found ${tbdTeams.length} TBD teams to resolve`);

    if (tbdTeams.length > 0) {
      // For each bracket that has completed pool play, assign winners to TBD spots
      for (const [bracketId, bracketStandings] of Object.entries(standings)) {
        const sortedTeams = bracketStandings as any[];
        
        if (sortedTeams.length >= 2) {
          const winner = sortedTeams[0];
          const runnerUp = sortedTeams[1];
          
          console.log(`[TBD RESOLUTION] Bracket ${bracketId}: Winner = ${winner.teamName}, Runner-up = ${runnerUp.teamName}`);

          // Find TBD teams that should be replaced with these winners
          // This would need more sophisticated logic based on tournament structure
          // For now, we log the potential assignments
        }
      }
    }

    console.log('[TBD RESOLUTION] TBD update process completed');
  } catch (error) {
    console.error('[TBD RESOLUTION] Error updating TBD games:', error);
  }
}

export default router;