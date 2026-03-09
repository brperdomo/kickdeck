import { db } from 'db';
import { teams, paymentTransactions } from '@db/schema';
import { eq, and, isNull, gte } from 'drizzle-orm';
import Stripe from 'stripe';
import { getStripeClient, getStripeWebhookSecret } from './stripe-client-factory';

/**
 * Real-time Payment Status Monitoring Service
 * Provides live status updates and proactive monitoring
 */

export interface PaymentStatusInfo {
  teamId: number;
  teamName: string;
  currentStatus: string;
  stripeStatus?: string;
  lastUpdated: string;
  needsAttention: boolean;
  actionRequired?: string;
}

/**
 * Get comprehensive payment status for a team
 */
export async function getTeamPaymentStatus(teamId: number): Promise<PaymentStatusInfo> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      event: {
        columns: { name: true }
      }
    }
  });

  if (!team) {
    throw new Error(`Team ${teamId} not found`);
  }

  let stripeStatus: string | undefined;
  let needsAttention = false;
  let actionRequired: string | undefined;

  // Check Stripe status if payment intent exists
  if (team.paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(team.paymentIntentId);
      stripeStatus = paymentIntent.status;

      // Check for status mismatches
      if (paymentIntent.status === 'succeeded' && team.paymentStatus !== 'paid') {
        needsAttention = true;
        actionRequired = 'Payment succeeded in Stripe but team status not updated';
      } else if (paymentIntent.status === 'requires_payment_method' && team.paymentStatus === 'payment_failed') {
        actionRequired = 'New payment method required - team can retry payment';
      }
    } catch (error) {
      console.warn(`Could not retrieve payment intent ${team.paymentIntentId}:`, error);
      stripeStatus = 'error_retrieving';
      needsAttention = true;
      actionRequired = 'Payment intent not found in Stripe';
    }
  } else if (team.setupIntentId && team.paymentStatus === 'payment_failed') {
    needsAttention = true;
    actionRequired = 'Has setup intent but no payment intent - needs payment processing';
  }

  return {
    teamId: team.id,
    teamName: team.name || `Team ${team.id}`,
    currentStatus: team.paymentStatus || 'unknown',
    stripeStatus,
    lastUpdated: team.paymentDate || team.createdAt,
    needsAttention,
    actionRequired
  };
}

/**
 * Monitor all teams with payment issues
 */
export async function monitorPaymentStatuses(): Promise<{
  summary: {
    total: number;
    needsAttention: number;
    recovered: number;
    stillFailed: number;
  };
  teamsNeedingAttention: PaymentStatusInfo[];
}> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  console.log('🔍 Starting payment status monitoring...');

  // Get all teams with potential payment issues
  const problematicTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      paymentStatus: teams.paymentStatus,
      paymentIntentId: teams.paymentIntentId,
      setupIntentId: teams.setupIntentId,
      paymentDate: teams.paymentDate,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(
      // Teams with failed status OR teams with setup intents but no payment date
      and(
        teams.paymentStatus !== null,
        teams.paymentStatus !== 'paid'
      )
    );

  console.log(`Found ${problematicTeams.length} teams with non-paid status`);

  const teamsNeedingAttention: PaymentStatusInfo[] = [];
  let recoveredCount = 0;
  let stillFailedCount = 0;

  for (const team of problematicTeams) {
    try {
      const statusInfo = await getTeamPaymentStatus(team.id);
      
      if (statusInfo.needsAttention) {
        teamsNeedingAttention.push(statusInfo);
      }

      // Auto-recovery check
      if (statusInfo.stripeStatus === 'succeeded' && statusInfo.currentStatus !== 'paid') {
        // Auto-recover this payment
        console.log(`🔄 Auto-recovering payment for team ${team.id}`);
        const paymentIntent = await stripe.paymentIntents.retrieve(team.paymentIntentId!);
        await updateTeamToApproved(team.id, paymentIntent);
        recoveredCount++;
      } else if (statusInfo.currentStatus === 'payment_failed') {
        stillFailedCount++;
      }

    } catch (error) {
      console.error(`Error monitoring team ${team.id}:`, error);
      teamsNeedingAttention.push({
        teamId: team.id,
        teamName: team.name || `Team ${team.id}`,
        currentStatus: team.paymentStatus || 'unknown',
        lastUpdated: team.paymentDate || team.createdAt,
        needsAttention: true,
        actionRequired: `Error checking status: ${error.message}`
      });
    }
  }

  return {
    summary: {
      total: problematicTeams.length,
      needsAttention: teamsNeedingAttention.length,
      recovered: recoveredCount,
      stillFailed: stillFailedCount
    },
    teamsNeedingAttention
  };
}

async function updateTeamToApproved(teamId: number, paymentIntent: Stripe.PaymentIntent) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const charges = await stripe.charges.list({
    payment_intent: paymentIntent.id,
  });

  const charge = charges.data[0];
  const cardDetails = charge?.payment_method_details?.card;

  // Record successful payment transaction
  await db.insert(paymentTransactions).values({
    teamId,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    status: "paid",
    paymentDate: new Date(),
    cardBrand: cardDetails?.brand || null,
    cardLast4: cardDetails?.last4 || null,
  });

  // Update team status to approved
  await db
    .update(teams)
    .set({
      paymentStatus: "paid",
      paymentDate: new Date().toISOString(),
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null,
    })
    .where(eq(teams.id, teamId));

  console.log(`✅ Team ${teamId} auto-recovered and approved`);
}

/**
 * Webhook status verification
 */
export async function verifyWebhookStatus(): Promise<{
  webhookConfigured: boolean;
  endpointUrl: string;
  enabledEvents: string[];
  lastWebhookReceived?: string;
  issues: string[];
}> {
  const issues: string[] = [];
  
  const webhookSecret = await getStripeWebhookSecret();
  
  if (!webhookSecret) {
    issues.push('Stripe webhook secret not configured');
  }

  // In production, we can check recent webhook deliveries
  let lastWebhookReceived: string | undefined;
  
  try {
    // This would require webhook endpoint ID to check delivery logs
    // For now, we'll indicate webhook status based on secret presence
    if (webhookSecret) {
      lastWebhookReceived = 'Webhook secret configured - unable to verify deliveries without endpoint ID';
    }
  } catch (error) {
    issues.push(`Error checking webhook status: ${error.message}`);
  }

  return {
    webhookConfigured: !!webhookSecret,
    endpointUrl: `${process.env.BACKEND_URL || 'https://app.kickdeck.xyz'}/api/payments/webhook`,
    enabledEvents: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed', 
      'setup_intent.succeeded',
      'charge.refunded'
    ],
    lastWebhookReceived,
    issues
  };
}
