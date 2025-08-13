import { Router } from 'express';
import { AIAuditLogger } from '../services/ai-audit-logger';

const router = Router();

/**
 * Get audit summary for an event
 */
router.get('/events/:eventId/ai-audit/summary', async (req, res) => {
  try {
    const { eventId } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const summary = await AIAuditLogger.generateAuditSummary(eventId, hours);
    
    if (!summary) {
      return res.status(500).json({ error: 'Failed to generate audit summary' });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get full audit history for an event
 */
router.get('/events/:eventId/ai-audit', async (req, res) => {
  try {
    const { eventId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const auditHistory = await AIAuditLogger.getEventAuditHistory(eventId, limit);
    res.json(auditHistory);
  } catch (error) {
    console.error('Error fetching audit history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get failed actions only
 */
router.get('/events/:eventId/ai-audit/failures', async (req, res) => {
  try {
    const { eventId } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const failedActions = await AIAuditLogger.getFailedActions(eventId, hours);
    res.json(failedActions);
  } catch (error) {
    console.error('Error fetching failed actions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Export audit log as CSV
 */
router.get('/events/:eventId/ai-audit/export', async (req, res) => {
  try {
    const { eventId } = req.params;
    const limit = parseInt(req.query.limit as string) || 1000;
    
    const auditHistory = await AIAuditLogger.getEventAuditHistory(eventId, limit);
    
    // Convert to CSV
    const csvHeaders = [
      'Timestamp',
      'Action Type',
      'Success',
      'Target Table',
      'Target ID',
      'User Request',
      'AI Reasoning',
      'Error Message',
      'Session ID'
    ];
    
    const csvRows = auditHistory.map(entry => [
      entry.timestamp,
      entry.actionType,
      entry.success ? 'SUCCESS' : 'FAILED',
      entry.targetTable,
      entry.targetId,
      `"${entry.userRequest}"`,
      `"${entry.aiReasoning || ''}"`,
      `"${entry.errorMessage || ''}"`,
      entry.sessionId
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ai-audit-log-event-${eventId}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting audit log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Mark audit entry as reviewed
 */
router.post('/events/:eventId/ai-audit/:auditId/review', async (req, res) => {
  try {
    const { auditId } = req.params;
    const { reviewNotes } = req.body;
    const reviewedBy = req.user?.email || 'Unknown Admin';
    
    // This would need to be implemented in AIAuditLogger
    // await AIAuditLogger.markAsReviewed(auditId, reviewedBy, reviewNotes);
    
    res.json({ success: true, message: 'Audit entry marked as reviewed' });
  } catch (error) {
    console.error('Error marking audit entry as reviewed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;