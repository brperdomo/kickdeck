import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, teamStandings, eventBrackets, eventScoringConfiguration, scoringRuleTemplates } from '@db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Calculate standings and update championship games
router.post('/:eventId/update-championship-teams', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Get event's scoring configuration
    const scoringConfig = await db.select()
      .from(eventScoringConfiguration)
      .leftJoin(scoringRuleTemplates, eq(eventScoringConfiguration.scoringRuleTemplateId, scoringRuleTemplates.id))
      .where(eq(eventScoringConfiguration.eventId, eventId))
      .limit(1);

    if (!scoringConfig.length) {
      return res.status(400).json({ error: 'No scoring configuration found for this event' });
    }

    // Get all brackets/flights for this event
    const brackets = await db.select().from(eventBrackets).where(eq(eventBrackets.eventId, eventId));
    
    const updatedGames = [];

    for (const bracket of brackets) {
      // Get all completed pool play games for this bracket
      const poolGames = await db.select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        status: games.status
      })
      .from(games)
      .where(and(
        eq(games.bracketId, bracket.id.toString()),
        eq(games.gameType, 'pool_play'),
        eq(games.status, 'completed')
      ));

      // Calculate standings for this bracket
      const standings = await calculateBracketStandings(bracket.id.toString(), poolGames, scoringConfig[0]);
      
      // Get championship game(s) for this bracket
      const championshipGames = await db.select()
        .from(games)
        .where(and(
          eq(games.bracketId, bracket.id.toString()),
          eq(games.gameType, 'final'),
          eq(games.isPending, true)
        ));

      // Update championship game teams based on standings
      for (const champGame of championshipGames) {
        if (standings.length >= 2) {
          const [firstPlace, secondPlace] = standings;
          
          const [updatedGame] = await db.update(games)
            .set({
              homeTeamId: firstPlace.teamId,
              awayTeamId: secondPlace.teamId,
              homeTeamName: firstPlace.teamName,
              awayTeamName: secondPlace.teamName,
              isPending: false,
              notes: `Auto-assigned: ${firstPlace.teamName} (1st) vs ${secondPlace.teamName} (2nd)`
            })
            .where(eq(games.id, champGame.id))
            .returning();

          updatedGames.push(updatedGame);
        }
      }
    }

    res.json({ 
      success: true, 
      message: `Updated ${updatedGames.length} championship games`,
      updatedGames 
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
        eq(games.id, gameId),
        eq(games.gameType, 'final')
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

    const championshipGames = await db.select({
      id: games.id,
      bracketId: games.bracketId,
      bracketName: eventBrackets.name,
      homeTeamId: games.homeTeamId,
      awayTeamId: games.awayTeamId,
      homeTeamName: games.homeTeamName,
      awayTeamName: games.awayTeamName,
      isPending: games.isPending,
      status: games.status,
      notes: games.notes
    })
    .from(games)
    .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
    .where(and(
      eq(eventBrackets.eventId, eventId),
      eq(games.gameType, 'final')
    ));

    res.json(championshipGames);

  } catch (error) {
    console.error('Error fetching championship status:', error);
    res.status(500).json({ error: 'Failed to fetch championship status' });
  }
});

// Helper function to calculate bracket standings
async function calculateBracketStandings(bracketId: string, poolGames: any[], scoringConfig: any) {
  const teamStats: Record<string, {
    teamId: string;
    teamName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    goalsScored: number;
    goalsAllowed: number;
    goalDifferential: number;
    points: number;
  }> = {};

  // Get all teams in this bracket
  const bracketTeams = await db.select().from(teams).where(eq(teams.bracketId, parseInt(bracketId)));
  
  // Initialize stats for all teams
  for (const team of bracketTeams) {
    teamStats[team.id] = {
      teamId: team.id.toString(),
      teamName: team.name,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      goalsScored: 0,
      goalsAllowed: 0,
      goalDifferential: 0,
      points: 0
    };
  }

  // Get scoring rules from configuration
  const winPoints = scoringConfig.scoring_rule_templates?.scoringRules?.win || 3;
  const tiePoints = scoringConfig.scoring_rule_templates?.scoringRules?.draw || 1;
  const lossPoints = scoringConfig.scoring_rule_templates?.scoringRules?.loss || 0;

  // Process each completed game
  for (const game of poolGames) {
    const homeStats = teamStats[game.homeTeamId];
    const awayStats = teamStats[game.awayTeamId];
    
    if (!homeStats || !awayStats) continue;

    homeStats.gamesPlayed++;
    awayStats.gamesPlayed++;
    
    homeStats.goalsScored += game.homeScore || 0;
    homeStats.goalsAllowed += game.awayScore || 0;
    awayStats.goalsScored += game.awayScore || 0;
    awayStats.goalsAllowed += game.homeScore || 0;

    // Determine winner and assign points
    if (game.homeScore > game.awayScore) {
      homeStats.wins++;
      awayStats.losses++;
      homeStats.points += winPoints;
      awayStats.points += lossPoints;
    } else if (game.awayScore > game.homeScore) {
      awayStats.wins++;
      homeStats.losses++;
      awayStats.points += winPoints;
      homeStats.points += lossPoints;
    } else {
      homeStats.ties++;
      awayStats.ties++;
      homeStats.points += tiePoints;
      awayStats.points += tiePoints;
    }

    homeStats.goalDifferential = homeStats.goalsScored - homeStats.goalsAllowed;
    awayStats.goalDifferential = awayStats.goalsScored - awayStats.goalsAllowed;
  }

  // Sort teams by standings criteria
  const standings = Object.values(teamStats).sort((a, b) => {
    // Primary: Points
    if (a.points !== b.points) return b.points - a.points;
    
    // Secondary: Goal differential
    if (a.goalDifferential !== b.goalDifferential) return b.goalDifferential - a.goalDifferential;
    
    // Tertiary: Goals scored
    if (a.goalsScored !== b.goalsScored) return b.goalsScored - a.goalsScored;
    
    // Quaternary: Fewer goals allowed
    return a.goalsAllowed - b.goalsAllowed;
  });

  return standings;
}

export default router;