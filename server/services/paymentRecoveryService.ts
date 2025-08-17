import { db } from 'db';
import { teams, paymentTransactions } from '@db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

/**
 * Automated Payment Recovery Service
 * Fixes stuck payments and synchronizes status between Stripe and database
 */

export async function recoverFailedPayments() {
  console.log('🔄 Starting automated payment recovery process...');
  
  try {
    // Find teams with failed payment status but active payment intents
    const failedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        paymentIntentId: teams.paymentIntentId,
        setupIntentId: teams.setupIntentId,
        paymentStatus: teams.paymentStatus,
        totalAmount: teams.totalAmount,
      })
      .from(teams)
      .where(
        and(
          eq(teams.paymentStatus, 'payment_failed'),
          // Has either a payment intent or setup intent
          // @ts-ignore - Drizzle typing issue with OR conditions
          inArray(teams.id, 
            db.select({ id: teams.id })
              .from(teams)
              .where(
                and(
                  eq(teams.paymentStatus, 'payment_failed'),
                  // Either has payment intent or setup intent
                  // We'll handle this in JavaScript filtering below
                )
              )
          )
        )
      );

    console.log(`Found ${failedTeams.length} teams with payment_failed status`);

    let recoveredCount = 0;
    let stillFailedCount = 0;

    for (const team of failedTeams) {
      try {
        // Skip teams without any payment identifiers
        if (!team.paymentIntentId && !team.setupIntentId) {
          continue;
        }

        console.log(`🔍 Checking team ${team.id} (${team.name})`);

        let paymentRecovered = false;

        // Check payment intent status if available
        if (team.paymentIntentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(team.paymentIntentId);
            
            if (paymentIntent.status === 'succeeded') {
              console.log(`✅ Found successful payment for team ${team.id}`);
              await updateTeamToApproved(team.id, paymentIntent);
              paymentRecovered = true;
              recoveredCount++;
            } else if (paymentIntent.status === 'requires_payment_method') {
              // Payment failed, create new payment intent
              await createRetryPaymentIntent(team);
            }
          } catch (error) {
            console.warn(`⚠️ Could not retrieve payment intent ${team.paymentIntentId}:`, error);
          }
        }

        // Check setup intent status if payment wasn't recovered
        if (!paymentRecovered && team.setupIntentId) {
          try {
            const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
            
            if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
              console.log(`✅ Found successful setup intent for team ${team.id} - processing payment`);
              await processSetupIntentPayment(team, setupIntent.payment_method as string);
              recoveredCount++;
            }
          } catch (error) {
            console.warn(`⚠️ Could not retrieve setup intent ${team.setupIntentId}:`, error);
          }
        }

        if (!paymentRecovered) {
          stillFailedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing team ${team.id}:`, error);
        stillFailedCount++;
      }
    }

    console.log(`🎯 Payment recovery completed: ${recoveredCount} recovered, ${stillFailedCount} still failed`);
    
    return {
      totalProcessed: failedTeams.length,
      recovered: recoveredCount,
      stillFailed: stillFailedCount
    };

  } catch (error) {
    console.error('❌ Error in payment recovery process:', error);
    throw error;
  }
}

async function updateTeamToApproved(teamId: number, paymentIntent: Stripe.PaymentIntent) {
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

  console.log(`✅ Team ${teamId} status updated to approved`);
}

async function createRetryPaymentIntent(team: any) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: team.totalAmount,
      currency: "usd",
      description: `Payment retry for ${team.name}`,
      metadata: {
        teamId: team.id.toString(),
        isRetry: 'true'
      },
    });

    await db
      .update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
      })
      .where(eq(teams.id, team.id));

    console.log(`🔄 Created retry payment intent for team ${team.id}`);
  } catch (error) {
    console.error(`❌ Failed to create retry payment intent for team ${team.id}:`, error);
  }
}

async function processSetupIntentPayment(team: any, paymentMethodId: string) {
  try {
    // Create payment intent using the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: team.totalAmount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      description: `Automatic payment processing for ${team.name}`,
      metadata: {
        teamId: team.id.toString(),
        fromSetupIntent: 'true'
      },
    });

    if (paymentIntent.status === 'succeeded') {
      await updateTeamToApproved(team.id, paymentIntent);
    } else {
      // Update payment intent ID for tracking
      await db
        .update(teams)
        .set({
          paymentIntentId: paymentIntent.id,
        })
        .where(eq(teams.id, team.id));
    }

  } catch (error) {
    console.error(`❌ Failed to process setup intent payment for team ${team.id}:`, error);
  }
}

/**
 * Synchronize payment status with Stripe for specific team
 */
export async function syncTeamPaymentStatus(teamId: number) {
  try {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    if (team.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(team.paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && team.paymentStatus !== 'paid') {
        await updateTeamToApproved(teamId, paymentIntent);
        return { status: 'recovered', message: 'Payment was successful, team approved' };
      }
    }

    return { status: 'no_change', message: 'No status update needed' };

  } catch (error) {
    console.error(`Error syncing payment status for team ${teamId}:`, error);
    throw error;
  }
}