import { Router } from 'express';
import { db } from '../../../db';
import { and, eq, inArray } from 'drizzle-orm';
import { eventBrackets, eventAgeGroups, teams } from '../../../db/schema';
import { hasEventAccess } from '../../middleware/event-access';

const router = Router();

// Get all brackets for an event
router.get('/events/:eventId/brackets', hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get all brackets for the event
    const brackets = await db
      .select()
      .from(eventBrackets)
      .where(eq(eventBrackets.eventId, eventId))
      .orderBy(eventBrackets.sortOrder);
    
    res.json(brackets);
  } catch (error) {
    console.error('Error fetching brackets:', error);
    res.status(500).json({ error: 'Failed to fetch brackets' });
  }
});

// Get brackets for a specific age group in an event
router.get('/events/:eventId/age-groups/:ageGroupId/brackets', hasEventAccess, async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const includeTeamCount = req.query.includeTeamCount === 'true';
    
    // Get all brackets for the specific age group
    const brackets = await db
      .select()
      .from(eventBrackets)
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          eq(eventBrackets.ageGroupId, parseInt(ageGroupId))
        )
      )
      .orderBy(eventBrackets.sortOrder);
    
    // If team count is requested, get team counts for each bracket
    if (includeTeamCount) {
      const bracketIds = brackets.map(bracket => bracket.id);
      
      // Skip team count query if there are no brackets
      if (bracketIds.length === 0) {
        return res.json(brackets.map(bracket => ({
          ...bracket,
          teamCount: 0
        })));
      }
      
      // Get team counts for all brackets in one query
      const teamCounts = await db
        .select({
          bracketId: teams.bracketId,
          count: db.sql<number>`count(${teams.id})::int`
        })
        .from(teams)
        .where(
          and(
            eq(teams.eventId, eventId),
            inArray(teams.bracketId, bracketIds),
            eq(teams.status, 'approved')
          )
        )
        .groupBy(teams.bracketId);
      
      // Create a map of bracket ID to team count
      const countMap = teamCounts.reduce((map, item) => {
        map[item.bracketId] = item.count;
        return map;
      }, {});
      
      // Add team counts to brackets
      const bracketsWithCount = brackets.map(bracket => ({
        ...bracket,
        teamCount: countMap[bracket.id] || 0
      }));
      
      return res.json(bracketsWithCount);
    }
    
    res.json(brackets);
  } catch (error) {
    console.error('Error fetching age group brackets:', error);
    res.status(500).json({ error: 'Failed to fetch age group brackets' });
  }
});

// Create a new bracket for an age group
router.post('/events/:eventId/brackets', hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ageGroupId, name, description, sortOrder = 0 } = req.body;
    
    // Validate required fields
    if (!ageGroupId || !name) {
      return res.status(400).json({ error: 'Age group ID and name are required' });
    }
    
    // Verify the age group exists and belongs to the event
    const ageGroup = await db
      .select()
      .from(eventAgeGroups)
      .where(
        and(
          eq(eventAgeGroups.id, ageGroupId),
          eq(eventAgeGroups.eventId, eventId)
        )
      )
      .limit(1);
    
    if (ageGroup.length === 0) {
      return res.status(404).json({ error: 'Age group not found for this event' });
    }
    
    // Create the new bracket
    const [newBracket] = await db
      .insert(eventBrackets)
      .values({
        eventId,
        ageGroupId,
        name,
        description,
        sortOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    res.status(201).json(newBracket);
  } catch (error) {
    console.error('Error creating bracket:', error);
    res.status(500).json({ error: 'Failed to create bracket' });
  }
});

// Update an existing bracket
router.put('/events/:eventId/brackets/:bracketId', hasEventAccess, async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    const { name, description, sortOrder } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Bracket name is required' });
    }
    
    // Verify the bracket exists and belongs to the event
    const existingBracket = await db
      .select()
      .from(eventBrackets)
      .where(
        and(
          eq(eventBrackets.id, parseInt(bracketId)),
          eq(eventBrackets.eventId, eventId)
        )
      )
      .limit(1);
    
    if (existingBracket.length === 0) {
      return res.status(404).json({ error: 'Bracket not found for this event' });
    }
    
    // Update the bracket
    const [updatedBracket] = await db
      .update(eventBrackets)
      .set({
        name,
        description,
        sortOrder: sortOrder !== undefined ? sortOrder : existingBracket[0].sortOrder,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(eventBrackets.id, parseInt(bracketId)),
          eq(eventBrackets.eventId, eventId)
        )
      )
      .returning();
    
    res.json(updatedBracket);
  } catch (error) {
    console.error('Error updating bracket:', error);
    res.status(500).json({ error: 'Failed to update bracket' });
  }
});

// Delete a bracket
router.delete('/events/:eventId/brackets/:bracketId', hasEventAccess, async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    
    // Check if there are teams using this bracket
    const teamsUsingBracket = await db
      .select({ id: teams.id })
      .from(teams)
      .where(
        and(
          eq(teams.eventId, eventId),
          eq(teams.bracketId, parseInt(bracketId))
        )
      )
      .limit(1);
    
    if (teamsUsingBracket.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete bracket because there are teams assigned to it' 
      });
    }
    
    // Delete the bracket
    const deletedBrackets = await db
      .delete(eventBrackets)
      .where(
        and(
          eq(eventBrackets.id, parseInt(bracketId)),
          eq(eventBrackets.eventId, eventId)
        )
      )
      .returning();
    
    if (deletedBrackets.length === 0) {
      return res.status(404).json({ error: 'Bracket not found for this event' });
    }
    
    res.json({ success: true, message: 'Bracket deleted successfully' });
  } catch (error) {
    console.error('Error deleting bracket:', error);
    res.status(500).json({ error: 'Failed to delete bracket' });
  }
});

// Assign a bracket to a team
router.put('/events/:eventId/teams/:teamId/bracket', hasEventAccess, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;
    const { bracketId } = req.body;
    
    // Validate required fields
    if (!bracketId) {
      return res.status(400).json({ error: 'Bracket ID is required' });
    }
    
    // Verify the team exists and belongs to the event
    const team = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.eventId, eventId)
        )
      )
      .limit(1);
    
    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found for this event' });
    }
    
    // Verify the bracket exists and belongs to the event
    const bracket = await db
      .select()
      .from(eventBrackets)
      .where(
        and(
          eq(eventBrackets.id, bracketId),
          eq(eventBrackets.eventId, eventId)
        )
      )
      .limit(1);
    
    if (bracket.length === 0) {
      return res.status(404).json({ error: 'Bracket not found for this event' });
    }
    
    // Verify the bracket belongs to the team's age group
    if (bracket[0].ageGroupId !== team[0].ageGroupId) {
      return res.status(400).json({ 
        error: 'Bracket does not belong to the team\'s age group' 
      });
    }
    
    // Update the team with the new bracket
    const [updatedTeam] = await db
      .update(teams)
      .set({
        bracketId,
      })
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.eventId, eventId)
        )
      )
      .returning();
    
    res.json(updatedTeam);
  } catch (error) {
    console.error('Error assigning bracket to team:', error);
    res.status(500).json({ error: 'Failed to assign bracket to team' });
  }
});

// Create brackets in bulk for multiple age groups
router.post('/events/:eventId/bulk-brackets', hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ageGroupIds, brackets } = req.body;
    
    // Validate required fields
    if (!ageGroupIds || !Array.isArray(ageGroupIds) || ageGroupIds.length === 0) {
      return res.status(400).json({ error: 'At least one age group ID is required' });
    }
    
    if (!brackets || !Array.isArray(brackets) || brackets.length === 0) {
      return res.status(400).json({ error: 'At least one bracket definition is required' });
    }
    
    // Verify the age groups exist and belong to the event
    const ageGroups = await db
      .select()
      .from(eventAgeGroups)
      .where(
        and(
          eq(eventAgeGroups.eventId, eventId),
          inArray(eventAgeGroups.id, ageGroupIds)
        )
      );
    
    if (ageGroups.length === 0) {
      return res.status(404).json({ error: 'No valid age groups found for this event' });
    }
    
    // For each age group, create the brackets
    const createdBrackets = [];
    const errors = [];
    
    for (const ageGroup of ageGroups) {
      // Delete existing brackets for this age group if specified
      if (req.body.replaceExisting) {
        // Check if there are teams using brackets in this age group
        const teamsUsingBrackets = await db
          .select({ id: teams.id })
          .from(teams)
          .where(
            and(
              eq(teams.eventId, eventId),
              eq(teams.ageGroupId, ageGroup.id),
              // Only check for teams that have a bracketId
              inArray(
                teams.bracketId,
                db.select({ id: eventBrackets.id })
                  .from(eventBrackets)
                  .where(eq(eventBrackets.ageGroupId, ageGroup.id))
              )
            )
          )
          .limit(1);
          
        if (teamsUsingBrackets.length > 0) {
          errors.push({
            ageGroupId: ageGroup.id,
            message: `Cannot replace brackets for age group ${ageGroup.ageGroup} (${ageGroup.gender}) because there are teams assigned to them`
          });
          continue;
        }
        
        // Delete existing brackets for this age group
        await db
          .delete(eventBrackets)
          .where(
            and(
              eq(eventBrackets.eventId, eventId),
              eq(eventBrackets.ageGroupId, ageGroup.id)
            )
          );
      }
      
      // Create the new brackets for this age group
      for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        
        try {
          const [newBracket] = await db
            .insert(eventBrackets)
            .values({
              eventId,
              ageGroupId: ageGroup.id,
              name: bracket.name,
              description: bracket.description || null,
              sortOrder: i,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();
            
          createdBrackets.push(newBracket);
        } catch (error) {
          console.error(`Error creating bracket for age group ${ageGroup.id}:`, error);
          errors.push({
            ageGroupId: ageGroup.id,
            bracketName: bracket.name,
            message: 'Failed to create bracket'
          });
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Created ${createdBrackets.length} brackets across ${ageGroups.length} age groups`,
      createdBrackets,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error creating brackets in bulk:', error);
    res.status(500).json({ error: 'Failed to create brackets in bulk' });
  }
});

export default router;