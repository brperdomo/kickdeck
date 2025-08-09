import { Router } from 'express';
import { db } from '@db';
import { 
  teams, 
  eventBrackets, 
  eventAgeGroups, 
  tournamentGroups 
} from '@db/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

const router = Router();

// Get bracket assignment data for all flights in an event
router.get('/events/:eventId/bracket-assignments', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`BRACKET ASSIGNMENT DEBUG: Fetching data for event ${eventId}`);

    // Get all flights (eventBrackets) for this event
    const flights = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        flightLevel: eventBrackets.level,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log(`BRACKET ASSIGNMENT DEBUG: Found ${flights.length} flights:`, 
      flights.map(f => `${f.ageGroup} ${f.gender} - ${f.flightName}`));

    const bracketAssignmentData = await Promise.all(
      flights.map(async (flight) => {
        // Get tournament groups (brackets) for this flight
        const brackets = await db
          .select({
            id: tournamentGroups.id,
            name: tournamentGroups.name,
            type: tournamentGroups.type,
            stage: tournamentGroups.stage
          })
          .from(tournamentGroups)
          .where(and(
            eq(tournamentGroups.eventId, eventId),
            eq(tournamentGroups.ageGroupId, flight.ageGroupId)
          ));

        // Get teams for each bracket
        const bracketsWithTeams = await Promise.all(
          brackets.map(async (bracket) => {
            const bracketTeams = await db
              .select({
                id: teams.id,
                name: teams.name,
                status: teams.status,
                groupId: teams.groupId,
                seedRanking: teams.seedRanking
              })
              .from(teams)
              .where(and(
                eq(teams.bracketId, flight.flightId),
                eq(teams.groupId, bracket.id),
                eq(teams.status, 'approved')
              ));

            return {
              ...bracket,
              teamCount: bracketTeams.length,
              teams: bracketTeams
            };
          })
        );

        // Get unassigned teams (teams in flight but no groupId)
        const unassignedTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
            status: teams.status,
            groupId: teams.groupId,
            seedRanking: teams.seedRanking
          })
          .from(teams)
          .where(and(
            eq(teams.bracketId, flight.flightId),
            eq(teams.status, 'approved'),
            isNull(teams.groupId)
          ));

        // Get total teams in this flight
        const totalTeams = await db
          .select()
          .from(teams)
          .where(and(
            eq(teams.bracketId, flight.flightId),
            eq(teams.status, 'approved')
          ));

        console.log(`BRACKET ASSIGNMENT DEBUG: Flight ${flight.flightName}:
          - Total teams: ${totalTeams.length}
          - Brackets: ${bracketsWithTeams.length}
          - Unassigned teams: ${unassignedTeams.length}
          - Teams in brackets: ${bracketsWithTeams.reduce((sum, b) => sum + b.teamCount, 0)}`);

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          flightLevel: flight.flightLevel,
          ageGroup: flight.ageGroup,
          gender: flight.gender,
          totalTeams: totalTeams.length,
          brackets: bracketsWithTeams,
          unassignedTeams
        };
      })
    );

    res.json(bracketAssignmentData);
  } catch (error) {
    console.error('Error fetching bracket assignment data:', error);
    res.status(500).json({ error: 'Failed to fetch bracket assignment data' });
  }
});

// Bulk assign teams to brackets within flights
router.post('/events/:eventId/teams/bulk-bracket-assign', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    console.log(`BRACKET ASSIGNMENT DEBUG: Assigning ${assignments.length} teams to brackets:`, assignments);

    // Update team bracket assignments
    await Promise.all(
      assignments.map(async ({ teamId, groupId }) => {
        console.log(`BRACKET ASSIGNMENT DEBUG: Assigning team ${teamId} to group ${groupId}`);
        
        await db
          .update(teams)
          .set({ 
            groupId: groupId
          })
          .where(eq(teams.id, teamId));
      })
    );

    console.log(`BRACKET ASSIGNMENT DEBUG: Successfully assigned ${assignments.length} teams to brackets`);
    res.json({ success: true, message: 'Teams assigned to brackets successfully' });
  } catch (error) {
    console.error('Error assigning teams to brackets:', error);
    res.status(500).json({ error: 'Failed to assign teams to brackets' });
  }
});

// Create appropriate brackets for a flight based on team count
router.post('/events/:eventId/flights/:flightId/create-brackets', async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    
    console.log(`BRACKET CREATION DEBUG: Creating brackets for flight ${flightId} in event ${eventId}`);

    // Get flight details and team count
    const flight = await db
      .select({
        ageGroupId: eventBrackets.ageGroupId,
        name: eventBrackets.name
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.id, parseInt(flightId)))
      .limit(1);

    if (flight.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Count teams in this flight
    const teamCount = await db
      .select()
      .from(teams)
      .where(and(
        eq(teams.bracketId, parseInt(flightId)),
        eq(teams.status, 'approved')
      ));

    console.log(`BRACKET CREATION DEBUG: Flight has ${teamCount.length} teams`);

    // Determine bracket structure based on team count
    let bracketsToCreate = [];
    
    if (teamCount.length <= 4) {
      // Single bracket for 4 or fewer teams
      bracketsToCreate = [
        { name: 'Single Pool', type: 'round_robin', stage: 'group_stage' }
      ];
    } else if (teamCount.length <= 6) {
      // Two crossplay brackets for 5-6 teams
      bracketsToCreate = [
        { name: 'Pool A', type: 'crossplay', stage: 'group_stage' },
        { name: 'Pool B', type: 'crossplay', stage: 'group_stage' }
      ];
    } else if (teamCount.length <= 8) {
      // Two standard brackets for 7-8 teams
      bracketsToCreate = [
        { name: 'Bracket A', type: 'round_robin', stage: 'group_stage' },
        { name: 'Bracket B', type: 'round_robin', stage: 'group_stage' }
      ];
    } else {
      // Multiple brackets for larger flights
      const bracketCount = Math.ceil(teamCount.length / 8);
      for (let i = 0; i < bracketCount; i++) {
        const letter = String.fromCharCode(65 + i); // A, B, C, etc.
        bracketsToCreate.push({
          name: `Bracket ${letter}`,
          type: 'round_robin',
          stage: 'group_stage'
        });
      }
    }

    console.log(`BRACKET CREATION DEBUG: Creating ${bracketsToCreate.length} brackets:`, bracketsToCreate.map(b => b.name));

    // Create the brackets
    const createdBrackets = [];
    for (const bracket of bracketsToCreate) {
      const [newBracket] = await db
        .insert(tournamentGroups)
        .values({
          eventId: eventId,
          ageGroupId: flight[0].ageGroupId,
          name: bracket.name,
          type: bracket.type,
          stage: bracket.stage,
          createdAt: new Date().toISOString()
        })
        .returning();
      
      createdBrackets.push(newBracket);
    }

    console.log(`BRACKET CREATION DEBUG: Created ${createdBrackets.length} brackets successfully`);
    res.json({ 
      success: true, 
      message: `Created ${createdBrackets.length} brackets for ${teamCount.length} teams`,
      brackets: createdBrackets 
    });
  } catch (error) {
    console.error('Error creating brackets:', error);
    res.status(500).json({ error: 'Failed to create brackets' });
  }
});

// Auto-balance teams across brackets within a flight
router.post('/events/:eventId/flights/:flightId/auto-balance', async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    
    console.log(`BRACKET ASSIGNMENT DEBUG: Auto-balancing flight ${flightId} in event ${eventId}`);

    // Get all teams in this flight
    const flightTeams = await db
      .select()
      .from(teams)
      .where(and(
        eq(teams.bracketId, parseInt(flightId)),
        eq(teams.status, 'approved')
      ));

    // Get available brackets for this flight
    const flight = await db
      .select({
        ageGroupId: eventBrackets.ageGroupId
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.id, parseInt(flightId)))
      .limit(1);

    if (flight.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const brackets = await db
      .select()
      .from(tournamentGroups)
      .where(and(
        eq(tournamentGroups.eventId, eventId),
        eq(tournamentGroups.ageGroupId, flight[0].ageGroupId)
      ));

    if (brackets.length === 0) {
      return res.status(400).json({ error: 'No brackets found for this flight' });
    }

    // Distribute teams evenly across brackets
    const teamsPerBracket = Math.floor(flightTeams.length / brackets.length);
    const remainderTeams = flightTeams.length % brackets.length;

    console.log(`BRACKET ASSIGNMENT DEBUG: Distributing ${flightTeams.length} teams across ${brackets.length} brackets:
      - ${teamsPerBracket} teams per bracket
      - ${remainderTeams} remainder teams`);

    // Shuffle teams for random distribution
    const shuffledTeams = [...flightTeams].sort(() => Math.random() - 0.5);
    
    let teamIndex = 0;
    
    // Assign teams to brackets
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const teamCountForThisBracket = teamsPerBracket + (i < remainderTeams ? 1 : 0);
      
      for (let j = 0; j < teamCountForThisBracket; j++) {
        if (teamIndex < shuffledTeams.length) {
          const team = shuffledTeams[teamIndex];
          
          await db
            .update(teams)
            .set({ groupId: bracket.id })
            .where(eq(teams.id, team.id));
          
          console.log(`BRACKET ASSIGNMENT DEBUG: Assigned team ${team.name} to bracket ${bracket.name}`);
          teamIndex++;
        }
      }
    }

    console.log(`BRACKET ASSIGNMENT DEBUG: Auto-balance complete - assigned ${teamIndex} teams`);
    res.json({ success: true, message: 'Teams auto-balanced across brackets successfully' });
  } catch (error) {
    console.error('Error auto-balancing brackets:', error);
    res.status(500).json({ error: 'Failed to auto-balance brackets' });
  }
});

export default router;