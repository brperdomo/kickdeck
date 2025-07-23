import { Router } from 'express';
import { db } from '../../../db';
import { events, workflowProgress } from '../../../db/schema';
import { eq, sql, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/admin/tournaments/scheduling - Get tournaments with scheduling progress info
router.get('/scheduling', async (req, res) => {
  try {
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

    // Get tournaments with progress information
    const tournaments = await db
      .select({
        id: events.id,
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        teamsCount: sql<number>`COALESCE((
          SELECT COUNT(*) 
          FROM teams 
          WHERE teams.event_id = ${events.id} 
          AND teams.status = 'approved'
        ), 0)`,
        hasProgress: sql<boolean>`EXISTS(
          SELECT 1 
          FROM workflow_progress 
          WHERE workflow_progress.event_id = ${events.id} 
          AND workflow_progress.workflow_type = 'scheduling'
        )`,
        lastModified: sql<string>`(
          SELECT workflow_progress.last_saved
          FROM workflow_progress 
          WHERE workflow_progress.event_id = ${events.id} 
          AND workflow_progress.workflow_type = 'scheduling'
          ORDER BY workflow_progress.last_saved DESC
          LIMIT 1
        )`,
        adminSession: sql<string>`(
          SELECT workflow_progress.session_id
          FROM workflow_progress 
          WHERE workflow_progress.event_id = ${events.id} 
          AND workflow_progress.workflow_type = 'scheduling'
          ORDER BY workflow_progress.last_saved DESC
          LIMIT 1
        )`
      })
      .from(events)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(events.startDate));

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