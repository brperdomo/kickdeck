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
    // Fetch team details to create meaningful description
    let description = 'Team Registration Payment';
    let enhancedMetadata = {
      teamId: teamId.toString(),
      ...metadata
    };

    // Only query team details if it's a real team ID (not temp)
    if (typeof teamId === 'number' || (!teamId.toString().startsWith('temp-') && !isNaN(Number(teamId)))) {
      try {
        const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
        const teamResult = await db
          .select({
            teamName: teams.name,
            eventName: events.name,
            ageGroupName: ageGroups.name,
            submitterEmail: teams.submitterEmail,
            managerEmail: teams.managerEmail
          })
          .from(teams)
          .leftJoin(events, eq(teams.eventId, events.id))
          .leftJoin(ageGroups, eq(teams.ageGroupId, ageGroups.id))
          .where(eq(teams.id, numericTeamId))
          .limit(1);

        if (teamResult.length > 0) {
          const team = teamResult[0];
          description = `${team.eventName || 'Tournament'} - ${team.teamName || 'Team Registration'}`;
          if (team.ageGroupName) {
            description += ` (${team.ageGroupName})`;
          }

          // Enhanced metadata for better tracking
          enhancedMetadata = {
            ...enhancedMetadata,
            teamName: team.teamName || '',
            eventName: team.eventName || '',
            ageGroup: team.ageGroupName || '',
            contactEmail: team.managerEmail || team.submitterEmail || ''
          };
        }
      } catch (dbError) {
        console.warn(`Could not fetch team details for description: ${dbError.message}`);
        // Continue with default description
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description: description,
      metadata: enhancedMetadata
    });

    // Only update the team in the database if it's a numeric ID (not a temp ID)
    if (typeof teamId === 'number' || !teamId.toString().startsWith('temp-')) {
      try {
        const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
        // Update the team with the payment intent ID
        await db.update(teams)
          .set({
            paymentIntentId: paymentIntent.id
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
      teamId: teamIdNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'paid',
      paymentDate: new Date(),
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null,
    });

    // Update team payment status and card details
    await db.update(teams)
      .set({
        paymentStatus: 'paid',
        paymentDate: new Date().toISOString(),
        cardBrand: cardDetails?.brand || null,
        cardLast4: cardDetails?.last4 || null,
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
      teamId: teamIdNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'failed',
      paymentDate: new Date(),
      errorCode: paymentIntent.last_payment_error?.code || null,
      errorMessage: paymentIntent.last_payment_error?.message || null,
    });

    // Update team payment status
    await db.update(teams)
      .set({
        paymentStatus: 'failed',
        errorCode: paymentIntent.last_payment_error?.code || null,
        errorMessage: paymentIntent.last_payment_error?.message || null,
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
          paymentStatus: 'refunded',
          refundDate: new Date().toISOString(),
        })
        .where(eq(teams.id, teamIdNumber));
      
      // Record the refund transaction
      await db.insert(paymentTransactions).values({
        teamId: teamIdNumber,
        paymentIntentId: paymentIntentId,
        amount: -(amount || paymentIntent.amount), // Negative amount for refund
        status: 'refunded',
        paymentDate: new Date(),
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
    
    // CRITICAL FIX: Create or get customer for charging capability
    let customerId: string | undefined;
    
    // For real teams (not temp), create/get customer based on team info
    if (typeof teamId === 'number' || !teamId.toString().startsWith('temp-')) {
      try {
        const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
        const existingTeam = await db.query.teams.findFirst({
          where: eq(teams.id, numericTeamId),
          columns: {
            stripeCustomerId: true,
            submitterEmail: true,
            submitterName: true,
            name: true
          }
        });
        
        if (existingTeam?.stripeCustomerId) {
          customerId = existingTeam.stripeCustomerId;
          log(`Using existing customer ID: ${customerId} for team ${teamId}`);
        } else if (existingTeam?.submitterEmail) {
          // Create new customer for this team
          const customer = await stripe.customers.create({
            email: existingTeam.submitterEmail,
            name: existingTeam.submitterName || 'Team Manager',
            metadata: {
              teamId: teamId.toString(),
              teamName: existingTeam.name || 'Unknown Team'
            }
          });
          customerId = customer.id;
          
          // Store customer ID in database for future use
          await db.update(teams)
            .set({ stripeCustomerId: customerId })
            .where(eq(teams.id, numericTeamId));
          
          log(`Created new customer: ${customerId} for team ${teamId}`);
        }
      } catch (customerError: any) {
        log(`Could not create/retrieve customer for team ${teamId}: ${customerError.message}`);
        // Continue without customer - will limit charging ability but still allow Setup Intent creation
      }
    } else {
      // For temp team IDs during registration, create a customer using metadata
      if (metadata?.userEmail) {
        try {
          const customer = await stripe.customers.create({
            email: metadata.userEmail,
            name: metadata.userName || 'Team Manager',
            metadata: {
              teamId: teamId.toString(),
              teamName: metadata.teamName || 'Unknown Team',
              createdFor: 'temp_team_registration'
            }
          });
          customerId = customer.id;
          log(`Created customer ${customerId} for temp team ${teamId} during registration`);
        } catch (customerError: any) {
          log(`Could not create customer for temp team ${teamId}: ${customerError.message}`);
        }
      } else {
        log(`WARNING: No user email provided for temp team ${teamId} - cannot create customer`);
      }
    }
    
    const setupIntentData: any = {
      // Use automatic_payment_methods instead of payment_method_types
      // This is the recommended approach by Stripe
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      usage: 'off_session', // This allows for future use without customer being present
      metadata: {
        teamId: teamId.toString(),
        ...metadata
      }
    };
    
    // Add customer if we have one (critical for charging later)
    if (customerId) {
      setupIntentData.customer = customerId;
      log(`Setup Intent will be created with customer: ${customerId}`);
    } else {
      log(`WARNING: Setup Intent created without customer - charging will be limited`);
    }
    
    const setupIntent = await stripe.setupIntents.create(setupIntentData);

    // Only update the team in the database if it's a numeric ID (not a temp ID)
    // AND only if the team doesn't already have a confirmed Setup Intent
    if (typeof teamId === 'number' || !teamId.toString().startsWith('temp-')) {
      try {
        const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
        
        // Check if team already has a Setup Intent
        const existingTeam = await db.query.teams.findFirst({
          where: eq(teams.id, numericTeamId),
          columns: {
            setupIntentId: true,
            paymentStatus: true
          }
        });
        
        // Only update if no existing Setup Intent or existing one is not completed
        if (!existingTeam?.setupIntentId || existingTeam?.paymentStatus === 'pending') {
          log(`Updating team ${numericTeamId} with Setup Intent: ${setupIntent.id}`);
          await db.update(teams)
            .set({
              setupIntentId: setupIntent.id,
              paymentStatus: 'payment_info_provided'
            })
            .where(eq(teams.id, numericTeamId));
        } else {
          log(`Team ${numericTeamId} already has Setup Intent ${existingTeam.setupIntentId}, skipping database update to preserve confirmed payment info`);
        }
      } catch (dbError: any) {
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
    
    if (!team.paymentMethodId) {
      throw new Error(`Team ${teamId} has no saved payment method`);
    }
    
    // Check if this is a Link payment method first
    const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
    
    // Handle Link payment methods differently - they cannot be attached to customers
    let customerId = team.stripeCustomerId;
    
    if (paymentMethod.type === 'link') {
      log(`Processing Link payment method for team: ${teamId} - skipping customer attachment`);
      // For Link payments, we cannot attach to customers and must process differently
      customerId = null;
    } else {
      // For regular payment methods, create/use customer and attach as usual
      if (!customerId) {
        log(`Creating Stripe customer for team: ${teamId}`);
        const customer = await stripe.customers.create({
          name: team.name || `Team ${teamId}`,
          email: team.submitterEmail || `team-${teamId}@example.com`,
          metadata: {
            teamId: teamId.toString(),
            eventId: team.eventId?.toString() || '',
          }
        });
        customerId = customer.id;
        
        // Save the customer ID to the team record
        await db.update(teams)
          .set({ stripeCustomerId: customerId })
          .where(eq(teams.id, teamId));
        
        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(team.paymentMethodId, {
          customer: customerId,
        });
      } else {
        // Verify if payment method is attached to this customer
        log(`Using existing Stripe customer for team: ${teamId}`);
        
        try {
          if (paymentMethod.customer !== customerId) {
            // If not attached, attach it now
            log(`Attaching payment method ${team.paymentMethodId} to customer ${customerId}`);
            await stripe.paymentMethods.attach(team.paymentMethodId, {
              customer: customerId,
            });
          }
        } catch (error) {
          // If an error occurred, the payment method might be attached to another customer
          // In this case we need to detach it first and then attach to our customer
          log(`Detaching and re-attaching payment method for team: ${teamId}`);
          
          try {
            await stripe.paymentMethods.detach(team.paymentMethodId);
          } catch (detachError) {
            // If detach fails, let's continue and try to attach anyway
            log(`Failed to detach payment method: ${detachError}`);
          }
          
          // Attach to our customer
          await stripe.paymentMethods.attach(team.paymentMethodId, {
            customer: customerId,
          });
        }
      }
    }
    
    // Create a payment intent with the saved payment method
    // For Link payments, we cannot include customer parameter
    const paymentIntentParams: any = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method: team.paymentMethodId,
      confirm: true, // Immediately attempt to confirm the payment
      off_session: true, // Since the customer is not present
      receipt_email: team.submitterEmail, // Enable Stripe's automatic receipt email
      metadata: {
        teamId: teamId.toString(),
        eventId: team.eventId?.toString() || '',
        description: `Team registration payment for ${team.name}`
      }
    };
    
    // Only add customer for non-Link payment methods
    if (customerId) {
      paymentIntentParams.customer = customerId;
    }
    
    log(`Creating payment intent for team ${teamId}, payment method type: ${paymentMethod.type}, customer: ${customerId || 'none'}`);
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    
    // Update the team with the payment intent ID
    await db.update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status,
        paymentDate: new Date()  // Use Date object directly for timestamp fields
      })
      .where(eq(teams.id, teamId));
    
    // Create a payment transaction record
    await db.insert(paymentTransactions).values({
      status: paymentIntent.status,
      transactionType: 'registration_payment',
      amount: amount,
      paymentIntentId: paymentIntent.id,
      setupIntentId: team.setupIntentId,
      eventId: team.eventId,
      teamId: teamId,
      cardBrand: team.cardBrand,
      cardLast4: team.cardLast4,
      // Note: paymentDate field was removed as it's not in the schema
      // We have createdAt which is automatically set
    });
    
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
        paymentStatus: 'failed',
        errorCode: error.code || null,
        errorMessage: error.message || 'Payment processing failed'
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
      where: eq(teams.paymentIntentId, paymentIntentId)
    });
    
    if (!team) {
      throw new Error(`No team found with payment intent ID ${paymentIntentId}`);
    }
    
    // Update the team payment status
    await db.update(teams)
      .set({
        paymentStatus: status,
        paymentDate: new Date(),  // Use Date object directly for timestamp fields
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
 * Create a test payment method and attach it to a setup intent (testing only)
 * This simulates a customer entering their card details
 */
export async function attachTestPaymentMethodToSetupIntent(setupIntentId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This function is only available in development mode');
  }

  try {
    log(`Attaching test payment method to setup intent: ${setupIntentId}`);
    
    // Use a test token instead of raw card data for testing
    // This avoids the direct card API access restriction in Stripe
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: 'tok_visa', // Standard test token for a Visa card
      },
    });
    
    log(`Created test payment method: ${paymentMethod.id}`);
    
    // Attach the payment method to the setup intent
    const setupIntent = await stripe.setupIntents.update(setupIntentId, {
      payment_method: paymentMethod.id,
    });
    
    // Confirm the setup intent to complete it
    const confirmedIntent = await stripe.setupIntents.confirm(setupIntentId, {
      payment_method: paymentMethod.id,
      return_url: 'https://example.com/setup-complete', // Dummy URL for testing purposes
    });
    
    log(`Confirmed setup intent: ${confirmedIntent.id} with status: ${confirmedIntent.status}`);
    
    // Process the successful setup intent
    await handleSetupIntentSuccess(confirmedIntent);
    
    return {
      success: true,
      setupIntentId: setupIntentId,
      paymentMethodId: paymentMethod.id,
      status: confirmedIntent.status
    };
  } catch (error: any) {
    console.error("Error attaching test payment method to setup intent:", error);
    throw new Error(`Error attaching payment method: ${error.message}`);
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
    
    // Create a Stripe customer and attach the payment method
    let customerId = existingTeam.stripeCustomerId;
    
    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        name: existingTeam.name || `Team ${teamId}`,
        email: existingTeam.submitterEmail || `team-${teamId}@example.com`,
        metadata: {
          teamId: teamId.toString(),
          eventId: existingTeam.eventId?.toString() || '',
        }
      });
      customerId = customer.id;
      
      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      // Set this payment method as the default
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Update team with payment method details
    await db.update(teams)
      .set({
        paymentMethodId: paymentMethodId,
        paymentStatus: 'payment_info_provided',
        cardBrand: cardDetails?.brand || null,
        cardLast4: cardDetails?.last4 || null,
        stripeCustomerId: customerId,
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
      where: eq(teams.paymentIntentId, paymentIntentId)
    });

    if (!team) {
      console.error(`No team found with payment intent ID ${paymentIntentId}`);
      return;
    }

    // Record payment transaction for the refund
    await db.insert(paymentTransactions).values({
      teamId: team.id,
      paymentIntentId: paymentIntentId,
      amount: -refund.amount, // negative amount for refund
      status: 'refunded',
      transactionType: 'refund',
      cardBrand: team.cardBrand,
      cardLast4: team.cardLast4,
    });

    // Update team payment status
    await db.update(teams)
      .set({
        paymentStatus: 'refunded',
        refundDate: new Date(),  // Use Date object directly for timestamp fields
      })
      .where(eq(teams.id, team.id));

    console.log(`Refund recorded for team ${team.id}`);
    return true;
  } catch (error: any) {
    console.error("Error handling refund:", error);
    throw new Error(`Error handling refund: ${error.message}`);
  }
}