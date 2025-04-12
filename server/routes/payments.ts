import { Request, Response } from 'express';
import { createPaymentIntent, retrievePaymentIntent } from '../services/stripeService';
import Stripe from 'stripe';
import { log } from '../vite';
import { db } from '@db';
import { teams } from '@db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get Stripe configuration including publishable key
 */
export async function getStripeConfig(req: Request, res: Response) {
  try {
    // Return the publishable key from environment variables
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      log('Stripe publishable key not found in environment variables', 'payment');
      return res.status(500).json({ error: 'Stripe configuration is missing' });
    }
    
    return res.json({
      publishableKey
    });
  } catch (error) {
    log(`Error retrieving Stripe config: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    return res.status(500).json({ 
      error: 'Failed to retrieve Stripe configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Create a Stripe payment intent
 */
export async function createStripePaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency, description, metadata, eventId, ageGroupId, teamId, isPreview } = req.body;

    // Handle preview mode
    if (isPreview === true || eventId === 'preview') {
      console.log('Preview mode: simulating payment intent creation without using Stripe');
      
      // Generate a fake client secret
      const fakePaymentIntentId = `pi_preview_${Date.now()}`;
      const fakeClientSecret = `${fakePaymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;
      
      return res.json({
        clientSecret: fakeClientSecret,
        paymentIntentId: fakePaymentIntentId,
        isPreview: true,
        message: "This is a preview payment intent. No actual payment will be processed."
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Make sure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to process payments' });
    }
    
    // If teamId is provided, check if this team already has a payment intent
    if (teamId) {
      try {
        // Check if the team already has a payment intent registered
        const existingTeam = await db.query.teams.findFirst({
          where: eq(teams.id, parseInt(teamId)),
          columns: {
            id: true,
            paymentIntentId: true,
            status: true
          }
        });
        
        // If team already has a payment intent ID and status is paid, return an error
        if (existingTeam?.paymentIntentId && existingTeam.status === 'paid') {
          log(`Prevented duplicate payment for team ${teamId}: already has payment intent ${existingTeam.paymentIntentId}`, 'payment');
          return res.status(400).json({ 
            error: 'This registration has already been paid for',
            details: 'To avoid duplicate charges, the system prevented a second payment attempt',
            existingPaymentId: existingTeam.paymentIntentId
          });
        }
      } catch (dbError) {
        // Just log the error but continue with payment processing
        log(`Error checking for existing payment: ${dbError}`, 'payment');
      }
    }
    
    // Add user ID and team ID to metadata for later reference
    const enhancedMetadata = {
      ...metadata,
      userId: String(req.user.id),
      eventId: String(eventId),
      ageGroupId: String(ageGroupId),
      teamId: teamId ? String(teamId) : undefined
    };
    
    // Create the payment intent with Stripe
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      description,
      metadata: enhancedMetadata
    });
    
    // If we have a teamId, immediately associate the payment intent with the team
    // This helps prevent multiple payments even if client-side validation fails
    if (teamId) {
      try {
        await db.update(teams)
          .set({
            paymentIntentId: paymentIntent.id,
            updatedAt: new Date().toISOString()
          })
          .where(eq(teams.id, parseInt(teamId)));
          
        log(`Associated payment intent ${paymentIntent.id} with team ${teamId}`, 'payment');
      } catch (dbError) {
        // Log but continue - the payment intent was still created successfully
        log(`Error associating payment intent with team: ${dbError}`, 'payment');
      }
    }
    
    return res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    log(`Error creating payment intent: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get payment intent status
 */
export async function getPaymentIntentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    // Check if this is a preview mode payment intent
    if (id.startsWith('pi_preview_')) {
      console.log('Preview mode: simulating successful payment status for preview intent');
      return res.json({
        status: 'succeeded',
        amount: 2500,
        currency: 'usd',
        created: Math.floor(Date.now() / 1000),
        isPreview: true,
        message: "This is a preview payment status. No actual payment was processed."
      });
    }
    
    // First check if this team has a successful test payment recorded
    // Get the payment intent ID first 
    try {
      // Check if this is a test payment that was processed via our simulated webhook
      // For testing only - this shouldn't be in production code
      const teams = await db.query.teams.findMany({
        where: eq(teams.status, 'paid'),
        columns: {
          id: true,
          notes: true,
          status: true,
          registrationFee: true
        }
      });
      
      // Check all teams to find one with this payment ID in the notes
      const team = teams.find(t => t.notes && t.notes.includes(id));
      
      // If we find a team with this payment ID in the notes, it was a simulated payment
      if (team) {
        log(`Found simulated payment status 'succeeded' for intent: ${id}`, 'payment-test');
        return res.json({
          status: 'succeeded', // Simulated success status for testing
          amount: team.totalAmount || team.registrationFee || 2500,
          currency: 'usd',
          created: Math.floor(Date.now() / 1000)
        });
      }
    } catch (dbError) {
      // Just log and continue to normal payment intent retrieval
      log(`Error checking for test payment: ${dbError}`, 'payment-test');
    }
    
    // If not a test payment, proceed with normal Stripe API call
    const paymentIntent = await retrievePaymentIntent(id);
    
    // If payment was successful and has team ID in metadata, update team record
    if (paymentIntent.status === 'succeeded' && 
        paymentIntent.metadata && 
        paymentIntent.metadata.teamId) {
      
      try {
        // Update team's payment status using existing fields
        await db
          .update(teams)
          .set({
            status: 'paid', // Use the status field for payment status
            totalAmount: paymentIntent.amount, // Store the total amount paid
            paymentIntentId: paymentIntent.id, // Store the payment intent ID for refunds
            notes: `Payment completed. Payment ID: ${paymentIntent.id}`, // Store payment ID in notes
          })
          .where(eq(teams.id, parseInt(paymentIntent.metadata.teamId)));
          
        log(`Updated team ${paymentIntent.metadata.teamId} payment status to paid`, 'payment');
      } catch (dbError) {
        // Log but don't fail the request
        log(`Error updating team payment status: ${dbError}`, 'payment');
      }
    }
    
    return res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created
    });
  } catch (error) {
    log(`Error retrieving payment intent: ${error}`, 'payment');
    return res.status(500).json({ 
      error: 'Failed to retrieve payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle webhook events from Stripe
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing signature or endpoint secret' });
  }
  
  let event: Stripe.Event;
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16', // Match the version used in stripeService.ts
    });
    
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    log(`Webhook Error: ${err}`, 'stripe-webhook');
    return res.status(400).json({ error: `Webhook Error: ${err}` });
  }
  
  // Handle specific events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      log(`PaymentIntent was successful! ID: ${paymentIntent.id}`, 'stripe-webhook');
      
      // If payment has team ID in metadata, update team record
      if (paymentIntent.metadata && paymentIntent.metadata.teamId) {
        try {
          // Get payment method details if available
          let cardBrand = null;
          let cardLastFour = null;
          let paymentMethodType = null;
          
          // Check if we have payment method details
          if (paymentIntent.charges && paymentIntent.charges.data && paymentIntent.charges.data.length > 0) {
            const charge = paymentIntent.charges.data[0];
            if (charge.payment_method_details) {
              paymentMethodType = charge.payment_method_details.type || null;
              
              // If it's a card payment, get card details
              if (charge.payment_method_details.card) {
                cardBrand = charge.payment_method_details.card.brand || null;
                cardLastFour = charge.payment_method_details.card.last4 || null;
              }
            }
          }
          
          // Update team's payment status using existing fields
          await db
            .update(teams)
            .set({
              status: 'paid', // Use the status field for payment status
              totalAmount: paymentIntent.amount, // Store the total amount paid
              paymentIntentId: paymentIntent.id, // Store the payment intent ID for refunds
              cardBrand: cardBrand, // Store the card brand
              cardLastFour: cardLastFour, // Store the last 4 digits of the card
              paymentMethodType: paymentMethodType, // Store the payment method type
              paymentDate: new Date(), // Record payment date
              notes: `Payment completed via webhook. Payment ID: ${paymentIntent.id}`, // Store payment ID in notes
              termsAcknowledgedAt: new Date(), // Record payment confirmation timestamp
              termsAcknowledged: true // Mark as acknowledged
            })
            .where(eq(teams.id, parseInt(paymentIntent.metadata.teamId)));
            
          log(`Updated team ${paymentIntent.metadata.teamId} payment status to paid from webhook with card details ${cardBrand} ${cardLastFour}`, 'payment');
        } catch (dbError) {
          log(`Error updating team payment status from webhook: ${dbError}`, 'payment');
        }
      }
      break;
    
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      log(`Payment failed: ${failedPaymentIntent.id}`, 'stripe-webhook');
      
      // If there's a teamId in the metadata, update the team with failure details
      if (failedPaymentIntent.metadata && failedPaymentIntent.metadata.teamId) {
        try {
          // Get error details if available
          let errorCode = null;
          let errorMessage = null;
          
          // Check for the last_payment_error which contains details about the failure
          if (failedPaymentIntent.last_payment_error) {
            errorCode = failedPaymentIntent.last_payment_error.code || null;
            errorMessage = failedPaymentIntent.last_payment_error.message || 'Payment failed';
          }
          
          // Update team to indicate payment failure and capture error details
          await db
            .update(teams)
            .set({
              status: 'payment_failed', // Set status to payment_failed
              paymentIntentId: failedPaymentIntent.id, // Store the failed payment intent ID
              paymentErrorCode: errorCode, // Store the error code
              paymentErrorMessage: errorMessage, // Store the error message
              notes: `Payment failed. Payment ID: ${failedPaymentIntent.id}. Error: ${errorMessage}`, // Store details in notes
            })
            .where(eq(teams.id, parseInt(failedPaymentIntent.metadata.teamId)));
            
          log(`Updated team ${failedPaymentIntent.metadata.teamId} payment status to failed`, 'payment');
        } catch (dbError) {
          log(`Error updating team payment failure status: ${dbError}`, 'payment');
        }
      }
      break;
      
    // Add more event handlers as needed
      
    default:
      log(`Unhandled event type: ${event.type}`, 'stripe-webhook');
  }
  
  // Return success to Stripe
  res.json({ received: true });
}