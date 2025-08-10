import { Router } from 'express';
import { db } from '@db';
import { 
  teams, 
  eventBrackets, 
  eventAgeGroups, 
  tournamentGroups,
  games 
} from '@db/schema';
import { eq, and, isNull, isNotNull, inArray, or, asc } from 'drizzle-orm';

const router = Router();

// Get bracket assignment data for all flights in an event
router.get('/events/:eventId/bracket-assignments', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`BRACKET ASSIGNMENT DEBUG: Fetching data for event ${eventId}`);

    // Get all flights (main eventBrackets that represent flights, not individual groups)
    // Identify flights by excluding Group A/B specific brackets
    const allBrackets = await db
      .select({
        flightId: eventBrackets.id,
        flightName: eventBrackets.name,
        flightLevel: eventBrackets.level,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        tournamentFormat: eventBrackets.tournamentFormat
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId));

    // Filter to get only main flights (not Group A/B sub-brackets)
    const flights = allBrackets.filter(bracket => 
      !bracket.flightName.includes('Group A') && 
      !bracket.flightName.includes('Group B') &&
      !bracket.flightName.includes('Group 1A') &&
      !bracket.flightName.includes('Group 1B') &&
      !bracket.flightName.includes('Group 2A') &&
      !bracket.flightName.includes('Group 2B')
    );

    console.log(`BRACKET ASSIGNMENT DEBUG: Found ${flights.length} flights:`, 
      flights.map(f => `${f.ageGroup} ${f.gender} - ${f.flightName}`));

    const bracketAssignmentData = await Promise.all(
      flights.map(async (flight) => {
        // Look for Group A/B brackets that belong to this flight
        const relatedBrackets = await db
          .select({
            id: eventBrackets.id,
            name: eventBrackets.name,
            tournamentFormat: eventBrackets.tournamentFormat,
            level: eventBrackets.level
          })
          .from(eventBrackets)
          .where(and(
            eq(eventBrackets.eventId, eventId),
            eq(eventBrackets.ageGroupId, flight.ageGroupId),
            // Find brackets that match this flight's name pattern
            or(
              eq(eventBrackets.name, flight.flightName),
              eq(eventBrackets.name, `${flight.flightName} Group A`),
              eq(eventBrackets.name, `${flight.flightName} Group B`),
              eq(eventBrackets.name, `${flight.flightName} Group 1A`),
              eq(eventBrackets.name, `${flight.flightName} Group 1B`),
              eq(eventBrackets.name, `${flight.flightName} Group 2A`),
              eq(eventBrackets.name, `${flight.flightName} Group 2B`)
            )
          ));

        // If no related brackets found with Group naming, this might be a single bracket flight
        let finalBrackets = relatedBrackets;
        if (relatedBrackets.length === 0) {
          // This is likely a single bracket flight, use tournament groups or the flight itself
          const tournamentGroupsForFlight = await db
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

          if (tournamentGroupsForFlight.length > 0) {
            finalBrackets = tournamentGroupsForFlight.map(tg => ({
              id: tg.id,
              name: tg.name,
              tournamentFormat: 'tournament_group',
              level: flight.flightLevel
            }));
          } else {
            // Single bracket flight - use the flight itself as the bracket
            finalBrackets = [{
              id: flight.flightId,
              name: flight.flightName,
              tournamentFormat: flight.tournamentFormat,
              level: flight.flightLevel
            }];
          }
        }

        console.log(`BRACKET ASSIGNMENT DEBUG: Flight ${flight.flightName} has ${finalBrackets.length} related brackets:`, 
          finalBrackets.map(b => b.name));

        // Get teams for each related bracket and handle crossplay Pool A/B assignments
        const bracketsWithTeams = await Promise.all(
          finalBrackets.map(async (bracket) => {
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
                eq(teams.bracketId, bracket.id),
                eq(teams.status, 'approved')
              ))
              .orderBy(asc(teams.name)); // Consistent ordering for Pool A/B assignment

            // For 6-team flights, create virtual Pool A/B brackets for assignment interface
            if (bracketTeams.length === 6) {
              // Split teams into Pool A (first 3) and Pool B (next 3) based on alphabetical order
              const poolATeams = bracketTeams.slice(0, 3);
              const poolBTeams = bracketTeams.slice(3, 6);

              return [
                {
                  id: bracket.id * 1000 + 1, // Virtual ID for Pool A
                  name: `${bracket.name} - Pool A`,
                  type: 'crossplay_pool',
                  stage: 'pool_a',
                  teamCount: poolATeams.length,
                  teams: poolATeams,
                  parentBracketId: bracket.id
                },
                {
                  id: bracket.id * 1000 + 2, // Virtual ID for Pool B  
                  name: `${bracket.name} - Pool B`,
                  type: 'crossplay_pool',
                  stage: 'pool_b',
                  teamCount: poolBTeams.length,
                  teams: poolBTeams,
                  parentBracketId: bracket.id
                }
              ];
            }

            // For non-6-team flights, return single bracket
            return [{
              id: bracket.id,
              name: bracket.name,
              type: bracket.tournamentFormat === 'crossplay' ? 'crossplay_group' : 'bracket',
              stage: 'main',
              teamCount: bracketTeams.length,
              teams: bracketTeams
            }];
          })
        );

        // Flatten the brackets array (since 6-team flights return multiple pools)
        const flattenedBrackets = bracketsWithTeams.flat();

        // Get unassigned teams for this flight
        const allFlightBracketIds = finalBrackets.map(b => b.id);
        const allTeamsInAgeGroup = await db
          .select({
            id: teams.id,
            name: teams.name,
            status: teams.status,
            bracketId: teams.bracketId,
            groupId: teams.groupId,
            seedRanking: teams.seedRanking,
            isPlaceholder: teams.isPlaceholder
          })
          .from(teams)
          .where(and(
            eq(teams.ageGroupId, flight.ageGroupId),
            eq(teams.status, 'approved')
          ));

        // Find teams that should be in this flight but aren't assigned to any of its brackets
        const assignedTeamIds = new Set(
          flattenedBrackets.flatMap(bracket => bracket.teams.map(team => team.id))
        );
        const unassignedTeams = allTeamsInAgeGroup.filter(team => 
          !assignedTeamIds.has(team.id) && 
          (!team.bracketId || allFlightBracketIds.includes(team.bracketId))
        );

        const totalTeams = flattenedBrackets.reduce((sum, bracket) => sum + bracket.teamCount, 0);

        console.log(`BRACKET ASSIGNMENT DEBUG: Flight ${flight.flightName}:
          - Total teams: ${totalTeams}
          - Brackets: ${flattenedBrackets.length}
          - Unassigned teams: ${unassignedTeams.length}`);

        // Check if this flight has completed bracket play
        const hasGames = await db.query.games.findFirst({
          where: and(
            eq(games.eventId, eventId),
            eq(games.ageGroupId, flight.ageGroupId)
          )
        });

        const isCompleted = !!hasGames && flattenedBrackets.length > 0;

        return {
          flightId: flight.flightId,
          flightName: flight.flightName,
          flightLevel: flight.flightLevel,
          ageGroup: flight.ageGroup,
          gender: flight.gender,
          birthYear: flight.birthYear,
          totalTeams: totalTeams,
          brackets: flattenedBrackets,
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
        
        // Handle virtual Pool A/B IDs (format: bracketId * 1000 + poolNumber)
        if (groupId > 10000) {
          const parentBracketId = Math.floor(groupId / 1000);
          const poolNumber = groupId % 1000;
          const poolAssignment = poolNumber === 1 ? 'pool_a' : 'pool_b';
          
          console.log(`BRACKET ASSIGNMENT DEBUG: Virtual pool assignment - Team ${teamId} to bracket ${parentBracketId}, pool ${poolAssignment}`);
          
          await db
            .update(teams)
            .set({ 
              bracketId: parentBracketId,
              groupId: groupId // Store the virtual pool ID for Pool A/B tracking
            })
            .where(eq(teams.id, teamId));
        } else {
          // Standard bracket assignment
          await db
            .update(teams)
            .set({ 
              groupId: groupId
            })
            .where(eq(teams.id, teamId));
        }
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