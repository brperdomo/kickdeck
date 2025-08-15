import { Router } from 'express';
import { db } from '@db';
import { 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  teams,
  tournamentGroups
} from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();

// Apply admin authentication to all routes
router.use(isAdmin);

/**
 * ENHANCED: Get bracket creation options based on team count
 * Offers multiple bracket configurations for flexibility
 */
router.get('/:eventId/bracket-options/:flightId', async (req, res) => {
  try {
    const { eventId, flightId } = req.params;
    
    console.log(`[Enhanced Bracket Creation] Getting options for flight ${flightId}`);

    // Get flight details and team count
    const flightInfo = await db
      .select({
        flightId: eventBrackets.id,
        name: eventBrackets.name,
        level: eventBrackets.level,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(eventBrackets.id, parseInt(flightId))
      ))
      .limit(1);

    if (!flightInfo.length) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const flight = flightInfo[0];

    // Get approved teams for this flight
    const assignedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        clubName: teams.clubName,
        status: teams.status
      })
      .from(teams)
      .where(and(
        eq(teams.bracketId, parseInt(flightId)),
        eq(teams.status, 'approved')
      ));

    const teamCount = assignedTeams.length;

    // Generate bracket configuration options based on team count
    const bracketOptions = generateBracketOptions(teamCount, flight.name);

    res.json({
      success: true,
      flight: {
        id: flight.flightId,
        name: flight.name,
        ageGroup: flight.ageGroup,
        gender: flight.gender,
        teamCount
      },
      teams: assignedTeams,
      bracketOptions
    });

  } catch (error) {
    console.error('[Enhanced Bracket Creation] Error:', error);
    res.status(500).json({ error: 'Failed to get bracket options' });
  }
});

/**
 * Create bracket structure with specified configuration
 */
router.post('/:eventId/create-bracket-structure', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { flightId, bracketConfig, teams: teamAssignments } = req.body;

    console.log(`[Enhanced Bracket Creation] Creating bracket structure:`, {
      flightId,
      bracketConfig,
      teamCount: teamAssignments?.length || 0
    });

    // Validate bracket configuration
    if (!bracketConfig || !bracketConfig.type || !teamAssignments) {
      return res.status(400).json({ error: 'Invalid bracket configuration' });
    }

    // Create tournament groups based on configuration
    const createdGroups = await createTournamentGroups(flightId, bracketConfig, eventId);

    // Assign teams to groups based on bracket configuration
    await assignTeamsToGroups(teamAssignments, createdGroups, bracketConfig);

    res.json({
      success: true,
      message: `Created ${bracketConfig.brackets} bracket(s) for ${teamAssignments.length} teams`,
      configuration: bracketConfig,
      groups: createdGroups
    });

  } catch (error) {
    console.error('[Enhanced Bracket Creation] Error creating structure:', error);
    res.status(500).json({ error: 'Failed to create bracket structure' });
  }
});

/**
 * Generate bracket configuration options based on team count
 */
function generateBracketOptions(teamCount: number, flightName: string) {
  const options = [];

  if (teamCount === 0) {
    return [{
      type: 'pending',
      description: 'No teams assigned to this flight yet',
      brackets: 0,
      teamsPerBracket: 0,
      isRecommended: false
    }];
  }

  // Single bracket options (always available)
  options.push({
    type: 'single',
    description: `Single bracket with all ${teamCount} teams`,
    brackets: 1,
    teamsPerBracket: teamCount,
    isRecommended: teamCount <= 6,
    estimatedGames: calculateEstimatedGames(teamCount, 'single'),
    championshipIncluded: teamCount >= 4
  });

  // Multiple bracket options based on team count
  if (teamCount >= 6) {
    // Option for 2 brackets
    const teamsPerBracket = Math.ceil(teamCount / 2);
    options.push({
      type: 'dual',
      description: `2 brackets with ${Math.floor(teamCount / 2)}-${teamsPerBracket} teams each`,
      brackets: 2,
      teamsPerBracket: teamsPerBracket,
      isRecommended: teamCount === 8,
      estimatedGames: calculateEstimatedGames(teamsPerBracket, 'dual') * 2 + 1, // +1 for championship
      championshipIncluded: true,
      distribution: {
        bracketA: Math.floor(teamCount / 2),
        bracketB: Math.ceil(teamCount / 2)
      }
    });
  }

  if (teamCount >= 9) {
    // Option for 3 brackets
    const teamsPerBracket = Math.ceil(teamCount / 3);
    options.push({
      type: 'triple',
      description: `3 brackets with ~${teamsPerBracket} teams each`,
      brackets: 3,
      teamsPerBracket: teamsPerBracket,
      isRecommended: teamCount >= 12,
      estimatedGames: calculateEstimatedGames(teamsPerBracket, 'single') * 3 + 3, // +3 for playoffs
      championshipIncluded: true,
      distribution: calculateDistribution(teamCount, 3)
    });
  }

  if (teamCount >= 12) {
    // Option for 4 brackets
    const teamsPerBracket = Math.ceil(teamCount / 4);
    options.push({
      type: 'quad',
      description: `4 brackets with ~${teamsPerBracket} teams each`,
      brackets: 4,
      teamsPerBracket: teamsPerBracket,
      isRecommended: teamCount >= 16,
      estimatedGames: calculateEstimatedGames(teamsPerBracket, 'single') * 4 + 7, // +7 for playoffs
      championshipIncluded: true,
      distribution: calculateDistribution(teamCount, 4)
    });
  }

  // Special configurations for common team counts
  if (teamCount === 6) {
    options.push({
      type: 'crossplay',
      description: 'Pool A vs Pool B crossplay (3v3 pools)',
      brackets: 2,
      teamsPerBracket: 3,
      isRecommended: true,
      estimatedGames: 10, // 3+3 pool games + 3 crossplay + 1 final
      championshipIncluded: true,
      special: 'crossplay'
    });
  }

  return options.sort((a, b) => {
    // Sort recommended first, then by bracket count
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.brackets - b.brackets;
  });
}

/**
 * Calculate estimated games for bracket type
 */
function calculateEstimatedGames(teamCount: number, type: string): number {
  if (teamCount <= 1) return 0;
  
  switch (type) {
    case 'single':
      // Round robin + potential championship
      return Math.floor(teamCount * (teamCount - 1) / 2);
    case 'dual':
      // Round robin within bracket
      return Math.floor(teamCount * (teamCount - 1) / 2);
    default:
      return teamCount - 1; // Simple elimination
  }
}

/**
 * Calculate team distribution across brackets
 */
function calculateDistribution(totalTeams: number, brackets: number) {
  const baseTeams = Math.floor(totalTeams / brackets);
  const remainder = totalTeams % brackets;
  
  const distribution: Record<string, number> = {};
  for (let i = 0; i < brackets; i++) {
    const bracketLetter = String.fromCharCode(65 + i); // A, B, C, D...
    distribution[`bracket${bracketLetter}`] = baseTeams + (i < remainder ? 1 : 0);
  }
  
  return distribution;
}

/**
 * Create tournament groups based on bracket configuration
 */
async function createTournamentGroups(flightId: number, bracketConfig: any, eventId: string) {
  const groups = [];
  
  for (let i = 0; i < bracketConfig.brackets; i++) {
    const bracketLetter = String.fromCharCode(65 + i); // A, B, C, D...
    let groupName = `Bracket ${bracketLetter}`;
    
    // Special naming for crossplay
    if (bracketConfig.special === 'crossplay') {
      groupName = `Pool ${bracketLetter}`;
    }
    
    try {
      const [newGroup] = await db
        .insert(tournamentGroups)
        .values({
          eventId,
          name: groupName,
          bracketId: flightId,
          groupType: bracketConfig.special || 'standard',
          maxTeams: bracketConfig.teamsPerBracket,
          isActive: true
        })
        .returning();
        
      groups.push(newGroup);
      console.log(`[Enhanced Bracket Creation] Created group: ${groupName} (ID: ${newGroup.id})`);
    } catch (error) {
      console.error(`[Enhanced Bracket Creation] Error creating group ${groupName}:`, error);
      throw error;
    }
  }
  
  return groups;
}

/**
 * Assign teams to groups based on bracket configuration
 */
async function assignTeamsToGroups(teamAssignments: any[], groups: any[], bracketConfig: any) {
  console.log(`[Enhanced Bracket Creation] Assigning ${teamAssignments.length} teams to ${groups.length} groups`);
  
  // Distribute teams evenly across groups
  for (let i = 0; i < teamAssignments.length; i++) {
    const team = teamAssignments[i];
    const groupIndex = i % groups.length;
    const assignedGroup = groups[groupIndex];
    
    try {
      await db
        .update(teams)
        .set({
          groupId: assignedGroup.id,
          updatedAt: new Date().toISOString()
        })
        .where(eq(teams.id, team.id));
        
      console.log(`[Enhanced Bracket Creation] Assigned team ${team.name} to group ${assignedGroup.name}`);
    } catch (error) {
      console.error(`[Enhanced Bracket Creation] Error assigning team ${team.name}:`, error);
      throw error;
    }
  }
}

export default router;