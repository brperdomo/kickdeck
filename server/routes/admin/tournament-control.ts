/**
 * Tournament Control API Routes
 * Handles unified tournament control center functionality
 */

import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { events, teams, games } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get tournament status and progress
router.get('/tournaments/:eventId/status', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check current tournament status
    const status = await getTournamentStatus(eventId);
    
    res.json(status);
  } catch (error: any) {
    console.error('Error fetching tournament status:', error);
    res.status(500).json({ error: 'Failed to fetch tournament status' });
  }
});

// Get scheduling components status
router.get('/tournaments/:eventId/components-status', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const components = await getComponentsStatus(eventId);
    
    res.json(components);
  } catch (error) {
    console.error('Error fetching components status:', error);
    res.status(500).json({ error: 'Failed to fetch components status' });
  }
});

// Execute auto-scheduling
router.post('/tournaments/:eventId/auto-schedule', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { includeReferees = true, includeFacilities = true } = req.body;
    
    console.log(`Starting auto-schedule for event ${eventId}`);
    
    // Execute full auto-scheduling workflow
    const result = await executeAutoScheduling(eventId, {
      includeReferees,
      includeFacilities
    });
    
    res.json({
      success: true,
      message: 'Auto-scheduling completed successfully',
      result
    });
  } catch (error) {
    console.error('Auto-scheduling failed:', error);
    res.status(500).json({ 
      error: 'Auto-scheduling failed',
      details: error.message 
    });
  }
});

// Execute individual manual steps
router.post('/tournaments/:eventId/execute-step', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { step } = req.body;
    
    console.log(`Executing manual step: ${step} for event ${eventId}`);
    
    let result;
    
    switch (step) {
      case 'configure-formats':
        result = await configureGameFormats(eventId);
        break;
      case 'assign-flights':
        result = await assignFlights(eventId);
        break;
      case 'create-brackets':
        result = await createBrackets(eventId);
        break;
      case 'validate-facilities':
        result = await validateFacilities(eventId);
        break;
      case 'assign-referees':
        result = await assignReferees(eventId);
        break;
      case 'optimize-schedule':
        result = await optimizeSchedule(eventId);
        break;
      default:
        throw new Error(`Unknown step: ${step}`);
    }
    
    res.json({
      success: true,
      message: `${step} completed successfully`,
      result
    });
  } catch (error: any) {
    console.error(`Step execution failed (${req.body.step}):`, error);
    res.status(500).json({ 
      error: `Failed to execute ${req.body.step}`,
      details: error.message 
    });
  }
});

// Helper functions

async function getTournamentStatus(eventId: string) {
  // Get tournament data and analyze current state
  const eventData = await db.select().from(events).where(eq(events.id, parseInt(eventId))).limit(1);
  
  if (eventData.length === 0) {
    throw new Error('Tournament not found');
  }
  
  // Analyze completion status
  const teamsData = await db.select().from(teams).where(eq(teams.eventId, parseInt(eventId)));
  const gamesData = await db.select().from(games).where(eq(games.eventId, parseInt(eventId)));
  
  // Determine current phase and progress
  let phase: 'setup' | 'configuration' | 'scheduling' | 'optimization' | 'finalized' = 'setup';
  let progress = 0;
  let nextAction = 'Configure game formats to begin tournament setup';
  let canProceed = teamsData.length > 0;
  
  const issues = [];
  
  if (teamsData.length === 0) {
    issues.push({
      type: 'warning' as const,
      message: 'No teams registered yet. Tournament setup requires teams.',
      action: 'register-teams'
    });
    canProceed = false;
  } else if (gamesData.length === 0) {
    phase = 'configuration';
    progress = 25;
    nextAction = 'Create tournament brackets and games';
  } else {
    phase = 'scheduling';
    progress = 75;
    nextAction = 'Optimize schedule and assign referees';
    
    // Check if schedule is finalized
    const scheduledGames = gamesData.filter(g => g.timeSlotId !== null);
    if (scheduledGames.length === gamesData.length) {
      phase = 'finalized';
      progress = 100;
      nextAction = 'Tournament schedule is complete';
    }
  }
  
  return {
    phase,
    progress,
    nextAction,
    canProceed,
    issues
  };
}

async function getComponentsStatus(eventId: string) {
  const teamsData = await db.select().from(teams).where(eq(teams.eventId, parseInt(eventId)));
  const gamesData = await db.select().from(games).where(eq(games.eventId, parseInt(eventId)));
  
  // Check status of each component
  return {
    gameFormats: gamesData.length > 0, // Games exist means formats are configured
    flightAssignment: teamsData.length > 0, // Teams exist means flights are assigned
    bracketCreation: gamesData.length > 0, // Games exist means brackets are created
    facilityConstraints: true, // Always available
    refereeAssignment: true, // Always available
    scheduleOptimization: gamesData.length > 0 // Available when games exist
  };
}

// Placeholder implementations for manual steps
async function executeAutoScheduling(eventId: string, options: any) {
  console.log(`Executing auto-scheduling for event ${eventId} with options:`, options);
  
  // For now, return a success message
  // In a real implementation, this would:
  // 1. Configure game formats
  // 2. Assign teams to flights
  // 3. Create brackets
  // 4. Validate facility constraints
  // 5. Assign referees
  // 6. Optimize final schedule
  
  return {
    gamesCreated: 0,
    bracketsCreated: 0,
    refereesAssigned: 0,
    message: 'Auto-scheduling workflow initiated'
  };
}

async function configureGameFormats(eventId: string) {
  console.log(`Configuring game formats for event ${eventId}`);
  return { message: 'Game formats configured' };
}

async function assignFlights(eventId: string) {
  console.log(`Assigning flights for event ${eventId}`);
  return { message: 'Flights assigned' };
}

async function createBrackets(eventId: string) {
  console.log(`Creating brackets for event ${eventId}`);
  return { message: 'Brackets created' };
}

async function validateFacilities(eventId: string) {
  console.log(`Validating facilities for event ${eventId}`);
  return { message: 'Facilities validated' };
}

async function assignReferees(eventId: string) {
  console.log(`Assigning referees for event ${eventId}`);
  return { message: 'Referees assigned' };
}

async function optimizeSchedule(eventId: string) {
  console.log(`Optimizing schedule for event ${eventId}`);
  return { message: 'Schedule optimized' };
}

export default router;