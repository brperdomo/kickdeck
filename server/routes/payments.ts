import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { 
  createPaymentIntent, 
  createSetupIntent,
  handlePaymentSuccess, 
  handlePaymentFailure, 
  handleRefund,
  handleSetupIntentSuccess,
  processPaymentForApprovedTeam,
  attachTestPaymentMethodToSetupIntent
} from '../services/stripeService';

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

// Check for existing setup intent
router.get('/check-existing-setup-intent', async (req, res) => {
  try {
    const { teamId, expectedAmount } = req.query;
    
    if (!teamId || !expectedAmount) {
      return res.status(400).json({ error: 'Team ID and expected amount are required' });
    }
    
    // For temporary team IDs, they don't exist in database so return null
    if (typeof teamId === 'string' && teamId.startsWith('temp-')) {
      return res.json({ setupIntentId: null, clientSecret: null });
    }
    
    // For actual team IDs, check the database (placeholder for now)
    // Since we're dealing with temp IDs during registration, this will mostly return null
    return res.json({ setupIntentId: null, clientSecret: null });
  } catch (error) {
    console.error('Error checking existing setup intent:', error);
    res.status(500).json({ error: 'Failed to check existing setup intent' });
  }
});

// Server-side cache to prevent duplicate Setup Intent creation
const setupIntentCache = new Map<string, { setupIntentId: string, clientSecret: string, timestamp: number }>();

// Create a setup intent (collect payment info without charging)
router.post('/create-setup-intent', async (req, res) => {
  try {
    const { teamId, metadata } = req.body;
    
    if (!teamId) {
      return res.status(400).json({ error: 'TeamId is required' });
    }
    
    // Check server-side cache to prevent duplicate creation within 5 minutes
    const cacheKey = teamId.toString();
    const cached = setupIntentCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
      console.log(`🔄 SERVER: Reusing cached setup intent for team ${teamId}: ${cached.setupIntentId}`);
      return res.json({
        clientSecret: cached.clientSecret,
        setupIntentId: cached.setupIntentId
      });
    }
    
    const result = await createSetupIntent(teamId, metadata);
    
    // Cache the result on server side
    setupIntentCache.set(cacheKey, {
      setupIntentId: result.setupIntentId,
      clientSecret: result.clientSecret,
      timestamp: Date.now()
    });
    
    console.log(`💾 SERVER: Cached setup intent for team ${teamId}: ${result.setupIntentId}`);
    res.json(result);
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process payment for an approved team using saved payment method
router.post('/process-approved-payment', async (req, res) => {
  try {
    const { teamId, amount } = req.body;
    
    if (!teamId || !amount) {
      return res.status(400).json({ error: 'TeamId and amount are required' });
    }
    
    const result = await processPaymentForApprovedTeam(Number(teamId), Number(amount));
    res.json(result);
  } catch (error: any) {
    console.error('Error processing payment for approved team:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get setup intent status
router.get('/setup-status/:setupIntentId', async (req, res) => {
  try {
    const { setupIntentId } = req.params;
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    res.json({
      status: setupIntent.status,
      paymentMethod: setupIntent.payment_method,
      metadata: setupIntent.metadata,
    });
  } catch (error: any) {
    console.error('Error retrieving setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment method details
router.get('/payment-method/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    
    // Retrieve the payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Return masked payment information only (last4, brand, etc)
    // Never return full card details
    res.json({
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      } : null,
      created: paymentMethod.created,
    });
  } catch (error: any) {
    console.error('Error retrieving payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update setup intent status in database (prevents payment_failed status sync issues)
router.post('/update-setup-status', async (req, res) => {
  try {
    const { teamId, setupIntentId, paymentMethodId, status } = req.body;
    
    if (!teamId || !setupIntentId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`🔄 Updating payment status for team ${teamId} to ${status}`);
    
    // Only update real teams (not temp IDs)
    if (typeof teamId === 'number' || !teamId.toString().startsWith('temp-')) {
      const { db } = await import('../db');
      const { teams } = await import('../db/schema');
      const { eq } = await import('drizzle-orm');
      
      const numericTeamId = typeof teamId === 'number' ? teamId : parseInt(teamId.toString());
      
      const updateData: any = {
        paymentStatus: status,
        setupIntentId: setupIntentId
      };
      
      if (paymentMethodId) {
        updateData.paymentMethodId = paymentMethodId;
      }
      
      await db.update(teams)
        .set(updateData)
        .where(eq(teams.id, numericTeamId));
      
      console.log(`✅ Updated team ${numericTeamId} payment status to ${status}`);
      res.json({ success: true, message: 'Payment status updated successfully' });
    } else {
      res.json({ success: true, message: 'Temporary team - no database update needed' });
    }
  } catch (error: any) {
    console.error('Error updating setup intent status:', error);
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
      case 'setup_intent.succeeded':
        await handleSetupIntentSuccess(event.data.object as Stripe.SetupIntent);
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
    const { paymentIntentId, setupIntentId } = req.body;
    
    if (paymentIntentId) {
      // Retrieve the payment intent to simulate a webhook event
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Simulate the webhook event handler
      await handlePaymentSuccess(paymentIntent);
      
      res.json({ success: true, message: 'Successfully simulated payment success webhook' });
    } else if (setupIntentId) {
      // Retrieve the setup intent to simulate a webhook event
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      // Simulate the webhook event handler
      await handleSetupIntentSuccess(setupIntent);
      
      res.json({ success: true, message: 'Successfully simulated setup intent success webhook' });
    } else {
      return res.status(400).json({ error: 'Either paymentIntentId or setupIntentId is required' });
    }
  } catch (error: any) {
    console.error('Error simulating webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to attach payment method to setup intent (test only)
router.post('/test-attach-payment-method', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in development' });
  }
  
  try {
    const { setupIntentId } = req.body;
    
    if (!setupIntentId) {
      return res.status(400).json({ error: 'Setup intent ID is required' });
    }
    
    const result = await attachTestPaymentMethodToSetupIntent(setupIntentId);
    res.json(result);
  } catch (error: any) {
    console.error('Error attaching test payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;