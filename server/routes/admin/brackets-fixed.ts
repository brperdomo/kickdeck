import { Router } from 'express';
import { db } from '../../../db';
import { eventBrackets, eventAgeGroups, teams, games } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

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
        sortOrder: eventBrackets.sortOrder,
        maxTeams: eventBrackets.maxTeams,
        isActive: eventBrackets.isActive
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
    const { name, description, level, eligibility, ageGroupId, maxTeams } = req.body;
    
    const newBracket = await db
      .insert(eventBrackets)
      .values({
        eventId,
        ageGroupId,
        name,
        description,
        level,
        eligibility,
        sortOrder: 0,
        maxTeams,
        isActive: true
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
    const { name, description, level, eligibility, maxTeams, isActive } = req.body;

    const updatedBracket = await db
      .update(eventBrackets)
      .set({
        name,
        description,
        level,
        eligibility,
        maxTeams,
        isActive,
        updatedAt: new Date().toISOString()
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

    // Check if there are teams assigned to this bracket
    const teamsInBracket = await db
      .select({ count: sql`count(*)` })
      .from(teams)
      .where(eq(teams.bracketId, parseInt(bracketId)));

    if (teamsInBracket[0]?.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete bracket with assigned teams',
        teamsCount: teamsInBracket[0].count 
      });
    }

    await db
      .delete(eventBrackets)
      .where(eq(eventBrackets.id, parseInt(bracketId)));

    res.json({ message: 'Bracket deleted successfully' });
  } catch (error) {
    console.error('Error deleting bracket:', error);
    res.status(500).json({ error: 'Failed to delete bracket' });
  }
});

// Get teams assigned to a bracket
router.get('/:eventId/brackets/:bracketId/teams', isAdmin, async (req, res) => {
  try {
    const { bracketId } = req.params;
    
    const teamsInBracket = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        status: teams.status,
        seedRanking: teams.seedRanking
      })
      .from(teams)
      .where(eq(teams.bracketId, parseInt(bracketId)))
      .orderBy(teams.seedRanking);

    res.json(teamsInBracket);
  } catch (error) {
    console.error('Error fetching bracket teams:', error);
    res.status(500).json({ error: 'Failed to fetch bracket teams' });
  }
});

// Assign teams to a bracket
router.post('/:eventId/brackets/:bracketId/assign-teams', isAdmin, async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { teamIds } = req.body;

    if (!teamIds || !Array.isArray(teamIds)) {
      return res.status(400).json({ error: 'teamIds array is required' });
    }

    // Update all specified teams to be assigned to this bracket
    await db
      .update(teams)
      .set({ 
        bracketId: parseInt(bracketId),
        updatedAt: new Date().toISOString()
      })
      .where(sql`${teams.id} = ANY(${teamIds})`);

    res.json({ 
      message: 'Teams assigned successfully',
      bracketId: parseInt(bracketId),
      assignedTeams: teamIds.length 
    });
  } catch (error) {
    console.error('Error assigning teams to bracket:', error);
    res.status(500).json({ error: 'Failed to assign teams to bracket' });
  }
});

// Generate games for a bracket
router.post('/:eventId/brackets/:bracketId/generate-games', isAdmin, async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    const { format = 'round_robin' } = req.body;

    // Get teams in the bracket
    const teamsInBracket = await db
      .select()
      .from(teams)
      .where(eq(teams.bracketId, parseInt(bracketId)))
      .orderBy(teams.seedRanking);

    if (teamsInBracket.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 teams required to generate games',
        currentTeams: teamsInBracket.length 
      });
    }

    const gamesToCreate = [];
    let gameNumber = 1;

    if (format === 'round_robin') {
      // Generate round-robin matchups
      for (let i = 0; i < teamsInBracket.length; i++) {
        for (let j = i + 1; j < teamsInBracket.length; j++) {
          gamesToCreate.push({
            eventId: eventId,
            ageGroupId: teamsInBracket[i].ageGroupId,
            matchNumber: gameNumber++,
            homeTeamId: teamsInBracket[i].id,
            awayTeamId: teamsInBracket[j].id,
            round: 1,
            status: 'scheduled',
            duration: 90,
            homeYellowCards: 0,
            awayYellowCards: 0,
            homeRedCards: 0,
            awayRedCards: 0,
            breakTime: 5,
            isScoreLocked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    if (gamesToCreate.length > 0) {
      await db.insert(games).values(gamesToCreate);
    }

    res.json({ 
      message: 'Games generated successfully',
      bracketId: parseInt(bracketId),
      gamesCreated: gamesToCreate.length,
      format: format
    });
  } catch (error) {
    console.error('Error generating games for bracket:', error);
    res.status(500).json({ error: 'Failed to generate games for bracket' });
  }
});

export default router;