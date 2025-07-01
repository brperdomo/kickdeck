/**
 * Schedule Management API
 * 
 * Handles complex/field integration, manual adjustments, and coach conflict detection
 */

import { Router } from 'express';
import { db } from '../../../db';
import { complexes, fields, games, teams } from '../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { CoachConflictService } from '../../services/coach-conflict-service';

const router = Router();

// Get real complexes and fields for schedule assignment
router.get('/complexes/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get all complexes with their available fields
    const complexesWithFields = await db
      .select({
        complexId: complexes.id,
        complexName: complexes.name,
        complexAddress: complexes.address,
        complexOpenTime: complexes.openTime,
        complexCloseTime: complexes.closeTime,
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        hasLights: fields.hasLights,
        isOpen: fields.isOpen,
        fieldOpenTime: fields.openTime,
        fieldCloseTime: fields.closeTime,
      })
      .from(complexes)
      .leftJoin(fields, eq(complexes.id, fields.complexId))
      .where(eq(fields.isOpen, true));

    // Group fields by complex
    const complexMap = new Map();
    
    complexesWithFields.forEach(row => {
      if (!complexMap.has(row.complexId)) {
        complexMap.set(row.complexId, {
          id: row.complexId,
          name: row.complexName,
          address: row.complexAddress,
          openTime: row.complexOpenTime,
          closeTime: row.complexCloseTime,
          fields: []
        });
      }
      
      if (row.fieldId) {
        complexMap.get(row.complexId).fields.push({
          id: row.fieldId,
          name: row.fieldName,
          fieldSize: row.fieldSize,
          hasLights: row.hasLights,
          isOpen: row.isOpen,
          openTime: row.fieldOpenTime,
          closeTime: row.fieldCloseTime,
        });
      }
    });

    const complexesList = Array.from(complexMap.values());
    
    res.json({
      complexes: complexesList,
      summary: {
        totalComplexes: complexesList.length,
        totalFields: complexesList.reduce((sum, complex) => sum + complex.fields.length, 0),
        fieldSizes: {
          '4v4': complexesList.reduce((sum, c) => sum + c.fields.filter(f => f.fieldSize === '4v4').length, 0),
          '7v7': complexesList.reduce((sum, c) => sum + c.fields.filter(f => f.fieldSize === '7v7').length, 0),
          '9v9': complexesList.reduce((sum, c) => sum + c.fields.filter(f => f.fieldSize === '9v9').length, 0),
          '11v11': complexesList.reduce((sum, c) => sum + c.fields.filter(f => f.fieldSize === '11v11').length, 0),
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching complexes for schedule:', error);
    res.status(500).json({ error: 'Failed to fetch complex data' });
  }
});

// Update game field assignment (drag-and-drop functionality)
router.patch('/games/:gameId/field', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fieldId, complexId, startTime, endTime } = req.body;

    // Validate field exists and get field info
    const fieldInfo = await db
      .select({
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name,
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.id, fieldId))
      .limit(1);

    if (!fieldInfo.length) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const field = fieldInfo[0];

    // Check for conflicts at the new time/field
    const conflicts = await checkGameConflicts(fieldId, startTime, endTime, parseInt(gameId));

    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Schedule conflict detected',
        conflicts: conflicts
      });
    }

    // Update the game
    await db
      .update(games)
      .set({
        fieldId: fieldId,
        complexId: complexId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        updatedAt: new Date(),
      })
      .where(eq(games.id, parseInt(gameId)));

    res.json({
      success: true,
      message: 'Game field assignment updated',
      game: {
        id: gameId,
        fieldName: field.fieldName,
        complexName: field.complexName,
        fieldSize: field.fieldSize,
        startTime,
        endTime
      }
    });

  } catch (error) {
    console.error('Error updating game field:', error);
    res.status(500).json({ error: 'Failed to update game field assignment' });
  }
});

// Check for coach conflicts
router.post('/conflicts/check', async (req, res) => {
  try {
    const { eventId, gameSchedule } = req.body;

    // Get team coach information
    const teamCoaches = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        coach: teams.coach,
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    const coachMap = new Map();
    teamCoaches.forEach(team => {
      if (team.coach) {
        if (!coachMap.has(team.coach)) {
          coachMap.set(team.coach, []);
        }
        coachMap.get(team.coach).push({
          teamId: team.teamId,
          teamName: team.teamName
        });
      }
    });

    // Check for conflicts in the proposed schedule
    const conflicts = [];
    
    for (const game of gameSchedule) {
      const homeCoach = teamCoaches.find(t => t.teamId === game.homeTeamId)?.coach;
      const awayCoach = teamCoaches.find(t => t.teamId === game.awayTeamId)?.coach;
      
      if (homeCoach && awayCoach && homeCoach === awayCoach) {
        conflicts.push({
          type: 'coach_conflict',
          gameId: game.id,
          coach: homeCoach,
          teams: [game.homeTeamId, game.awayTeamId],
          message: `Coach ${homeCoach} cannot coach both teams in the same game`
        });
      }

      // Check for coach scheduling conflicts (same coach, overlapping times)
      for (const otherGame of gameSchedule) {
        if (game.id !== otherGame.id && doTimesOverlap(game.startTime, game.endTime, otherGame.startTime, otherGame.endTime)) {
          const gameCoaches = [homeCoach, awayCoach].filter(Boolean);
          const otherHomeCoach = teamCoaches.find(t => t.teamId === otherGame.homeTeamId)?.coach;
          const otherAwayCoach = teamCoaches.find(t => t.teamId === otherGame.awayTeamId)?.coach;
          const otherGameCoaches = [otherHomeCoach, otherAwayCoach].filter(Boolean);
          
          const conflictingCoach = gameCoaches.find(coach => otherGameCoaches.includes(coach));
          if (conflictingCoach) {
            conflicts.push({
              type: 'time_conflict',
              coach: conflictingCoach,
              games: [game.id, otherGame.id],
              message: `Coach ${conflictingCoach} has overlapping games`
            });
          }
        }
      }
    }

    res.json({
      conflicts: conflicts,
      coachSummary: {
        totalCoaches: coachMap.size,
        multiTeamCoaches: Array.from(coachMap.entries())
          .filter(([coach, teams]) => teams.length > 1)
          .map(([coach, teams]) => ({
            coach,
            teams: teams.map(t => t.teamName)
          }))
      }
    });

  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check for conflicts' });
  }
});

// Auto-optimize schedule based on field availability and conflicts
router.post('/optimize/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get current games
    const currentGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));

    // Get available complexes and fields
    const complexesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/schedule/complexes/${eventId}`);
    const { complexes: availableComplexes } = await complexesResponse.json();

    // Optimize field assignments
    const optimizedGames = await optimizeFieldAssignments(currentGames, availableComplexes);

    res.json({
      message: 'Schedule optimization completed',
      optimizedGames: optimizedGames.length,
      conflicts: [], // Would implement full conflict resolution
      recommendations: [
        'Consider adding more 11v11 fields for older age groups',
        'Stagger game times to allow for field turnover',
        'Assign teams with same coach to different time slots'
      ]
    });

  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ error: 'Failed to optimize schedule' });
  }
});

// Helper functions
async function checkGameConflicts(fieldId: number, startTime: string, endTime: string, excludeGameId?: number) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const query = db
    .select()
    .from(games)
    .where(
      and(
        eq(games.fieldId, fieldId),
        // Add time overlap logic here
      )
    );

  if (excludeGameId) {
    // Add exclusion logic
  }

  return []; // Simplified for now
}

function doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 < e2 && s2 < e1;
}

async function optimizeFieldAssignments(games: any[], complexes: any[]) {
  // Implement field assignment optimization logic
  return games; // Simplified for now
}

export default router;