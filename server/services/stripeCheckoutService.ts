import Stripe from 'stripe';
import { db } from 'db';
import { teams, events } from '@db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

/**
 * Calculate platform fees: 4% + $0.30
 */
function calculateWithPlatformFees(baseAmount: number): number {
  const platformFeePercentage = 0.04; // 4%
  const platformFeeFixed = 30; // $0.30 in cents
  
  return Math.round(baseAmount + (baseAmount * platformFeePercentage) + platformFeeFixed);
}

/**
 * Create Stripe Checkout Session for payment retry
 * This provides a hosted payment page that handles all payment complexity
 */
export async function createCheckoutSession(teamId: number): Promise<{
  checkoutUrl: string;
  sessionId: string;
  totalAmountWithFees: number;
}> {
  try {
    // Get team details
    const team = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        managerEmail: teams.managerEmail,
        submitterEmail: teams.submitterEmail,
        eventName: events.name,
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

    // Calculate total amount including platform fees
    const totalAmountWithFees = calculateWithPlatformFees(teamData.totalAmount);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      success_url: `${process.env.FRONTEND_URL || 'https://app.matchpro.ai'}/payment/success?session_id={CHECKOUT_SESSION_ID}&team_id=${teamId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://app.matchpro.ai'}/payment/retry/${teamId}?cancelled=true`,
      customer_email: teamData.managerEmail || teamData.submitterEmail || undefined,
      metadata: {
        teamId: teamId.toString(),
        originalAmount: teamData.totalAmount.toString(),
        platformFees: (totalAmountWithFees - teamData.totalAmount).toString(),
        retryPayment: 'true',
      },
      payment_intent_data: {
        metadata: {
          teamId: teamId.toString(),
          retryPayment: 'true',
        },
      },
    });

    // Update team with new payment session info
    await db
      .update(teams)
      .set({
        paymentIntentId: null, // Clear old payment intent
        // Store checkout session ID in a comment or metadata field if available
      })
      .where(eq(teams.id, teamId));

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
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (!session.metadata?.teamId) {
      throw new Error('Team ID not found in session metadata');
    }

    const teamId = parseInt(session.metadata.teamId);
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;

    if (session.payment_status === 'paid' && paymentIntent) {
      // Update team status to paid
      await db
        .update(teams)
        .set({
          paymentStatus: 'paid',
          paymentDate: new Date().toISOString(),
          paymentIntentId: paymentIntent.id,
        })
        .where(eq(teams.id, teamId));

      console.log(`✅ Team ${teamId} payment completed via Stripe Checkout`);

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
  const platformFeePercentage = Math.round(baseAmount * 0.04);
  const platformFeeFixed = 30;
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