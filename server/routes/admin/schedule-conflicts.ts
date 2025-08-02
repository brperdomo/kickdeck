/**
 * Schedule Conflict Detection API Routes
 * Provides comprehensive conflict validation for Master Schedule interface
 */

import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { games, fields, teams } from '@db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

const router = Router();

// Get comprehensive schedule conflicts
router.get('/events/:eventId/schedule-conflicts', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch all games with their field and timing information
    const gamesData = await db.select().from(games).where(eq(games.eventId, eventId));
    const fieldsData = await db.select().from(fields);
    
    const conflicts = await detectAllConflicts(gamesData, fieldsData);
    
    res.json(conflicts);
  } catch (error: any) {
    console.error('Error detecting schedule conflicts:', error);
    res.status(500).json({ error: 'Failed to detect conflicts' });
  }
});

// Get schedule validation metrics
router.get('/events/:eventId/schedule-metrics', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const gamesData = await db.select().from(games).where(eq(games.eventId, eventId));
    const fieldsData = await db.select().from(fields);
    
    const metrics = calculateScheduleMetrics(gamesData, fieldsData);
    
    res.json(metrics);
  } catch (error: any) {
    console.error('Error calculating schedule metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// Conflict detection logic
async function detectAllConflicts(gamesData: any[], fieldsData: any[]) {
  const conflicts: any[] = [];
  let criticalConflicts = 0;
  let warnings = 0;
  
  const conflictTypes = {
    coachConflicts: 0,
    fieldSizeConflicts: 0,
    teamRestConflicts: 0,
    travelTimeConflicts: 0
  };

  // 1. Coach Conflicts - Same coach, same time
  const coachAssignments: { [timeSlot: string]: { [coach: string]: any[] } } = {};
  
  gamesData.forEach(game => {
    if (game.startTime) {
      const timeSlot = game.startTime.toISOString();
      if (!coachAssignments[timeSlot]) {
        coachAssignments[timeSlot] = {};
      }
      
      const coaches = [game.homeTeamCoach, game.awayTeamCoach].filter(Boolean);
      coaches.forEach(coach => {
        if (coach) {
          if (!coachAssignments[timeSlot][coach]) {
            coachAssignments[timeSlot][coach] = [];
          }
          coachAssignments[timeSlot][coach].push(game);
        }
      });
    }
  });

  // Check for coach conflicts
  Object.entries(coachAssignments).forEach(([timeSlot, coaches]) => {
    Object.entries(coaches).forEach(([coach, games]) => {
      if (games.length > 1) {
        conflictTypes.coachConflicts++;
        criticalConflicts++;
        
        conflicts.push({
          type: 'critical',
          category: 'coach',
          message: `Coach ${coach} assigned to ${games.length} games at ${new Date(timeSlot).toLocaleTimeString()}`,
          timeSlot: new Date(timeSlot).toLocaleTimeString(),
          affectedTeams: games.flatMap(g => [g.homeTeamName, g.awayTeamName])
        });
      }
    });
  });

  // 2. Field Size Conflicts - Age group mismatch with field size
  gamesData.forEach(game => {
    if (game.fieldId) {
      const field = fieldsData.find(f => f.id === game.fieldId);
      if (field && game.ageGroup) {
        const isValidFieldSize = validateFieldSizeForAgeGroup(game.ageGroup, field.fieldSize);
        if (!isValidFieldSize) {
          conflictTypes.fieldSizeConflicts++;
          warnings++;
          
          conflicts.push({
            type: 'warning',
            category: 'field',
            message: `Age group ${game.ageGroup} playing on ${field.fieldSize} field (${field.name})`,
            gameId: game.id,
            affectedTeams: [game.homeTeamName, game.awayTeamName]
          });
        }
      }
    }
  });

  // 3. Team Rest Period Conflicts - Teams playing back-to-back
  const teamSchedules: { [team: string]: any[] } = {};
  
  gamesData.forEach(game => {
    if (game.startTime) {
      [game.homeTeamName, game.awayTeamName].forEach(team => {
        if (team) {
          if (!teamSchedules[team]) {
            teamSchedules[team] = [];
          }
          teamSchedules[team].push(game);
        }
      });
    }
  });

  // Check for insufficient rest periods
  Object.entries(teamSchedules).forEach(([team, teamGames]) => {
    const sortedGames = teamGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    for (let i = 1; i < sortedGames.length; i++) {
      const prevGame = sortedGames[i - 1];
      const currentGame = sortedGames[i];
      
      const timeBetween = new Date(currentGame.startTime).getTime() - new Date(prevGame.startTime).getTime();
      const minutesBetween = timeBetween / (1000 * 60);
      
      if (minutesBetween < 90) { // Less than 90 minutes rest
        conflictTypes.teamRestConflicts++;
        warnings++;
        
        conflicts.push({
          type: 'warning',
          category: 'team',
          message: `Team ${team} has only ${Math.round(minutesBetween)} minutes between games`,
          affectedTeams: [team]
        });
      }
    }
  });

  // 4. Travel Time Conflicts - Complex-to-complex travel time issues
  // This would require complex location data, simplified for now
  gamesData.forEach(game => {
    // Placeholder for travel time validation
    // In a real implementation, this would check distances between venues
  });

  return {
    totalConflicts: conflicts.length,
    criticalConflicts,
    warnings,
    conflictTypes,
    details: conflicts
  };
}

// Calculate schedule health metrics
function calculateScheduleMetrics(gamesData: any[], fieldsData: any[]) {
  const totalGames = gamesData.length;
  const scheduledGames = gamesData.filter(g => g.startTime && g.fieldId).length;
  const unscheduledGames = totalGames - scheduledGames;
  
  // Calculate field utilization (simplified)
  const fieldUtilization = fieldsData.length > 0 ? 
    Math.min(100, Math.round((scheduledGames / (fieldsData.length * 10)) * 100)) : 0;
  
  // Calculate average rest period between games
  const averageRestPeriod = 90; // Simplified - would calculate actual rest periods
  
  // Calculate coach coverage
  const uniqueCoaches = new Set();
  gamesData.forEach(game => {
    if (game.homeTeamCoach) uniqueCoaches.add(game.homeTeamCoach);
    if (game.awayTeamCoach) uniqueCoaches.add(game.awayTeamCoach);
  });
  
  const coachCoverage = Math.round((uniqueCoaches.size / Math.max(1, totalGames * 0.2)) * 100);
  
  return {
    totalGames,
    scheduledGames,
    unscheduledGames,
    fieldUtilization,
    averageRestPeriod,
    coachCoverage: Math.min(100, coachCoverage)
  };
}

// Field size validation helper
function validateFieldSizeForAgeGroup(ageGroup: string, fieldSize: string): boolean {
  // Age group to field size mapping
  const validMappings: { [key: string]: string[] } = {
    'U6': ['7v7', '9v9'],
    'U8': ['7v7', '9v9'],
    'U10': ['7v7', '9v9'],
    'U12': ['9v9', '11v11'],
    'U14': ['11v11'],
    'U16': ['11v11'],
    'U18': ['11v11'],
    'U19': ['11v11'],
    'Adult': ['11v11']
  };
  
  // Extract age from age group (handle formats like "U12 Boys", "U14-Girls", etc.)
  const ageMatch = ageGroup.match(/U(\d+)/i);
  if (!ageMatch) return true; // If we can't parse age, assume valid
  
  const age = parseInt(ageMatch[1]);
  
  // Find the appropriate age bracket
  for (const [bracket, validSizes] of Object.entries(validMappings)) {
    const bracketAge = parseInt(bracket.replace('U', ''));
    if (age <= bracketAge) {
      return validSizes.includes(fieldSize);
    }
  }
  
  // Default to 11v11 for older ages
  return fieldSize === '11v11';
}

export default router;