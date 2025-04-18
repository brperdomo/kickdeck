import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../../db';
import { log } from '../vite';
import { paymentTransactions } from '../../db/schema';
import { teams } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Log a payment transaction to the database
 */
export async function logTransaction({
  teamId = null,
  eventId = null,
  userId = null,
  paymentIntentId = null,
  transactionType,
  amount,
  status,
  cardBrand = null,
  cardLast4 = null,
  submitterEmail = null,
  submitterName = null,
  paymentMethod = 'stripe',
  errorCode = null,
  errorMessage = null,
  metadata = null,
  refundId = null,
  refundAmount = null,
  notes = null,
}) {
  try {
    const transaction = {
      teamId,
      eventId,
      userId,
      paymentIntentId,
      transactionType,
      amount,
      status,
      cardBrand,
      cardLast4,
      submitterEmail,
      submitterName,
      paymentMethod,
      errorCode,
      errorMessage,
      metadata: metadata ? JSON.stringify(metadata) : null,
      refundId,
      refundAmount,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Log transaction in the database
    const result = await db.insert(paymentTransactions).values(transaction);
    
    log(`Payment transaction logged: ${transactionType} for $${amount/100} with status ${status}`, 'payment-transaction');
    
    return { success: true, transactionId: result.rowCount ? result.rowCount : 0 };
  } catch (error) {
    log(`Error logging payment transaction: ${error}`, 'payment-transaction');
    return { success: false, error };
  }
}

/**
 * Get Stripe configuration including publishable key
 */
export async function getStripeConfig(req: Request, res: Response) {
  try {
    // Return the publishable key from environment variables
    const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY;
    
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
 * Create a payment intent for team registration
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { 
      amount, 
      currency = 'usd', 
      description = 'Team registration payment',
      metadata = {},
      teamId = null,
      eventId = null,
      ageGroupId = null
    } = req.body;

    // Basic validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency,
      metadata: {
        ...metadata,
        description,
        teamId: teamId ? String(teamId) : null,
        eventId: eventId ? String(eventId) : null,
        ageGroupId: ageGroupId ? String(ageGroupId) : null,
      },
      payment_method_types: ['card'],
    });

    // Log the payment intent creation
    await logTransaction({
      teamId,
      eventId,
      userId: req.user?.id || null,
      paymentIntentId: paymentIntent.id,
      transactionType: 'payment',
      amount: paymentIntent.amount,
      status: 'pending',
      submitterEmail: req.user?.email || null,
      submitterName: req.user?.name || null,
      notes: 'Payment intent created',
      metadata: {
        description,
        ...metadata
      }
    });

    // If this is for a team, update the payment intent ID
    if (teamId) {
      try {
        await db.update(teams)
          .set({
            paymentIntentId: paymentIntent.id,
          })
          .where(eq(teams.id, teamId));
      } catch (error) {
        log(`Error updating team with payment intent ID: ${error}`, 'payment');
        // We don't want to fail the overall request if just the team update fails
      }
    }

    // Return the client secret to the client
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    log(`Error creating payment intent: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    
    // Log the failure
    await logTransaction({
      teamId: req.body.teamId || null,
      eventId: req.body.eventId || null,
      userId: req.user?.id || null,
      transactionType: 'payment',
      amount: req.body.amount || 0,
      status: 'failed',
      errorCode: 'payment_intent_creation_failed',
      errorMessage: error instanceof Error ? error.message : String(error),
      submitterEmail: req.user?.email || null,
      submitterName: req.user?.name || null,
      notes: 'Error creating payment intent',
    });
    
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get the status of a payment intent
 */
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    
    // Get payment details for successful payments
    let paymentDetails = null;
    if (paymentIntent.status === 'succeeded' && paymentIntent.charges.data.length > 0) {
      const charge = paymentIntent.charges.data[0];
      paymentDetails = {
        paymentMethod: charge.payment_method_details?.card ? {
          brand: charge.payment_method_details.card.brand,
          last4: charge.payment_method_details.card.last4,
          expiryMonth: charge.payment_method_details.card.exp_month,
          expiryYear: charge.payment_method_details.card.exp_year,
        } : null,
        receiptUrl: charge.receipt_url,
        receiptEmail: charge.receipt_email,
        receiptNumber: charge.receipt_number,
      };
      
      // If this is a successful payment, update transaction status and card details
      if (paymentIntent.status === 'succeeded') {
        // Extract card details from charge if available
        const cardDetails = charge.payment_method_details?.card;
        
        // Log the successful payment
        await logTransaction({
          paymentIntentId: paymentIntent.id,
          transactionType: 'payment',
          amount: paymentIntent.amount,
          status: 'completed',
          cardBrand: cardDetails?.brand || null,
          cardLast4: cardDetails?.last4 || null,
          metadata: paymentIntent.metadata || {},
          notes: 'Payment completed successfully',
        });
        
        // Update team payment status if this was for a team registration
        if (paymentIntent.metadata?.teamId) {
          try {
            const teamId = parseInt(paymentIntent.metadata.teamId);
            await db.update(teams)
              .set({
                paymentStatus: 'paid',
                cardBrand: cardDetails?.brand || null,
                cardLast4: cardDetails?.last4 || null,
                paymentDate: new Date(),
              })
              .where(eq(teams.id, teamId));
          } catch (error) {
            log(`Error updating team payment status: ${error}`, 'payment');
            // Don't fail the request if just this update fails
          }
        }
      }
    }
    
    return res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      paymentDetails,
      message: getPaymentStatusMessage(paymentIntent.status),
    });
  } catch (error) {
    log(`Error retrieving payment status: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    
    // Log the status check failure
    if (req.params.id) {
      try {
        await logTransaction({
          paymentIntentId: req.params.id,
          transactionType: 'payment',
          amount: 0, // Unknown amount
          status: 'failed',
          errorCode: 'status_check_failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          notes: 'Error occurred while checking payment status'
        });
      } catch (logError) {
        log(`Error logging payment status check failure: ${logError}`, 'payment-transaction');
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to retrieve payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle Stripe webhook events for payment processing
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    log('Stripe webhook secret not configured, skipping signature verification', 'payment');
  }
  
  let event;
  
  try {
    if (endpointSecret && sig) {
      // Verify the event came from Stripe if we have a secret
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // In development, we might just parse the event without verification
      event = req.body;
    }
    
    // Handle the event based on its type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
        
      default:
        log(`Unhandled Stripe event type: ${event.type}`, 'payment');
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    log(`Webhook Error: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    log(`Payment succeeded: ${paymentIntent.id}`, 'payment');
    
    // Get charge details if available
    let cardBrand = null;
    let cardLast4 = null;
    
    if (paymentIntent.charges.data.length > 0) {
      const charge = paymentIntent.charges.data[0];
      if (charge.payment_method_details?.card) {
        cardBrand = charge.payment_method_details.card.brand;
        cardLast4 = charge.payment_method_details.card.last4;
      }
    }
    
    // Log the successful payment transaction
    await logTransaction({
      paymentIntentId: paymentIntent.id,
      teamId: paymentIntent.metadata?.teamId ? parseInt(paymentIntent.metadata.teamId) : null,
      eventId: paymentIntent.metadata?.eventId || null,
      transactionType: 'payment',
      amount: paymentIntent.amount,
      status: 'completed',
      cardBrand,
      cardLast4,
      metadata: paymentIntent.metadata,
      notes: 'Payment completed via webhook notification',
    });
    
    // Update team payment status if applicable
    if (paymentIntent.metadata?.teamId) {
      const teamId = parseInt(paymentIntent.metadata.teamId);
      await db.update(teams)
        .set({
          paymentStatus: 'paid',
          cardBrand,
          cardLast4,
          paymentDate: new Date(),
        })
        .where(eq(teams.id, teamId));
    }
  } catch (error) {
    log(`Error handling payment_intent.succeeded event: ${error}`, 'payment');
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    log(`Payment failed: ${paymentIntent.id}`, 'payment');
    
    // Get the last error message if available
    let errorMessage = 'Payment failed';
    let errorCode = 'payment_failed';
    
    if (paymentIntent.last_payment_error) {
      errorMessage = paymentIntent.last_payment_error.message || errorMessage;
      errorCode = paymentIntent.last_payment_error.code || errorCode;
    }
    
    // Log the failed payment transaction
    await logTransaction({
      paymentIntentId: paymentIntent.id,
      teamId: paymentIntent.metadata?.teamId ? parseInt(paymentIntent.metadata.teamId) : null,
      eventId: paymentIntent.metadata?.eventId || null,
      transactionType: 'payment',
      amount: paymentIntent.amount,
      status: 'failed',
      errorCode,
      errorMessage,
      metadata: paymentIntent.metadata,
      notes: 'Payment failed via webhook notification',
    });
    
    // Update team payment status if applicable
    if (paymentIntent.metadata?.teamId) {
      const teamId = parseInt(paymentIntent.metadata.teamId);
      await db.update(teams)
        .set({
          paymentStatus: 'failed',
          paymentDate: new Date(),
        })
        .where(eq(teams.id, teamId));
    }
  } catch (error) {
    log(`Error handling payment_intent.payment_failed event: ${error}`, 'payment');
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    log(`Charge refunded: ${charge.id}`, 'payment');
    
    // Get the payment intent ID from the charge
    const paymentIntentId = charge.payment_intent as string;
    
    // Determine if this is a full or partial refund
    const isFullRefund = charge.amount_refunded === charge.amount;
    const refundStatus = isFullRefund ? 'refunded' : 'partial_refund';
    
    // Log the refund transaction
    await logTransaction({
      paymentIntentId,
      teamId: charge.metadata?.teamId ? parseInt(charge.metadata.teamId) : null,
      eventId: charge.metadata?.eventId || null,
      transactionType: isFullRefund ? 'refund' : 'partial_refund',
      amount: charge.amount_refunded,
      status: 'completed',
      cardBrand: charge.payment_method_details?.card?.brand || null,
      cardLast4: charge.payment_method_details?.card?.last4 || null,
      metadata: charge.metadata,
      notes: `${isFullRefund ? 'Full' : 'Partial'} refund processed via webhook notification`,
    });
    
    // Update team payment status if applicable
    if (charge.metadata?.teamId) {
      const teamId = parseInt(charge.metadata.teamId);
      await db.update(teams)
        .set({
          paymentStatus: refundStatus,
          refundDate: new Date(),
        })
        .where(eq(teams.id, teamId));
    }
  } catch (error) {
    log(`Error handling charge.refunded event: ${error}`, 'payment');
  }
}

/**
 * Helper function to get a user-friendly payment status message
 */
function getPaymentStatusMessage(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'Your payment has been processed successfully.';
    case 'processing':
      return 'Your payment is being processed.';
    case 'requires_payment_method':
      return 'Your payment method was declined or expired. Please try a different payment method.';
    case 'requires_action':
      return 'Your payment requires additional verification. Please complete the verification process.';
    case 'canceled':
      return 'This payment was canceled.';
    default:
      return 'Payment status unknown.';
  }
}