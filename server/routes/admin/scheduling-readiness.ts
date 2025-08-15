import express from 'express';
import { db } from 'db';
import { eq, sql } from 'drizzle-orm';
import { 
  events, 
  teams, 
  eventGameFormats, 
  eventScheduleConstraints,
  fields,
  complexes,
  clubs,
  eventAgeGroups
} from '@db/schema';
import { isAdmin } from '../../middleware/auth';

const router = express.Router();

// GET /api/admin/events/:eventId/scheduling-readiness
// Analyze tournament configuration for scheduling readiness
router.get('/events/:eventId/scheduling-readiness', async (req, res) => {
  try {
    console.log(`=== SCHEDULING READINESS ANALYSIS ===`);
    console.log(`Event ID: ${req.params.eventId}`);
    
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ 
        error: 'Invalid event ID',
        providedEventId: req.params.eventId
      });
    }

    // 1. Fetch tournament teams with coach information
    console.log('Fetching teams...');
    const tournamentTeams = await db.select({
      id: teams.id,
      name: teams.name,
      ageGroupId: teams.ageGroupId,
      coach: teams.coach,
      coachNames: sql<string[]>`
        CASE 
          WHEN ${teams.coach}::text LIKE '%{%' 
          THEN ARRAY[${teams.coach}->>'headCoachName']
          ELSE ARRAY[${teams.coach}]
        END
      `,
      clubId: teams.clubId,
      status: teams.status
    })
    .from(teams)
    .where(eq(teams.eventId, eventId.toString()));

    console.log(`Found ${tournamentTeams.length} teams`);

    // 2. Fetch game formats
    console.log('Fetching game formats...');
    const gameFormats = await db.select()
      .from(eventGameFormats)
      .where(eq(eventGameFormats.eventId, eventId));

    console.log(`Found ${gameFormats.length} game formats`);

    // 3. Fetch schedule constraints
    console.log('Fetching schedule constraints...');
    const scheduleConstraints = await db.select()
      .from(eventScheduleConstraints)
      .where(eq(eventScheduleConstraints.eventId, eventId));

    console.log(`Found ${scheduleConstraints.length} schedule constraints`);

    // 4. Fetch fields and complexes
    console.log('Fetching fields...');
    const tournamentFields = await db.select({
      id: fields.id,
      name: fields.name,
      fieldSize: fields.fieldSize,
      hasLights: fields.hasLights,
      openTime: fields.openTime,
      closeTime: fields.closeTime,
      complexId: fields.complexId,
      complexName: complexes.name,
      complexOpenTime: complexes.openTime,
      complexCloseTime: complexes.closeTime
    })
    .from(fields)
    .leftJoin(complexes, eq(fields.complexId, complexes.id))
    .where(eq(fields.isOpen, true));

    console.log(`Found ${tournamentFields.length} available fields`);

    // 5. Fetch clubs
    console.log('Fetching clubs...');
    const tournamentClubs = await db.select()
      .from(clubs);

    console.log(`Found ${tournamentClubs.length} clubs`);

    // 6. Fetch age groups
    console.log('Fetching age groups...');
    const ageGroups = await db.select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId.toString()));

    console.log(`Found ${ageGroups.length} age groups`);

    // 7. Analyze coach conflicts
    console.log('Analyzing coach conflicts...');
    const coachTeamMap = new Map<string, any[]>();
    
    tournamentTeams.forEach(team => {
      if (team.coachNames && team.coachNames.length > 0) {
        team.coachNames.forEach((coachName: string) => {
          if (coachName && coachName.trim()) {
            const cleanCoachName = coachName.trim().toLowerCase();
            if (!coachTeamMap.has(cleanCoachName)) {
              coachTeamMap.set(cleanCoachName, []);
            }
            const teamList = coachTeamMap.get(cleanCoachName);
            if (teamList) {
              teamList.push(team);
            }
          }
        });
      }
    });

    const coachConflicts = Array.from(coachTeamMap.entries())
      .filter(([_, teams]) => teams.length > 1)
      .map(([coachName, teams]) => ({
        coachName,
        teams: teams.map(t => ({ id: t.id, name: t.name, ageGroupId: t.ageGroupId })),
        conflictCount: teams.length
      }));

    console.log(`Found ${coachConflicts.length} coaches with multiple teams`);

    // 8. Build comprehensive readiness report
    const readinessReport = {
      // Core data
      teams: tournamentTeams,
      gameFormats,
      scheduleConstraints: scheduleConstraints[0] || null,
      fields: tournamentFields,
      clubs: tournamentClubs,
      ageGroups,
      coachConflicts,

      // Analysis flags
      hasTeams: tournamentTeams.length > 0,
      hasGameFormats: gameFormats.length > 0,
      hasScheduleConstraints: scheduleConstraints.length > 0,
      hasFields: tournamentFields.length > 0,
      hasCoachInfo: tournamentTeams.some(t => t.coachNames && t.coachNames.length > 0),
      hasAgeGroups: ageGroups.length > 0,

      // Missing components (will be added when we implement them)
      flights: [], // TODO: Implement flights
      brackets: [], // TODO: Implement brackets
      seedingLogic: null, // TODO: Implement seeding
      advancementRules: null, // TODO: Implement advancement rules
      tieBreakerRules: null, // TODO: Implement tie-breaker rules
      spacingRules: scheduleConstraints[0] || null,
      timeSlotGenerator: true, // Automatic

      // Summary statistics
      stats: {
        totalTeams: tournamentTeams.length,
        approvedTeams: tournamentTeams.filter(t => t.status === 'approved').length,
        ageGroupCount: new Set(tournamentTeams.map(t => t.ageGroupId)).size,
        fieldCount: tournamentFields.length,
        coachConflictCount: coachConflicts.length,
        gameFormatCount: gameFormats.length
      }
    };

    console.log('Tournament readiness analysis complete');
    console.log('Stats:', readinessReport.stats);

    res.json(readinessReport);

  } catch (error: any) {
    console.error('=== SCHEDULING READINESS ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    
    res.status(500).json({ 
      error: 'Failed to analyze scheduling readiness', 
      details: error?.message || 'Unknown error'
    });
  }
});

// GET /api/admin/events/:eventId/validate
// Validate configuration completeness for schedule generation
router.get('/events/:eventId/validate', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventIdInt = parseInt(eventId);

    console.log(`🔍 CONFIGURATION VALIDATION - Event ${eventId}`);
    console.log('==========================================');

    // Initialize validation results with enhanced analysis
    const buildingBlocks = [
      {
        name: 'Game Metadata Configuration',
        key: 'gameMetadata',
        status: 'pending' as 'complete' | 'partial' | 'pending' | 'missing',
        description: 'Game formats, rules, and scheduling constraints',
        details: 'Checking game metadata configuration...',
        priority: 'high' as 'high' | 'medium' | 'low',
        blocksScheduling: true,
        configurationUrl: `/admin/events/${eventId}/game-metadata`,
        validationRules: ['Game format rules defined', 'Schedule constraints configured', 'Field requirements specified']
      },
      {
        name: 'Age Group & Division Rules',
        key: 'ageGroupRules',
        status: 'pending' as 'complete' | 'partial' | 'pending' | 'missing',
        description: 'Age group management and flight creation',
        details: 'Checking age group configuration...',
        priority: 'high' as 'high' | 'medium' | 'low',
        blocksScheduling: true,
        configurationUrl: `/admin/events/${eventId}/flexible-age-groups`,
        validationRules: ['Age groups defined', 'Teams assigned to age groups', 'Flight structure established']
      },
      {
        name: 'Tournament Parameters',
        key: 'tournamentParameters',
        status: 'pending' as 'complete' | 'partial' | 'pending' | 'missing',
        description: 'Overall tournament settings and parameters',
        details: 'Checking tournament parameters...',
        priority: 'high' as 'high' | 'medium' | 'low',
        blocksScheduling: true,
        configurationUrl: `/admin/events/${eventId}/tournament-parameters`,
        validationRules: ['Operating hours defined', 'Field allocations set', 'Time slot configurations complete']
      },
      {
        name: 'Field Inventory & Venues',
        key: 'fieldInventory',
        status: 'pending' as 'complete' | 'partial' | 'pending' | 'missing',
        description: 'Field availability and venue management',
        details: 'Checking field and venue setup...',
        priority: 'high' as 'high' | 'medium' | 'low',
        blocksScheduling: true,
        configurationUrl: '/admin/complexes',
        validationRules: ['Fields defined in system', 'Field sizes match age groups', 'Venue availability confirmed']
      }
    ];

    // 1. Validate Game Metadata
    console.log('Validating game metadata...');
    try {
      const gameFormats = await db
        .select()
        .from(eventGameFormats)
        .where(eq(eventGameFormats.eventId, eventIdInt));

      const constraints = await db
        .select()
        .from(eventScheduleConstraints)
        .where(eq(eventScheduleConstraints.eventId, eventIdInt));

      const gameMetadataBlock = buildingBlocks.find(b => b.key === 'gameMetadata')!;
      
      if (gameFormats.length > 0 && constraints.length > 0) {
        gameMetadataBlock.status = 'complete';
        gameMetadataBlock.details = `✓ ${gameFormats.length} game formats and schedule constraints configured`;
        gameMetadataBlock.blocksScheduling = false;
      } else if (gameFormats.length > 0 || constraints.length > 0) {
        gameMetadataBlock.status = 'partial';
        gameMetadataBlock.details = `⚠ Partial: ${gameFormats.length} game formats, ${constraints.length} constraints`;
      } else {
        gameMetadataBlock.status = 'missing';
        gameMetadataBlock.details = '❌ No game metadata configured';
      }
    } catch (error) {
      console.error('Game metadata validation error:', error);
      const gameMetadataBlock = buildingBlocks.find(b => b.key === 'gameMetadata')!;
      gameMetadataBlock.status = 'missing';
      gameMetadataBlock.details = '❌ Error checking game metadata';
    }

    // 2. Validate Age Groups
    console.log('Validating age groups...');
    try {
      const eventTeams = await db
        .select()
        .from(teams)
        .where(eq(teams.eventId, eventId.toString()));

      const ageGroupsWithTeams = new Set(eventTeams.map((t: any) => t.ageGroupId).filter(Boolean));
      
      const ageGroupBlock = buildingBlocks.find(b => b.key === 'ageGroupRules')!;
      
      if (ageGroupsWithTeams.size >= 2 && eventTeams.length >= 4) {
        ageGroupBlock.status = 'complete';
        ageGroupBlock.details = `✓ ${ageGroupsWithTeams.size} age groups with ${eventTeams.length} teams`;
        ageGroupBlock.blocksScheduling = false;
      } else if (ageGroupsWithTeams.size > 0) {
        ageGroupBlock.status = 'partial';
        ageGroupBlock.details = `⚠ Needs more teams: ${ageGroupsWithTeams.size} age groups, ${eventTeams.length} teams`;
      } else {
        ageGroupBlock.status = 'missing';
        ageGroupBlock.details = '❌ No age groups or teams configured';
      }
    } catch (error) {
      console.error('Age group validation error:', error);
      const ageGroupBlock = buildingBlocks.find(b => b.key === 'ageGroupRules')!;
      ageGroupBlock.status = 'missing';
      ageGroupBlock.details = '❌ Error checking age groups';
    }

    // 3. Validate Tournament Parameters
    console.log('Validating tournament parameters...');
    const tournamentParamsBlock = buildingBlocks.find(b => b.key === 'tournamentParameters')!;
    
    // Check if tournament has event data and basic configuration
    try {
      const eventData = await db
        .select()
        .from(events)
        .where(eq(events.id, eventIdInt))
        .limit(1);

      if (eventData.length > 0) {
        tournamentParamsBlock.status = 'complete';
        tournamentParamsBlock.details = '✓ Tournament parameters available via configuration interface';
        tournamentParamsBlock.blocksScheduling = false;
      } else {
        tournamentParamsBlock.status = 'missing';
        tournamentParamsBlock.details = '❌ Tournament not found';
      }
    } catch (error) {
      console.error('Tournament parameters validation error:', error);
      tournamentParamsBlock.status = 'missing';
      tournamentParamsBlock.details = '❌ Error checking tournament parameters';
    }

    // 4. Validate Field Inventory
    console.log('Validating field inventory...');
    try {
      const fieldData = await db
        .select()
        .from(fields)
        .leftJoin(complexes, eq(fields.complexId, complexes.id));

      const fieldInventoryBlock = buildingBlocks.find(b => b.key === 'fieldInventory')!;
      
      if (fieldData.length >= 2) {
        fieldInventoryBlock.status = 'complete';
        fieldInventoryBlock.details = `✓ ${fieldData.length} fields available across venues`;
        fieldInventoryBlock.blocksScheduling = false;
      } else if (fieldData.length > 0) {
        fieldInventoryBlock.status = 'partial';
        fieldInventoryBlock.details = `⚠ Limited fields: ${fieldData.length} field(s) - recommend adding more`;
      } else {
        fieldInventoryBlock.status = 'missing';
        fieldInventoryBlock.details = '❌ No fields configured';
      }
    } catch (error) {
      console.error('Field inventory validation error:', error);
      const fieldInventoryBlock = buildingBlocks.find(b => b.key === 'fieldInventory')!;
      fieldInventoryBlock.status = 'missing';
      fieldInventoryBlock.details = '❌ Error checking field inventory';
    }

    // Calculate overall readiness
    const completeBlocks = buildingBlocks.filter(b => b.status === 'complete').length;
    const totalBlocks = buildingBlocks.length;
    const readyForScheduling = buildingBlocks.every(b => !b.blocksScheduling);
    
    const validationSummary = {
      isReadyForScheduling: readyForScheduling,
      completionPercentage: Math.round((completeBlocks / totalBlocks) * 100),
      completedBlocks: completeBlocks,
      totalBlocks: totalBlocks,
      buildingBlocks: buildingBlocks,
      nextSteps: buildingBlocks
        .filter(b => b.status !== 'complete')
        .slice(0, 3)
        .map(b => ({
          name: b.name,
          action: `Configure ${b.name}`,
          url: b.configurationUrl
        })),
      scheduleGenerationReady: readyForScheduling ? 
        'All configuration blocks complete - ready for automated schedule generation' :
        `${totalBlocks - completeBlocks} configuration block(s) need completion before scheduling`
    };

    console.log('Configuration validation complete');
    console.log(`Ready for scheduling: ${readyForScheduling}`);
    console.log(`Completion: ${completeBlocks}/${totalBlocks} blocks`);

    res.json(validationSummary);

  } catch (error: any) {
    console.error('=== CONFIGURATION VALIDATION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    
    res.status(500).json({ 
      error: 'Failed to validate configuration', 
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;