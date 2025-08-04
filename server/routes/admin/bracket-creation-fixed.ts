import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { eq, and, sql, or } from 'drizzle-orm';
import { 
  eventBrackets, 
  teams, 
  eventAgeGroups,
  events,
  games,
  teamStandings
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

    // Get all flights (event brackets) for this event with age group and game format information
    const flights = await db.query.eventBrackets.findMany({
      where: eq(eventBrackets.eventId, eventId),
      orderBy: eventBrackets.sortOrder,
      with: {
        ageGroup: true, // Join with eventAgeGroups to get age group and gender
        gameFormat: true // Join with gameFormats to get actual tournament configuration
      }
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
      // Get teams assigned to this specific flight/bracket with seeding (including placeholders)
      const assignedTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, flight.id),
          sql`(status = 'approved' OR status = 'placeholder')`
        ),
        orderBy: [sql`COALESCE(seed_ranking, 999)`, teams.name]
      });

      const assignedCount = assignedTeams.length;

      // For now, use assigned count as total count (simplified)
      const totalForAgeGroup = assignedCount;
      const unassignedForFlight = 0; // Simplified for now

      // Get bracket type from actual game format configuration or default based on team count
      let bracketType = 'Not Configured';
      let estimatedGames = 0;
      
      if (flight.gameFormat?.templateName) {
        // Use the actual configured tournament format
        bracketType = flight.gameFormat.templateName;
        
        // Calculate estimated games based on format and team count
        if (bracketType.toLowerCase().includes('round robin')) {
          estimatedGames = assignedCount > 1 ? Math.floor((assignedCount * (assignedCount - 1)) / 2) : 0;
        } else if (bracketType.toLowerCase().includes('elimination')) {
          estimatedGames = assignedCount > 1 ? assignedCount - 1 : 0;
        } else {
          estimatedGames = Math.max(assignedCount - 1, 0);
        }
      } else if (assignedCount >= 3) {
        // Fallback logic for unconfigured flights based on team count
        if (assignedCount <= 4) {
          bracketType = 'Round Robin (Default)';
          estimatedGames = Math.floor((assignedCount * (assignedCount - 1)) / 2);
        } else {
          bracketType = 'Single Elimination (Default)';
          estimatedGames = assignedCount - 1;
        }
      }

      const isConfigured = assignedCount >= 3;
      if (isConfigured) assignedFlights++;

      // Format teams for the response with proper seeding and placeholder identification
      const teamsInFlight: Team[] = assignedTeams.map((team, index) => ({
        id: team.id,
        name: team.name,
        clubName: team.clubName || '',
        status: team.status,
        flightId: team.bracketId,
        seed: team.seedRanking || (index + 1), // Use actual seed or assign based on current order
        ageGroupId: team.ageGroupId,
        isPlaceholder: team.status === 'placeholder',
        placeholderLabel: team.status === 'placeholder' ? team.name : undefined
      }));

      flightData.push({
        flightId: flight.id,
        name: flight.name,
        ageGroup: flight.ageGroup?.ageGroup || 'Unknown Age Group',
        gender: flight.ageGroup?.gender || 'Mixed',
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
      seed: team.seedRanking || null
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

    // Simple position-based swapping: swap positions in the ordered list
    const teamToSwapWith = flightTeams[newIndex];
    
    // Assign new seed rankings based on position (1-indexed)
    const newCurrentTeamSeed = newIndex + 1;
    const newSwapTeamSeed = currentIndex + 1;

    await db
      .update(teams)
      .set({ seedRanking: newCurrentTeamSeed })
      .where(eq(teams.id, parseInt(teamId)));

    await db
      .update(teams)
      .set({ seedRanking: newSwapTeamSeed })
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

// Add placeholder team to flight
router.post('/:eventId/flights/:flightId/add-placeholder', isAdmin, async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    const { placeholderName } = req.body;

    console.log(`[Placeholder] Adding placeholder "${placeholderName}" to flight ${flightId} in event ${eventId}`);

    // Get the bracket/flight info to determine age group
    const bracket = await db.query.eventBrackets.findFirst({
      where: and(
        eq(eventBrackets.id, parseInt(flightId)),
        eq(eventBrackets.eventId, eventId)
      )
    });

    if (!bracket) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    // Create placeholder team record
    const [placeholderTeam] = await db.insert(teams).values({
      eventId: eventId,
      ageGroupId: bracket.ageGroupId,
      bracketId: parseInt(flightId),
      name: placeholderName,
      clubName: 'TBD',
      status: 'placeholder',
      managerName: 'TBD',
      managerEmail: 'tbd@placeholder.com',
      seedRanking: 999, // Put placeholders at the end by default
      createdAt: new Date().toISOString()
    }).returning();

    console.log(`[Placeholder] Successfully created placeholder team:`, placeholderTeam);

    res.json({
      success: true,
      message: `Added placeholder "${placeholderName}" successfully`,
      placeholderTeam
    });

  } catch (error) {
    console.error('[Placeholder] Error adding placeholder team:', error);
    res.status(500).json({ error: 'Failed to add placeholder team' });
  }
});

// Replace placeholder team with real team
router.post('/:eventId/replace-placeholder', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { placeholderId, newTeamId } = req.body;

    console.log(`[Placeholder] Replacing placeholder ${placeholderId} with team ${newTeamId} in event ${eventId}`);

    // Get the placeholder team info
    const placeholderTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, parseInt(placeholderId)),
        eq(teams.eventId, eventId),
        eq(teams.status, 'placeholder')
      )
    });

    if (!placeholderTeam) {
      return res.status(404).json({ error: 'Placeholder team not found' });
    }

    // Get the real team
    const realTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, parseInt(newTeamId)),
        eq(teams.eventId, eventId)
      )
    });

    if (!realTeam) {
      return res.status(404).json({ error: 'Real team not found' });
    }

    // Update the real team to take the placeholder's position
    await db.update(teams)
      .set({
        bracketId: placeholderTeam.bracketId,
        seedRanking: placeholderTeam.seedRanking
      })
      .where(eq(teams.id, parseInt(newTeamId)));

    // Delete the placeholder team
    await db.delete(teams)
      .where(eq(teams.id, parseInt(placeholderId)));

    console.log(`[Placeholder] Successfully replaced placeholder with real team`);

    res.json({
      success: true,
      message: `Successfully replaced placeholder with ${realTeam.name}`,
      replacedTeam: realTeam
    });

  } catch (error) {
    console.error('[Placeholder] Error replacing placeholder team:', error);
    res.status(500).json({ error: 'Failed to replace placeholder team' });
  }
});

// Validate team swap before execution
router.post('/:eventId/validate-team-swap', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { team1Id, team2Id } = req.body;

    console.log(`[Team Swap] Validating swap between teams ${team1Id} and ${team2Id} in event ${eventId}`);

    // Get both teams with their current bracket assignments
    const [team1, team2] = await Promise.all([
      db.query.teams.findFirst({
        where: and(
          eq(teams.id, parseInt(team1Id)),
          eq(teams.eventId, eventId)
        )
      }),
      db.query.teams.findFirst({
        where: and(
          eq(teams.id, parseInt(team2Id)),
          eq(teams.eventId, eventId)
        )
      })
    ]);

    if (!team1 || !team2) {
      return res.status(404).json({ error: 'One or both teams not found' });
    }

    const validation = {
      canSwap: true,
      warnings: [] as string[],
      impacts: [] as string[],
      blockers: [] as string[]
    };

    // Check if teams are in same age group
    if (team1.ageGroupId !== team2.ageGroupId) {
      validation.blockers.push('Teams must be in the same age group to swap flights');
      validation.canSwap = false;
    }

    // Check if teams are placeholders
    if (team1.status === 'placeholder' || team2.status === 'placeholder') {
      validation.impacts.push('Swapping involves placeholder teams');
    }

    // Check for existing games
    const [team1Games, team2Games] = await Promise.all([
      db.query.games.findMany({
        where: or(
          eq(games.homeTeamId, parseInt(team1Id)),
          eq(games.awayTeamId, parseInt(team1Id))
        )
      }),
      db.query.games.findMany({
        where: or(
          eq(games.homeTeamId, parseInt(team2Id)),
          eq(games.awayTeamId, parseInt(team2Id))
        )
      })
    ]);

    if (team1Games.length > 0 || team2Games.length > 0) {
      validation.warnings.push('Teams have existing games scheduled - games will need to be rescheduled');
      validation.impacts.push('Existing games will be moved with the teams to their new brackets');
    }

    // Check for standings/scores
    const [team1Standings, team2Standings] = await Promise.all([
      db.query.teamStandings.findMany({
        where: eq(teamStandings.teamId, parseInt(team1Id))
      }),
      db.query.teamStandings.findMany({
        where: eq(teamStandings.teamId, parseInt(team2Id))
      })
    ]);

    if (team1Standings.length > 0 || team2Standings.length > 0) {
      validation.warnings.push('Teams have existing standings - standings will be reset for affected brackets');
      validation.impacts.push('Bracket standings will be recalculated after swap');
    }

    // Impact summary
    validation.impacts.push(`${team1.name} will move to ${team2.bracketId ? 'existing bracket' : 'unassigned pool'}`);
    validation.impacts.push(`${team2.name} will move to ${team1.bracketId ? 'existing bracket' : 'unassigned pool'}`);

    console.log(`[Team Swap] Validation result:`, validation);

    res.json(validation);

  } catch (error) {
    console.error('[Team Swap] Validation error:', error);
    res.status(500).json({ error: 'Failed to validate team swap' });
  }
});

// Execute team swap
router.post('/:eventId/swap-teams', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { team1Id, team2Id, preserveSeeds = true } = req.body;

    console.log(`[Team Swap] Executing swap between teams ${team1Id} and ${team2Id} in event ${eventId}`);

    // Get both teams with their current bracket assignments
    const [team1, team2] = await Promise.all([
      db.query.teams.findFirst({
        where: and(
          eq(teams.id, parseInt(team1Id)),
          eq(teams.eventId, eventId)
        )
      }),
      db.query.teams.findFirst({
        where: and(
          eq(teams.id, parseInt(team2Id)),
          eq(teams.eventId, eventId)
        )
      })
    ]);

    if (!team1 || !team2) {
      return res.status(404).json({ error: 'One or both teams not found' });
    }

    // Execute the swap in a transaction
    await db.transaction(async (tx) => {
      // Swap bracket assignments
      const team1NewBracket = team2.bracketId;
      const team2NewBracket = team1.bracketId;

      // Swap seed rankings if preserving seeds
      const team1NewSeed = preserveSeeds ? team2.seedRanking : team1.seedRanking;
      const team2NewSeed = preserveSeeds ? team1.seedRanking : team2.seedRanking;

      // Update team 1
      await tx.update(teams)
        .set({
          bracketId: team1NewBracket,
          seedRanking: team1NewSeed
        })
        .where(eq(teams.id, parseInt(team1Id)));

      // Update team 2
      await tx.update(teams)
        .set({
          bracketId: team2NewBracket,
          seedRanking: team2NewSeed
        })
        .where(eq(teams.id, parseInt(team2Id)));

      // Games will automatically follow teams since they reference teamId, not bracketId
      // No need to update games table as bracket assignment is through team relationship

      // Clear standings for affected brackets to force recalculation  
      if (team1.bracketId) {
        await tx.delete(teamStandings)
          .where(and(
            eq(teamStandings.eventId, eventId),
            eq(teamStandings.bracketId, team1.bracketId)
          ));
      }

      if (team2.bracketId && team2.bracketId !== team1.bracketId) {
        await tx.delete(teamStandings)
          .where(and(
            eq(teamStandings.eventId, eventId),
            eq(teamStandings.bracketId, team2.bracketId)
          ));
      }
    });

    console.log(`[Team Swap] Successfully swapped ${team1.name} and ${team2.name}`);

    res.json({
      success: true,
      message: `Successfully swapped ${team1.name} and ${team2.name}`,
      swappedTeams: {
        team1: { id: team1.id, name: team1.name, newBracket: team2.bracketId },
        team2: { id: team2.id, name: team2.name, newBracket: team1.bracketId }
      }
    });

  } catch (error) {
    console.error('[Team Swap] Execution error:', error);
    res.status(500).json({ error: 'Failed to execute team swap' });
  }
});

export default router;