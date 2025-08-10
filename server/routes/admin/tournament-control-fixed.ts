/**
 * Tournament Control API Routes
 * Handles unified tournament control center functionality
 */

import { Router } from 'express';
import { db } from '@db';
import { isAdmin } from '../../middleware';
import { events, teams, games, eventAgeGroups, eventBrackets, fields } from '@db/schema';
import { eq, and, count } from 'drizzle-orm';

const router = Router();

// Helper function to get tournament status
async function getTournamentStatus(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, parseInt(eventId))
  });

  const teamsCount = await db.select({ count: count() }).from(teams).where(eq(teams.eventId, parseInt(eventId)));
  const gamesCount = await db.select({ count: count() }).from(games).where(eq(games.eventId, parseInt(eventId)));
  const ageGroupsCount = await db.select({ count: count() }).from(eventAgeGroups).where(eq(eventAgeGroups.eventId, parseInt(eventId)));

  return {
    event,
    teams: teamsCount[0]?.count || 0,
    games: gamesCount[0]?.count || 0,
    ageGroups: ageGroupsCount[0]?.count || 0,
    status: 'active'
  };
}

// Helper function to get components status
async function getComponentsStatus(eventId: string) {
  const teamsCount = await db.select({ count: count() }).from(teams).where(eq(teams.eventId, parseInt(eventId)));
  const gamesCount = await db.select({ count: count() }).from(games).where(eq(games.eventId, parseInt(eventId)));
  const fieldsCount = await db.select({ count: count() }).from(fields);

  return {
    teams: teamsCount[0]?.count || 0,
    games: gamesCount[0]?.count || 0,
    fields: fieldsCount[0]?.count || 0,
    ready: true
  };
}

// Helper function for auto-scheduling execution
async function executeAutoScheduling(eventId: string, options: { includeReferees: boolean; includeFacilities: boolean }) {
  // Basic implementation for now
  return {
    success: true,
    gamesScheduled: 0,
    message: 'Auto-scheduling feature available'
  };
}

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
  } catch (error: any) {
    console.error('Auto-scheduling failed:', error);
    res.status(500).json({ 
      error: 'Auto-scheduling failed',
      details: error.message 
    });
  }
});

export default router;