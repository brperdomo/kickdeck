import { Router } from 'express';
import { db } from '@db';
import { 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  teams 
} from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();
router.use(isAdmin);

// Get bracket creation data for an event
router.get('/:eventId/bracket-creation', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    console.log(`[Bracket Creation] GET /${eventId}/bracket-creation`);

    // Direct SQL query to get flights for the event
    const flightsQuery = await db
      .select({
        flightId: eventBrackets.id,
        name: eventBrackets.name,
        level: eventBrackets.level,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, String(eventId)));

    // Get team counts for each flight
    const eventFlights = [];
    for (const flight of flightsQuery) {
      const teamCount = await db
        .select()
        .from(teams)
        .where(and(
          eq(teams.bracketId, flight.flightId),
          eq(teams.status, 'approved')
        ));

      eventFlights.push({
        ...flight,
        teamCount: teamCount.length,
        registeredTeams: teamCount
      });
    }

    // Get total teams for event
    const eventTeams = await db
      .select()
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, String(eventId)),
        eq(teams.status, 'approved')
      ));

    const unassignedTeams = eventTeams.filter(t => !t.teams.bracketId);

    const stats = {
      totalFlights: eventFlights.length,
      assignedFlights: eventFlights.filter(f => f.teamCount > 0).length,
      unassignedTeams: unassignedTeams.length,
      totalTeams: eventTeams.length,
      readyForScheduling: unassignedTeams.length === 0 && eventTeams.length > 0
    };

    console.log(`[Bracket Creation] Stats:`, stats);
    res.json({ flights: eventFlights, stats });

  } catch (error: any) {
    console.error('[Bracket Creation] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bracket creation data',
      details: error.message 
    });
  }
});

// Auto-assign teams
router.post('/:eventId/bracket-creation/auto-assign', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    console.log(`[Bracket Creation] Auto-assign teams for event ${eventId}`);

    // Get unassigned teams
    const allTeams = await db.query.teams.findMany({
      where: (teams, { eq }) => eq(teams.status, 'approved'),
      with: {
        ageGroup: true
      }
    });

    const unassignedTeams = allTeams.filter(t => 
      t.ageGroup && 
      String(t.ageGroup.eventId) === String(eventId) && 
      !t.bracketId
    );

    if (unassignedTeams.length === 0) {
      return res.json({
        message: 'No unassigned teams found',
        assignedTeams: 0,
        method: 'balanced'
      });
    }

    // Get flights for this event
    const flights = await db.query.eventBrackets.findMany({
      with: {
        ageGroup: true
      }
    });

    const eventFlights = flights.filter(f => 
      f.ageGroup && String(f.ageGroup.eventId) === String(eventId)
    );

    let assignmentCount = 0;

    // Simple assignment logic
    for (const team of unassignedTeams) {
      const matchingFlights = eventFlights.filter(f => 
        f.ageGroup?.ageGroup === team.ageGroup?.ageGroup && 
        f.ageGroup?.gender === team.ageGroup?.gender
      );

      if (matchingFlights.length > 0) {
        // Assign to first flight (Elite priority)
        const targetFlight = matchingFlights.find(f => f.name === 'Elite') || matchingFlights[0];
        
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
      method: 'balanced'
    });

  } catch (error: any) {
    console.error('[Bracket Creation] Auto-assign error:', error);
    res.status(500).json({ 
      error: 'Failed to auto-assign teams',
      details: error.message 
    });
  }
});

// Lock brackets
router.post('/:eventId/bracket-creation/lock', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    console.log(`[Bracket Creation] Lock brackets for event ${eventId}`);

    await db
      .update(events)
      .set({ 
        status: 'brackets_locked',
        updatedAt: new Date().toISOString()
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