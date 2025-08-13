import { db } from "../../db";
import { aiAuditLog } from "../../db/schema";
import { eq, and, gte } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Audit Logger Service
 * Tracks all AI-initiated changes for tournament scheduling transparency
 */
export class AIAuditLogger {
  
  /**
   * Log an AI action with full context
   */
  static async logAction({
    eventId,
    sessionId,
    actionType,
    targetTable,
    targetId,
    oldValues,
    newValues,
    aiReasoning,
    userRequest,
    success,
    errorMessage
  }: {
    eventId: string;
    sessionId: string;
    actionType: 'move_game' | 'swap_teams' | 'create_game' | 'update_status' | 'move_team_bracket' | 'update_field' | 'record_score';
    targetTable: string;
    targetId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    aiReasoning?: string;
    userRequest: string;
    success: boolean;
    errorMessage?: string;
  }) {
    try {
      await db.insert(aiAuditLog).values({
        id: uuidv4(),
        eventId: parseInt(eventId),
        sessionId,
        actionType,
        targetTable,
        targetId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        aiReasoning,
        userRequest,
        success,
        errorMessage,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🤖 AI Action Logged: ${actionType} on ${targetTable}:${targetId} - ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('Failed to log AI action:', error);
    }
  }

  /**
   * Get audit history for an event
   */
  static async getEventAuditHistory(eventId: string, limit: number = 100) {
    try {
      return await db.query.aiAuditLog.findMany({
        where: (aiAuditLog, { eq }) => eq(aiAuditLog.eventId, parseInt(eventId)),
        orderBy: (aiAuditLog, { desc }) => [desc(aiAuditLog.timestamp)],
        limit
      });
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
      return [];
    }
  }

  /**
   * Get audit history for a specific session
   */
  static async getSessionAuditHistory(eventId: string, sessionId: string) {
    try {
      return await db.query.aiAuditLog.findMany({
        where: (aiAuditLog, { eq, and }) => and(
          eq(aiAuditLog.eventId, parseInt(eventId)),
          eq(aiAuditLog.sessionId, sessionId)
        ),
        orderBy: (aiAuditLog, { desc }) => [desc(aiAuditLog.timestamp)]
      });
    } catch (error) {
      console.error('Failed to fetch session audit history:', error);
      return [];
    }
  }

  /**
   * Get failed actions for review
   */
  static async getFailedActions(eventId: string, hours: number = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      return await db.query.aiAuditLog.findMany({
        where: (aiAuditLog, { eq, and, gte }) => and(
          eq(aiAuditLog.eventId, parseInt(eventId)),
          eq(aiAuditLog.success, false),
          gte(aiAuditLog.timestamp, cutoffTime)
        ),
        orderBy: (aiAuditLog, { desc }) => [desc(aiAuditLog.timestamp)]
      });
    } catch (error) {
      console.error('Failed to fetch failed actions:', error);
      return [];
    }
  }

  /**
   * Generate audit summary for review
   */
  static async generateAuditSummary(eventId: string, hours: number = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const actions = await db.query.aiAuditLog.findMany({
        where: (aiAuditLog, { eq, and, gte }) => and(
          eq(aiAuditLog.eventId, parseInt(eventId)),
          gte(aiAuditLog.timestamp, cutoffTime)
        ),
        orderBy: (aiAuditLog, { desc }) => [desc(aiAuditLog.timestamp)]
      });

      const summary = {
        totalActions: actions.length,
        successfulActions: actions.filter(a => a.success).length,
        failedActions: actions.filter(a => !a.success).length,
        actionsByType: {} as Record<string, number>,
        mostRecentFailures: actions.filter(a => !a.success).slice(0, 5),
        timeRange: `${hours} hours`
      };

      // Count actions by type
      actions.forEach(action => {
        summary.actionsByType[action.actionType] = (summary.actionsByType[action.actionType] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error('Failed to generate audit summary:', error);
      return null;
    }
  }

  /**
   * Check if user should be notified of AI changes
   */
  static async shouldNotifyUser(eventId: string, threshold: number = 10) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const recentActions = await db.query.aiAuditLog.findMany({
        where: (aiAuditLog, { eq, and, gte }) => and(
          eq(aiAuditLog.eventId, parseInt(eventId)),
          gte(aiAuditLog.timestamp, oneHourAgo)
        )
      });

      return recentActions.length >= threshold;
    } catch (error) {
      console.error('Failed to check notification threshold:', error);
      return false;
    }
  }
}