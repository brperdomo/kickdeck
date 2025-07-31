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

    // Fetch all flights (brackets) for this event with team counts
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

    // Get team counts and team details for each flight
    const flights = await Promise.all(
      flightsQuery.map(async (flight) => {
        // Get teams assigned to this flight
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

    // Get total team counts
    const totalTeamsResult = await db
      .select({
        count: teams.id
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    // Get unassigned teams count  
    const unassignedTeamsResult = await db
      .select({
        count: teams.id
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    const totalTeams = totalTeamsResult.length;
    
    // Count unassigned teams (those without bracketId)
    const unassignedCount = await db
      .select()
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));
    
    const unassignedTeams = unassignedCount.filter(t => !t.teams.bracketId).length;
    const assignedFlights = flights.filter(f => f.teamCount > 0).length;

    const stats = {
      totalFlights: flights.length,
      assignedFlights,
      unassignedTeams,
      totalTeams,
      readyForScheduling: unassignedTeams === 0 && totalTeams > 0
    };

    console.log(`[Bracket Creation] Stats calculated:`, stats);

    res.json({
      flights,
      stats
    });

  } catch (error) {
    console.error('[Bracket Creation] Error fetching bracket creation data:', error);
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

    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/auto-assign - Method: ${method}`);

    // Get all unassigned teams for this event
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
        eq(teams.status, 'approved'),
        eq(teams.bracketId, null)
      ));

    console.log(`[Bracket Creation] Found ${unassignedTeams.length} unassigned teams`);

    // Group teams by age group and gender
    const teamsByAgeGroup = unassignedTeams.reduce((acc, team) => {
      const key = `${team.ageGroup}-${team.gender}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(team);
      return acc;
    }, {} as Record<string, any[]>);

    // Get available flights for each age group
    const flights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        level: eventBrackets.level,
        ageGroupId: eventBrackets.ageGroupId,
        maxTeams: eventBrackets.maxTeams,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventBrackets.name);

    // Group flights by age group and gender
    const flightsByAgeGroup = flights.reduce((acc, flight) => {
      const key = `${flight.ageGroup}-${flight.gender}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(flight);
      return acc;
    }, {} as Record<string, any[]>);

    let assignmentCount = 0;

    // Auto-assign teams using balanced method
    for (const [ageGroupKey, teamList] of Object.entries(teamsByAgeGroup)) {
      const availableFlights = flightsByAgeGroup[ageGroupKey] || [];
      
      if (availableFlights.length === 0) {
        console.log(`[Bracket Creation] No flights available for ${ageGroupKey}`);
        continue;
      }

      // Sort flights by priority: Elite, Premier, Classic
      const flightPriority = { 'Elite': 0, 'Premier': 1, 'Classic': 2 };
      availableFlights.sort((a, b) => {
        const aPriority = flightPriority[a.name] ?? 999;
        const bPriority = flightPriority[b.name] ?? 999;
        return aPriority - bPriority;
      });

      // Distribute teams evenly across flights
      const teamsPerFlight = Math.ceil(teamList.length / availableFlights.length);
      
      for (let i = 0; i < teamList.length; i++) {
        const flightIndex = Math.floor(i / teamsPerFlight);
        const targetFlight = availableFlights[Math.min(flightIndex, availableFlights.length - 1)];
        
        await db
          .update(teams)
          .set({ bracketId: targetFlight.id })
          .where(eq(teams.id, teamList[i].id));
        
        assignmentCount++;
      }
    }

    console.log(`[Bracket Creation] Auto-assigned ${assignmentCount} teams`);

    res.json({
      message: 'Teams auto-assigned successfully',
      assignedTeams: assignmentCount,
      method
    });

  } catch (error) {
    console.error('[Bracket Creation] Error auto-assigning teams:', error);
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
    
    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/lock`);

    // Verify all teams are assigned
    const unassignedTeams = await db
      .select({ count: teams.id })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved'),
        eq(teams.bracketId, null)
      ));

    if (unassignedTeams.length > 0) {
      return res.status(400).json({
        error: 'Cannot lock brackets',
        message: `${unassignedTeams.length} teams are still unassigned`
      });
    }

    // Update event status to indicate brackets are locked
    await db
      .update(events)
      .set({ 
        status: 'brackets_locked',
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));

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
      details: error.message 
    });
  }
});

export default router;