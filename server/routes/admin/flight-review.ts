import { Router } from 'express';
import { db } from '../../../db/index.js';
import { eventAgeGroups, teams, eventBrackets } from '../../../db/schema.js';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

const router = Router();

// Get flight review data - teams with and without flight assignments
router.get('/events/:eventId/flight-review', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`FLIGHT REVIEW DEBUG: Fetching data for event ${eventId}`);

    // Get all age groups for this event with their flight options
    const ageGroups = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log(`FLIGHT REVIEW DEBUG: Found ${ageGroups.length} age groups:`, ageGroups.map(ag => `${ag.ageGroup} ${ag.gender} (ID: ${ag.id})`));

    // Sort age groups from oldest to youngest (lowest birth year to highest)
    const sortedAgeGroups = ageGroups.sort((a, b) => a.birthYear - b.birthYear);

    const flightReviewData = await Promise.all(
      sortedAgeGroups.map(async (ageGroup) => {
        // Get available flights for this age group
        const availableFlights = await db
          .select()
          .from(eventBrackets)
          .where(eq(eventBrackets.ageGroupId, ageGroup.id));

        // Get teams with flight selections
        const teamsWithSelection = await db
          .select({
            id: teams.id,
            name: teams.name,
            status: teams.status,
            bracketId: teams.bracketId,
            selectedBracketName: eventBrackets.name
          })
          .from(teams)
          .innerJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
          .where(
            and(
              eq(teams.ageGroupId, ageGroup.id),
              eq(teams.status, 'approved'),
              isNotNull(teams.bracketId)
            )
          );

        // Get teams without flight selections
        const teamsWithoutSelection = await db
          .select({
            id: teams.id,
            name: teams.name,
            status: teams.status,
            bracketId: teams.bracketId
          })
          .from(teams)
          .where(
            and(
              eq(teams.ageGroupId, ageGroup.id),
              eq(teams.status, 'approved'),
              isNull(teams.bracketId)
            )
          );

        console.log(`FLIGHT REVIEW DEBUG: Age group ${ageGroup.ageGroup} ${ageGroup.gender} (ID: ${ageGroup.id}):
          - Teams with selection: ${teamsWithSelection.length} (${teamsWithSelection.map(t => t.name).join(', ')})
          - Teams without selection: ${teamsWithoutSelection.length} (${teamsWithoutSelection.map(t => t.name).join(', ')})`);

        // Debug: Get ALL teams for this age group regardless of status to see what's happening
        const allTeamsInAgeGroup = await db
          .select({
            id: teams.id,
            name: teams.name,
            status: teams.status,
            bracketId: teams.bracketId
          })
          .from(teams)
          .where(eq(teams.ageGroupId, ageGroup.id));

        console.log(`FLIGHT REVIEW DEBUG: ALL teams in age group ${ageGroup.ageGroup} ${ageGroup.gender}:`, 
          allTeamsInAgeGroup.map(t => `${t.name} (status: ${t.status}, bracketId: ${t.bracketId})`));

        return {
          ageGroup: ageGroup.ageGroup,
          birthYear: ageGroup.birthYear,
          gender: ageGroup.gender,
          displayName: `${ageGroup.ageGroup} ${ageGroup.gender} - [${ageGroup.birthYear}]`,
          sortKey: ageGroup.birthYear, // For sorting oldest to youngest
          teamsWithSelection: teamsWithSelection.map(team => ({
            ...team,
            ageGroup: ageGroup.ageGroup,
            gender: ageGroup.gender,
            selectedBracketName: team.selectedBracketName
          })),
          teamsWithoutSelection: teamsWithoutSelection.map(team => ({
            ...team,
            ageGroup: ageGroup.ageGroup,
            gender: ageGroup.gender,
            selectedBracketName: null
          })),
          availableFlights: availableFlights.map(flight => ({
            id: flight.id,
            name: flight.name,
            description: flight.description,
            level: flight.level,
            ageGroupId: flight.ageGroupId
          })),
          totalTeams: teamsWithSelection.length + teamsWithoutSelection.length
        };
      })
    );

    res.json(flightReviewData);
  } catch (error) {
    console.error('Error fetching flight review data:', error);
    res.status(500).json({ error: 'Failed to fetch flight review data' });
  }
});

// Bulk assign teams to flights
router.post('/events/:eventId/teams/bulk-flight-assign', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    // Update team flight assignments
    await Promise.all(
      assignments.map(async ({ teamId, bracketId }) => {
        await db
          .update(teams)
          .set({ 
            bracketId: bracketId
          })
          .where(eq(teams.id, teamId));
      })
    );

    res.json({ success: true, message: 'Teams assigned to flights successfully' });
  } catch (error) {
    console.error('Error assigning teams to flights:', error);
    res.status(500).json({ error: 'Failed to assign teams to flights' });
  }
});

// Lock flights for format configuration
router.post('/events/:eventId/flights/lock', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check that all teams have flight assignments
    const teamsWithoutFlights = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          eq(eventAgeGroups.eventId, eventId),
          eq(teams.status, 'approved'),
          isNull(teams.bracketId)
        )
      );

    if (teamsWithoutFlights.length > 0) {
      return res.status(400).json({ 
        error: 'All teams must have flight assignments before locking',
        teamsWithoutFlights: teamsWithoutFlights.map(t => t.name)
      });
    }

    // We can add a flights_locked status to events table if needed
    // For now, the existence of flight assignments indicates they're locked

    res.json({ success: true, message: 'Flights locked successfully' });
  } catch (error) {
    console.error('Error locking flights:', error);
    res.status(500).json({ error: 'Failed to lock flights' });
  }
});

export default router;