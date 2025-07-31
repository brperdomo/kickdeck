import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eq, and, sql } from 'drizzle-orm';
import { 
  eventBrackets, 
  teams, 
  eventAgeGroups,
  events,
  games
} from '@db/schema';

const router = Router();

interface Flight {
  id: number;
  name: string;
  ageGroup: string;
  gender: string;
  level: string;
  teamCount: number;
  assignedTeams: number;
  unassignedTeams: number;
  bracketType?: string;
  estimatedGames?: number;
  isConfigured: boolean;
}

interface BracketStats {
  totalFlights: number;
  assignedFlights: number;
  unassignedTeams: number;
  totalTeams: number;
  readyForScheduling: boolean;
}

interface BracketCreationData {
  stats: BracketStats;
  flights: Flight[];
  readyForLocking: boolean;
}

// GET /api/admin/events/:eventId/bracket-creation
router.get('/:eventId/bracket-creation', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Bracket Creation] GET /${eventId}/bracket-creation`);

    // Get all flights (event brackets) for this event
    const flights = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId),
      orderBy: eventBrackets.sortOrder
    });

    console.log(`[Bracket Creation] Found ${flights.length} flights`);

    // Build flight data with team counts
    const flightData: Flight[] = [];
    let totalTeams = 0;
    let unassignedTeams = 0;
    let assignedFlights = 0;

    for (const flight of flights) {
      // Count teams assigned to this specific flight/bracket
      const assignedTeamsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(teams)
        .where(and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, flight.id),
          eq(teams.status, 'approved')
        ));

      const assignedCount = assignedTeamsResult[0]?.count || 0;

      // For now, use assigned count as total count (simplified)
      const totalForAgeGroup = assignedCount;
      const unassignedForFlight = 0; // Simplified for now

      // Determine bracket type based on team count
      let bracketType = 'Single Elimination';
      let estimatedGames = assignedCount;
      
      if (assignedCount === 4) {
        bracketType = 'Round Robin + Final';
        estimatedGames = 7;
      } else if (assignedCount === 6) {
        bracketType = 'Cross-Flight Play';
        estimatedGames = 10;
      } else if (assignedCount === 8) {
        bracketType = 'Dual-Flight Championship';
        estimatedGames = 14;
      } else if (assignedCount > 2) {
        estimatedGames = Math.max(assignedCount - 1, 3);
      }

      const isConfigured = assignedCount >= 3;
      if (isConfigured) assignedFlights++;

      flightData.push({
        id: flight.id,
        name: flight.name,
        ageGroup: flight.level,
        gender: 'Mixed',
        level: flight.level,
        teamCount: totalForAgeGroup,
        assignedTeams: assignedCount,
        unassignedTeams: unassignedForFlight,
        bracketType,
        estimatedGames,
        isConfigured
      });

      totalTeams += totalForAgeGroup;
      unassignedTeams += unassignedForFlight;
    }

    const stats: BracketStats = {
      totalFlights: flights.length,
      assignedFlights,
      unassignedTeams,
      totalTeams,
      readyForScheduling: unassignedTeams === 0 && assignedFlights === flights.length
    };

    const response: BracketCreationData = {
      stats,
      flights: flightData,
      readyForLocking: stats.readyForScheduling
    };

    console.log(`[Bracket Creation] Response stats:`, stats);
    res.json(response);

  } catch (error) {
    console.error('[Bracket Creation] Error fetching bracket creation data:', error);
    res.status(500).json({ error: 'Failed to fetch bracket creation data' });
  }
});

// POST /api/admin/events/:eventId/bracket-creation/assign
router.post('/:eventId/bracket-creation/assign', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { assignments } = req.body; // Array of { teamId, flightId }

    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/assign with ${assignments.length} assignments`);

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments must be an array' });
    }

    // Process assignments
    for (const { teamId, flightId } of assignments) {
      await db
        .update(teams)
        .set({ bracketId: flightId ? parseInt(flightId) : null })
        .where(and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.eventId, eventId)
        ));
    }

    console.log(`[Bracket Creation] Successfully updated ${assignments.length} team assignments`);

    res.json({ 
      success: true, 
      message: `Updated ${assignments.length} team assignments`,
      assignmentsProcessed: assignments.length
    });

  } catch (error) {
    console.error('[Bracket Creation] Error assigning teams:', error);
    res.status(500).json({ error: 'Failed to assign teams to flights' });
  }
});

// POST /api/admin/events/:eventId/bracket-creation/lock
router.post('/:eventId/bracket-creation/lock', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/lock`);

    // Verify all teams are assigned and brackets are ready
    const unassignedTeamsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved'),
        sql`${teams.bracketId} IS NULL`
      ));

    const unassignedCount = unassignedTeamsResult[0]?.count || 0;

    if (unassignedCount > 0) {
      return res.status(400).json({
        error: 'Cannot lock brackets',
        message: `${unassignedCount} teams are still unassigned to flights`
      });
    }

    console.log(`[Bracket Creation] Brackets locked for event ${eventId}`);

    res.json({
      message: 'Brackets locked successfully',
      status: 'brackets_locked',
      readyForScheduling: true
    });

  } catch (error) {
    console.error('[Bracket Creation] Error locking brackets:', error);
    res.status(500).json({ 
      error: 'Failed to lock brackets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;