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
    const { amount, currency, description, metadata, eventId, ageGroupId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Make sure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to process payments' });
    }
    
    // Add user ID to metadata for later reference
    const enhancedMetadata = {
      ...metadata,
      userId: String(req.user.id),
      eventId: String(eventId),
      ageGroupId: String(ageGroupId)
    };
    
    // Create the payment intent with Stripe
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      description,
      metadata: enhancedMetadata
    });
    
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
            registrationFee: paymentIntent.amount, // Use registrationFee for the amount
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
      apiVersion: '2022-11-15', // Use a compatible API version
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
          // Update team's payment status using existing fields
          await db
            .update(teams)
            .set({
              status: 'paid', // Use the status field for payment status
              registrationFee: paymentIntent.amount, // Use registrationFee for the amount
              notes: `Payment completed via webhook. Payment ID: ${paymentIntent.id}`, // Store payment ID in notes
              termsAcknowledgedAt: new Date(), // Record payment confirmation timestamp
              termsAcknowledged: true // Mark as acknowledged
            })
            .where(eq(teams.id, parseInt(paymentIntent.metadata.teamId)));
            
          log(`Updated team ${paymentIntent.metadata.teamId} payment status to paid from webhook`, 'payment');
        } catch (dbError) {
          log(`Error updating team payment status from webhook: ${dbError}`, 'payment');
        }
      }
      break;
    
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      log(`Payment failed: ${failedPaymentIntent.id}`, 'stripe-webhook');
      // Optional: Update team status to payment_failed
      break;
      
    // Add more event handlers as needed
      
    default:
      log(`Unhandled event type: ${event.type}`, 'stripe-webhook');
  }
  
  // Return success to Stripe
  res.json({ received: true });
}