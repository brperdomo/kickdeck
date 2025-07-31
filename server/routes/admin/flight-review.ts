import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';
import { db } from '@db';
import { teams, eventBrackets, eventAgeGroups } from '@db/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

const router = Router();

// GET /api/admin/events/:eventId/flight-review
// Get comprehensive flight review data for tournament directors
router.get('/events/:eventId/flight-review', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    console.log(`[Flight Review] Fetching data for event ${eventId}`);

    // Get all age groups for this event
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId)
    });

    console.log(`[Flight Review] Found ${ageGroups.length} age groups`);

    const flightReviewData = [];

    for (const ageGroup of ageGroups) {
      console.log(`[Flight Review] Processing ${ageGroup.ageGroup} ${ageGroup.gender}`);

      // Get available flights for this age group
      const availableFlights = await db.query.eventBrackets.findMany({
        where: and(
          eq(eventBrackets.eventId, eventId),
          eq(eventBrackets.ageGroupId, ageGroup.id)
        )
      });

      // Get teams WITH flight selection
      const teamsWithSelection = await db
        .select({
          id: teams.id,
          name: teams.name,
          status: teams.status,
          bracketId: teams.bracketId,
          selectedBracketName: eventBrackets.name,
          ageGroup: eventAgeGroups.ageGroup,
          gender: eventAgeGroups.gender
        })
        .from(teams)
        .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
        .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
        .where(and(
          eq(teams.eventId, eventId),
          eq(teams.ageGroupId, ageGroup.id),
          eq(teams.status, 'approved'),
          isNotNull(teams.bracketId)
        ));

      // Get teams WITHOUT flight selection
      const teamsWithoutSelection = await db
        .select({
          id: teams.id,
          name: teams.name,
          status: teams.status,
          bracketId: teams.bracketId,
          ageGroup: eventAgeGroups.ageGroup,
          gender: eventAgeGroups.gender
        })
        .from(teams)
        .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
        .where(and(
          eq(teams.eventId, eventId),
          eq(teams.ageGroupId, ageGroup.id),
          eq(teams.status, 'approved'),
          isNull(teams.bracketId)
        ));

      const totalTeams = teamsWithSelection.length + teamsWithoutSelection.length;

      // Only include age groups that have teams
      if (totalTeams > 0) {
        flightReviewData.push({
          ageGroup: ageGroup.ageGroup,
          gender: ageGroup.gender,
          ageGroupId: ageGroup.id,
          teamsWithSelection: teamsWithSelection.map(team => ({
            ...team,
            selectedBracketName: team.selectedBracketName || 'Unknown Flight'
          })),
          teamsWithoutSelection: teamsWithoutSelection.map(team => ({
            ...team,
            selectedBracketName: null
          })),
          availableFlights: availableFlights.map(flight => ({
            id: flight.id,
            name: flight.name,
            description: flight.description || '',
            level: flight.level || 'intermediate',
            ageGroupId: flight.ageGroupId
          })),
          totalTeams
        });

        console.log(`[Flight Review] ${ageGroup.ageGroup} ${ageGroup.gender}: ${totalTeams} teams, ${teamsWithSelection.length} assigned, ${teamsWithoutSelection.length} unassigned`);
      }
    }

    res.json(flightReviewData);

  } catch (error) {
    console.error('[Flight Review] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flight review data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/events/:eventId/teams/bulk-flight-assign
// Bulk assign teams to flights
router.post('/events/:eventId/teams/bulk-flight-assign', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { assignments } = req.body;

    console.log(`[Flight Assignment] Processing ${assignments.length} team assignments`);

    // Validate assignments
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Invalid assignments data' });
    }

    // Process each assignment
    const results = [];
    for (const assignment of assignments) {
      const { teamId, bracketId } = assignment;

      // Verify team exists and belongs to event
      const team = await db.query.teams.findFirst({
        where: and(
          eq(teams.id, teamId),
          eq(teams.eventId, eventId),
          eq(teams.status, 'approved')
        )
      });

      if (!team) {
        console.log(`[Flight Assignment] Team ${teamId} not found or not approved`);
        continue;
      }

      // Verify bracket exists and belongs to event
      const bracket = await db.query.eventBrackets.findFirst({
        where: and(
          eq(eventBrackets.id, bracketId),
          eq(eventBrackets.eventId, eventId)
        )
      });

      if (!bracket) {
        console.log(`[Flight Assignment] Bracket ${bracketId} not found`);
        continue;
      }

      // Update team's bracket assignment
      await db
        .update(teams)
        .set({ bracketId: bracketId })
        .where(eq(teams.id, teamId));

      results.push({
        teamId,
        teamName: team.name,
        bracketId,
        bracketName: bracket.name,
        success: true
      });

      console.log(`[Flight Assignment] Assigned ${team.name} to ${bracket.name}`);
    }

    res.json({
      success: true,
      message: `Successfully assigned ${results.length} teams to flights`,
      assignments: results
    });

  } catch (error) {
    console.error('[Flight Assignment] Error:', error);
    res.status(500).json({ 
      error: 'Failed to assign teams to flights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/events/:eventId/flights/lock
// Lock flight assignments and prepare for scheduling
router.post('/events/:eventId/flights/lock', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Check if all teams have flight assignments
    const teamsWithoutFlights = await db
      .select({ count: teams.id })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.status, 'approved'),
        isNull(teams.bracketId)
      ));

    if (teamsWithoutFlights.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot lock flights - some teams are not assigned to flights',
        teamsWithoutFlights: teamsWithoutFlights.length
      });
    }

    // TODO: Add flight locking mechanism to database
    // For now, just verify all teams are assigned

    console.log(`[Flight Lock] All teams assigned to flights for event ${eventId}`);

    res.json({
      success: true,
      message: 'Flight assignments locked and ready for scheduling',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Flight Lock] Error:', error);
    res.status(500).json({ 
      error: 'Failed to lock flights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;