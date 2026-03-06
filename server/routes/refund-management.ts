/**
 * Refund Management API Routes
 * Handles refund processing with tournament Connect account cost recovery
 */

import express from 'express';
import { createRefund } from '../services/stripeService';
import { db } from '../db';
import { paymentTransactions, teams } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = express.Router();

/**
 * Process refund with Connect account cost recovery
 * POST /api/refunds/process
 */
router.post('/process', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    console.log(`[REFUND API] Processing refund for payment intent: ${paymentIntentId}`);
    
    // Process the refund (includes automatic cost recovery)
    const refund = await createRefund(paymentIntentId, amount);

    console.log(`[REFUND API] ✅ Refund processed successfully: ${refund.id}`);

    res.json({
      success: true,
      refundId: refund.id,
      message: 'Refund processed with automatic cost recovery attempted'
    });

  } catch (error: any) {
    console.error('[REFUND API] Error processing refund:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Refund processing failed'
    });
  }
});

/**
 * Get refund cost absorption report
 * GET /api/refunds/absorption-report
 */
router.get('/absorption-report', async (req, res) => {
  try {
    const { eventId } = req.query;

    // Get all refund-related transactions
    let query = db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          // Filter for refund cost transactions
          // Success: refund_cost_recovery (positive amount)
          // Failure: refund_cost_recovery_failed or refund_cost_absorbed (negative amount)
        )
      )
      .orderBy(desc(paymentTransactions.createdAt));

    const transactions = await query;

    // Calculate totals
    const summary = {
      totalRefunds: 0,
      totalRecovered: 0,
      totalAbsorbed: 0,
      recoverySuccessRate: 0,
      transactions: []
    };

    for (const transaction of transactions) {
      const amount = transaction.amount || 0;
      const type = transaction.transactionType;

      if (type === 'refund_cost_recovery') {
        summary.totalRecovered += Math.abs(amount);
        summary.totalRefunds += 1;
      } else if (type === 'refund_cost_recovery_failed' || type === 'refund_cost_absorbed') {
        summary.totalAbsorbed += Math.abs(amount);
        summary.totalRefunds += 1;
      }

      summary.transactions.push({
        id: transaction.id,
        teamId: transaction.teamId,
        amount: amount,
        type: type,
        status: transaction.status,
        timestamp: transaction.createdAt,
        metadata: transaction.metadata
      });
    }

    // Calculate success rate
    if (summary.totalRefunds > 0) {
      const successfulRecoveries = summary.transactions.filter(t => 
        t.type === 'refund_cost_recovery'
      ).length;
      summary.recoverySuccessRate = Math.round((successfulRecoveries / summary.totalRefunds) * 100);
    }

    res.json({
      success: true,
      summary,
      message: `Found ${summary.totalRefunds} refund transactions`
    });

  } catch (error: any) {
    console.error('[REFUND REPORT] Error generating absorption report:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get detailed refund information for a specific payment
 * GET /api/refunds/:paymentIntentId
 */
router.get('/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    // Get all transactions related to this payment intent
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.paymentIntentId, paymentIntentId))
      .orderBy(desc(paymentTransactions.createdAt));

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No transactions found for this payment intent'
      });
    }

    // Analyze the refund chain
    const refundTransaction = transactions.find(t => t.transactionType === 'refund');
    const costRecoveryTransaction = transactions.find(t => 
      t.transactionType === 'refund_cost_recovery' || 
      t.transactionType === 'refund_cost_recovery_failed' ||
      t.transactionType === 'refund_cost_absorbed'
    );

    const analysis = {
      paymentIntentId,
      refundProcessed: !!refundTransaction,
      costRecoveryAttempted: !!costRecoveryTransaction,
      costRecoverySuccessful: costRecoveryTransaction?.transactionType === 'refund_cost_recovery',
      netCostToKickDeck: 0,
      transactions
    };

    // Calculate net cost to KickDeck
    if (refundTransaction && !analysis.costRecoverySuccessful) {
      analysis.netCostToKickDeck = Math.abs(refundTransaction.amount || 0);
    }

    res.json({
      success: true,
      analysis,
      message: 'Refund analysis complete'
    });

  } catch (error: any) {
    console.error('[REFUND DETAILS] Error getting refund details:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;