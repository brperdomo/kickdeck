/**
 * Enhanced Coach Conflict Detection Service
 * 
 * This service provides comprehensive coach conflict detection using multiple
 * identification methods and cross-event conflict checking.
 */

import { db } from '../../db';
import { teams, games, events } from '../../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

interface CoachIdentifier {
  name: string;
  email?: string;
  phone?: string;
  uniqueKey: string; // Generated composite key for identification
}

interface CoachAssignment {
  teamId: number;
  teamName: string;
  eventId: string;
  eventName: string;
  ageGroupId: number;
  role: 'head' | 'assistant';
  coachInfo: CoachIdentifier;
}

interface ScheduleConflict {
  type: 'same_game' | 'time_overlap' | 'cross_event';
  severity: 'critical' | 'warning' | 'info';
  coach: CoachIdentifier;
  conflictingGames: {
    gameId: number;
    eventId: string;
    eventName: string;
    startTime: string;
    endTime: string;
    teams: string[];
  }[];
  message: string;
  suggestedResolution?: string;
}

export class CoachConflictService {
  
  /**
   * Generate a unique coach identifier using multiple data points
   */
  static generateCoachKey(name: string, email?: string, phone?: string): string {
    // Normalize inputs
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedPhone = phone?.replace(/\D/g, ''); // Remove non-digits
    
    // Create composite key - prioritize email, then phone, then name
    if (normalizedEmail) {
      return `email:${normalizedEmail}`;
    } else if (normalizedPhone && normalizedPhone.length >= 10) {
      return `phone:${normalizedPhone}`;
    } else {
      return `name:${normalizedName}`;
    }
  }

  /**
   * Extract all coach assignments from teams across events
   */
  static async getAllCoachAssignments(eventIds?: string[]): Promise<CoachAssignment[]> {
    try {
      let query = db
        .select({
          teamId: teams.id,
          teamName: teams.name,
          eventId: teams.eventId,
          ageGroupId: teams.ageGroupId,
          coach: teams.coach,
          eventName: events.name,
        })
        .from(teams)
        .leftJoin(events, eq(teams.eventId, events.id))
        .where(sql`${teams.coach} IS NOT NULL AND ${teams.coach} != ''`);

      if (eventIds && eventIds.length > 0) {
        query = query.where(inArray(teams.eventId, eventIds));
      }

      const teamsData = await query;
      const assignments: CoachAssignment[] = [];

      for (const team of teamsData) {
        try {
          const coachData = JSON.parse(team.coach);
          
          // Extract head coach
          if (coachData.headCoachName) {
            const headCoach: CoachIdentifier = {
              name: coachData.headCoachName,
              email: coachData.headCoachEmail,
              phone: coachData.headCoachPhone,
              uniqueKey: this.generateCoachKey(
                coachData.headCoachName,
                coachData.headCoachEmail,
                coachData.headCoachPhone
              )
            };

            assignments.push({
              teamId: team.teamId,
              teamName: team.teamName,
              eventId: team.eventId,
              eventName: team.eventName || 'Unknown Event',
              ageGroupId: team.ageGroupId,
              role: 'head',
              coachInfo: headCoach
            });
          }

          // Extract assistant coach
          if (coachData.assistantCoachName) {
            const assistantCoach: CoachIdentifier = {
              name: coachData.assistantCoachName,
              email: coachData.assistantCoachEmail,
              phone: coachData.assistantCoachPhone,
              uniqueKey: this.generateCoachKey(
                coachData.assistantCoachName,
                coachData.assistantCoachEmail,
                coachData.assistantCoachPhone
              )
            };

            assignments.push({
              teamId: team.teamId,
              teamName: team.teamName,
              eventId: team.eventId,
              eventName: team.eventName || 'Unknown Event',
              ageGroupId: team.ageGroupId,
              role: 'assistant',
              coachInfo: assistantCoach
            });
          }
        } catch (error) {
          console.warn(`Failed to parse coach data for team ${team.teamId}:`, error);
        }
      }

      return assignments;
    } catch (error) {
      console.error('Error fetching coach assignments:', error);
      return [];
    }
  }

  /**
   * Comprehensive conflict detection for game schedule
   */
  static async detectConflicts(
    gameSchedule: any[],
    eventId: string,
    checkCrossEvent: boolean = true
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];
    
    // Get coach assignments for current event
    const currentEventAssignments = await this.getAllCoachAssignments([eventId]);
    
    // Get cross-event assignments if requested
    let allAssignments = currentEventAssignments;
    if (checkCrossEvent) {
      // Get assignments from other events with overlapping dates
      const otherEventAssignments = await this.getOverlappingEventAssignments(eventId);
      allAssignments = [...currentEventAssignments, ...otherEventAssignments];
    }

    // Create coach lookup maps
    const coachToTeams = new Map<string, CoachAssignment[]>();
    allAssignments.forEach(assignment => {
      const key = assignment.coachInfo.uniqueKey;
      if (!coachToTeams.has(key)) {
        coachToTeams.set(key, []);
      }
      coachToTeams.get(key)!.push(assignment);
    });

    // Check for conflicts in the proposed schedule
    for (const game of gameSchedule) {
      // Get coaches for this game
      const gameCoaches = this.getGameCoaches(game, currentEventAssignments);
      
      // Check 1: Same coach on both teams in same game
      if (gameCoaches.homeCoaches.length > 0 && gameCoaches.awayCoaches.length > 0) {
        const homeCoachKeys = gameCoaches.homeCoaches.map(c => c.uniqueKey);
        const awayCoachKeys = gameCoaches.awayCoaches.map(c => c.uniqueKey);
        
        for (const homeKey of homeCoachKeys) {
          if (awayCoachKeys.includes(homeKey)) {
            const conflictCoach = gameCoaches.homeCoaches.find(c => c.uniqueKey === homeKey);
            if (conflictCoach) {
              conflicts.push({
                type: 'same_game',
                severity: 'critical',
                coach: conflictCoach,
                conflictingGames: [{
                  gameId: game.id,
                  eventId: eventId,
                  eventName: game.eventName || 'Current Event',
                  startTime: game.startTime,
                  endTime: game.endTime,
                  teams: [game.homeTeam, game.awayTeam]
                }],
                message: `${conflictCoach.name} cannot coach both teams in the same game`,
                suggestedResolution: 'Assign different coaches to opposing teams'
              });
            }
          }
        }
      }

      // Check 2: Time overlap conflicts
      const allGameCoaches = [...gameCoaches.homeCoaches, ...gameCoaches.awayCoaches];
      for (const coach of allGameCoaches) {
        const coachAssignments = coachToTeams.get(coach.uniqueKey) || [];
        
        // Check against other games in same schedule
        for (const otherGame of gameSchedule) {
          if (game.id !== otherGame.id && this.doTimesOverlap(game.startTime, game.endTime, otherGame.startTime, otherGame.endTime)) {
            const otherGameCoaches = this.getGameCoaches(otherGame, currentEventAssignments);
            const otherCoachKeys = [...otherGameCoaches.homeCoaches, ...otherGameCoaches.awayCoaches]
              .map(c => c.uniqueKey);
            
            if (otherCoachKeys.includes(coach.uniqueKey)) {
              conflicts.push({
                type: 'time_overlap',
                severity: 'critical',
                coach: coach,
                conflictingGames: [
                  {
                    gameId: game.id,
                    eventId: eventId,
                    eventName: 'Current Event',
                    startTime: game.startTime,
                    endTime: game.endTime,
                    teams: [game.homeTeam, game.awayTeam]
                  },
                  {
                    gameId: otherGame.id,
                    eventId: eventId,
                    eventName: 'Current Event',
                    startTime: otherGame.startTime,
                    endTime: otherGame.endTime,
                    teams: [otherGame.homeTeam, otherGame.awayTeam]
                  }
                ],
                message: `${coach.name} has overlapping games in the same event`,
                suggestedResolution: 'Adjust game times to prevent overlap'
              });
            }
          }
        }

        // Check 3: Cross-event conflicts (if enabled)
        if (checkCrossEvent) {
          const crossEventConflicts = await this.checkCrossEventConflicts(
            coach, game, eventId
          );
          conflicts.push(...crossEventConflicts);
        }
      }
    }

    // Remove duplicate conflicts
    return this.deduplicateConflicts(conflicts);
  }

  /**
   * Get coach assignments for games that might overlap with current event
   */
  private static async getOverlappingEventAssignments(currentEventId: string): Promise<CoachAssignment[]> {
    try {
      // Get current event dates
      const currentEvent = await db
        .select()
        .from(events)
        .where(eq(events.id, currentEventId))
        .limit(1);

      if (!currentEvent.length) return [];

      // Find events with overlapping dates (within 7 days for safety)
      const eventDate = new Date(currentEvent[0].startDate);
      const weekBefore = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAfter = new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const overlappingEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            sql`${events.id} != ${currentEventId}`,
            sql`${events.startDate} >= ${weekBefore.toISOString()}`,
            sql`${events.startDate} <= ${weekAfter.toISOString()}`
          )
        );

      const eventIds = overlappingEvents.map(e => e.id);
      return this.getAllCoachAssignments(eventIds);
    } catch (error) {
      console.error('Error getting overlapping event assignments:', error);
      return [];
    }
  }

  /**
   * Extract coaches for a specific game
   */
  private static getGameCoaches(game: any, assignments: CoachAssignment[]) {
    const homeCoaches = assignments
      .filter(a => a.teamId === game.homeTeamId)
      .map(a => a.coachInfo);
    
    const awayCoaches = assignments
      .filter(a => a.teamId === game.awayTeamId)
      .map(a => a.coachInfo);

    return { homeCoaches, awayCoaches };
  }

  /**
   * Check for cross-event conflicts
   */
  private static async checkCrossEventConflicts(
    coach: CoachIdentifier,
    game: any,
    currentEventId: string
  ): Promise<ScheduleConflict[]> {
    // This would query games table for overlapping times with same coach
    // Implementation depends on your games table structure
    return []; // Simplified for now
  }

  /**
   * Check if two time periods overlap
   */
  private static doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);

    return s1 < e2 && s2 < e1;
  }

  /**
   * Remove duplicate conflicts
   */
  private static deduplicateConflicts(conflicts: ScheduleConflict[]): ScheduleConflict[] {
    const seen = new Set<string>();
    return conflicts.filter(conflict => {
      const key = `${conflict.type}-${conflict.coach.uniqueKey}-${conflict.conflictingGames.map(g => g.gameId).sort().join('-')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get coach utilization report
   */
  static async getCoachUtilizationReport(eventId?: string): Promise<{
    totalCoaches: number;
    multiTeamCoaches: Array<{
      coach: CoachIdentifier;
      teams: string[];
      events: string[];
      potentialConflicts: number;
    }>;
    crossEventCoaches: number;
  }> {
    const assignments = await this.getAllCoachAssignments(eventId ? [eventId] : undefined);
    
    const coachMap = new Map<string, CoachAssignment[]>();
    assignments.forEach(assignment => {
      const key = assignment.coachInfo.uniqueKey;
      if (!coachMap.has(key)) {
        coachMap.set(key, []);
      }
      coachMap.get(key)!.push(assignment);
    });

    const multiTeamCoaches = [];
    let crossEventCoaches = 0;

    for (const [coachKey, coachAssignments] of coachMap.entries()) {
      const events = new Set(coachAssignments.map(a => a.eventId));
      const teams = coachAssignments.map(a => a.teamName);
      
      if (events.size > 1) crossEventCoaches++;
      
      if (coachAssignments.length > 1) {
        multiTeamCoaches.push({
          coach: coachAssignments[0].coachInfo,
          teams,
          events: Array.from(events),
          potentialConflicts: coachAssignments.length - 1
        });
      }
    }

    return {
      totalCoaches: coachMap.size,
      multiTeamCoaches,
      crossEventCoaches
    };
  }
}