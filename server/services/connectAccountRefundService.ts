import Stripe from 'stripe';
import { db } from 'db';
import { teams, events, paymentTransactions } from '@db/schema';
import { eq, and } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Stripe features will be unavailable.");
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null;

/**
 * CONNECT ACCOUNT REFUND SERVICE
 * 
 * Handles all refunds directly on tournament Connect accounts to guarantee:
 * 1. Tournament organizers have full refund control
 * 2. KickDeck has zero refund financial exposure
 * 3. Complete payment traceability in Connect dashboards
 */

interface RefundRequest {
  teamId: number;
  amount?: number; // Optional: partial refund amount in cents
  reason?: string;
  adminId?: number;
  notes?: string;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  connectAccountId: string;
  error?: string;
  metadata: {
    teamName: string;
    eventName: string;
    originalPaymentId: string;
    refundReason: string;
    processedBy: string;
  };
}

/**
 * Process refund entirely on Connect account
 * Guarantees tournament organizer pays the refund, not KickDeck
 */
export async function processConnectAccountRefund(request: RefundRequest): Promise<RefundResult> {
  try {
    console.log(`🔄 Processing Connect account refund for team ${request.teamId}`);
    
    // Get team with event and Connect account info
    const teamData = await db
      .select({
        team: {
          id: teams.id,
          name: teams.name,
          paymentIntentId: teams.paymentIntentId,
          stripeCustomerId: teams.stripeCustomerId,
          paymentStatus: teams.paymentStatus,
          totalAmount: teams.totalAmount,
          managerEmail: teams.managerEmail,
        },
        event: {
          id: events.id,
          name: events.name,
          stripeConnectAccountId: events.stripeConnectAccountId,
        }
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, request.teamId))
      .limit(1);

    if (!teamData[0]) {
      throw new Error(`Team ${request.teamId} not found`);
    }

    const { team, event } = teamData[0];

    // Validate Connect account exists
    if (!event?.stripeConnectAccountId) {
      throw new Error(`Tournament does not have Connect account configured - refunds not possible`);
    }

    // Validate payment exists
    if (!team.paymentIntentId) {
      throw new Error(`Team ${request.teamId} has no payment to refund`);
    }

    if (team.paymentStatus !== 'paid' && team.paymentStatus !== 'approved') {
      throw new Error(`Team ${request.teamId} payment status is ${team.paymentStatus} - cannot refund`);
    }

    console.log(`✅ Found payment ${team.paymentIntentId} on Connect account ${event.stripeConnectAccountId}`);

    // Get payment intent from Connect account
    const paymentIntent = await stripe.paymentIntents.retrieve(team.paymentIntentId, {
      stripeAccount: event.stripeConnectAccountId
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment ${team.paymentIntentId} status is ${paymentIntent.status} - cannot refund`);
    }

    // Calculate refund amount
    const refundAmount = request.amount || paymentIntent.amount;
    
    if (refundAmount > paymentIntent.amount) {
      throw new Error(`Refund amount ${refundAmount} cannot exceed original payment ${paymentIntent.amount}`);
    }

    // Create refund on Connect account
    console.log(`💰 Creating refund of $${refundAmount / 100} on Connect account ${event.stripeConnectAccountId}`);
    
    const refund = await stripe.refunds.create({
      payment_intent: team.paymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        teamId: request.teamId.toString(),
        teamName: team.name || "Unknown Team",
        eventId: event.id?.toString() || "",
        eventName: event.name || "",
        refundReason: request.reason || "Team withdrawal",
        adminNotes: request.notes || "",
        processedBy: request.adminId?.toString() || "system",
        originalAmount: paymentIntent.amount.toString(),
        refundAmount: refundAmount.toString(),
        internalReference: `REFUND-${request.teamId}-${event.id}`,
        systemSource: "KickDeck",
        refundType: "connect_account_refund",
        processedDate: new Date().toISOString(),
      }
    }, {
      // CRITICAL: Process refund on Connect account
      stripeAccount: event.stripeConnectAccountId
    });

    console.log(`✅ Refund created: ${refund.id} for $${refund.amount / 100}`);

    // Update team status in database
    await db
      .update(teams)
      .set({
        paymentStatus: refundAmount === paymentIntent.amount ? 'refunded' : 'partially_refunded',
        refundDate: new Date().toISOString(),
        refundAmount: refundAmount,
        refundReason: request.reason || "Team withdrawal",
      })
      .where(eq(teams.id, request.teamId));

    // Log transaction for audit trail
    await db.insert(paymentTransactions).values({
      teamId: request.teamId,
      type: 'refund',
      amount: refundAmount,
      stripeId: refund.id,
      status: 'completed',
      metadata: {
        originalPaymentIntent: team.paymentIntentId,
        connectAccountId: event.stripeConnectAccountId,
        refundReason: request.reason || "Team withdrawal",
        processedBy: request.adminId?.toString() || "system",
      },
      createdAt: new Date().toISOString(),
    });

    console.log(`🎉 Connect account refund completed for team ${request.teamId}`);

    return {
      success: true,
      refundId: refund.id,
      amount: refundAmount,
      connectAccountId: event.stripeConnectAccountId,
      metadata: {
        teamName: team.name || "Unknown Team",
        eventName: event.name || "",
        originalPaymentId: team.paymentIntentId,
        refundReason: request.reason || "Team withdrawal",
        processedBy: request.adminId?.toString() || "system",
      }
    };

  } catch (error: any) {
    console.error(`❌ Refund failed for team ${request.teamId}:`, error.message);
    
    // Log failed refund attempt
    try {
      await db.insert(paymentTransactions).values({
        teamId: request.teamId,
        type: 'refund_failed',
        amount: request.amount || 0,
        status: 'failed',
        metadata: {
          errorMessage: error.message,
          refundReason: request.reason || "Team withdrawal",
          processedBy: request.adminId?.toString() || "system",
        },
        createdAt: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log refund error:', logError);
    }

    return {
      success: false,
      amount: request.amount || 0,
      connectAccountId: '',
      error: error.message,
      metadata: {
        teamName: '',
        eventName: '',
        originalPaymentId: '',
        refundReason: request.reason || "Team withdrawal",
        processedBy: request.adminId?.toString() || "system",
      }
    };
  }
}

/**
 * Get refund status and details for a team
 */
export async function getRefundStatus(teamId: number): Promise<{
  hasRefund: boolean;
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
  connectAccountId?: string;
  refundId?: string;
}> {
  const team = await db
    .select({
      refundAmount: teams.refundAmount,
      refundDate: teams.refundDate,
      refundReason: teams.refundReason,
      paymentStatus: teams.paymentStatus,
      connectAccountId: events.stripeConnectAccountId,
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team[0]) {
    return { hasRefund: false };
  }

  const teamData = team[0];
  const hasRefund = teamData.paymentStatus === 'refunded' || teamData.paymentStatus === 'partially_refunded';

  if (!hasRefund) {
    return { hasRefund: false };
  }

  // Get refund transaction details
  const refundTransaction = await db
    .select({
      stripeId: paymentTransactions.stripeId,
    })
    .from(paymentTransactions)
    .where(and(
      eq(paymentTransactions.teamId, teamId),
      eq(paymentTransactions.type, 'refund'),
      eq(paymentTransactions.status, 'completed')
    ))
    .limit(1);

  return {
    hasRefund: true,
    refundAmount: teamData.refundAmount || 0,
    refundDate: teamData.refundDate || '',
    refundReason: teamData.refundReason || '',
    connectAccountId: teamData.connectAccountId || '',
    refundId: refundTransaction[0]?.stripeId || '',
  };
}

/**
 * List all refunds for a tournament (Connect account)
 */
export async function listTournamentRefunds(eventId: number): Promise<Array<{
  teamId: number;
  teamName: string;
  refundAmount: number;
  refundDate: string;
  refundReason: string;
  refundId: string;
}>> {
  const refunds = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      refundAmount: teams.refundAmount,
      refundDate: teams.refundDate,
      refundReason: teams.refundReason,
      refundId: paymentTransactions.stripeId,
    })
    .from(teams)
    .leftJoin(paymentTransactions, and(
      eq(paymentTransactions.teamId, teams.id),
      eq(paymentTransactions.type, 'refund'),
      eq(paymentTransactions.status, 'completed')
    ))
    .where(and(
      eq(teams.eventId, eventId),
      eq(teams.paymentStatus, 'refunded')
    ));

  return refunds.map(refund => ({
    teamId: refund.teamId,
    teamName: refund.teamName || "Unknown Team",
    refundAmount: refund.refundAmount || 0,
    refundDate: refund.refundDate || "",
    refundReason: refund.refundReason || "",
    refundId: refund.refundId || "",
  }));
}