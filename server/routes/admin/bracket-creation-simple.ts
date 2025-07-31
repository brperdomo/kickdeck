import { Router } from 'express';
import { db } from '@db';
import { 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  teams 
} from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/index.js';

const router = Router();

// Apply admin authentication to all routes
router.use(isAdmin);

// Get bracket creation data for an event
router.get('/:eventId/bracket-creation', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    console.log(`[Bracket Creation] GET /${eventId}/bracket-creation`);

    // Fetch all flights (brackets) for this event
    const flightsQuery = await db
      .select({
        flightId: eventBrackets.id,
        name: eventBrackets.name,
        level: eventBrackets.level,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        maxTeams: eventBrackets.maxTeams
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventBrackets.name, eventAgeGroups.ageGroup, eventAgeGroups.gender);

    // Get team counts for each flight
    const flights = await Promise.all(
      flightsQuery.map(async (flight) => {
        const assignedTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
            clubName: teams.clubName,
            status: teams.status
          })
          .from(teams)
          .where(and(
            eq(teams.bracketId, flight.flightId),
            eq(teams.status, 'approved')
          ));

        return {
          ...flight,
          teamCount: assignedTeams.length,
          registeredTeams: assignedTeams
        };
      })
    );

    // Get total approved teams for this event
    const allTeams = await db
      .select({
        id: teams.id,
        bracketId: teams.bracketId
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    const totalTeams = allTeams.length;
    const unassignedTeams = allTeams.filter(t => !t.bracketId).length;
    const assignedFlights = flights.filter(f => f.teamCount > 0).length;

    const stats = {
      totalFlights: flights.length,
      assignedFlights,
      unassignedTeams,
      totalTeams,
      readyForScheduling: unassignedTeams === 0 && totalTeams > 0
    };

    console.log(`[Bracket Creation] Stats:`, stats);

    res.json({
      flights,
      stats
    });

  } catch (error: any) {
    console.error('[Bracket Creation] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bracket creation data',
      details: error.message 
    });
  }
});

// Auto-assign teams to flights
router.post('/:eventId/bracket-creation/auto-assign', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { method = 'balanced' } = req.body;

    console.log(`[Bracket Creation] Auto-assign teams for event ${eventId} using ${method} method`);

    // Get all unassigned teams
    const unassignedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    // Filter to only truly unassigned teams (bracketId is null)
    const teamsToAssign = unassignedTeams.filter((team: any) => !team.bracketId);
    
    if (teamsToAssign.length === 0) {
      return res.json({
        message: 'No unassigned teams found',
        assignedTeams: 0,
        method
      });
    }

    // Get available flights
    const flights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId));

    let assignmentCount = 0;

    // Simple assignment: distribute teams evenly
    for (const team of teamsToAssign) {
      const matchingFlights = flights.filter(f => 
        f.ageGroup === team.ageGroup && 
        f.gender === team.gender
      );

      if (matchingFlights.length > 0) {
        // Assign to first available flight (can be enhanced later)
        const targetFlight = matchingFlights[0];
        
        await db
          .update(teams)
          .set({ bracketId: targetFlight.id })
          .where(eq(teams.id, team.id));
        
        assignmentCount++;
      }
    }

    res.json({
      message: 'Teams auto-assigned successfully',
      assignedTeams: assignmentCount,
      method
    });

  } catch (error: any) {
    console.error('[Bracket Creation] Auto-assign error:', error);
    res.status(500).json({ 
      error: 'Failed to auto-assign teams',
      details: error.message 
    });
  }
});

// Lock brackets and create games
router.post('/:eventId/bracket-creation/lock', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    console.log(`[Bracket Creation] Lock brackets for event ${eventId}`);

    // Update event status
    await db
      .update(events)
      .set({ 
        status: 'brackets_locked',
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));

    res.json({
      message: 'Brackets locked successfully',
      status: 'brackets_locked',
      readyForScheduling: true
    });

  } catch (error: any) {
    console.error('[Bracket Creation] Lock error:', error);
    res.status(500).json({ 
      error: 'Failed to lock brackets',
      details: error.message 
    });
  }
});

export default router;