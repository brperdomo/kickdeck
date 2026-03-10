import Stripe from 'stripe';
import { db } from 'db';
import { teams, events } from '@db/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient } from './stripe-client-factory';
import { DEFAULT_PLATFORM_FEE_RATE, STRIPE_FIXED_FEE } from './fee-calculator';
import { scheduleConnectVisibilityUpdate } from './stripe-connect-visibility';
import { findOrCreatePlatformCustomer } from './stripe-connect-customer';

/**
 * Calculate total charge including platform fee (4% + $0.30)
 */
function calculateWithPlatformFees(baseAmount: number): { total: number; platformFee: number } {
  const platformFee = Math.round(baseAmount * DEFAULT_PLATFORM_FEE_RATE + STRIPE_FIXED_FEE);
  return { total: baseAmount + platformFee, platformFee };
}

/**
 * Create Stripe Checkout Session for payment retry
 * Uses DESTINATION CHARGE pattern: charge on platform, transfer to Connect account
 */
export async function createCheckoutSession(teamId: number): Promise<{
  checkoutUrl: string;
  sessionId: string;
  totalAmountWithFees: number;
}> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    // Get team details INCLUDING Connect account info
    const team = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        managerEmail: teams.managerEmail,
        managerName: teams.managerName,
        submitterEmail: teams.submitterEmail,
        submitterName: teams.submitterName,
        eventName: events.name,
        eventId: events.id,
        stripeConnectAccountId: events.stripeConnectAccountId,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team[0]) {
      throw new Error(`Team ${teamId} not found`);
    }

    const teamData = team[0];

    if (!teamData.totalAmount) {
      throw new Error('Team registration amount not found');
    }

    const connectAccountId = teamData.stripeConnectAccountId;
    if (!connectAccountId) {
      throw new Error(`Tournament must have Stripe Connect account configured for payments`);
    }

    // Calculate total amount including platform fees
    const { total: totalAmountWithFees, platformFee } = calculateWithPlatformFees(teamData.totalAmount);

    // Find or create customer on PLATFORM account (destination charges require platform-owned customers)
    const customerEmail = teamData.managerEmail || teamData.submitterEmail || `team-${teamId}@tournament.local`;
    const { customerId: platformCustomerId } = await findOrCreatePlatformCustomer({
      email: customerEmail,
      name: teamData.submitterName || teamData.managerName || 'Team Manager',
      description: `Team: ${teamData.name} | Event: ${teamData.eventName} | TeamID: ${teamId}`,
      metadata: {
        teamId: teamId.toString(),
        teamName: teamData.name || "Unknown Team",
        eventId: teamData.eventId?.toString() || "",
        eventName: teamData.eventName || "",
        managerEmail: teamData.managerEmail || teamData.submitterEmail || "",
        registrationDate: new Date().toISOString(),
        internalReference: `TEAM-${teamId}-${teamData.eventId}`,
        systemSource: "KickDeck",
        createdFor: "checkout_session",
      },
    });
    const customer = { id: platformCustomerId };

    console.log(`Using platform customer ${customer.id} for team ${teamId} checkout`);

    // Create checkout session on PLATFORM account with destination charge
    // Funds are routed to Connect account via transfer_data, KickDeck keeps application_fee
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tournament Registration - ${teamData.name}`,
              description: `${teamData.eventName || 'Tournament Registration'}`,
              metadata: {
                teamId: teamId.toString(),
                teamName: teamData.name || '',
                eventName: teamData.eventName || '',
              },
            },
            unit_amount: totalAmountWithFees,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://app.kickdeck.xyz'}/payment/success?session_id={CHECKOUT_SESSION_ID}&team_id=${teamId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://app.kickdeck.xyz'}/payment/retry/${teamId}?cancelled=true`,
      metadata: {
        teamId: teamId.toString(),
        originalAmount: teamData.totalAmount.toString(),
        platformFees: platformFee.toString(),
        retryPayment: 'true',
        connectAccountId: connectAccountId,
        eventId: teamData.eventId?.toString() || '',
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        on_behalf_of: connectAccountId,
        transfer_data: {
          destination: connectAccountId,
        },
        statement_descriptor_suffix: (teamData.name || 'Tournament').substring(0, 22),
        metadata: {
          teamId: teamId.toString(),
          teamName: teamData.name || '',
          eventName: teamData.eventName || '',
          tournamentAmount: teamData.totalAmount.toString(),
          platformFee: platformFee.toString(),
          retryPayment: 'true',
          connectAccountId: connectAccountId,
          eventId: teamData.eventId?.toString() || '',
        },
      },
    });

    // Update team with new payment session info
    await db
      .update(teams)
      .set({
        paymentIntentId: null, // Clear old payment intent
        stripeCustomerId: customer.id,
      })
      .where(eq(teams.id, teamId));

    console.log(`✅ Checkout session created on platform with destination to Connect ${connectAccountId} | Total: $${(totalAmountWithFees / 100).toFixed(2)} | Platform fee: $${(platformFee / 100).toFixed(2)}`);

    return {
      checkoutUrl: session.url!,
      sessionId: session.id,
      totalAmountWithFees,
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Handle successful checkout session completion
 */
export async function handleCheckoutSuccess(sessionId: string): Promise<{
  teamId: number;
  paymentIntentId: string;
  amount: number;
}> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    // Retrieve session from platform account (destination charges live on platform)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (!session.metadata?.teamId) {
      throw new Error('Team ID not found in session metadata');
    }

    const teamId = parseInt(session.metadata.teamId);
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;

    if (session.payment_status === 'paid' && paymentIntent) {
      const isRetryPayment = session.metadata?.retryPayment === 'true';

      // Build update fields
      const updateFields: Record<string, any> = {
        paymentStatus: 'paid',
        paymentDate: new Date().toISOString(),
        paymentIntentId: paymentIntent.id,
        paymentErrorMessage: null, // clear previous error
      };

      if (isRetryPayment) {
        updateFields.status = 'approved'; // auto-approve on successful retry
      }

      await db
        .update(teams)
        .set(updateFields)
        .where(eq(teams.id, teamId));

      console.log(`✅ Team ${teamId} payment completed via Stripe Checkout (destination charge)${isRetryPayment ? ' — auto-approved' : ''}`);

      // Send approval + receipt emails for retry payments (auto-approve flow)
      if (isRetryPayment) {
        try {
          const { sendTeamApprovalEmails } = await import('../routes/admin/teams-simple');
          sendTeamApprovalEmails(teamId);
        } catch (e) {
          console.error('Failed to send auto-approval emails:', e);
        }
      }

      // Update transfer + destination payment + connected customer for visibility
      {
        const connectAcctId = session.metadata?.connectAccountId;
        const tName = session.metadata?.teamName || paymentIntent.metadata?.teamName || '';
        const eName = session.metadata?.eventName || paymentIntent.metadata?.eventName || '';
        const eId = session.metadata?.eventId || paymentIntent.metadata?.eventId || '';
        const pFees = session.metadata?.platformFees || '';

        if (connectAcctId) {
          // Fetch team email for customer creation
          const teamRow = await db
            .select({ managerEmail: teams.managerEmail, submitterEmail: teams.submitterEmail, name: teams.name })
            .from(teams)
            .where(eq(teams.id, teamId))
            .limit(1);
          const teamData = teamRow[0];

          scheduleConnectVisibilityUpdate({
            connectAccountId: connectAcctId,
            paymentIntentId: paymentIntent.id,
            description: `${eName} - ${tName} Registration`,
            metadata: {
              teamId: teamId.toString(), teamName: tName, eventName: eName, eventId: eId,
              registrationDate: new Date().toISOString(),
              totalCharged: paymentIntent.amount.toString(), platformFee: pFees,
              systemSource: 'KickDeck',
            },
            customerEmail: teamData?.managerEmail || teamData?.submitterEmail || undefined,
            customerName: teamData?.submitterName || teamData?.managerName || 'Team Manager',
          });
        }
      }

      return {
        teamId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
      };
    } else {
      throw new Error('Payment not completed');
    }

  } catch (error) {
    console.error('Error handling checkout success:', error);
    throw error;
  }
}

/**
 * Get platform fee breakdown for display
 */
export function getPlatformFeeBreakdown(baseAmount: number): {
  baseAmount: number;
  platformFeePercentage: number;
  platformFeeFixed: number;
  totalPlatformFees: number;
  totalAmount: number;
} {
  const platformFeePercentage = Math.round(baseAmount * DEFAULT_PLATFORM_FEE_RATE);
  const platformFeeFixed = STRIPE_FIXED_FEE;
  const totalPlatformFees = platformFeePercentage + platformFeeFixed;
  const totalAmount = baseAmount + totalPlatformFees;

  return {
    baseAmount,
    platformFeePercentage,
    platformFeeFixed,
    totalPlatformFees,
    totalAmount,
  };
}
