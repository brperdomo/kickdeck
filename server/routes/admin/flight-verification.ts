import { Router } from 'express';
import { db } from '@db';
import { events, eventAgeGroups, eventBrackets, teams } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Comprehensive flight system verification
router.get('/verify-system', async (req, res) => {
  try {
    console.log('🔍 Verifying complete flight system integrity...');

    // Check all active events
    const eventStats = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        ageGroupsCount: db.$count(eventAgeGroups, eq(eventAgeGroups.eventId, events.id)),
        flightsCount: db.$count(eventBrackets, eq(eventBrackets.eventId, events.id)),
        teamsCount: db.$count(teams, eq(teams.eventId, events.id))
      })
      .from(events)
      .where(eq(events.isArchived, false))
      .limit(20);

    // Check flight selection availability for team registration
    const flightAvailability = await db
      .select({
        eventId: eventBrackets.eventId,
        eventName: events.name,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        tournamentFormat: eventBrackets.tournamentFormat
      })
      .from(eventBrackets)
      .innerJoin(events, eq(eventBrackets.eventId, events.id))
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(events.isArchived, false),
        eq(eventAgeGroups.isEligible, true)
      ))
      .orderBy(events.name, eventAgeGroups.ageGroup, eventAgeGroups.gender)
      .limit(30);

    // Check teams with flight assignments
    const teamsWithFlights = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        flightName: eventBrackets.name,
        tournamentFormat: eventBrackets.tournamentFormat
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
      .where(eq(teams.bracketId, teams.bracketId))
      .limit(15);

    // Summary statistics
    const totalEvents = eventStats.length;
    const eventsWithAgeGroups = eventStats.filter(e => e.ageGroupsCount > 0).length;
    const eventsWithFlights = eventStats.filter(e => e.flightsCount > 0).length;
    const eventsWithTeams = eventStats.filter(e => e.teamsCount > 0).length;
    const totalFlights = flightAvailability.length;
    const totalTeamsWithFlights = teamsWithFlights.length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalActiveEvents: totalEvents,
        eventsWithAgeGroups,
        eventsWithFlights,
        eventsWithTeams,
        totalAvailableFlights: totalFlights,
        totalTeamsWithFlightAssignments: totalTeamsWithFlights,
        systemHealth: {
          ageGroupIntegrity: `${eventsWithAgeGroups}/${totalEvents} events have age groups`,
          flightAvailability: `${eventsWithFlights}/${totalEvents} events have flights`,
          teamRegistrationWorking: `${totalTeamsWithFlights} teams successfully assigned to flights`
        }
      },
      eventDetails: eventStats,
      flightAvailability,
      sampleTeamsWithFlights: teamsWithFlights,
      recommendedActions: {
        flightSelection: 'Teams can select flights during registration via BracketSelector component',
        apiEndpoint: '/api/brackets?eventId={eventId}&ageGroupId={ageGroupId}',
        registrationFlow: 'Age Group → Flight Selection → Team Registration Complete'
      }
    });

  } catch (error) {
    console.error('Error verifying flight system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify flight system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test flight selection for a specific event and age group
router.get('/test-flight-selection/:eventId/:ageGroupId', async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    
    // Simulate what the BracketSelector component does
    const availableFlights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        description: eventBrackets.description,
        tournamentFormat: eventBrackets.tournamentFormat,
        eligibility: eventBrackets.eligibility,
        teamCount: db.$count(teams, eq(teams.bracketId, eventBrackets.id))
      })
      .from(eventBrackets)
      .where(and(
        eq(eventBrackets.eventId, eventId),
        eq(eventBrackets.ageGroupId, parseInt(ageGroupId))
      ));

    // Get age group info
    const ageGroupInfo = await db.query.eventAgeGroups.findFirst({
      where: eq(eventAgeGroups.id, parseInt(ageGroupId))
    });

    res.json({
      success: true,
      eventId,
      ageGroupId,
      ageGroupInfo,
      availableFlights,
      flightSelectionWorking: availableFlights.length > 0,
      message: availableFlights.length > 0 
        ? `Flight selection working: ${availableFlights.length} flights available`
        : 'No flights configured for this age group'
    });

  } catch (error) {
    console.error('Error testing flight selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test flight selection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;