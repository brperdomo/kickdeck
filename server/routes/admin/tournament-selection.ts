import { Router } from 'express';
import { db } from '../../../db';
import { events, workflowProgress, teams } from '../../../db/schema';
import { eq, sql, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/admin/tournaments/scheduling - Get tournaments with scheduling progress info
router.get('/scheduling', async (req, res) => {
  try {
    console.log('Fetching tournaments for scheduling...');
    const { status, hasProgress } = req.query;
    
    // Build the base query
    let whereConditions = [];
    
    if (status && status !== 'all') {
      // Map status to appropriate database field if needed
      if (status === 'draft') {
        whereConditions.push(sql`${events.isArchived} = false`);
      } else if (status === 'active') {
        whereConditions.push(sql`${events.startDate} <= NOW() AND ${events.endDate} >= NOW()`);
      } else if (status === 'completed') {
        whereConditions.push(sql`${events.endDate} < NOW()`);
      }
    }

    // First get basic tournaments data
    console.log('Getting basic tournaments data...');
    const basicTournaments = await db
      .select({
        id: events.id,
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate
      })
      .from(events)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(events.startDate));

    console.log(`Found ${basicTournaments.length} tournaments`);

    // Then enhance with counts and progress info
    const tournaments = [];
    for (const tournament of basicTournaments) {
      try {
        console.log(`Processing tournament ${tournament.id} (${tournament.name})...`);
        
        // Get teams count with better error handling
        let teamsCount = 0;
        try {
          const teamsResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(teams)
            .where(and(
              eq(teams.eventId, tournament.id.toString()),
              eq(teams.status, 'approved')
            ));
          
          teamsCount = Number(teamsResult[0]?.count || 0);
          console.log(`Tournament ${tournament.id}: Found ${teamsCount} approved teams`);
        } catch (teamsError) {
          console.error(`Error counting teams for tournament ${tournament.id}:`, teamsError);
        }

        // Check for workflow progress with better error handling
        let hasProgressFlag = false;
        let lastModified = null;
        let adminSession = null;
        
        try {
          const progressResult = await db
            .select()
            .from(workflowProgress)
            .where(
              and(
                eq(workflowProgress.eventId, Number(tournament.id)),
                eq(workflowProgress.workflowType, 'scheduling')
              )
            )
            .orderBy(desc(workflowProgress.lastSaved))
            .limit(1);

          hasProgressFlag = progressResult.length > 0;
          lastModified = progressResult[0]?.lastSaved || null;
          adminSession = progressResult[0]?.sessionId || null;
          
          console.log(`Tournament ${tournament.id}: Progress check - hasProgress: ${hasProgressFlag}`);
        } catch (progressError) {
          console.error(`Error checking progress for tournament ${tournament.id}:`, progressError);
        }

        tournaments.push({
          ...tournament,
          teamsCount,
          hasProgress: hasProgressFlag,
          lastModified,
          adminSession
        });
        
        console.log(`Tournament ${tournament.id} processed successfully`);
      } catch (subError) {
        console.error(`Error processing tournament ${tournament.id}:`, subError);
        // Add tournament with default values
        tournaments.push({
          ...tournament,
          teamsCount: 0,
          hasProgress: false,
          lastModified: null,
          adminSession: null
        });
      }
    }

    // Filter by progress if requested
    const filteredTournaments = hasProgress === 'true' 
      ? tournaments.filter(t => t.hasProgress)
      : tournaments;

    // Add status determination
    const tournamentsWithStatus = filteredTournaments.map(tournament => {
      const now = new Date();
      const startDate = new Date(tournament.startDate);
      const endDate = new Date(tournament.endDate);
      
      let status = 'draft';
      if (now >= startDate && now <= endDate) {
        status = 'active';
      } else if (now > endDate) {
        status = 'completed';
      }

      return {
        ...tournament,
        status,
        // Format session ID for display (first 8 characters)
        adminSession: tournament.adminSession ? 
          `Admin-${tournament.adminSession.substring(0, 8)}` : null
      };
    });

    res.json(tournamentsWithStatus);
  } catch (error) {
    console.error('Error fetching tournaments for scheduling:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tournaments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/tournaments/:id/scheduling/start - Start or continue scheduling
router.post('/:id/scheduling/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.body; // 'continue' | 'fresh'
    const sessionId = req.sessionID;

    if (mode === 'fresh') {
      // Clear any existing progress for this event
      await db
        .delete(workflowProgress)
        .where(
          and(
            eq(workflowProgress.eventId, parseInt(id)),
            eq(workflowProgress.workflowType, 'scheduling')
          )
        );
    }

    // Check if tournament exists and user has access
    const tournament = await db
      .select({
        id: events.id,
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate
      })
      .from(events)
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    if (tournament.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get existing progress if in continue mode
    let existingProgress = null;
    if (mode === 'continue') {
      const progress = await db
        .select()
        .from(workflowProgress)
        .where(
          and(
            eq(workflowProgress.eventId, parseInt(id)),
            eq(workflowProgress.workflowType, 'scheduling')
          )
        )
        .limit(1);

      existingProgress = progress[0] || null;
    }

    res.json({
      tournament: tournament[0],
      mode,
      sessionId,
      existingProgress,
      redirectUrl: `/admin/events/${id}/scheduling/enhanced`
    });
  } catch (error) {
    console.error('Error starting tournament scheduling:', error);
    res.status(500).json({ 
      error: 'Failed to start scheduling',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;