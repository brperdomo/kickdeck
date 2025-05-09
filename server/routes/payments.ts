import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { createPaymentIntent, handlePaymentSuccess, handlePaymentFailure, handleRefund, createRefund } from '../services/stripeService';
import { createGeneralPaymentIntent } from './payments/create-payment-intent';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

// Create a router for payment-related routes
const router = express.Router();

// Middleware to parse Stripe webhook events
const stripeWebhookMiddleware = bodyParser.raw({type: 'application/json'});

// Get Stripe configuration (publishable key)
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY,
  });
});

// Route for standalone general-purpose payment intent (used by checkout page)
router.post('/create-payment-intent', createGeneralPaymentIntent);

// Create a payment intent for a registration
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, teamId, metadata } = req.body;
    
    if (!amount || !teamId) {
      return res.status(400).json({ error: 'Amount and teamId are required' });
    }
    
    const result = await createPaymentIntent(amount, teamId, metadata);
    res.json(result);
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process refund endpoint
router.post('/process-refund', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const { paymentIntentId, amount, isPartial } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment ID is required" });
    }
    
    // For partial refunds, amount is required
    if (isPartial && (!amount || isNaN(amount) || amount <= 0)) {
      return res.status(400).json({ error: "Valid amount is required for partial refunds" });
    }
    
    // Process the refund using our stripeService
    const parsedAmount = isPartial ? Math.round(amount * 100) : undefined;
    const refund = await createRefund(paymentIntentId, parsedAmount);
    
    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created
      }
    });
  } catch (error: any) {
    console.error("Error processing refund:", error);
    res.status(500).json({ 
      error: error.message || "Failed to process refund" 
    });
  }
});

// Get payment intent status
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe events
router.post('/webhook', stripeWebhookMiddleware, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing Stripe signature or webhook secret' });
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event based on type
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        if (charge.refunds && charge.refunds.data && charge.refunds.data.length > 0) {
          await handleRefund(charge, charge.refunds.data[0]);
        } else {
          console.error('Refund data is missing in the charge object');
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook event: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Test webhook for development (simulates successful payment)
router.post('/simulate-webhook', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in development' });
  }
  
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    // Retrieve the payment intent to simulate a webhook event
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Simulate the webhook event handler
    await handlePaymentSuccess(paymentIntent);
    
    res.json({ success: true, message: 'Successfully simulated payment success webhook' });
  } catch (error: any) {
    console.error('Error simulating webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;