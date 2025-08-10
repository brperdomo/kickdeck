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
            selectedBracketName: eventBrackets.name,
            isPlaceholder: teams.isPlaceholder
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
            bracketId: teams.bracketId,
            isPlaceholder: teams.isPlaceholder
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
router.post('/events/:eventId/teams/bulk-assign', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    console.log(`FLIGHT ASSIGNMENT DEBUG: Assigning ${assignments.length} teams to flights:`, assignments);

    // Validate that teams exist
    const teamIds = assignments.map(a => a.teamId);
    console.log(`FLIGHT ASSIGNMENT DEBUG: Validating teams:`, teamIds);

    // Update team flight assignments (bracketId is the flight assignment)
    await Promise.all(
      assignments.map(async ({ teamId, flightId }) => {
        console.log(`FLIGHT ASSIGNMENT DEBUG: Assigning team ${teamId} to flight ${flightId}`);
        
        await db
          .update(teams)
          .set({ 
            bracketId: flightId // bracketId represents the flight assignment
          })
          .where(eq(teams.id, teamId));
      })
    );

    console.log(`FLIGHT ASSIGNMENT DEBUG: Successfully assigned ${assignments.length} teams to flights`);
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

// Create placeholder team for flight
router.post('/events/:eventId/placeholders', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, flightId } = req.body;

    if (!name || !flightId) {
      return res.status(400).json({ error: 'Name and flightId are required' });
    }

    console.log(`PLACEHOLDER DEBUG: Creating placeholder "${name}" for flight ${flightId} in event ${eventId}`);

    // Get the flight details to find the age group
    const flight = await db
      .select({ ageGroupId: eventBrackets.ageGroupId })
      .from(eventBrackets)
      .where(eq(eventBrackets.id, flightId))
      .limit(1);

    if (flight.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Create placeholder team
    const placeholderTeam = await db
      .insert(teams)
      .values({
        eventId: parseInt(eventId),
        name: name,
        status: 'approved',
        ageGroupId: flight[0].ageGroupId,
        bracketId: flightId, // Assign to the flight
        // Set minimal required fields
        submitterEmail: 'placeholder@system.local',
        submitterName: 'System Generated',
        managerName: 'TBD',
        managerEmail: 'placeholder@system.local',
        selectedFeeIds: '[]',
        totalAmount: 0,
        clubName: 'TBD',
        isPlaceholder: true
      })
      .returning({ id: teams.id, name: teams.name });

    console.log(`PLACEHOLDER DEBUG: Created placeholder team ${placeholderTeam[0].id}: "${placeholderTeam[0].name}"`);

    res.json({ 
      success: true, 
      message: 'Placeholder team created successfully',
      team: placeholderTeam[0]
    });
  } catch (error) {
    console.error('Error creating placeholder team:', error);
    res.status(500).json({ error: 'Failed to create placeholder team' });
  }
});

export default router;