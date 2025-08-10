import { Router } from 'express';
import { db } from '../../../db';
import { eventBrackets, eventAgeGroups, teams, games } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';
import { 
  validateTournamentFormat, 
  getRecommendedFormat, 
  autoFixDeprecatedFormat,
  isCrossplayFormat 
} from '../../utils/tournament-format-validator';

const router = Router();

// Get brackets for a specific age group
router.get('/:eventId/age-groups/:ageGroupId/brackets', isAdmin, async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    
    const brackets = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        description: eventBrackets.description,
        level: eventBrackets.level,
        eligibility: eventBrackets.eligibility,
        sortOrder: eventBrackets.sortOrder
      })
      .from(eventBrackets)
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          eq(eventBrackets.ageGroupId, parseInt(ageGroupId))
        )
      )
      .orderBy(eventBrackets.sortOrder);

    res.json(brackets);
  } catch (error) {
    console.error('Error fetching age group brackets:', error);
    res.status(500).json({ error: 'Failed to fetch age group brackets' });
  }
});

// Create a new bracket for an age group
router.post('/:eventId/brackets', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, level, eligibility, ageGroupId } = req.body;
    
    const newBracket = await db
      .insert(eventBrackets)
      .values({
        eventId,
        ageGroupId,
        name,
        description,
        level,
        eligibility,
        sortOrder: 0
      })
      .returning();

    res.json(newBracket[0]);
  } catch (error) {
    console.error('Error creating bracket:', error);
    res.status(500).json({ error: 'Failed to create bracket' });
  }
});

// Update a bracket
router.put('/:eventId/brackets/:bracketId', isAdmin, async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { name, description, level, eligibility } = req.body;
    
    const updatedBracket = await db
      .update(eventBrackets)
      .set({ name, description, level, eligibility })
      .where(eq(eventBrackets.id, parseInt(bracketId)))
      .returning();

    res.json(updatedBracket[0]);
  } catch (error) {
    console.error('Error updating bracket:', error);
    res.status(500).json({ error: 'Failed to update bracket' });
  }
});

// Delete a bracket
router.delete('/:eventId/brackets/:bracketId', isAdmin, async (req, res) => {
  try {
    const { bracketId } = req.params;
    
    await db
      .delete(eventBrackets)
      .where(eq(eventBrackets.id, parseInt(bracketId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bracket:', error);
    res.status(500).json({ error: 'Failed to delete bracket' });
  }
});

// Get brackets for an event
router.get('/:eventId/brackets', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    const brackets = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        maxTeams: eventBrackets.maxTeams,
        bracketType: sql<string>`COALESCE(${eventBrackets.name}, 'standard')`,
        isActive: eventBrackets.isActive,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        fieldSize: eventAgeGroups.fieldSize
      })
      .from(eventBrackets)
      .leftJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventBrackets.eventId, eventId));

    // Get team counts and game counts for each bracket
    const bracketsWithCounts = await Promise.all(
      brackets.map(async (bracket) => {
        const teamCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(teams)
          .where(
            and(
              eq(teams.eventId, eventId),
              eq(teams.status, 'approved'),
              sql`${teams.ageGroup} = ${bracket.ageGroup}`,
              sql`${teams.gender} = ${bracket.gender}`
            )
          );

        const gameCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(games)
          .where(eq(games.bracketId, bracket.id.toString()));
        
        return {
          ...bracket,
          teamCount: teamCount[0]?.count || 0,
          estimatedGames: gameCount[0]?.count || 0
        };
      })
    );

    res.json(bracketsWithCounts);
  } catch (error) {
    console.error('Error fetching brackets:', error);
    res.status(500).json({ error: 'Failed to fetch brackets' });
  }
});

// Generate brackets with specific configurations
router.post('/:eventId/brackets/generate', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { brackets: bracketConfigs } = req.body;

    let bracketsGenerated = 0;

    for (const config of bracketConfigs) {
      const { flightId, bracketType } = config;
      
      // Get flight info
      const flight = await db
        .select()
        .from(eventBrackets)
        .where(eq(eventBrackets.id, flightId))
        .limit(1);

      if (flight.length === 0) continue;

      // Get teams for this flight
      const ageGroup = await db
        .select()
        .from(eventAgeGroups)
        .where(eq(eventAgeGroups.id, flight[0].ageGroupId))
        .limit(1);

      if (ageGroup.length === 0) continue;

      const flightTeams = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.eventId, eventId),
            eq(teams.status, 'approved'),
            sql`${teams.ageGroup} = ${ageGroup[0].ageGroup}`,
            sql`${teams.gender} = ${ageGroup[0].gender}`
          )
        );

      // Generate games based on bracket type
      const generatedGames = generateGamesForBracketType(
        bracketType,
        flightTeams,
        flightId.toString()
      );

      // Insert games into database
      if (generatedGames.length > 0) {
        await db.insert(games).values(generatedGames);
        bracketsGenerated++;
      }
    }

    res.json({
      success: true,
      bracketsGenerated,
      message: `Generated ${bracketsGenerated} brackets with optimal structure`
    });
  } catch (error) {
    console.error('Error generating brackets:', error);
    res.status(500).json({ error: 'Failed to generate brackets' });
  }
});

// Auto-generate all brackets with intelligent format selection
router.post('/:eventId/brackets/auto-generate-all', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get all flights (brackets)
    const flights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .leftJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventBrackets.eventId, eventId));

    let bracketsCreated = 0;

    for (const flight of flights) {
      // Get team count for this flight
      const teamCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(teams)
        .where(
          and(
            eq(teams.eventId, eventId),
            eq(teams.status, 'approved'),
            sql`${teams.ageGroup} = ${flight.ageGroup}`,
            sql`${teams.gender} = ${flight.gender}`
          )
        );

      const totalTeams = teamCount[0]?.count || 0;
      
      if (totalTeams > 0) {
        // Get teams for this flight
        const flightTeams = await db
          .select()
          .from(teams)
          .where(
            and(
              eq(teams.eventId, eventId),
              eq(teams.status, 'approved'),
              sql`${teams.ageGroup} = ${flight.ageGroup}`,
              sql`${teams.gender} = ${flight.gender}`
            )
          );

        // Determine optimal bracket type with validation
        const bracketType = getOptimalBracketType(totalTeams);
        
        // Validate the format before proceeding
        const validation = validateTournamentFormat(bracketType, totalTeams);
        if (!validation.isValid) {
          console.error(`❌ VALIDATION ERROR: ${validation.reason}`);
          console.log(`🔧 VALIDATION: Auto-fixing to recommended format: ${validation.recommendedFormat}`);
        }
        
        const finalFormat = validation.recommendedFormat || bracketType;
        
        // Generate games
        const generatedGames = generateGamesForBracketType(
          finalFormat,
          flightTeams,
          flight.id.toString()
        );

        // Insert games
        if (generatedGames.length > 0) {
          await db.insert(games).values(generatedGames);
          bracketsCreated++;
        }
      }
    }

    res.json({
      success: true,
      bracketsCreated,
      message: `Generated ${bracketsCreated} brackets with intelligent format selection`
    });
  } catch (error) {
    console.error('Error auto-generating brackets:', error);
    res.status(500).json({ error: 'Failed to auto-generate brackets' });
  }
});

// Helper functions - UPDATED to prevent round_robin usage
function getOptimalBracketType(teamCount: number): string {
  console.log(`🎯 VALIDATION: Getting optimal bracket type for ${teamCount} teams`);
  
  // CRITICAL: Never return round_robin - use proper group formats
  const recommendedFormat = getRecommendedFormat(teamCount);
  
  console.log(`✅ VALIDATION: Recommended format for ${teamCount} teams: ${recommendedFormat}`);
  return recommendedFormat;
}

function generateGamesForBracketType(bracketType: string, teams: any[], bracketId: string) {
  const games = [];
  
  // Helper function to randomize Home/Away assignments
  function randomizeHomeAway(team1: any, team2: any) {
    const random = Math.random() < 0.5;
    return random 
      ? { homeTeamId: team1.id, awayTeamId: team2.id }
      : { homeTeamId: team2.id, awayTeamId: team1.id };
  }
  
  // Auto-fix deprecated formats before processing
  const validatedFormat = autoFixDeprecatedFormat(bracketType, teams.length);
  if (validatedFormat !== bracketType) {
    console.log(`🔧 AUTO-FIX: Changed format from '${bracketType}' to '${validatedFormat}' for ${teams.length} teams`);
    bracketType = validatedFormat;
  }

  switch (bracketType) {
    case 'group_of_4':
      // Generate 4-team group format: round-robin + championship
      console.log(`🎯 GROUP_OF_4: Generating games for ${teams.length} teams`);
      
      // Take first 4 teams if more are provided
      const selectedTeams = teams.slice(0, Math.min(4, teams.length));
      
      // Generate round-robin among selected teams
      for (let i = 0; i < selectedTeams.length; i++) {
        for (let j = i + 1; j < selectedTeams.length; j++) {
          const { homeTeamId, awayTeamId } = randomizeHomeAway(selectedTeams[i], selectedTeams[j]);
          games.push({
            bracketId,
            homeTeamId,
            awayTeamId,
            gameNumber: games.length + 1,
            round: 1,
            status: 'scheduled'
          });
        }
      }
      
      // Add championship final (placeholder)
      games.push({
        bracketId,
        homeTeamId: null,
        awayTeamId: null,
        gameNumber: games.length + 1,
        round: 2,
        status: 'pending'
      });
      break;
      
    case 'group_of_6':
      // Generate 6-team dual pool format (3v3 pools + cross-pool + championship)
      console.log(`🎯 GROUP_OF_6: Generating games for ${teams.length} teams`);
      
      if (teams.length >= 6) {
        const poolA = teams.slice(0, 3);
        const poolB = teams.slice(3, 6);
        
        // Pool A round-robin
        for (let i = 0; i < poolA.length; i++) {
          for (let j = i + 1; j < poolA.length; j++) {
            const { homeTeamId, awayTeamId } = randomizeHomeAway(poolA[i], poolA[j]);
            games.push({
              bracketId,
              homeTeamId,
              awayTeamId,
              gameNumber: games.length + 1,
              round: 1,
              status: 'scheduled'
            });
          }
        }
        
        // Pool B round-robin
        for (let i = 0; i < poolB.length; i++) {
          for (let j = i + 1; j < poolB.length; j++) {
            const { homeTeamId, awayTeamId } = randomizeHomeAway(poolB[i], poolB[j]);
            games.push({
              bracketId,
              homeTeamId,
              awayTeamId,
              gameNumber: games.length + 1,
              round: 1,
              status: 'scheduled'
            });
          }
        }
        
        // Cross-pool games
        for (let i = 0; i < 3; i++) {
          const { homeTeamId, awayTeamId } = randomizeHomeAway(poolA[i], poolB[i]);
          games.push({
            bracketId,
            homeTeamId,
            awayTeamId,
            gameNumber: games.length + 1,
            round: 1,
            status: 'scheduled'
          });
        }
        
        // Championship final
        games.push({
          bracketId,
          homeTeamId: null,
          awayTeamId: null,
          gameNumber: games.length + 1,
          round: 2,
          status: 'pending'
        });
      }
      break;

    case 'group_of_8':
      // Generate 8-team dual bracket format (4v4 pools + cross-pool + championship)
      console.log(`🎯 GROUP_OF_8: Generating games for ${teams.length} teams`);
      
      if (teams.length >= 8) {
        const poolA = teams.slice(0, 4);
        const poolB = teams.slice(4, 8);
        
        // Pool A round-robin
        for (let i = 0; i < poolA.length; i++) {
          for (let j = i + 1; j < poolA.length; j++) {
            const { homeTeamId, awayTeamId } = randomizeHomeAway(poolA[i], poolA[j]);
            games.push({
              bracketId,
              homeTeamId,
              awayTeamId,
              gameNumber: games.length + 1,
              round: 1,
              status: 'scheduled'
            });
          }
        }
        
        // Pool B round-robin
        for (let i = 0; i < poolB.length; i++) {
          for (let j = i + 1; j < poolB.length; j++) {
            const { homeTeamId, awayTeamId } = randomizeHomeAway(poolB[i], poolB[j]);
            games.push({
              bracketId,
              homeTeamId,
              awayTeamId,
              gameNumber: games.length + 1,
              round: 1,
              status: 'scheduled'
            });
          }
        }
        
        // Championship final
        games.push({
          bracketId,
          homeTeamId: null,
          awayTeamId: null,
          gameNumber: games.length + 1,
          round: 2,
          status: 'pending'
        });
      }
      break;
      
    case 'single_elimination':
      // Generate single elimination bracket
      const rounds = Math.ceil(Math.log2(teams.length));
      let currentRound = 1;
      let gameNumber = 1;
      
      // First round with randomized Home/Away
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          const { homeTeamId, awayTeamId } = randomizeHomeAway(teams[i], teams[i + 1]);
          games.push({
            bracketId,
            homeTeamId,
            awayTeamId,
            gameNumber: gameNumber++,
            round: currentRound,
            status: 'scheduled'
          });
        }
      }
      
      // Subsequent rounds (placeholder games)
      for (let round = 2; round <= rounds; round++) {
        const gamesInRound = Math.pow(2, rounds - round);
        for (let game = 0; game < gamesInRound; game++) {
          games.push({
            bracketId,
            homeTeamId: null,
            awayTeamId: null,
            gameNumber: gameNumber++,
            round: round,
            status: 'pending'
          });
        }
      }
      break;
      
    case 'crossplay':
    case 'group_of_6_crossplay':
    case 'crossover_bracket_6_teams':
    case 'full_crossplay':
      // CRITICAL FIX: Handle crossplay formats properly using group_id to separate pools
      console.log(`🚨 CROSSPLAY FIX: Generating crossplay games for ${teams.length} teams`);
      
      if (teams.length !== 6) {
        console.error(`❌ CROSSPLAY ERROR: Expected 6 teams for crossplay, got ${teams.length}`);
        throw new Error(`Crossplay format requires exactly 6 teams, got ${teams.length}`);
      }
      
      // Split teams by group_id (Pool A vs Pool B) NOT by array position
      const poolA = teams.filter(team => team.groupId === teams[0]?.groupId).slice(0, 3);
      const poolB = teams.filter(team => team.groupId !== teams[0]?.groupId).slice(0, 3);
      
      // Fallback: if group_id approach fails, use array position (this should not happen)
      if (poolA.length !== 3 || poolB.length !== 3) {
        console.warn(`⚠️ CROSSPLAY FALLBACK: group_id separation failed, using array position`);
        const poolA_fallback = teams.slice(0, 3);
        const poolB_fallback = teams.slice(3, 6);
        poolA.length = 0;
        poolB.length = 0;
        poolA.push(...poolA_fallback);
        poolB.push(...poolB_fallback);
      }
      
      console.log(`🔄 CROSSPLAY Pool A (group ${poolA[0]?.groupId}):`, poolA.map(t => `${t.name} (ID:${t.id})`));
      console.log(`🔄 CROSSPLAY Pool B (group ${poolB[0]?.groupId}):`, poolB.map(t => `${t.name} (ID:${t.id})`));
      
      // Validate that we have different groups
      if (poolA[0]?.groupId === poolB[0]?.groupId) {
        console.error(`❌ CROSSPLAY CRITICAL: All teams are in same group_id (${poolA[0]?.groupId}). Cannot generate crossplay!`);
        throw new Error(`Crossplay requires teams in different groups. All teams are in group ${poolA[0]?.groupId}`);
      }
      
      // Generate ONLY crossplay games (Pool A vs Pool B) - comprehensive 9-game matrix
      const crossplayPairs = [
        [0, 0], // A1 vs B1
        [1, 1], // A2 vs B2
        [2, 2], // A3 vs B3
        [0, 1], // A1 vs B2
        [1, 2], // A2 vs B3
        [2, 0], // A3 vs B1
        [0, 2], // A1 vs B3
        [1, 0], // A2 vs B1
        [2, 1]  // A3 vs B2
      ];
      
      crossplayPairs.forEach(([aIdx, bIdx], gameIndex) => {
        const teamA = poolA[aIdx];
        const teamB = poolB[bIdx];
        
        if (!teamA || !teamB) {
          console.error(`❌ CROSSPLAY SKIP: Missing team A[${aIdx}] or B[${bIdx}]`);
          return;
        }
        
        const { homeTeamId, awayTeamId } = randomizeHomeAway(teamA, teamB);
        games.push({
          bracketId,
          homeTeamId,
          awayTeamId,
          gameNumber: gameIndex + 1,
          round: 1,
          status: 'scheduled'
        });
        
        console.log(`✅ CROSSPLAY GAME ${gameIndex + 1}: ${teamA.name} (Group ${teamA.groupId}) vs ${teamB.name} (Group ${teamB.groupId})`);
      });
      
      console.log(`🎯 CROSSPLAY SUCCESS: Generated ${games.length} proper crossplay games (Pool A vs Pool B only)`);
      break;
      
    default:
      // CRITICAL FIX: Prevent unintended round-robin games in unknown formats
      console.log(`⚠️  UNKNOWN FORMAT WARNING: Format '${bracketType}' not recognized. Creating minimal games to prevent errors.`);
      
      // For unknown formats, create a single placeholder game to prevent the system from breaking
      // This prevents the catastrophic bug where all teams play each other in crossplay
      if (teams.length >= 2) {
        const { homeTeamId, awayTeamId } = randomizeHomeAway(teams[0], teams[1]);
        games.push({
          bracketId,
          homeTeamId,
          awayTeamId,
          gameNumber: 1,
          round: 1,
          status: 'pending' // Mark as pending so admin can review
        });
        
        console.log(`⚠️  DEFAULT: Created single placeholder game for unknown format '${bracketType}'`);
        console.log(`⚠️  ADMIN ACTION REQUIRED: Review and configure proper tournament format`);
      }
  }
  
  return games;
}

export default router;