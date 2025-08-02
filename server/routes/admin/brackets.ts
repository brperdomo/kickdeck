import { Router } from 'express';
import { db } from '../../../db';
import { eventBrackets, eventAgeGroups, teams, games } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Get brackets for a specific age group within an event
router.get('/:eventId/age-groups/:ageGroupId/brackets', isAdmin, async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    
    const brackets = await db
      .select({
        id: eventBrackets.id,
        event_id: eventBrackets.eventId,
        age_group_id: eventBrackets.ageGroupId,
        name: eventBrackets.name,
        description: eventBrackets.description,
        level: eventBrackets.level,
        eligibility: eventBrackets.eligibility,
        created_at: eventBrackets.createdAt,
        updated_at: eventBrackets.updatedAt
      })
      .from(eventBrackets)
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          eq(eventBrackets.ageGroupId, parseInt(ageGroupId))
        )
      );

    res.json(brackets);
  } catch (error) {
    console.error('Error fetching brackets for age group:', error);
    res.status(500).json({ error: 'Failed to fetch brackets' });
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
        bracketType: sql<string>`COALESCE(${eventBrackets.name}, 'standard')`,
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
              eq(teams.ageGroupId, bracket.ageGroupId)
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

// Create a new bracket
router.post('/:eventId/brackets', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, level, eligibility, ageGroupId } = req.body;

    const newBracket = await db
      .insert(eventBrackets)
      .values({
        eventId: eventId,
        ageGroupId: parseInt(ageGroupId),
        name,
        description,
        level,
        eligibility
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
      .set({
        name,
        description,
        level,
        eligibility,
        updatedAt: new Date().toISOString().slice(0, 19) + 'Z'
      })
      .where(eq(eventBrackets.id, parseInt(bracketId)))
      .returning();

    if (updatedBracket.length === 0) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

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

    const deletedBracket = await db
      .delete(eventBrackets)
      .where(eq(eventBrackets.id, parseInt(bracketId)))
      .returning();

    if (deletedBracket.length === 0) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    res.json({ success: true, message: 'Bracket deleted successfully' });
  } catch (error) {
    console.error('Error deleting bracket:', error);
    res.status(500).json({ error: 'Failed to delete bracket' });
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

        // Determine optimal bracket type
        const bracketType = getOptimalBracketType(totalTeams);
        
        // Generate games
        const generatedGames = generateGamesForBracketType(
          bracketType,
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

// Helper functions
function getOptimalBracketType(teamCount: number): string {
  if (teamCount <= 4) return 'round_robin';
  if (teamCount <= 8) return 'round_robin';
  if (teamCount <= 16) return 'single_elimination';
  return 'pool_play';
}

function generateGamesForBracketType(bracketType: string, teams: any[], bracketId: string) {
  const games = [];
  
  switch (bracketType) {
    case 'round_robin':
      // Generate round robin games
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          games.push({
            bracketId,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            gameNumber: games.length + 1,
            round: 1,
            status: 'scheduled'
          });
        }
      }
      break;
      
    case 'single_elimination':
      // Generate single elimination bracket
      const rounds = Math.ceil(Math.log2(teams.length));
      let currentRound = 1;
      let gameNumber = 1;
      
      // First round
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          games.push({
            bracketId,
            homeTeamId: teams[i].id,
            awayTeamId: teams[i + 1].id,
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
      
    default:
      // Default to round robin for small groups
      for (let i = 0; i < teams.length && i < 6; i++) {
        for (let j = i + 1; j < teams.length && j < 6; j++) {
          games.push({
            bracketId,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            gameNumber: games.length + 1,
            round: 1,
            status: 'scheduled'
          });
        }
      }
  }
  
  return games;
}

export default router;