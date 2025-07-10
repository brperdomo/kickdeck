/**
 * Fee Adjustments API Routes
 * 
 * Provides endpoints for adjusting team registration fees with audit logging.
 * Business rule: Only downward adjustments allowed before team approval and payment.
 */

import { Router } from 'express';
import { db } from '../../../db/index.js';
import { teams, feeAdjustments, users } from '../../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/admin/teams/:teamId/fee-adjustments
 * Retrieve fee adjustment history for a specific team
 */
router.get('/teams/:teamId/fee-adjustments', isAdmin, async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID provided' });
    }

    const adjustments = await db
      .select({
        id: feeAdjustments.id,
        originalAmount: feeAdjustments.originalAmount,
        adjustedAmount: feeAdjustments.adjustedAmount,
        adjustment: feeAdjustments.adjustment,
        reason: feeAdjustments.reason,
        adjustedAt: feeAdjustments.adjustedAt,
        adminEmail: feeAdjustments.adminEmail,
      })
      .from(feeAdjustments)
      .where(eq(feeAdjustments.teamId, teamId))
      .orderBy(desc(feeAdjustments.adjustedAt));

    res.json({ adjustments });
  } catch (error) {
    console.error('Error fetching fee adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch fee adjustment history' });
  }
});

/**
 * POST /api/admin/teams/:teamId/adjust-fee
 * Adjust team registration fee with audit logging
 */
router.post('/teams/:teamId/adjust-fee', isAdmin, async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const { adjustedAmount, reason } = req.body;
    const adminId = req.user?.id;
    const adminEmail = req.user?.email;

    // Validate inputs
    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID provided' });
    }

    if (!adjustedAmount || isNaN(adjustedAmount) || adjustedAmount < 0) {
      return res.status(400).json({ error: 'Valid adjusted amount is required (must be non-negative)' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason for adjustment is required' });
    }

    if (!adminId || !adminEmail) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // Get team details
    const team = await db
      .select({
        id: teams.id,
        name: teams.name,
        status: teams.status,
        totalAmount: teams.totalAmount,
        registrationFee: teams.registrationFee,
        eventId: teams.eventId,
        paymentStatus: teams.paymentStatus,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team.length) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = team[0];
    const currentAmount = teamData.totalAmount || teamData.registrationFee || 0;

    // Business rule: Only allow downward adjustments
    if (adjustedAmount > currentAmount) {
      return res.status(400).json({ 
        error: 'Fee increases are not permitted. Only reductions are allowed.',
        details: `Current amount: $${(currentAmount / 100).toFixed(2)}, Requested: $${(adjustedAmount / 100).toFixed(2)}`
      });
    }

    // Business rule: No adjustments after approval and payment
    if (teamData.status === 'approved' && teamData.paymentStatus === 'paid') {
      return res.status(400).json({ 
        error: 'Cannot adjust fees for teams that have been approved and paid.',
        details: 'Team has already completed payment processing'
      });
    }

    const adjustment = adjustedAmount - currentAmount; // Will be negative for reductions

    // Start transaction
    await db.transaction(async (tx) => {
      // Update team's fee amount
      await tx
        .update(teams)
        .set({ 
          totalAmount: adjustedAmount,
          registrationFee: teamData.totalAmount ? teamData.registrationFee : adjustedAmount // Keep original registrationFee if totalAmount exists
        })
        .where(eq(teams.id, teamId));

      // Record adjustment in audit log
      await tx.insert(feeAdjustments).values({
        teamId: teamId,
        originalAmount: currentAmount,
        adjustedAmount: adjustedAmount,
        adjustment: adjustment,
        reason: reason.trim(),
        adjustedBy: adminId,
        eventId: teamData.eventId,
        teamName: teamData.name,
        adminEmail: adminEmail,
      });
    });

    console.log(`Fee adjustment applied: Team ${teamData.name} (ID: ${teamId}) adjusted from $${(currentAmount / 100).toFixed(2)} to $${(adjustedAmount / 100).toFixed(2)} by ${adminEmail}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Fee adjustment applied successfully',
      adjustment: {
        teamId,
        teamName: teamData.name,
        originalAmount: currentAmount,
        adjustedAmount,
        adjustment,
        reason: reason.trim(),
        adjustedBy: adminEmail,
      }
    });

  } catch (error) {
    console.error('Error adjusting team fee:', error);
    res.status(500).json({ error: 'Failed to adjust team fee' });
  }
});

/**
 * GET /api/admin/fee-adjustments
 * Get all fee adjustments across all teams (for reporting)
 */
router.get('/fee-adjustments', isAdmin, async (req, res) => {
  try {
    const { eventId, limit = 50 } = req.query;
    
    let query = db
      .select({
        id: feeAdjustments.id,
        teamId: feeAdjustments.teamId,
        teamName: feeAdjustments.teamName,
        eventId: feeAdjustments.eventId,
        originalAmount: feeAdjustments.originalAmount,
        adjustedAmount: feeAdjustments.adjustedAmount,
        adjustment: feeAdjustments.adjustment,
        reason: feeAdjustments.reason,
        adjustedAt: feeAdjustments.adjustedAt,
        adminEmail: feeAdjustments.adminEmail,
      })
      .from(feeAdjustments);

    if (eventId) {
      query = query.where(eq(feeAdjustments.eventId, eventId as string));
    }

    const adjustments = await query
      .orderBy(desc(feeAdjustments.adjustedAt))
      .limit(parseInt(limit as string));

    res.json({ adjustments });
  } catch (error) {
    console.error('Error fetching all fee adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch fee adjustments' });
  }
});

export default router;