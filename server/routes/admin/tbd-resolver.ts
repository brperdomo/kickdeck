import { Router } from 'express';
import { db } from '@db';

const router = Router();

// POST /api/admin/events/:eventId/resolve-tbd - Resolve TBD games based on pool standings
router.post('/:eventId/resolve-tbd', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    console.log(`[TBD RESOLVER] Starting TBD resolution for event ${eventId}`);

    // Get current standings by calling the standings API
    const standingsResponse = await fetch(`http://localhost:5000/api/public/standings/${eventId}/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!standingsResponse.ok) {
      throw new Error('Failed to get current standings');
    }

    const standingsData = await standingsResponse.json();
    const standings = standingsData.standings;

    // Get all TBD games that need resolution
    const tbdGamesResult = await db.execute(`
      SELECT 
        g.id, g.round, g.home_team_id, g.away_team_id, 
        g.scheduled_date, g.scheduled_time,
        eb.id as bracket_id, eb.age_group_id
      FROM games g
      LEFT JOIN event_brackets eb ON g.group_id = eb.id
      WHERE g.event_id = ${parseInt(eventId)} 
      AND (g.home_team_id IS NULL OR g.away_team_id IS NULL)
      AND g.status = 'pending'
      ORDER BY g.round, g.scheduled_date, g.scheduled_time
    `);

    const tbdGames = tbdGamesResult.rows;
    console.log(`[TBD RESOLVER] Found ${tbdGames.length} TBD games to resolve`);

    let resolvedCount = 0;
    const resolutionLog = [];

    for (const game of tbdGames) {
      try {
        // For Round 2+ games, resolve based on pool standings
        if (game.round >= 2 && game.bracket_id && standings[game.bracket_id]) {
          const bracketStandings = standings[game.bracket_id];
          
          if (bracketStandings.length >= 2) {
            let homeTeamId = null;
            let awayTeamId = null;

            // Determine teams based on game pattern
            if (game.round === 2) {
              // Semifinals: 1st vs 4th, 2nd vs 3rd (if 4+ teams)
              // Championship: 1st vs 2nd (if 2-3 teams)
              if (bracketStandings.length >= 4) {
                // 4+ teams: semifinals pattern
                const gameIndex = tbdGames.filter(g => 
                  g.bracket_id === game.bracket_id && g.round === 2
                ).indexOf(game);
                
                if (gameIndex === 0) {
                  // First semifinal: 1st vs 4th
                  homeTeamId = bracketStandings[0].teamId;
                  awayTeamId = bracketStandings[3].teamId;
                } else if (gameIndex === 1) {
                  // Second semifinal: 2nd vs 3rd
                  homeTeamId = bracketStandings[1].teamId;
                  awayTeamId = bracketStandings[2].teamId;
                }
              } else if (bracketStandings.length >= 2) {
                // 2-3 teams: direct championship
                homeTeamId = bracketStandings[0].teamId;
                awayTeamId = bracketStandings[1].teamId;
              }
            }

            // Update the game if we have both teams
            if (homeTeamId && awayTeamId) {
              await db.execute(`
                UPDATE games 
                SET home_team_id = ${homeTeamId}, away_team_id = ${awayTeamId}, status = 'scheduled'
                WHERE id = ${game.id}
              `);

              resolvedCount++;
              resolutionLog.push({
                gameId: game.id,
                round: game.round,
                homeTeam: bracketStandings.find(t => t.teamId === homeTeamId)?.teamName,
                awayTeam: bracketStandings.find(t => t.teamId === awayTeamId)?.teamName,
                bracketId: game.bracket_id
              });

              console.log(`[TBD RESOLVER] Game ${game.id}: ${bracketStandings.find(t => t.teamId === homeTeamId)?.teamName} vs ${bracketStandings.find(t => t.teamId === awayTeamId)?.teamName}`);
            }
          }
        }
      } catch (gameError) {
        console.error(`[TBD RESOLVER] Error resolving game ${game.id}:`, gameError);
      }
    }

    console.log(`[TBD RESOLVER] Resolved ${resolvedCount} TBD games`);

    res.json({
      success: true,
      message: `Successfully resolved ${resolvedCount} TBD games`,
      resolvedCount,
      totalTbdGames: tbdGames.length,
      resolutionLog
    });

  } catch (error) {
    console.error('[TBD RESOLVER] Error:', error);
    res.status(500).json({ 
      error: 'Failed to resolve TBD games', 
      details: error.message 
    });
  }
});

export default router;