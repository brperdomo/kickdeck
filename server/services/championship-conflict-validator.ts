import { db } from '@db';
import { games, teams, gameFormats } from '@db/schema';
import { eq, and, or, isNotNull } from 'drizzle-orm';

export interface ChampionshipConflictValidationResult {
  isValid: boolean;
  conflicts: ConflictDetail[];
  participatingTeams: number[];
  minimumRestPeriod: number;
  suggestedEarliestTime?: Date;
}

export interface ConflictDetail {
  teamId: number;
  teamName: string;
  lastGameEnd: Date;
  restPeriodViolation: number; // Minutes short of minimum rest
  conflictType: 'rest_period' | 'overlap';
}

/**
 * CRITICAL FIX: Validate championship game scheduling against all possible participants
 * Championship games must validate rest periods for ALL teams in the flight, not just TBD placeholders
 */
export async function validateChampionshipGameScheduling(
  championshipGameId: string,
  proposedStartTime: Date,
  flightId: number
): Promise<ChampionshipConflictValidationResult> {
  console.log(`[Championship Conflict] Validating championship game ${championshipGameId} at ${proposedStartTime.toISOString()}`);

  try {
    // Get all teams in this flight - these are ALL potential championship participants
    const flightTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        bracketId: teams.bracketId
      })
      .from(teams)
      .where(and(
        eq(teams.bracketId, flightId),
        eq(teams.status, 'approved')
      ));

    if (!flightTeams.length) {
      return {
        isValid: false,
        conflicts: [],
        participatingTeams: [],
        minimumRestPeriod: 0
      };
    }

    console.log(`[Championship Conflict] Found ${flightTeams.length} teams in flight ${flightId}:`, 
      flightTeams.map(t => t.name));

    // Get the rest period requirement for this flight
    const formatConfig = await db
      .select({
        restPeriod: gameFormats.restPeriod
      })
      .from(gameFormats)
      .where(eq(gameFormats.bracketId, flightId))
      .limit(1);

    const minimumRestPeriod = formatConfig.length > 0 ? formatConfig[0].restPeriod : 120; // Default 2 hours
    console.log(`[Championship Conflict] Using minimum rest period: ${minimumRestPeriod} minutes`);

    // Find the most recent game for each team in this flight
    const teamIds = flightTeams.map(t => t.id);
    const recentGames = await db
      .select({
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamName: games.homeTeamName,
        awayTeamName: games.awayTeamName,
        startTime: games.startTime,
        duration: games.duration
      })
      .from(games)
      .where(and(
        or(
          ...teamIds.flatMap(teamId => [
            eq(games.homeTeamId, teamId),
            eq(games.awayTeamId, teamId)
          ])
        ),
        isNotNull(games.startTime),
        isNotNull(games.duration)
      ));

    console.log(`[Championship Conflict] Found ${recentGames.length} games for teams in flight`);

    // Calculate conflicts for each team
    const conflicts: ConflictDetail[] = [];
    const teamParticipation = new Map<number, Date>(); // Track last game end time for each team

    for (const team of flightTeams) {
      // Find this team's most recent game
      const teamGames = recentGames.filter(game => 
        game.homeTeamId === team.id || game.awayTeamId === team.id
      );

      if (teamGames.length === 0) {
        // Team has no games yet, no conflict
        console.log(`[Championship Conflict] Team ${team.name} has no previous games`);
        continue;
      }

      // Find the latest game end time for this team
      let latestGameEnd: Date | null = null;
      
      for (const game of teamGames) {
        if (game.startTime && game.duration) {
          const gameStart = new Date(game.startTime);
          const gameEnd = new Date(gameStart.getTime() + (game.duration * 60 * 1000));
          
          if (!latestGameEnd || gameEnd > latestGameEnd) {
            latestGameEnd = gameEnd;
          }
        }
      }

      if (!latestGameEnd) {
        console.log(`[Championship Conflict] Team ${team.name} has games but no valid end times`);
        continue;
      }

      teamParticipation.set(team.id, latestGameEnd);

      // Check if rest period is sufficient
      const timeDifferenceMs = proposedStartTime.getTime() - latestGameEnd.getTime();
      const restPeriodMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

      console.log(`[Championship Conflict] Team ${team.name}: last game ended ${latestGameEnd.toISOString()}, rest period: ${restPeriodMinutes} minutes`);

      if (restPeriodMinutes < minimumRestPeriod) {
        const violation = minimumRestPeriod - restPeriodMinutes;
        conflicts.push({
          teamId: team.id,
          teamName: team.name,
          lastGameEnd: latestGameEnd,
          restPeriodViolation: violation,
          conflictType: 'rest_period'
        });

        console.log(`[Championship Conflict] REST PERIOD VIOLATION: Team ${team.name} needs ${violation} more minutes`);
      }
    }

    // Calculate suggested earliest start time if there are conflicts
    let suggestedEarliestTime: Date | undefined;
    if (conflicts.length > 0) {
      const latestRequiredEnd = Array.from(teamParticipation.values())
        .reduce((latest, endTime) => endTime > latest ? endTime : latest, new Date(0));
      
      suggestedEarliestTime = new Date(latestRequiredEnd.getTime() + (minimumRestPeriod * 60 * 1000));
      console.log(`[Championship Conflict] Suggested earliest start time: ${suggestedEarliestTime.toISOString()}`);
    }

    const result: ChampionshipConflictValidationResult = {
      isValid: conflicts.length === 0,
      conflicts,
      participatingTeams: teamIds,
      minimumRestPeriod,
      suggestedEarliestTime
    };

    console.log(`[Championship Conflict] Validation result: ${result.isValid ? 'VALID' : 'INVALID'} with ${conflicts.length} conflicts`);
    return result;

  } catch (error) {
    console.error('[Championship Conflict] Validation error:', error);
    return {
      isValid: false,
      conflicts: [],
      participatingTeams: [],
      minimumRestPeriod: 0
    };
  }
}

/**
 * Get all championship games that need conflict validation
 */
export async function getChampionshipGamesForValidation(eventId: string) {
  const championshipGames = await db
    .select({
      id: games.id,
      homeTeamName: games.homeTeamName,
      awayTeamName: games.awayTeamName,
      bracketId: games.bracketId,
      bracketName: games.bracketName,
      startTime: games.startTime,
      duration: games.duration,
      gameType: games.gameType,
      isPending: games.isPending
    })
    .from(games)
    .where(and(
      eq(games.eventId, eventId),
      or(
        eq(games.gameType, 'final'),
        eq(games.gameType, 'championship')
      ),
      eq(games.isPending, true)
    ));

  return championshipGames;
}