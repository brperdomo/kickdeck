import { Router } from 'express';
import { db } from '@db';
import { 
  teams, 
  eventBrackets, 
  eventAgeGroups, 
  tournamentGroups,
  games 
} from '@db/schema';
import { eq, and, isNull, isNotNull, inArray } from 'drizzle-orm';

const router = Router();

// Get bracket assignment data for all flights in an event
router.get('/events/:eventId/bracket-assignments', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`BRACKET ASSIGNMENT DEBUG: Fetching data for event ${eventId}`);

    // Get all flights (eventBrackets) for this event with birth years
    const flights = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        flightLevel: eventBrackets.level,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear
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
                seedRanking: teams.seedRanking,
                isPlaceholder: teams.isPlaceholder
              })
              .from(teams)
              .where(and(
                eq(teams.bracketId, flight.flightId),
                eq(teams.groupId, bracket.id)
                // Include both approved teams and placeholder teams (status filtering removed)
              ));

            return {
              ...bracket,
              teamCount: bracketTeams.length,
              teams: bracketTeams
            };
          })
        );

        // Get unassigned teams (teams in flight but no groupId) - include approved teams only, not placeholders
        const unassignedTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
            status: teams.status,
            groupId: teams.groupId,
            seedRanking: teams.seedRanking,
            isPlaceholder: teams.isPlaceholder
          })
          .from(teams)
          .where(and(
            eq(teams.bracketId, flight.flightId),
            eq(teams.status, 'approved'),
            isNull(teams.groupId),
            eq(teams.isPlaceholder, false) // Only real teams, not placeholders
          ));

        // Get total teams in this flight (both approved and placeholders)
        const totalTeams = await db
          .select()
          .from(teams)
          .where(eq(teams.bracketId, flight.flightId));

        console.log(`BRACKET ASSIGNMENT DEBUG: Flight ${flight.flightName}:
          - Total teams: ${totalTeams.length}
          - Brackets: ${bracketsWithTeams.length}
          - Unassigned teams: ${unassignedTeams.length}
          - Teams in brackets: ${bracketsWithTeams.reduce((sum, b) => sum + b.teamCount, 0)}`);

        // Check if this flight has completed bracket play (has games generated)
        const hasGames = await db.query.games.findFirst({
          where: and(
            eq(games.eventId, eventId),
            eq(games.ageGroupId, flight.ageGroupId)
          )
        });

        const isCompleted = !!hasGames && bracketsWithTeams.length > 0;

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          flightLevel: flight.flightLevel,
          ageGroup: flight.ageGroup,
          gender: flight.gender,
          birthYear: flight.birthYear,
          totalTeams: totalTeams.length,
          brackets: bracketsWithTeams,
          unassignedTeams,
          isCompleted
        };
      })
    );

    // Sort flights by gender (boys first) then by age descending
    const sortedData = bracketAssignmentData.sort((a, b) => {
      // Boys first, then girls
      if (a.gender !== b.gender) {
        return a.gender === 'Boys' ? -1 : 1;
      }
      // Within same gender, sort by birth year descending (older first)
      return parseInt(String(b.birthYear || '0')) - parseInt(String(a.birthYear || '0'));
    });

    res.json(sortedData);
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

// Add placeholder team to bracket
router.post('/events/:eventId/brackets/:bracketId/add-placeholder', async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    const { placeholderName } = req.body;
    
    console.log(`PLACEHOLDER DEBUG: Adding placeholder "${placeholderName}" to bracket ${bracketId}`);
    
    if (!placeholderName || placeholderName.trim() === '') {
      return res.status(400).json({ error: 'Placeholder name is required' });
    }

    // Get bracket details to find eventId and ageGroupId
    const bracket = await db
      .select({
        eventId: tournamentGroups.eventId,
        ageGroupId: tournamentGroups.ageGroupId
      })
      .from(tournamentGroups)
      .where(eq(tournamentGroups.id, parseInt(bracketId)))
      .limit(1);

    if (bracket.length === 0) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    // Create a placeholder team entry
    await db
      .insert(teams)
      .values({
        eventId: bracket[0].eventId,
        ageGroupId: bracket[0].ageGroupId,
        name: placeholderName.trim(),
        status: 'placeholder',
        groupId: parseInt(bracketId),
        createdAt: new Date().toISOString()
      });

    console.log(`PLACEHOLDER DEBUG: Successfully added placeholder team "${placeholderName}"`);
    res.json({ success: true, message: 'Placeholder team added successfully' });
  } catch (error) {
    console.error('Error adding placeholder team:', error);
    res.status(500).json({ error: 'Failed to add placeholder team' });
  }
});

// Replace placeholder team with real team
router.post('/events/:eventId/teams/:placeholderTeamId/replace-with/:realTeamId', async (req, res) => {
  try {
    const { placeholderTeamId, realTeamId } = req.params;
    
    console.log(`PLACEHOLDER REPLACE DEBUG: Replacing placeholder team ${placeholderTeamId} with real team ${realTeamId}`);

    // Get the placeholder team's bracket assignment
    const placeholderTeam = await db
      .select({
        groupId: teams.groupId,
        bracketId: teams.bracketId,
        status: teams.status
      })
      .from(teams)
      .where(eq(teams.id, parseInt(placeholderTeamId)))
      .limit(1);

    if (placeholderTeam.length === 0) {
      return res.status(404).json({ error: 'Placeholder team not found' });
    }

    if (placeholderTeam[0].status !== 'placeholder') {
      return res.status(400).json({ error: 'Team is not a placeholder' });
    }

    // Transfer all scheduled games from placeholder to real team
    await db
      .update(games)
      .set({ homeTeamId: parseInt(realTeamId) })
      .where(eq(games.homeTeamId, parseInt(placeholderTeamId)));

    await db
      .update(games)
      .set({ awayTeamId: parseInt(realTeamId) })
      .where(eq(games.awayTeamId, parseInt(placeholderTeamId)));

    // Assign the real team to the placeholder's bracket position
    await db
      .update(teams)
      .set({
        groupId: placeholderTeam[0].groupId,
        bracketId: placeholderTeam[0].bracketId
      })
      .where(eq(teams.id, parseInt(realTeamId)));

    // Delete the placeholder team
    await db
      .delete(teams)
      .where(eq(teams.id, parseInt(placeholderTeamId)));

    console.log(`PLACEHOLDER REPLACE DEBUG: Successfully replaced placeholder ${placeholderTeamId} with real team ${realTeamId}`);
    res.json({ 
      success: true, 
      message: 'Placeholder team replaced successfully. All scheduled games transferred to real team.' 
    });
  } catch (error) {
    console.error('Error replacing placeholder team:', error);
    res.status(500).json({ error: 'Failed to replace placeholder team' });
  }
});

// Remove team from bracket
router.post('/events/:eventId/teams/:teamId/remove-from-bracket', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log(`BRACKET EDIT DEBUG: Removing team ${teamId} from bracket`);

    // Update team to remove bracket assignment
    await db
      .update(teams)
      .set({ 
        groupId: null,
        bracketId: null
      })
      .where(eq(teams.id, parseInt(teamId)));

    console.log(`BRACKET EDIT DEBUG: Successfully removed team ${teamId} from bracket`);
    res.json({ success: true, message: 'Team removed from bracket successfully' });
  } catch (error) {
    console.error('Error removing team from bracket:', error);
    res.status(500).json({ error: 'Failed to remove team from bracket' });
  }
});

export default router;