// ─── Conflict Detection Hook ────────────────────────────────────────────────

import { useMemo } from 'react';
import type { CalendarGame, ConflictInfo, FlightConfig } from './calendarTypes';
import { timeToMinutes, minutesToTime, isWinnerPlaceholder } from './calendarUtils';

interface ConflictDetectionOptions {
  games: CalendarGame[];
  selectedDate: string;
  flightConfigs: FlightConfig[];
}

/** Derive rest period for a game from flight configs or fallback defaults */
function getRestPeriod(game: CalendarGame, configs: FlightConfig[]): number {
  // Try matching by bracket name or age group
  const match = configs.find(
    (c) =>
      c.flightName === game.bracketName ||
      c.ageGroup === game.ageGroup,
  );
  if (match?.restPeriod) return match.restPeriod;

  // Age-group fallback
  const ag = (game.ageGroup || '').toUpperCase();
  if (/U1[3-9]/.test(ag)) return 120;
  if (/U[7-9]|U1[0-2]/.test(ag)) return 90;
  return 60;
}

function getMaxGamesPerDay(game: CalendarGame, configs: FlightConfig[]): number {
  const match = configs.find(
    (c) =>
      c.flightName === game.bracketName ||
      c.ageGroup === game.ageGroup,
  );
  return match?.maxGamesPerDay || 2;
}

export function useConflictDetection({
  games,
  selectedDate,
  flightConfigs,
}: ConflictDetectionOptions) {
  const conflicts = useMemo<ConflictInfo[]>(() => {
    const result: ConflictInfo[] = [];

    // Filter to games on the selected date that have actual scheduling info
    const dayGames = games.filter((g) => {
      const d = g.startTime?.split('T')[0] || g.date;
      return d === selectedDate && g.startTime;
    });

    // ── Pairwise: team overlap & rest period ────────────────────────────────
    for (let i = 0; i < dayGames.length; i++) {
      const g1 = dayGames[i];
      const start1 = timeToMinutes(g1.startTime);
      const end1 = start1 + g1.duration;

      for (let j = i + 1; j < dayGames.length; j++) {
        const g2 = dayGames[j];
        const start2 = timeToMinutes(g2.startTime);
        const end2 = start2 + g2.duration;

        // Real team names (exclude TBD placeholders)
        const teams1 = [g1.homeTeamName, g1.awayTeamName].filter(
          (t) => t && !isWinnerPlaceholder(t),
        );
        const teams2 = [g2.homeTeamName, g2.awayTeamName].filter(
          (t) => t && !isWinnerPlaceholder(t),
        );
        const sharedTeams = teams1.filter((t) => teams2.includes(t));
        if (sharedTeams.length === 0) continue;

        const hasOverlap = start1 < end2 && start2 < end1;

        if (hasOverlap) {
          result.push({
            type: 'team_conflict',
            severity: 'error',
            message: `${sharedTeams.join(', ')} has overlapping games: ${minutesToTime(start1)}–${minutesToTime(end1)} and ${minutesToTime(start2)}–${minutesToTime(end2)}`,
            gameIds: [g1.id, g2.id],
          });
        } else {
          // Rest period check
          const gap = Math.min(
            Math.abs(end1 - start2),
            Math.abs(end2 - start1),
          );
          const required = Math.max(
            getRestPeriod(g1, flightConfigs),
            getRestPeriod(g2, flightConfigs),
          );
          if (gap < required) {
            result.push({
              type: 'rest_period',
              severity: 'warning',
              message: `${sharedTeams.join(', ')} has ${gap}min rest between games (min: ${required}min)`,
              gameIds: [g1.id, g2.id],
            });
          }
        }
      }
    }

    // ── Games per day per team ───────────────────────────────────────────────
    const teamGamesMap = new Map<string, CalendarGame[]>();
    for (const g of dayGames) {
      for (const name of [g.homeTeamName, g.awayTeamName]) {
        if (!name || isWinnerPlaceholder(name)) continue;
        const list = teamGamesMap.get(name) || [];
        list.push(g);
        teamGamesMap.set(name, list);
      }
    }

    teamGamesMap.forEach((teamGames, teamName) => {
      const limit = getMaxGamesPerDay(teamGames[0], flightConfigs);
      if (teamGames.length > limit) {
        result.push({
          type: 'games_per_day',
          severity: 'error',
          message: `${teamName} has ${teamGames.length} games on ${selectedDate} (limit: ${limit})`,
          gameIds: teamGames.map((g) => g.id),
        });
      }
    });

    // ── Field double-booking ────────────────────────────────────────────────
    for (let i = 0; i < dayGames.length; i++) {
      const g1 = dayGames[i];
      if (!g1.fieldId) continue;
      const start1 = timeToMinutes(g1.startTime);
      const end1 = start1 + g1.duration;

      for (let j = i + 1; j < dayGames.length; j++) {
        const g2 = dayGames[j];
        if (g2.fieldId !== g1.fieldId) continue;
        const start2 = timeToMinutes(g2.startTime);
        const end2 = start2 + g2.duration;

        if (start1 < end2 && start2 < end1) {
          result.push({
            type: 'field_conflict',
            severity: 'error',
            message: `Field ${g1.fieldName} double-booked: ${minutesToTime(start1)}–${minutesToTime(end1)} and ${minutesToTime(start2)}–${minutesToTime(end2)}`,
            gameIds: [g1.id, g2.id],
          });
        }
      }
    }

    return result;
  }, [games, selectedDate, flightConfigs]);

  // Build a quick lookup: gameId → conflictInfo[]
  const gameConflicts = useMemo(() => {
    const map = new Map<number, ConflictInfo[]>();
    for (const c of conflicts) {
      for (const id of c.gameIds) {
        const list = map.get(id) || [];
        list.push(c);
        map.set(id, list);
      }
    }
    return map;
  }, [conflicts]);

  return { conflicts, gameConflicts };
}
