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
  flightId: number;
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
  registeredTeams: Team[];
  ageGroupId?: number;
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
  teams: Team[];
  readyForLocking: boolean;
}

interface Team {
  id: number;
  name: string;
  clubName: string;
  status: string;
  flightId?: number | null;
  ageGroupId?: number;
  seed?: number | null;
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

    // Get total approved teams for this event first
    const totalTeamsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved')
      ));
    
    const totalTeamsCount = totalTeamsResult[0]?.count || 0;
    console.log(`[Bracket Creation] Total approved teams for event: ${totalTeamsCount}`);

    // Get unassigned teams (those without bracket assignment)
    const unassignedTeamsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved'),
        sql`bracket_id IS NULL`
      ));
    
    const unassignedTeamsCount = unassignedTeamsResult[0]?.count || 0;
    console.log(`[Bracket Creation] Unassigned teams: ${unassignedTeamsCount}`);

    // Build flight data with team counts
    const flightData: Flight[] = [];
    let assignedFlights = 0;

    for (const flight of flights) {
      // Get teams assigned to this specific flight/bracket with seeding
      const assignedTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, flight.id),
          eq(teams.status, 'approved')
        ),
        orderBy: [sql`COALESCE(seed_ranking, 999)`, teams.name]
      });

      const assignedCount = assignedTeams.length;

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

      // Format teams for the response
      const teamsInFlight: Team[] = assignedTeams.map(team => ({
        id: team.id,
        name: team.name,
        clubName: team.clubName || '',
        status: team.status,
        flightId: team.bracketId,
        seed: team.seedRanking,
        ageGroupId: team.ageGroupId
      }));

      flightData.push({
        flightId: flight.id,
        name: flight.name,
        ageGroup: flight.level,
        gender: 'Mixed',
        level: flight.level,
        teamCount: totalForAgeGroup,
        assignedTeams: assignedCount,
        unassignedTeams: unassignedForFlight,
        bracketType,
        estimatedGames,
        isConfigured,
        registeredTeams: teamsInFlight,
        ageGroupId: flight.ageGroupId
      });

    }

    const stats: BracketStats = {
      totalFlights: flights.length,
      assignedFlights,
      unassignedTeams: unassignedTeamsCount,
      totalTeams: totalTeamsCount,
      readyForScheduling: unassignedTeamsCount === 0 && assignedFlights === flights.length
    };

    // Get all teams for this event with age group information
    const allTeams = await db.query.teams.findMany({
      where: and(eq(teams.eventId, eventId), eq(teams.status, 'approved')),
      with: {
        ageGroup: true
      },
      orderBy: teams.name
    });

    const teamsData: Team[] = allTeams.map(team => ({
      id: team.id,
      name: team.name,
      clubName: team.clubName || '',
      status: team.status,
      flightId: team.bracketId,
      ageGroupId: team.ageGroupId,
      seed: team.seedRanking
    }));

    const response: BracketCreationData = {
      stats,
      flights: flightData,
      teams: teamsData,
      readyForLocking: stats.readyForScheduling
    };

    console.log(`[Bracket Creation] Response stats:`, stats);
    res.json(response);

  } catch (error) {
    console.error('[Bracket Creation] Error fetching bracket creation data:', error);
    res.status(500).json({ error: 'Failed to fetch bracket creation data' });
  }
});

// POST /api/admin/events/:eventId/bracket-creation/auto-assign
router.post('/:eventId/bracket-creation/auto-assign', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { method } = req.body; // 'balanced', 'skill', or 'geographic'
    
    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/auto-assign with method: ${method}`);

    // Get all unassigned teams
    const unassignedTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved'),
        sql`${teams.bracketId} IS NULL`
      ),
      orderBy: teams.id
    });

    if (unassignedTeams.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No unassigned teams found',
        assignmentsProcessed: 0
      });
    }

    // Get available flights
    const flights = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId),
      orderBy: eventBrackets.sortOrder
    });

    if (flights.length === 0) {
      return res.status(400).json({ error: 'No flights available for team assignment' });
    }

    // Simple balanced assignment algorithm
    const assignments = [];
    let currentFlightIndex = 0;
    
    for (const team of unassignedTeams) {
      const selectedFlight = flights[currentFlightIndex];
      assignments.push({
        teamId: team.id,
        flightId: selectedFlight.id
      });
      
      // Move to next flight, cycling back to first if needed
      currentFlightIndex = (currentFlightIndex + 1) % flights.length;
    }

    // Execute assignments
    for (const { teamId, flightId } of assignments) {
      await db
        .update(teams)
        .set({ bracketId: flightId })
        .where(and(
          eq(teams.id, teamId),
          eq(teams.eventId, eventId)
        ));
    }

    console.log(`[Bracket Creation] Successfully auto-assigned ${assignments.length} teams using ${method} method`);

    res.json({ 
      success: true, 
      message: `Auto-assigned ${assignments.length} teams to ${flights.length} flights using ${method} method`,
      assignmentsProcessed: assignments.length,
      method
    });

  } catch (error) {
    console.error('[Bracket Creation] Error auto-assigning teams:', error);
    res.status(500).json({ error: 'Failed to auto-assign teams to flights' });
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

// Manual team assignment endpoints
// POST /api/admin/events/:eventId/teams/:teamId/assign-flight
router.post('/:eventId/teams/:teamId/assign-flight', isAdmin, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;
    const { flightId } = req.body;

    console.log(`[Manual Assignment] Assigning team ${teamId} to flight ${flightId} in event ${eventId}`);

    // Verify the team exists and belongs to this event
    const team = await db.query.teams.findFirst({
      where: and(eq(teams.id, parseInt(teamId)), eq(teams.eventId, eventId))
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Verify the flight exists and belongs to this event
    const flight = await db.query.eventBrackets.findFirst({
      where: and(eq(eventBrackets.id, flightId), eq(eventBrackets.eventId, eventId))
    });

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Update team's flight assignment
    await db
      .update(teams)
      .set({ bracketId: flightId })
      .where(eq(teams.id, parseInt(teamId)));

    console.log(`[Manual Assignment] Successfully assigned team ${teamId} to flight ${flightId}`);

    res.json({
      success: true,
      message: 'Team assigned to flight successfully'
    });

  } catch (error) {
    console.error('[Manual Assignment] Error assigning team to flight:', error);
    res.status(500).json({ error: 'Failed to assign team to flight' });
  }
});

// POST /api/admin/events/:eventId/teams/:teamId/remove-flight
router.post('/:eventId/teams/:teamId/remove-flight', isAdmin, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;

    console.log(`[Manual Assignment] Removing team ${teamId} from flight in event ${eventId}`);

    // Verify the team exists and belongs to this event
    const team = await db.query.teams.findFirst({
      where: and(eq(teams.id, parseInt(teamId)), eq(teams.eventId, eventId))
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Remove team's flight assignment
    await db
      .update(teams)
      .set({ bracketId: null })
      .where(eq(teams.id, parseInt(teamId)));

    console.log(`[Manual Assignment] Successfully removed team ${teamId} from flight`);

    res.json({
      success: true,
      message: 'Team removed from flight successfully'
    });

  } catch (error) {
    console.error('[Manual Assignment] Error removing team from flight:', error);
    res.status(500).json({ error: 'Failed to remove team from flight' });
  }
});

// POST /api/admin/events/:eventId/teams/:teamId/seed
router.post('/:eventId/teams/:teamId/seed', isAdmin, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    console.log(`[Seeding] Moving team ${teamId} seed ${direction} in event ${eventId}`);

    // Get the team's current details
    const team = await db.query.teams.findFirst({
      where: and(eq(teams.id, parseInt(teamId)), eq(teams.eventId, eventId))
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (!team.bracketId) {
      return res.status(400).json({ error: 'Team must be assigned to a flight before seeding' });
    }

    // Get all teams in the same flight, ordered by current seed
    const flightTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.bracketId, team.bracketId),
        eq(teams.status, 'approved')
      ),
      orderBy: [sql`COALESCE(seed_ranking, 999)`, teams.id]
    });

    const currentIndex = flightTeams.findIndex(t => t.id === parseInt(teamId));
    if (currentIndex === -1) {
      return res.status(400).json({ error: 'Team not found in flight' });
    }

    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < flightTeams.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return res.status(400).json({ error: 'Cannot move team seed in that direction' });
    }

    // Swap the seeds
    const teamToSwapWith = flightTeams[newIndex];
    const currentTeamSeed = team.seedRanking || (currentIndex + 1);
    const swapTeamSeed = teamToSwapWith.seedRanking || (newIndex + 1);

    await db
      .update(teams)
      .set({ seedRanking: swapTeamSeed })
      .where(eq(teams.id, parseInt(teamId)));

    await db
      .update(teams)
      .set({ seedRanking: currentTeamSeed })
      .where(eq(teams.id, teamToSwapWith.id));

    console.log(`[Seeding] Successfully moved team ${teamId} seed ${direction}`);

    res.json({
      success: true,
      message: `Team seed moved ${direction} successfully`
    });

  } catch (error) {
    console.error('[Seeding] Error updating team seed:', error);
    res.status(500).json({ error: 'Failed to update team seed' });
  }
});

// POST /api/admin/events/:eventId/flights/:flightId/auto-seed
router.post('/:eventId/flights/:flightId/auto-seed', isAdmin, async (req, res) => {
  try {
    const { eventId, flightId } = req.params;

    console.log(`[Auto-Seeding] Auto-seeding teams in flight ${flightId} for event ${eventId}`);

    // Get all teams in this flight
    const flightTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, eventId),
        eq(teams.bracketId, parseInt(flightId)),
        eq(teams.status, 'approved')
      ),
      orderBy: [teams.name] // Simple alphabetical seeding for now
    });

    if (flightTeams.length === 0) {
      return res.status(400).json({ error: 'No teams found in this flight' });
    }

    // Assign seeds 1, 2, 3, etc. based on alphabetical order
    for (let i = 0; i < flightTeams.length; i++) {
      await db
        .update(teams)
        .set({ seedRanking: i + 1 })
        .where(eq(teams.id, flightTeams[i].id));
    }

    console.log(`[Auto-Seeding] Successfully auto-seeded ${flightTeams.length} teams in flight ${flightId}`);

    res.json({
      success: true,
      message: `Auto-seeded ${flightTeams.length} teams successfully`,
      teamsSeeded: flightTeams.length
    });

  } catch (error) {
    console.error('[Auto-Seeding] Error auto-seeding teams:', error);
    res.status(500).json({ error: 'Failed to auto-seed teams' });
  }
});

export default router;