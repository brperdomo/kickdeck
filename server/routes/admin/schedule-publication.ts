import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, eventBrackets, fields } from '@db/schema';
import { eq, and, sql, count, isNotNull } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Get schedule summary
router.get('/:eventId/schedule/summary', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get total games
    const totalGamesResult = await db
      .select({ count: count() })
      .from(games)
      .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
      .where(eq(eventBrackets.eventId, eventId));

    // Get assigned games
    const assignedGamesResult = await db
      .select({ count: count() })
      .from(games)
      .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          isNotNull(games.fieldId)
        )
      );

    // Get fields used
    const fieldsUsedResult = await db
      .select({ fieldId: games.fieldId })
      .from(games)
      .innerJoin(eventBrackets, eq(games.bracketId, sql`${eventBrackets.id}::text`))
      .where(
        and(
          eq(eventBrackets.eventId, eventId),
          isNotNull(games.fieldId)
        )
      )
      .groupBy(games.fieldId);

    // Get participating teams
    const teamsResult = await db
      .select({ count: count() })
      .from(teams)
      .where(
        and(
          eq(teams.eventId, eventId),
          eq(teams.status, 'approved')
        )
      );

    res.json({
      totalGames: totalGamesResult[0]?.count || 0,
      assignedGames: assignedGamesResult[0]?.count || 0,
      fieldsUsed: fieldsUsedResult.length,
      daysSpanned: 2, // Placeholder - would calculate from actual schedule dates
      teamsParticipating: teamsResult[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching schedule summary:', error);
    res.status(500).json({ error: 'Failed to fetch schedule summary' });
  }
});

// Get publication status
router.get('/:eventId/schedule/publication-status', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Check if schedule is published (placeholder logic)
    // In a real implementation, this would check a publication status table
    const isPublished = false;
    
    res.json({
      isPublished,
      publishedAt: isPublished ? new Date().toISOString() : null,
      scheduleUrl: isPublished ? `/schedule/public/${eventId}` : null,
      notificationsSent: 0,
      downloadFormats: ['pdf', 'csv', 'ical']
    });
  } catch (error) {
    console.error('Error fetching publication status:', error);
    res.status(500).json({ error: 'Failed to fetch publication status' });
  }
});

// Publish schedule
router.post('/:eventId/schedule/publish', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { notifications } = req.body;

    // Placeholder publication logic
    // In a real implementation, this would:
    // 1. Mark schedule as published
    // 2. Generate public URLs
    // 3. Send notifications based on selections
    // 4. Create publication record

    let notificationsSent = 0;
    if (notifications.teams) notificationsSent += 25;
    if (notifications.referees) notificationsSent += 8;
    if (notifications.officials) notificationsSent += 5;

    res.json({
      success: true,
      isPublished: true,
      publishedAt: new Date().toISOString(),
      scheduleUrl: `/schedule/public/${eventId}`,
      notificationsSent,
      message: 'Schedule published successfully'
    });
  } catch (error) {
    console.error('Error publishing schedule:', error);
    res.status(500).json({ error: 'Failed to publish schedule' });
  }
});

// Send notifications
router.post('/:eventId/schedule/notify', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { recipients } = req.body;

    // Placeholder notification logic
    let recipientCount = 0;
    recipients.forEach((recipient: string) => {
      switch (recipient) {
        case 'teams':
          recipientCount += 25;
          break;
        case 'referees':
          recipientCount += 8;
          break;
        case 'officials':
          recipientCount += 5;
          break;
      }
    });

    res.json({
      success: true,
      recipientCount,
      message: `Sent notifications to ${recipientCount} recipients`
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Generate exports
router.post('/:eventId/schedule/export', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { formats } = req.body;

    // Placeholder export generation
    // In a real implementation, this would generate actual files
    
    res.json({
      success: true,
      formats: formats,
      downloadUrls: formats.map((format: string) => `/api/admin/events/${eventId}/schedule/download/${format}`),
      message: `Generated ${formats.length} export formats`
    });
  } catch (error) {
    console.error('Error generating exports:', error);
    res.status(500).json({ error: 'Failed to generate exports' });
  }
});

export default router;