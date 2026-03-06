/**
 * Refund Cost Recovery Service
 * Ensures tournament Connect accounts cover refund costs instead of KickDeck main account
 */

import Stripe from 'stripe';
import { db } from '../db';
import { paymentTransactions } from '../db/schema';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

export interface RefundCostRecoveryResult {
  success: boolean;
  transferId?: string;
  amountCovered: number;
  error?: string;
  fallbackToMainAccount: boolean;
}

/**
 * Attempts to recover refund cost from tournament Connect account
 * @param connectAccountId - Tournament's Stripe Connect account ID
 * @param refundAmount - Amount to recover in cents
 * @param paymentIntentId - Original payment intent ID for tracking
 * @param teamId - Team ID for transaction recording
 */
export async function recoverRefundCost(
  connectAccountId: string,
  refundAmount: number,
  paymentIntentId: string,
  teamId: string
): Promise<RefundCostRecoveryResult> {
  
  if (!connectAccountId || connectAccountId.trim() === '') {
    return {
      success: false,
      amountCovered: 0,
      error: 'No Connect account ID provided',
      fallbackToMainAccount: true
    };
  }

  try {
    console.log(`[REFUND COST RECOVERY] Attempting to recover ${refundAmount} cents from Connect account ${connectAccountId}`);

    // Create transfer from Connect account to KickDeck main account
    const transfer = await stripe.transfers.create({
      amount: refundAmount,
      currency: 'usd',
      destination: process.env.STRIPE_ACCOUNT_ID || 'main', // KickDeck main account
      description: `Refund cost recovery for payment ${paymentIntentId}`,
      metadata: {
        purpose: 'refund_cost_recovery',
        originalPaymentIntent: paymentIntentId,
        teamId: teamId,
        refundAmount: refundAmount.toString(),
        recoveryTimestamp: new Date().toISOString()
      }
    }, {
      stripeAccount: connectAccountId // Execute from tournament Connect account
    });

    console.log(`[REFUND COST RECOVERY] ✅ SUCCESS: Transfer ${transfer.id} created for ${refundAmount} cents`);

    // Record successful cost recovery
    await db.insert(paymentTransactions).values({
      teamId: parseInt(teamId),
      paymentIntentId: paymentIntentId,
      amount: refundAmount, // Positive - money recovered
      status: "completed",
      transactionType: "refund_cost_recovery",
      metadata: {
        transferId: transfer.id,
        sourceConnectAccount: connectAccountId,
        recoveredAmount: refundAmount.toString(),
        recoveryTimestamp: new Date().toISOString(),
        status: 'tournament_covered_refund_cost'
      },
    });

    return {
      success: true,
      transferId: transfer.id,
      amountCovered: refundAmount,
      fallbackToMainAccount: false
    };

  } catch (error: any) {
    console.error(`[REFUND COST RECOVERY] ❌ FAILED: ${error.message}`);

    // Record failed recovery attempt
    await db.insert(paymentTransactions).values({
      teamId: parseInt(teamId),
      paymentIntentId: paymentIntentId,
      amount: 0, // No money recovered
      status: "failed",
      transactionType: "refund_cost_recovery_failed",
      metadata: {
        error: error.message,
        connectAccount: connectAccountId,
        attemptedAmount: refundAmount.toString(),
        fallbackTo: 'kickdeck_main_account',
        failureTimestamp: new Date().toISOString()
      },
    });

    return {
      success: false,
      amountCovered: 0,
      error: error.message,
      fallbackToMainAccount: true
    };
  }
}

/**
 * Gets the total amount KickDeck has absorbed in refund costs
 * Useful for financial reporting and Connect account balance recovery
 */
export async function getRefundCostsAbsorbed(eventId?: string): Promise<{
  totalAbsorbed: number;
  refundCount: number;
  details: any[];
}> {
  try {
    // Query for all refund cost absorptions
    const absorptions = await db
      .select()
      .from(paymentTransactions)
      .where(
        // Filter for transactions where KickDeck absorbed refund costs
        // This includes failed recoveries and missing Connect account metadata
      );

    // Calculate totals
    const totalAbsorbed = absorptions.reduce((sum, transaction) => {
      if (transaction.transactionType === 'cost_absorption' || 
          transaction.transactionType === 'refund_cost_recovery_failed') {
        return sum + Math.abs(transaction.amount || 0);
      }
      return sum;
    }, 0);

    return {
      totalAbsorbed,
      refundCount: absorptions.length,
      details: absorptions
    };

  } catch (error) {
    console.error('Error calculating absorbed refund costs:', error);
    return {
      totalAbsorbed: 0,
      refundCount: 0,
      details: []
    };
  }
}