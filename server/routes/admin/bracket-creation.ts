import { Router } from 'express';
import { db } from '@db';
import { 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  teams,
  gameFormats,
  tournamentGroups,
  games,
  fields,
  eventComplexes,
  gameTimeSlots
} from '@db/schema';
import { eq, and, isNull, like, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();

// Apply admin authentication to all routes
router.use(isAdmin);

// Get bracket creation data for an event
router.get('/:eventId/bracket-creation', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Keep as string since eventId is text in schema
    
    console.log(`[Bracket Creation] GET /${eventId}/bracket-creation`);

    // Fetch all flights (brackets) for this event with team counts  
    const flightsQuery = await db
      .select({
        flightId: eventBrackets.id,
        name: eventBrackets.name,
        level: eventBrackets.level,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventBrackets.name, eventAgeGroups.ageGroup, eventAgeGroups.gender);

    console.log(`[Bracket Creation] Found ${flightsQuery.length} flights`);
    
    // Log all Nike Elite flights from initial query
    const nikeEliteFlights = flightsQuery.filter(f => f.name === 'Nike Elite');
    console.log(`[NIKE ELITE FLIGHTS] Found ${nikeEliteFlights.length} Nike Elite flights:`, 
      nikeEliteFlights.map(f => `${f.ageGroup} ${f.gender} (ID: ${f.flightId})`));

    // Get team counts and team details for each flight
    const flights = await Promise.all(
      flightsQuery.map(async (flight) => {
        // Get teams assigned to this flight
        const assignedTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
            clubName: teams.clubName,
            status: teams.status,
            groupId: teams.groupId,
            bracketId: teams.bracketId
          })
          .from(teams)
          .where(and(
            eq(teams.bracketId, flight.flightId),
            eq(teams.status, 'approved')
          ));

        console.log(`[FLIGHT ${flight.flightId} DEBUG] Found ${assignedTeams.length} assigned teams:`, assignedTeams.map(t => `${t.name} (groupId: ${t.groupId})`));

        // Check if this flight has a game format configured using Drizzle ORM
        let hasFormat = false;
        let templateName = null;
        
        try {
          // Try to find format by bracketId (which matches flightId)
          const formatResult = await db
            .select({
              id: gameFormats.id,
              templateName: gameFormats.templateName,
              gameLength: gameFormats.gameLength,
              fieldSize: gameFormats.fieldSize
            })
            .from(gameFormats)
            .where(eq(gameFormats.bracketId, flight.flightId))
            .limit(1);
            
          // A format is considered configured if the record exists, regardless of template_name
          hasFormat = formatResult.length > 0;
          templateName = hasFormat ? formatResult[0]?.templateName : null;
          
          // Debug logging for all flights to understand the data structure
          console.log(`[BRACKET DEBUG] Flight ${flight.flightId} (${flight.ageGroup} ${flight.gender} ${flight.name}):`, {
            hasFormat,
            templateName,
            formatCount: formatResult.length,
            formatData: formatResult[0] || 'No format found'
          });
          
          // Log all Nike Elite flights for debugging
          if (flight.name === 'Nike Elite') {
            console.log(`[NIKE ELITE DEBUG] Flight ${flight.flightId} - ${flight.ageGroup} ${flight.gender} ${flight.name}:`, {
              hasFormat,
              templateName,
              formatCount: formatResult.length,
              formatData: formatResult[0]
            });
          }
        } catch (error) {
          console.error(`Failed to check format for flight ${flight.flightId}:`, error as Error);
          hasFormat = false;
          templateName = null;
        }
        
        // Determine bracket type and configuration status
        let bracketType = 'Not Configured';
        let isConfigured = hasFormat;
        let estimatedGames = 0;

        // If we have a format record, it's configured regardless of template name
        if (hasFormat) {
          // Map technical template names to user-friendly display names
          if (templateName) {
            switch (templateName) {
              case 'group_of_4':
                bracketType = '4-Team Single Bracket';
                estimatedGames = 7; // Pool play (6) + final (1)
                break;
              case 'group_of_6':
                bracketType = '6-Team Crossover Brackets';
                estimatedGames = 10; // Crossover pool (9) + final (1)
                break;
              case 'group_of_8':
                bracketType = '8-Team Dual Brackets';
                estimatedGames = 13; // Dual brackets (12) + final (1)
                break;
              default:
                // Handle legacy format names or custom formats
                if (templateName.includes('Single Bracket')) {
                  bracketType = templateName;
                  estimatedGames = 7;
                } else if (templateName.includes('Crossover')) {
                  bracketType = templateName;
                  estimatedGames = 10;
                } else if (templateName.includes('Dual')) {
                  bracketType = templateName;
                  estimatedGames = 13;
                } else {
                  bracketType = templateName;
                  estimatedGames = Math.max(0, assignedTeams.length + 2);
                }
                break;
            }
          } else {
            bracketType = `Custom Format (${assignedTeams.length} teams)`;
            estimatedGames = Math.max(0, assignedTeams.length + 2);
          }
        } else if (assignedTeams.length > 0) {
          // Default bracket type based on team count
          bracketType = 'Single Elimination (Default)';
          estimatedGames = Math.max(0, assignedTeams.length - 1);
        }

        // Get existing brackets for multi-bracket configurations
        // For these formats, we need to check if teams are properly assigned to pools/brackets
        const brackets: any[] = [];
        
        // Always include unassigned teams list for bracket management
        let unassignedTeams: any[] = [];
        
        // Create brackets for any flight with teams that can benefit from bracket organization
        const needsBrackets = assignedTeams.length >= 4; // All flights with 4+ teams should have brackets available
        
        if (needsBrackets) {
          console.log(`[BRACKET CREATION DEBUG] Creating brackets for flight ${flight.flightId} (${flight.name}) - templateName: ${templateName}, teamCount: ${assignedTeams.length}`);
          
          // Create virtual brackets based on groupId assignments
          const teamsWithGroups = assignedTeams.filter(t => t.groupId);
          const teamsWithoutGroups = assignedTeams.filter(t => !t.groupId);
          
          console.log(`[BRACKET DISPLAY DEBUG] Flight ${flight.flightId} - Teams with groups:`, teamsWithGroups.map(t => `${t.name} (groupId: ${t.groupId})`));
          console.log(`[BRACKET DISPLAY DEBUG] Flight ${flight.flightId} - Unassigned teams:`, teamsWithoutGroups.map(t => t.name));
          
          // Store unassigned teams for UI display
          unassignedTeams = teamsWithoutGroups.map(t => ({
            id: t.id,
            name: t.name,
            clubName: t.clubName || '',
            status: t.status,
            groupId: null,
            bracketId: t.bracketId
          }));
          
          // Group teams by their groupId (which represents bracket assignments) - ADMIN CONTROL ONLY
          let teamsByBracket: Record<string, any[]> = teamsWithGroups.reduce((acc, team) => {
            if (team.groupId) {
              const bracketKey = team.groupId.toString();
              if (!acc[bracketKey]) {
                acc[bracketKey] = [];
              }
              acc[bracketKey].push(team);
            }
            return acc;
          }, {} as Record<string, any[]>);
          
          console.log(`[BRACKET DISPLAY DEBUG] Flight ${flight.flightId} - Teams by bracket:`, teamsByBracket);
          
          // Always create both brackets (even if empty) for assignment interface
          // Determine bracket names based on format
          let bracketAName = 'Bracket A';
          let bracketBName = 'Bracket B';
          
          if (templateName === 'group_of_6') {
            bracketAName = 'Pool A';
            bracketBName = 'Pool B';
          } else if (templateName === 'group_of_8') {
            bracketAName = 'Bracket A';
            bracketBName = 'Bracket B';
          } else if (assignedTeams.length === 6) {
            // Default 6-team setup to pools for crossplay
            bracketAName = 'Pool A';
            bracketBName = 'Pool B';
          } else if (assignedTeams.length === 4) {
            // Default 4-team setup
            bracketAName = 'Pool A';
            bracketBName = 'Pool B';
          }
          
          brackets.push({
            id: 1,
            name: bracketAName,
            teamCount: 0,
            teams: []
          });
          brackets.push({
            id: 2, 
            name: bracketBName,
            teamCount: 0,
            teams: []
          });
          
          // Populate brackets with assigned teams - Fixed bracket mapping
          const groupIds = Object.keys(teamsByBracket);
          
          // For each group, find if it's Pool A or Pool B and assign to correct bracket
          for (const groupId of groupIds) {
            const bracketTeams = teamsByBracket[groupId].map(t => ({
              id: t.id,
              name: t.name,
              clubName: t.clubName || '',
              status: t.status,
              groupId: t.groupId,
              bracketId: t.bracketId
            }));
            
            // Determine bracket index based on group name pattern
            // Groups ending with "Pool A" go to bracket index 0 (Bracket A)
            // Groups ending with "Pool B" go to bracket index 1 (Bracket B)
            let bracketIndex = 0; // Default to Bracket A
            
            // Check existing tournament groups to find the name pattern
            try {
              const groupRecord = await db
                .select({ name: tournamentGroups.name })
                .from(tournamentGroups)
                .where(eq(tournamentGroups.id, parseInt(groupId)))
                .limit(1);
                
              if (groupRecord.length > 0 && groupRecord[0].name.includes('Pool B')) {
                bracketIndex = 1; // Pool B goes to Bracket B (index 1)
              }
            } catch (error) {
              console.error(`[BRACKET MAPPING] Error checking group ${groupId}:`, error);
            }
            
            if (brackets[bracketIndex]) {
              brackets[bracketIndex].teams = bracketTeams;
              brackets[bracketIndex].teamCount = bracketTeams.length;
              
              console.log(`[BRACKET DISPLAY DEBUG] Populated bracket ${bracketIndex + 1} (${brackets[bracketIndex].name}) with ${bracketTeams.length} teams from group ${groupId}`);
            }
          }
          
          console.log(`[BRACKET CREATION SUCCESS] Created ${brackets.length} brackets for flight ${flight.flightId} (${flight.name})`);
        } else {
          console.log(`[BRACKET CREATION SKIP] Skipping bracket creation for flight ${flight.flightId} (${flight.name}) - needsBrackets: ${needsBrackets}, templateName: ${templateName}, teamCount: ${assignedTeams.length}, isConfigured: ${isConfigured}`);
        }

        return {
          flightId: flight.flightId,
          name: flight.name,
          ageGroup: flight.ageGroup,
          gender: flight.gender,
          level: flight.level,
          teamCount: assignedTeams.length,
          assignedTeams: assignedTeams.length,
          unassignedTeamsCount: unassignedTeams.length,
          bracketType,
          estimatedGames,
          isConfigured,
          brackets: brackets, // Add brackets information
          unassignedTeams: unassignedTeams, // Teams not yet assigned to brackets
          debugInfo: `${brackets.length} brackets created, ${unassignedTeams.length} unassigned teams`,
          registeredTeams: assignedTeams.map(t => ({
            ...t,
            seed: 0,
            ageGroupId: 0,
            isPlaceholder: false,
            flightId: flight.flightId,
            groupId: t.groupId, // Include groupId for team assignments
            bracketId: t.bracketId // Include bracketId for team assignments
          })),
          ageGroupId: 0
        };
      })
    );

    // Get total team counts
    const totalTeamsResult = await db
      .select({
        count: teams.id
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    // Get unassigned teams count  
    const unassignedTeamsResult = await db
      .select({
        count: teams.id
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));

    const totalTeams = totalTeamsResult.length;
    
    // Count unassigned teams (those without bracketId)
    const unassignedCount = await db
      .select()
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved')
      ));
    
    const unassignedTeams = unassignedCount.filter(t => !t.teams.bracketId).length;
    const assignedFlights = flights.filter(f => f.teamCount > 0).length;

    const stats = {
      totalFlights: flights.length,
      assignedFlights,
      unassignedTeams,
      totalTeams,
      readyForScheduling: unassignedTeams === 0 && totalTeams > 0
    };

    console.log(`[Bracket Creation] Stats calculated:`, stats);

    res.json({
      flights,
      stats
    });

  } catch (error) {
    console.error('[Bracket Creation] Error fetching bracket creation data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bracket creation data',
      details: (error as Error).message 
    });
  }
});

// Assign teams to specific brackets within a flight  
router.post('/:eventId/bracket-creation/assign-teams', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { assignments, flightId, seedingPositions } = req.body; // { teamId: bracketId, ... }, flightId, seedingPositions

    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/assign-teams`);
    console.log('[Team Assignment] Assignments received:', assignments);
    console.log('[Team Assignment] Seeding positions received:', seedingPositions);
    console.log('[Team Assignment] Flight ID:', flightId);

    if (!assignments || Object.keys(assignments).length === 0) {
      return res.status(400).json({ error: 'No team assignments provided' });
    }

    // First, we need to ensure tournament groups exist for the bracket assignments
    // Get flight information to determine age group
    const flight = await db
      .select({
        ageGroupId: eventBrackets.ageGroupId,
        name: eventBrackets.name
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.id, flightId))
      .limit(1);

    if (flight.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const { ageGroupId, name: flightName } = flight[0];

    // Create or find Pool A and Pool B tournament groups for this age group
    const poolAName = `${flightName} - Pool A`;
    const poolBName = `${flightName} - Pool B`;

    // Check if groups already exist
    let poolAGroup = await db
      .select({ id: tournamentGroups.id })
      .from(tournamentGroups)
      .where(and(
        eq(tournamentGroups.eventId, eventId),
        eq(tournamentGroups.ageGroupId, ageGroupId),
        eq(tournamentGroups.name, poolAName)
      ))
      .limit(1);

    let poolBGroup = await db
      .select({ id: tournamentGroups.id })
      .from(tournamentGroups)
      .where(and(
        eq(tournamentGroups.eventId, eventId),
        eq(tournamentGroups.ageGroupId, ageGroupId),
        eq(tournamentGroups.name, poolBName)
      ))
      .limit(1);

    // Create Pool A group if it doesn't exist
    if (poolAGroup.length === 0) {
      const newPoolAGroup = await db
        .insert(tournamentGroups)
        .values({
          eventId: eventId,
          ageGroupId: ageGroupId,
          name: poolAName,
          type: 'pool',
          stage: 'group'
        })
        .returning({ id: tournamentGroups.id });
      
      poolAGroup = newPoolAGroup;
      console.log('[Team Assignment] Created Pool A group:', newPoolAGroup[0].id);
    }

    // Create Pool B group if it doesn't exist
    if (poolBGroup.length === 0) {
      const newPoolBGroup = await db
        .insert(tournamentGroups)
        .values({
          eventId: eventId,
          ageGroupId: ageGroupId,
          name: poolBName,
          type: 'pool',
          stage: 'group'
        })
        .returning({ id: tournamentGroups.id });
      
      poolBGroup = newPoolBGroup;
      console.log('[Team Assignment] Created Pool B group:', newPoolBGroup[0].id);
    }

    // Map UI bracket IDs to actual tournament group IDs
    const bracketMapping = {
      1: poolAGroup[0].id, // Pool A
      2: poolBGroup[0].id  // Pool B
    };

    // Update each team's groupId and seeding position based on assignments
    for (const [teamIdStr, uiBracketId] of Object.entries(assignments)) {
      const teamId = parseInt(teamIdStr);
      const actualGroupId = uiBracketId === 0 ? null : bracketMapping[uiBracketId as keyof typeof bracketMapping];

      if (uiBracketId !== 0 && !actualGroupId) {
        console.error(`[Team Assignment] Invalid bracket ID: ${uiBracketId}`);
        continue;
      }

      // Get seeding position for this team (if provided)
      const seedingInfo = seedingPositions?.[teamId];
      const seedRanking = seedingInfo?.position || null;

      await db
        .update(teams)
        .set({ 
          groupId: actualGroupId,
          seedRanking: seedRanking
        })
        .where(eq(teams.id, teamId));

      if (seedingInfo) {
        console.log(`[Team Assignment] Team ${teamId} assigned to bracket ${actualGroupId} (UI bracket ${uiBracketId}) with seed ${seedingInfo.seed} (position ${seedingInfo.position})`);
      } else {
        console.log(`[Team Assignment] Team ${teamId} assigned to bracket ${actualGroupId} (UI bracket ${uiBracketId})`);
      }
    }

    res.json({ 
      success: true, 
      message: `Updated assignments for ${Object.keys(assignments).length} teams`,
      assignments: assignments,
      createdGroups: {
        poolA: poolAGroup[0].id,
        poolB: poolBGroup[0].id
      }
    });

  } catch (error) {
    console.error('[Team Assignment] Error assigning teams:', error);
    res.status(500).json({ 
      error: 'Failed to assign teams',
      details: (error as Error).message 
    });
  }
});

// Auto-assign teams to flights
router.post('/:eventId/bracket-creation/auto-assign', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { method = 'balanced' } = req.body;

    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/auto-assign - Method: ${method}`);

    // Get all unassigned teams for this event
    const unassignedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved'),
        isNull(teams.bracketId)
      ));

    console.log(`[Bracket Creation] Found ${unassignedTeams.length} unassigned teams`);

    // Group teams by age group and gender
    const teamsByAgeGroup = unassignedTeams.reduce((acc, team) => {
      const key = `${team.ageGroup}-${team.gender}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(team);
      return acc;
    }, {} as Record<string, any[]>);

    // Get available flights for each age group
    const flights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        level: eventBrackets.level,
        ageGroupId: eventBrackets.ageGroupId,
        // maxTeams field doesn't exist in schema
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(eventBrackets)
      .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventBrackets.name);

    // Group flights by age group and gender
    const flightsByAgeGroup = flights.reduce((acc, flight) => {
      const key = `${flight.ageGroup}-${flight.gender}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(flight);
      return acc;
    }, {} as Record<string, any[]>);

    let assignmentCount = 0;

    // Auto-assign teams using balanced method
    for (const [ageGroupKey, teamList] of Object.entries(teamsByAgeGroup)) {
      const availableFlights = flightsByAgeGroup[ageGroupKey] || [];
      
      if (availableFlights.length === 0) {
        console.log(`[Bracket Creation] No flights available for ${ageGroupKey}`);
        continue;
      }

      // Sort flights by priority: Elite, Premier, Classic
      const flightPriority: Record<string, number> = { 'Elite': 0, 'Premier': 1, 'Classic': 2 };
      availableFlights.sort((a, b) => {
        const aPriority = flightPriority[a.name] ?? 999;
        const bPriority = flightPriority[b.name] ?? 999;
        return aPriority - bPriority;
      });

      // Distribute teams evenly across flights
      const teamsPerFlight = Math.ceil(teamList.length / availableFlights.length);
      
      for (let i = 0; i < teamList.length; i++) {
        const flightIndex = Math.floor(i / teamsPerFlight);
        const targetFlight = availableFlights[Math.min(flightIndex, availableFlights.length - 1)];
        
        await db
          .update(teams)
          .set({ bracketId: targetFlight.id })
          .where(eq(teams.id, teamList[i].id));
        
        assignmentCount++;
      }
    }

    console.log(`[Bracket Creation] Auto-assigned ${assignmentCount} teams`);

    res.json({
      message: 'Teams auto-assigned successfully',
      assignedTeams: assignmentCount,
      method
    });

  } catch (error) {
    console.error('[Bracket Creation] Error auto-assigning teams:', error);
    res.status(500).json({ 
      error: 'Failed to auto-assign teams',
      details: (error as Error).message 
    });
  }
});

// Lock brackets and create games
router.post('/:eventId/bracket-creation/lock', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Keep as string for consistency
    
    console.log(`[Bracket Creation] POST /${eventId}/bracket-creation/lock`);

    // Verify all teams are assigned
    const unassignedTeams = await db
      .select({ count: teams.id })
      .from(teams)
      .innerJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(teams.status, 'approved'),
        isNull(teams.bracketId)
      ));

    if (unassignedTeams.length > 0) {
      return res.status(400).json({
        error: 'Cannot lock brackets',
        message: `${unassignedTeams.length} teams are still unassigned`
      });
    }

    // Import the tournament scheduler for game generation
    const { TournamentScheduler } = await import('../../services/tournament-scheduler');
    
    // CRITICAL FIX: Generate games for all brackets before field assignment
    console.log(`[Bracket Creation] Generating games for all brackets in event ${eventId}`);
    await generateGamesForEvent(eventId);
    console.log(`[Bracket Creation] Games generated successfully`);
    
    // Import the field assignment function
    const { assignFieldsToGames } = await import('./tournament-control');
    
    // Apply field assignments to any unassigned games with size validation
    await assignFieldsToGames(eventId);
    console.log(`[Bracket Creation] Applied field assignments with size validation`);

    // Update event status to indicate brackets are locked
    await db
      .update(events)
      .set({ 
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, parseInt(eventId)));

    console.log(`[Bracket Creation] Brackets locked for event ${eventId}`);

    res.json({
      message: 'Brackets locked successfully',
      status: 'brackets_locked',
      readyForScheduling: true
    });

  } catch (error) {
    console.error('[Bracket Creation] Error locking brackets:', error);
    res.status(500).json({ 
      error: 'Failed to lock brackets',
      details: (error as Error).message 
    });
  }
});

// NEW API ENDPOINT: Manual game generation
router.post('/:eventId/bracket-creation/generate-games', async (req, res) => {
  console.log(`🚀🚀🚀 [GAME-GENERATION-API] Endpoint hit for event ${req.params.eventId} 🚀🚀🚀`);
  
  try {
    const eventId = req.params.eventId;
    const { flightId } = req.body;
    
    console.log(`🔍 [DEBUG] Request body:`, req.body);
    console.log(`🔍 [DEBUG] Extracted flightId:`, flightId, `(type: ${typeof flightId})`);
    
    if (flightId && flightId !== 'all') {
      console.log(`🚀 [API] Manual game generation requested for event ${eventId}, flight ${flightId}`);
      console.log(`🚀 [API] Starting generateGamesForFlight function...`);
      
      await generateGamesForFlight(eventId, parseInt(flightId));
      
      console.log(`✅ [API] Game generation completed successfully for flight ${flightId} in event ${eventId}`);
      res.json({ 
        success: true, 
        message: `Games generated successfully for the selected flight` 
      });
    } else {
      console.log(`🚀 [API] Manual game generation requested for ALL brackets in event ${eventId}`);
      console.log(`🚀 [API] Starting generateGamesForEvent function...`);
      
      await generateGamesForEvent(eventId);
      
      console.log(`✅ [API] Game generation completed successfully for event ${eventId}`);
      res.json({ 
        success: true, 
        message: 'Games generated successfully for all brackets in the event' 
      });
    }
  } catch (error) {
    console.error(`❌ [API] Failed to generate games for event ${req.params.eventId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate games',
      details: (error as Error).message 
    });
  }
});

// CRITICAL FUNCTION: Generate games for a specific flight
export async function generateGamesForFlight(eventId: string, flightId: number) {
  console.log(`[Game Generation] Starting game generation for flight ${flightId} in event ${eventId}`);
  
  // Get brackets for the specific flight only
  const brackets = await db
    .select({
      bracketId: eventBrackets.id,
      bracketName: eventBrackets.name,
      ageGroupId: eventBrackets.ageGroupId,
      format: eventBrackets.tournamentFormat,
      teamCount: sql<number>`COUNT(${teams.id})`.as('teamCount')
    })
    .from(eventBrackets)
    .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
    .leftJoin(teams, and(
      eq(teams.bracketId, eventBrackets.id),
      eq(teams.status, 'approved')
    ))
    .where(and(
      eq(eventAgeGroups.eventId, eventId),
      eq(eventBrackets.id, flightId)  // Filter by specific flight/bracket ID
    ))
    .groupBy(eventBrackets.id, eventBrackets.name, eventBrackets.ageGroupId, eventBrackets.tournamentFormat);

  console.log(`[Game Generation] Found ${brackets.length} brackets to process for flight ${flightId}`);

  for (const bracket of brackets) {
    if (bracket.teamCount === 0) {
      console.log(`[Game Generation] Skipping bracket ${bracket.bracketName} - no approved teams`);
      continue;
    }

    console.log(`[Game Generation] Processing bracket ${bracket.bracketName} with ${bracket.teamCount} teams`);

    // Get teams for this bracket
    const bracketTeams = await db
      .select()
      .from(teams)
      .where(and(
        eq(teams.bracketId, bracket.bracketId),
        eq(teams.status, 'approved')
      ))
      .orderBy(teams.seedRanking);

    // Prepare bracket data for tournament scheduler
    const bracketData = {
      bracketId: bracket.bracketId,
      bracketName: bracket.bracketName,
      format: bracket.format,
      tournamentFormat: bracket.format,
      teams: bracketTeams,
      id: bracket.bracketId,
      name: bracket.bracketName
    };

    console.log(`[Game Generation] Generating games for bracket ${bracket.bracketName} using format '${bracket.format}'`);

    try {
      // Generate games using the TournamentScheduler
      const { TournamentScheduler } = await import('../../services/tournament-scheduler');
      const generatedGames = await TournamentScheduler.generateBracketGames(bracketData, 1);
      
      console.log(`[Game Generation] Generated ${generatedGames.length} games for bracket ${bracket.bracketName}`);

      // Now schedule the games with dates, times, and fields
      console.log(`[Game Scheduling] Starting field and time assignment for ${generatedGames.length} games...`);
      
      // Get available fields for this event
      const fieldsData = await db
        .select({
          id: fields.id,
          name: fields.name,
          complexId: fields.complexId
        })
        .from(fields)
        .innerJoin(eventComplexes, eq(fields.complexId, eventComplexes.complexId))
        .where(eq(eventComplexes.eventId, eventId));

      console.log(`[Game Scheduling] Found ${fieldsData.length} available fields`);

      // Get available time slots for this event
      const timeSlotsData = await db
        .select()
        .from(gameTimeSlots)
        .where(eq(gameTimeSlots.eventId, eventId));

      console.log(`[Game Scheduling] Found ${timeSlotsData.length} time slots configured`);

      let scheduledGames = generatedGames;

      // Apply basic field assignment if fields are available
      if (fieldsData.length > 0) {
        console.log(`[Game Scheduling] Assigning fields to ${generatedGames.length} games`);
        
        scheduledGames = generatedGames.map((game, index) => {
          const fieldIndex = index % fieldsData.length;
          const assignedField = fieldsData[fieldIndex];
          
          // Basic time slot assignment (8 AM start, 90 min games + 15 min break)
          const gameStartTime = 8 * 60 + (Math.floor(index / fieldsData.length) * 105); // 105 min = 90 game + 15 break
          const startHours = Math.floor(gameStartTime / 60);
          const startMinutes = gameStartTime % 60;
          const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
          
          const endTime = `${Math.floor((gameStartTime + 90) / 60).toString().padStart(2, '0')}:${((gameStartTime + 90) % 60).toString().padStart(2, '0')}`;
          
          return {
            ...game,
            fieldId: assignedField.id,
            fieldName: assignedField.name,
            startTime,
            endTime,
            date: new Date().toISOString().split('T')[0] // Today's date
          };
        });
        
        console.log(`[Game Scheduling] Successfully assigned fields to all ${scheduledGames.length} games`);
      } else {
        console.log(`[Game Scheduling] No fields available - games will be unscheduled`);
      }

      // Save games to database with scheduling information
      for (const game of scheduledGames) {
        console.log(`[Game Generation] Inserting scheduled game ${game.id} - Field: ${game.fieldId || 'TBD'}, Time: ${game.startTime || 'TBD'}`);
        
        // Use raw SQL insert to bypass Drizzle type issues
        await db.execute(sql`
          INSERT INTO games (
            event_id, age_group_id, group_id, home_team_id, away_team_id,
            round, status, duration, match_number, break_time, field_id,
            scheduled_date, scheduled_time, created_at, updated_at,
            home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards
          ) VALUES (
            ${parseInt(eventId)}, 
            ${bracket.ageGroupId},
            ${game.poolId ? parseInt(game.poolId) : null},
            ${game.homeTeamId || null},
            ${game.awayTeamId || null},
            ${game.round === 'Pool Play' ? 1 : 2},
            'scheduled',
            ${game.duration || 90},
            ${game.gameNumber || 1},
            5,
            ${game.fieldId || null},
            ${game.date || null},
            ${game.startTime || null},
            NOW(),
            NOW(),
            0, 0, 0, 0
          )
        `);
      }

      console.log(`[Game Generation] Successfully saved ${generatedGames.length} games for bracket ${bracket.bracketName}`);

    } catch (error) {
      console.error(`[Game Generation] Failed to generate games for bracket ${bracket.bracketName}:`, error);
      throw error;
    }
  }

  console.log(`[Game Generation] Completed game generation for flight ${flightId} in event ${eventId}`);
}

// CRITICAL FUNCTION: Generate games for all brackets in an event
async function generateGamesForEvent(eventId: string) {
  console.log(`[Game Generation] Starting game generation for event ${eventId} (type: ${typeof eventId})`);
  
  // Get all brackets with assigned teams for this event
  const brackets = await db
    .select({
      bracketId: eventBrackets.id,
      bracketName: eventBrackets.name,
      ageGroupId: eventBrackets.ageGroupId,
      format: eventBrackets.tournamentFormat,
      teamCount: sql<number>`COUNT(${teams.id})`.as('teamCount')
    })
    .from(eventBrackets)
    .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
    .leftJoin(teams, and(
      eq(teams.bracketId, eventBrackets.id),
      eq(teams.status, 'approved')
    ))
    .where(eq(eventAgeGroups.eventId, eventId))
    .groupBy(eventBrackets.id, eventBrackets.name, eventBrackets.ageGroupId, eventBrackets.tournamentFormat);

  console.log(`[Game Generation] Found ${brackets.length} brackets to process`);

  for (const bracket of brackets) {
    if (bracket.teamCount === 0) {
      console.log(`[Game Generation] Skipping bracket ${bracket.bracketName} - no approved teams`);
      continue;
    }

    console.log(`[Game Generation] Processing bracket ${bracket.bracketName} with ${bracket.teamCount} teams`);

    // Get teams for this bracket with their seeding positions
    const bracketTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        bracketId: teams.bracketId,
        groupId: teams.groupId,
        seedRanking: teams.seedRanking
      })
      .from(teams)
      .where(and(
        eq(teams.bracketId, bracket.bracketId),
        eq(teams.status, 'approved')
      ))
      .orderBy(teams.seedRanking);

    // Prepare bracket data for tournament scheduler
    const bracketData = {
      bracketId: bracket.bracketId,
      bracketName: bracket.bracketName,
      format: bracket.format,
      tournamentFormat: bracket.format,
      teams: bracketTeams,
      id: bracket.bracketId,
      name: bracket.bracketName
    };

    console.log(`[Game Generation] Generating games for bracket ${bracket.bracketName} using format '${bracket.format}'`);

    try {
      // Import tournament scheduler
      const { TournamentScheduler } = await import('../../services/tournament-scheduler');
      
      // Generate games using the enhanced tournament scheduler
      const generatedGames = await TournamentScheduler.generateBracketGames(bracketData, 1);
      
      console.log(`[Game Generation] Generated ${generatedGames.length} games for bracket ${bracket.bracketName}`);

      // Save games to database
      for (const game of generatedGames) {
        await db.insert(games).values({
          eventId: eventId,
          ageGroupId: bracket.ageGroupId,
          groupId: game.poolId ? parseInt(game.poolId) : null,
          homeTeamId: game.homeTeamId || null,
          awayTeamId: game.awayTeamId || null,
          round: game.round === 'Pool Play' ? 1 : 2, // Pool play = round 1, finals = round 2
          matchNumber: game.gameNumber,
          duration: game.duration || 90,
          status: game.homeTeamId && game.awayTeamId ? 'scheduled' : 'pending' // TBD games are pending
        });
      }

      console.log(`[Game Generation] Saved ${generatedGames.length} games to database for bracket ${bracket.bracketName}`);

    } catch (error) {
      console.error(`[Game Generation] Failed to generate games for bracket ${bracket.bracketName}:`, error);
      throw new Error(`Failed to generate games for bracket ${bracket.bracketName}: ${(error as Error).message}`);
    }
  }

  console.log(`[Game Generation] Completed game generation for event ${eventId}`);
}

export default router;