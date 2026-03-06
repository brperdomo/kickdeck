/**
 * Championship Resolver Service
 *
 * Shared logic for resolving championship/playoff games.
 * Used by both the championship API endpoint and the auto-trigger
 * after pool play completion.
 */

import { db } from '../../db/index.js';
import { games, teams, eventBrackets, eventScoringConfiguration, scoringRuleTemplates } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

interface BracketStanding {
  teamId: number;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsScored: number;
  goalsAllowed: number;
  goalDifferential: number;
  points: number;
}

/**
 * Resolve championship games for a specific bracket/flight.
 * Calculates pool play standings and assigns the top 2 teams to championship games.
 *
 * @param bracketId - The bracket/flight ID
 * @param eventId - The event ID (as string)
 * @returns Object with success status, message, and updated games
 */
export async function resolveChampionshipGames(
  bracketId: number,
  eventId: string
): Promise<{ success: boolean; message: string; updatedGames: any[] }> {
  console.log(`[Championship Resolver] Resolving championship for bracket ${bracketId}, event ${eventId}`);

  // Get all completed pool play games for this bracket
  const poolGames = await db.select({
    id: games.id,
    homeTeamId: games.homeTeamId,
    awayTeamId: games.awayTeamId,
    homeScore: games.homeScore,
    awayScore: games.awayScore,
    status: games.status,
  })
  .from(games)
  .where(and(
    eq(games.bracketId, bracketId),
    eq(games.gameType, 'pool_play'),
    eq(games.status, 'completed')
  ));

  if (poolGames.length === 0) {
    return { success: false, message: 'No completed pool play games found for this bracket', updatedGames: [] };
  }

  // Get all pool play games total (to check if all are completed)
  const allPoolGames = await db.select({ id: games.id, status: games.status })
    .from(games)
    .where(and(
      eq(games.bracketId, bracketId),
      eq(games.gameType, 'pool_play')
    ));

  const allCompleted = allPoolGames.every(g => g.status === 'completed');
  if (!allCompleted) {
    const completed = allPoolGames.filter(g => g.status === 'completed').length;
    return {
      success: false,
      message: `Only ${completed} of ${allPoolGames.length} pool play games completed. All must be completed before resolving championships.`,
      updatedGames: []
    };
  }

  // Get scoring configuration for this event
  const scoringConfig = await db.select()
    .from(eventScoringConfiguration)
    .leftJoin(scoringRuleTemplates, eq(eventScoringConfiguration.scoringRuleTemplateId, scoringRuleTemplates.id))
    .where(eq(eventScoringConfiguration.eventId, eventId))
    .limit(1);

  // Default scoring rules (FIFA standard)
  const winPoints = scoringConfig?.[0]?.scoring_rule_templates?.scoringRules?.win ?? 3;
  const tiePoints = scoringConfig?.[0]?.scoring_rule_templates?.scoringRules?.draw ?? 1;
  const lossPoints = scoringConfig?.[0]?.scoring_rule_templates?.scoringRules?.loss ?? 0;

  // Get all teams in this bracket
  const bracketTeams = await db.select().from(teams).where(eq(teams.bracketId, bracketId));

  // Calculate standings
  const teamStats: Record<number, BracketStanding> = {};
  for (const team of bracketTeams) {
    teamStats[team.id] = {
      teamId: team.id,
      teamName: team.name,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      goalsScored: 0,
      goalsAllowed: 0,
      goalDifferential: 0,
      points: 0,
    };
  }

  for (const game of poolGames) {
    if (!game.homeTeamId || !game.awayTeamId) continue;
    const homeStats = teamStats[game.homeTeamId];
    const awayStats = teamStats[game.awayTeamId];
    if (!homeStats || !awayStats) continue;

    homeStats.gamesPlayed++;
    awayStats.gamesPlayed++;

    homeStats.goalsScored += game.homeScore || 0;
    homeStats.goalsAllowed += game.awayScore || 0;
    awayStats.goalsScored += game.awayScore || 0;
    awayStats.goalsAllowed += game.homeScore || 0;

    if ((game.homeScore || 0) > (game.awayScore || 0)) {
      homeStats.wins++;
      awayStats.losses++;
      homeStats.points += winPoints;
      awayStats.points += lossPoints;
    } else if ((game.awayScore || 0) > (game.homeScore || 0)) {
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

  // Sort by: points → goal differential → goals scored → fewer goals allowed
  const standings = Object.values(teamStats).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifferential !== b.goalDifferential) return b.goalDifferential - a.goalDifferential;
    if (a.goalsScored !== b.goalsScored) return b.goalsScored - a.goalsScored;
    return a.goalsAllowed - b.goalsAllowed;
  });

  if (standings.length < 2) {
    return { success: false, message: 'Need at least 2 teams with standings to resolve championship', updatedGames: [] };
  }

  const [firstPlace, secondPlace] = standings;

  // Get pending championship games for this bracket
  const championshipGames = await db.select()
    .from(games)
    .where(and(
      eq(games.bracketId, bracketId),
      eq(games.gameType, 'final'),
      eq(games.isPending, true)
    ));

  if (championshipGames.length === 0) {
    // Also check for 'championship' gameType (alternate label)
    const altChampGames = await db.select()
      .from(games)
      .where(and(
        eq(games.bracketId, bracketId),
        eq(games.gameType, 'championship'),
        eq(games.isPending, true)
      ));

    if (altChampGames.length === 0) {
      return { success: false, message: 'No pending championship games found for this bracket', updatedGames: [] };
    }

    // Use the alternate championship games
    championshipGames.push(...altChampGames);
  }

  const updatedGames = [];
  for (const champGame of championshipGames) {
    const [updatedGame] = await db.update(games)
      .set({
        homeTeamId: firstPlace.teamId,
        awayTeamId: secondPlace.teamId,
        homeTeamName: firstPlace.teamName,
        awayTeamName: secondPlace.teamName,
        isPending: false,
        status: 'scheduled',
        notes: `Auto-assigned: ${firstPlace.teamName} (1st, ${firstPlace.points}pts) vs ${secondPlace.teamName} (2nd, ${secondPlace.points}pts)`,
      })
      .where(eq(games.id, champGame.id))
      .returning();

    if (updatedGame) {
      updatedGames.push(updatedGame);
    }
  }

  const bracketInfo = await db.query.eventBrackets.findFirst({
    where: eq(eventBrackets.id, bracketId)
  });
  const bracketName = bracketInfo?.name || `Bracket ${bracketId}`;

  console.log(`[Championship Resolver] ✅ Resolved ${updatedGames.length} championship game(s) for ${bracketName}: ${firstPlace.teamName} vs ${secondPlace.teamName}`);

  return {
    success: true,
    message: `Championship resolved for ${bracketName}: ${firstPlace.teamName} (1st) vs ${secondPlace.teamName} (2nd)`,
    updatedGames,
  };
}
