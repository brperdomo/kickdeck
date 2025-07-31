import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eq, and, or, sql } from 'drizzle-orm';
import { 
  games, 
  teams, 
  fields,
  eventBrackets,
  events
} from '@db/schema';

const router = Router();

interface ConflictCheck {
  type: 'field' | 'team_rest' | 'coach' | 'referee';
  severity: 'critical' | 'warning' | 'info';
  gameId: number;
  conflictWith?: number;
  message: string;
  suggestedAction?: string;
}

interface ConflictSummary {
  totalConflicts: number;
  criticalConflicts: number;
  warningConflicts: number;
  conflicts: ConflictCheck[];
  canProceed: boolean;
}

// GET /api/admin/events/:eventId/conflict-check
// Comprehensive conflict detection for tournament scheduling
router.get('/:eventId/conflict-check', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Conflict Detection] Running comprehensive check for event ${eventId}`);

    // Get all games for this event
    const eventGames = await db.query.games.findMany({
      where: eq(games.eventId, eventId),
      with: {
        homeTeam: true,
        awayTeam: true,
        field: true
      }
    });

    const conflicts: ConflictCheck[] = [];

    // 1. FIELD CONFLICTS - Multiple games on same field at same time
    await checkFieldConflicts(eventGames, conflicts);

    // 2. TEAM REST VALIDATION - Enforce minimum rest periods
    await checkTeamRestConflicts(eventGames, conflicts);

    // 3. COACH CONFLICTS - Same coach managing multiple teams
    await checkCoachConflicts(eventGames, conflicts, eventId);

    // 4. REFEREE CONFLICTS - Assignment validation
    await checkRefereeConflicts(eventGames, conflicts);

    // Calculate summary
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
    const warningConflicts = conflicts.filter(c => c.severity === 'warning').length;
    
    const summary: ConflictSummary = {
      totalConflicts: conflicts.length,
      criticalConflicts,
      warningConflicts,
      conflicts,
      canProceed: criticalConflicts === 0 // Only proceed if no critical conflicts
    };

    console.log(`[Conflict Detection] Found ${conflicts.length} conflicts (${criticalConflicts} critical)`);

    res.json(summary);

  } catch (error) {
    console.error('[Conflict Detection] Error during conflict check:', error);
    res.status(500).json({ error: 'Failed to perform conflict detection' });
  }
});

// POST /api/admin/events/:eventId/auto-resolve-conflicts
// Automatically resolve conflicts where possible
router.post('/:eventId/auto-resolve-conflicts', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { conflictTypes = ['field', 'team_rest'] } = req.body;
    
    console.log(`[Conflict Resolution] Auto-resolving conflicts for event ${eventId}`);

    let resolvedCount = 0;
    const resolutionLog = [];

    // Get current conflicts
    const currentConflicts = await getEventConflicts(eventId);
    
    for (const conflict of currentConflicts) {
      if (conflictTypes.includes(conflict.type)) {
        const resolved = await attemptAutoResolution(conflict, eventId);
        if (resolved) {
          resolvedCount++;
          resolutionLog.push({
            type: conflict.type,
            gameId: conflict.gameId,
            action: resolved.action,
            details: resolved.details
          });
        }
      }
    }

    console.log(`[Conflict Resolution] Auto-resolved ${resolvedCount} conflicts`);

    res.json({
      success: true,
      resolvedCount,
      resolutionLog,
      message: `Successfully auto-resolved ${resolvedCount} conflicts`
    });

  } catch (error) {
    console.error('[Conflict Resolution] Error during auto-resolution:', error);
    res.status(500).json({ error: 'Failed to auto-resolve conflicts' });
  }
});

// Helper Functions

async function checkFieldConflicts(games: any[], conflicts: ConflictCheck[]) {
  const gamesByField = new Map();
  
  for (const game of games) {
    if (!game.fieldId || !game.scheduledTime) continue;
    
    const fieldKey = game.fieldId;
    if (!gamesByField.has(fieldKey)) {
      gamesByField.set(fieldKey, []);
    }
    gamesByField.get(fieldKey).push(game);
  }

  // Check for overlaps within each field
  for (const [fieldId, fieldGames] of gamesByField) {
    for (let i = 0; i < fieldGames.length; i++) {
      for (let j = i + 1; j < fieldGames.length; j++) {
        const game1 = fieldGames[i];
        const game2 = fieldGames[j];
        
        if (gamesOverlap(game1, game2)) {
          conflicts.push({
            type: 'field',
            severity: 'critical',
            gameId: game1.id,
            conflictWith: game2.id,
            message: `Field conflict: Both games scheduled on ${game1.field?.name || 'Field ' + fieldId} at overlapping times`,
            suggestedAction: 'Reschedule one game to different time or field'
          });
        }
      }
    }
  }
}

async function checkTeamRestConflicts(games: any[], conflicts: ConflictCheck[]) {
  const MINIMUM_REST_MINUTES = 90; // Configurable minimum rest period
  
  const teamGames = new Map();
  
  // Group games by team
  for (const game of games) {
    if (!game.scheduledTime) continue;
    
    [game.homeTeamId, game.awayTeamId].forEach(teamId => {
      if (teamId) {
        if (!teamGames.has(teamId)) {
          teamGames.set(teamId, []);
        }
        teamGames.get(teamId).push(game);
      }
    });
  }

  // Check rest periods for each team
  for (const [teamId, teamGameList] of teamGames) {
    const sortedGames = teamGameList.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    for (let i = 0; i < sortedGames.length - 1; i++) {
      const currentGame = sortedGames[i];
      const nextGame = sortedGames[i + 1];
      
      const currentEnd = new Date(currentGame.scheduledTime);
      currentEnd.setMinutes(currentEnd.getMinutes() + (currentGame.duration || 70));
      
      const nextStart = new Date(nextGame.scheduledTime);
      const restMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (restMinutes < MINIMUM_REST_MINUTES) {
        conflicts.push({
          type: 'team_rest',
          severity: restMinutes < 60 ? 'critical' : 'warning',
          gameId: nextGame.id,
          conflictWith: currentGame.id,
          message: `Insufficient rest: Team has only ${Math.round(restMinutes)} minutes between games (minimum ${MINIMUM_REST_MINUTES})`,
          suggestedAction: 'Add more time between games or schedule on different days'
        });
      }
    }
  }
}

async function checkCoachConflicts(games: any[], conflicts: ConflictCheck[], eventId: string) {
  // This would need coach information from teams table
  // For now, we'll implement a basic check for teams with similar contact info
  
  const teamsByContact = new Map();
  
  // Get all teams for this event with contact information
  const eventTeams = await db.query.teams.findMany({
    where: eq(teams.eventId, eventId)
  });

  // Group teams by coach email (assuming coach conflicts based on same contact)
  for (const team of eventTeams) {
    const coachKey = team.coachEmail || team.contactEmail;
    if (coachKey) {
      if (!teamsByContact.has(coachKey)) {
        teamsByContact.set(coachKey, []);
      }
      teamsByContact.get(coachKey).push(team);
    }
  }

  // Check for simultaneous games with same coach
  for (const [coachEmail, coachTeams] of teamsByContact) {
    if (coachTeams.length > 1) {
      const coachTeamIds = coachTeams.map(t => t.id);
      
      for (const game of games) {
        if (!game.scheduledTime) continue;
        
        const gameTeams = [game.homeTeamId, game.awayTeamId].filter(Boolean);
        const hasCoachTeam = gameTeams.some(teamId => coachTeamIds.includes(teamId));
        
        if (hasCoachTeam) {
          // Check for other games at same time with same coach's teams
          const conflictingGames = games.filter(otherGame => 
            otherGame.id !== game.id &&
            otherGame.scheduledTime &&
            gamesOverlap(game, otherGame) &&
            [otherGame.homeTeamId, otherGame.awayTeamId].some(teamId => 
              teamId && coachTeamIds.includes(teamId)
            )
          );
          
          for (const conflictGame of conflictingGames) {
            conflicts.push({
              type: 'coach',
              severity: 'warning',
              gameId: game.id,
              conflictWith: conflictGame.id,
              message: `Coach conflict: Same coach (${coachEmail}) managing teams in overlapping games`,
              suggestedAction: 'Reschedule one game or assign assistant coach'
            });
          }
        }
      }
    }
  }
}

async function checkRefereeConflicts(games: any[], conflicts: ConflictCheck[]) {
  // Check for referee assignment overlaps
  const refereeGames = new Map();
  
  for (const game of games) {
    if (game.refereeId && game.scheduledTime) {
      if (!refereeGames.has(game.refereeId)) {
        refereeGames.set(game.refereeId, []);
      }
      refereeGames.get(game.refereeId).push(game);
    }
  }

  for (const [refereeId, refGames] of refereeGames) {
    for (let i = 0; i < refGames.length; i++) {
      for (let j = i + 1; j < refGames.length; j++) {
        const game1 = refGames[i];
        const game2 = refGames[j];
        
        if (gamesOverlap(game1, game2)) {
          conflicts.push({
            type: 'referee',
            severity: 'critical',
            gameId: game1.id,
            conflictWith: game2.id,
            message: `Referee conflict: Same referee assigned to overlapping games`,
            suggestedAction: 'Assign different referee to one of the games'
          });
        }
      }
    }
  }
}

function gamesOverlap(game1: any, game2: any): boolean {
  if (!game1.scheduledTime || !game2.scheduledTime) return false;
  
  const game1Start = new Date(game1.scheduledTime);
  const game1End = new Date(game1Start);
  game1End.setMinutes(game1End.getMinutes() + (game1.duration || 70));
  
  const game2Start = new Date(game2.scheduledTime);
  const game2End = new Date(game2Start);
  game2End.setMinutes(game2End.getMinutes() + (game2.duration || 70));
  
  return game1Start < game2End && game2Start < game1End;
}

async function getEventConflicts(eventId: string): Promise<ConflictCheck[]> {
  // This would re-run the conflict detection logic
  // For brevity, returning empty array - would normally call the main conflict check function
  return [];
}

async function attemptAutoResolution(conflict: ConflictCheck, eventId: string) {
  // Auto-resolution logic would go here
  // For now, return null (no auto-resolution implemented)
  return null;
}

export default router;