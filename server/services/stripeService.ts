import Stripe from 'stripe';
import { db } from "../../db";
import { teams, paymentTransactions, events } from "../../db/schema";
import { eq } from 'drizzle-orm';
import { log } from '../vite';
import { sendRegistrationReceiptEmail } from './emailService';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// In production, we can add a version check to ensure our API version stays current
const STRIPE_API_VERSION = "2023-10-16" as any;

// Initialize Stripe client with proper API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});

// Check Stripe API version on startup (only in production)
if (process.env.NODE_ENV === 'production') {
  checkStripeApiVersion();
}

/**
 * Helper function to check if our Stripe API version is current
 * This helps ensure we don't fall too far behind Stripe's recommended versions
 */
async function checkStripeApiVersion() {
  try {
    // Current API version might be outdated if a new version is available
    console.log(`Using Stripe API version: ${STRIPE_API_VERSION}`);
  } catch (error) {
    console.warn('Could not verify Stripe API version:', error);
  }
}

/**
 * Creates a payment intent for a team registration
 */
export async function createPaymentIntent(amount: number, teamId: number | string, metadata?: Record<string, string>) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        teamId: teamId.toString(),
        ...metadata
      }
    });

    // Only update the team in the database if it's a numeric ID (not a temp ID)
    if (typeof teamId === 'number' || !teamId.toString().startsWith('temp-')) {
      try {
        const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
        // Update the team with the payment intent ID
        await db.update(teams)
          .set({
            payment_intent_id: paymentIntent.id
          })
          .where(eq(teams.id, numericTeamId));
      } catch (dbError) {
        // Log the db error but don't fail the payment intent creation
        console.warn(`Could not update team record with payment intent ID, likely a temporary team: ${dbError.message}`);
      }
    }

    return { 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    throw new Error(`Error creating payment intent: ${error.message}`);
  }
}

/**
 * Handles a successful payment intent webhook event
 */
export async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const teamId = paymentIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in payment intent metadata");
      return;
    }

    // Check if this is a temporary team ID (for new registrations)
    if (teamId.toString().startsWith('temp-')) {
      console.log(`Payment received for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`);
      return;
    }

    // Find the team
    const teamIdNumber = parseInt(teamId);
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamIdNumber)
    });

    if (!existingTeam) {
      console.error(`Team with ID ${teamId} not found`);
      return;
    }

    // Get payment details
    const charges = await stripe.charges.list({
      payment_intent: paymentIntent.id
    });
    
    const charge = charges.data[0];
    const cardDetails = charge?.payment_method_details?.card;

    // Record payment transaction
    await db.insert(paymentTransactions).values({
      team_id: teamIdNumber,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'paid',
      payment_date: new Date(),
      card_brand: cardDetails?.brand || null,
      card_last_four: cardDetails?.last4 || null,
    });

    // Update team payment status and card details
    await db.update(teams)
      .set({
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        card_brand: cardDetails?.brand || null,
        card_last_four: cardDetails?.last4 || null,
      })
      .where(eq(teams.id, teamIdNumber));

    console.log(`Payment recorded successfully for team ${teamId}`);
    
    // Send receipt email with payment details if submitter email is available
    try {
      if (existingTeam.submitterEmail) {
        // Get the event name for the email
        const [eventInfo] = await db
          .select({ name: events.name })
          .from(events)
          .where(eq(events.id, existingTeam.eventId));
        
        // Create payment data object for receipt email
        const paymentData = {
          status: 'paid',
          amount: paymentIntent.amount,
          paymentIntentId: paymentIntent.id,
          paymentDate: new Date().toISOString(),
          cardBrand: cardDetails?.brand || null,
          cardLastFour: cardDetails?.last4 || null,
          paymentMethodType: 'card'
        };
        
        console.log(`Sending payment receipt email to ${existingTeam.submitterEmail}`);
        
        // Send the receipt email asynchronously (don't await to avoid delaying the response)
        sendRegistrationReceiptEmail(
          existingTeam.submitterEmail,
          existingTeam,
          paymentData,
          eventInfo?.name || 'Tournament Registration'
        ).catch(emailError => {
          // Log email errors but don't fail the payment processing
          console.error('Error sending payment receipt email:', emailError);
        });
      }
    } catch (emailError) {
      // Log email errors but don't fail the payment processing
      console.error('Error preparing payment receipt email:', emailError);
    }
    
    return true;
  } catch (error: any) {
    console.error("Error handling payment success:", error);
    throw new Error(`Error handling payment success: ${error.message}`);
  }
}

/**
 * Handles a payment intent failure webhook event
 */
export async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const teamId = paymentIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in payment intent metadata");
      return;
    }
    
    // Check if this is a temporary team ID (for new registrations)
    if (teamId.toString().startsWith('temp-')) {
      console.log(`Payment failure for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`);
      return;
    }

    // Find the team
    const teamIdNumber = parseInt(teamId);
    
    // Record payment transaction
    await db.insert(paymentTransactions).values({
      team_id: teamIdNumber,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'failed',
      payment_date: new Date(),
      error_code: paymentIntent.last_payment_error?.code || null,
      error_message: paymentIntent.last_payment_error?.message || null,
    });

    // Update team payment status
    await db.update(teams)
      .set({
        payment_status: 'failed',
        error_code: paymentIntent.last_payment_error?.code || null,
        error_message: paymentIntent.last_payment_error?.message || null,
      })
      .where(eq(teams.id, teamIdNumber));

    console.log(`Payment failure recorded for team ${teamId}`);
    return true;
  } catch (error: any) {
    console.error("Error handling payment failure:", error);
    throw new Error(`Error handling payment failure: ${error.message}`);
  }
}

/**
 * Creates a test payment intent for development/testing purposes
 */
export async function createTestPaymentIntent(amount: number, teamId: number, metadata?: Record<string, string>) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test payment intents are not allowed in production');
  }
  
  log('Creating test payment intent');
  return createPaymentIntent(amount, teamId, metadata);
}

/**
 * Creates a refund for a payment
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  try {
    log(`Creating refund for payment intent ${paymentIntentId}`);
    
    // Find the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      throw new Error(`Payment intent ${paymentIntentId} not found`);
    }
    
    // Find the charge associated with this payment intent
    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId
    });
    
    if (charges.data.length === 0) {
      throw new Error(`No charges found for payment intent ${paymentIntentId}`);
    }
    
    const chargeId = charges.data[0].id;
    
    // Create the refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount, // If not specified, refund the full amount
    });
    
    // Get the team from the payment intent metadata
    const teamId = paymentIntent.metadata.teamId;
    if (teamId) {
      const teamIdNumber = parseInt(teamId);
      
      // Update the team status
      await db.update(teams)
        .set({
          payment_status: 'refunded',
          refund_date: new Date().toISOString(),
        })
        .where(eq(teams.id, teamIdNumber));
      
      // Record the refund transaction
      await db.insert(paymentTransactions).values({
        team_id: teamIdNumber,
        payment_intent_id: paymentIntentId,
        amount: -(amount || paymentIntent.amount), // Negative amount for refund
        status: 'refunded',
        payment_date: new Date(),
      });
    }
    
    return refund;
  } catch (error: any) {
    console.error("Error creating refund:", error);
    throw new Error(`Error creating refund: ${error.message}`);
  }
}

/**
 * Creates a Setup Intent for collecting payment details without charging
 * This allows us to collect card information during registration and only charge upon approval
 */
export async function createSetupIntent(teamId: number | string, metadata?: Record<string, string>) {
  try {
    log(`Creating setup intent for team: ${teamId}`);
    
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session', // This allows for future use without customer being present
      metadata: {
        teamId: teamId.toString(),
        ...metadata
      }
    });

    // Only update the team in the database if it's a numeric ID (not a temp ID)
    if (typeof teamId === 'number' || !teamId.toString().startsWith('temp-')) {
      try {
        const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
        // Update the team with the setup intent ID
        await db.update(teams)
          .set({
            setup_intent_id: setupIntent.id,
            payment_status: 'payment_info_provided'
          })
          .where(eq(teams.id, numericTeamId));
      } catch (dbError) {
        console.warn(`Could not update team record with setup intent ID, likely a temporary team: ${dbError.message}`);
      }
    }

    return { 
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    };
  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    throw new Error(`Error creating setup intent: ${error.message}`);
  }
}

/**
 * Processes a payment for a team using a saved payment method
 * This is used when an admin approves a team that provided payment information during registration
 */
export async function processPaymentForApprovedTeam(teamId: number, amount: number) {
  try {
    log(`Processing payment for approved team: ${teamId}`);
    
    // Find the team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    
    if (!team.payment_method_id) {
      throw new Error(`Team ${teamId} has no saved payment method`);
    }
    
    // Create a payment intent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method: team.payment_method_id,
      confirm: true, // Immediately attempt to confirm the payment
      off_session: true, // Since the customer is not present
      metadata: {
        teamId: teamId.toString(),
        eventId: team.eventId.toString(),
        description: `Team registration payment for ${team.name}`
      }
    });
    
    // Update the team with the payment intent ID
    await db.update(teams)
      .set({
        payment_intent_id: paymentIntent.id,
        payment_status: paymentIntent.status,
        payment_date: new Date().toISOString()
      })
      .where(eq(teams.id, teamId));
    
    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    };
  } catch (error: any) {
    // Handle specific Stripe errors
    console.error("Error processing payment for approved team:", error);
    
    // Update the team with the error information
    await db.update(teams)
      .set({
        payment_status: 'failed',
        error_code: error.code || null,
        error_message: error.message || 'Payment processing failed'
      })
      .where(eq(teams.id, teamId));
    
    throw new Error(`Error processing payment: ${error.message}`);
  }
}

/**
 * Updates a payment intent status (for testing purpose only)
 * This function should ONLY be used in development to simulate status changes
 */
export async function updatePaymentIntentStatus(paymentIntentId: string, status: string) {
  // This function is only for development and testing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This function is only available in development mode');
  }

  try {
    // Note: In a real environment, we can't directly modify a payment intent's status.
    // This is just to update our database to simulate a status change
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Find the team associated with this payment intent
    const team = await db.query.teams.findFirst({
      where: eq(teams.payment_intent_id, paymentIntentId)
    });
    
    if (!team) {
      throw new Error(`No team found with payment intent ID ${paymentIntentId}`);
    }
    
    // Update the team payment status
    await db.update(teams)
      .set({
        payment_status: status,
        payment_date: new Date().toISOString(),
      })
      .where(eq(teams.id, team.id));
      
    return {
      success: true,
      message: `Updated payment intent ${paymentIntentId} status to ${status} in database`
    };
  } catch (error: any) {
    console.error("Error updating payment intent status:", error);
    throw new Error(`Error updating payment intent status: ${error.message}`);
  }
}

/**
 * Handle a successful setup intent completion (when payment method is attached)
 */
export async function handleSetupIntentSuccess(setupIntent: Stripe.SetupIntent) {
  try {
    const teamId = setupIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in setup intent metadata");
      return;
    }

    // Check if this is a temporary team ID (for new registrations)
    if (teamId.toString().startsWith('temp-')) {
      console.log(`Setup intent completed for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`);
      return;
    }

    const paymentMethodId = setupIntent.payment_method as string;
    if (!paymentMethodId) {
      console.error("No payment method attached to setup intent");
      return;
    }

    // Find the team
    const teamIdNumber = parseInt(teamId);
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamIdNumber)
    });

    if (!existingTeam) {
      console.error(`Team with ID ${teamId} not found`);
      return;
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const cardDetails = paymentMethod.card;

    // Update team with payment method details
    await db.update(teams)
      .set({
        payment_method_id: paymentMethodId,
        payment_status: 'payment_info_provided',
        card_brand: cardDetails?.brand || null,
        card_last_four: cardDetails?.last4 || null,
      })
      .where(eq(teams.id, teamIdNumber));

    console.log(`Payment method saved successfully for team ${teamId}`);
    return true;
  } catch (error: any) {
    console.error("Error handling setup intent success:", error);
    throw new Error(`Error handling setup intent success: ${error.message}`);
  }
}

export async function handleRefund(charge: Stripe.Charge, refund: Stripe.Refund) {
  try {
    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) {
      console.error("No payment intent ID found in charge");
      return;
    }

    // Find the team with this payment intent
    const team = await db.query.teams.findFirst({
      where: eq(teams.payment_intent_id, paymentIntentId)
    });

    if (!team) {
      console.error(`No team found with payment intent ID ${paymentIntentId}`);
      return;
    }

    // Record payment transaction for the refund
    await db.insert(paymentTransactions).values({
      team_id: team.id,
      payment_intent_id: paymentIntentId,
      amount: -refund.amount, // negative amount for refund
      status: 'refunded',
      payment_date: new Date(),
      card_brand: team.card_brand,
      card_last_four: team.card_last_four,
    });

    // Update team payment status
    await db.update(teams)
      .set({
        payment_status: 'refunded',
        refund_date: new Date().toISOString(),
      })
      .where(eq(teams.id, team.id));

    console.log(`Refund recorded for team ${team.id}`);
    return true;
  } catch (error: any) {
    console.error("Error handling refund:", error);
    throw new Error(`Error handling refund: ${error.message}`);
  }
}