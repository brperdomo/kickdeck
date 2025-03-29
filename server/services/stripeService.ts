import Stripe from 'stripe';
import { log } from '../vite';

// Check if Stripe API key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

// Only initialize Stripe if we have an API key
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16', // Use the latest API version or specify one
  });
  log('Stripe initialized successfully', 'stripe');
} else {
  console.warn('STRIPE_SECRET_KEY not found in environment variables. Stripe functionality will be disabled.');
}

export interface PaymentIntentParams {
  amount: number; // Amount in cents
  currency?: string; // Default: 'usd'
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Create a payment intent for processing payments
 */
export async function createPaymentIntent(params: PaymentIntentParams) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }

    const { amount, currency = 'usd', description, metadata = {} } = params;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata,
      // Setting to true for automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  } catch (error) {
    log(`Error creating payment intent: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Retrieve a payment intent by ID
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    log(`Error retrieving payment intent: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Update a payment intent status to simulate successful payment
 * Only used for testing purposes
 */
export async function updatePaymentIntentStatus(paymentIntentId: string, status: 'succeeded') {
  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }
    
    // In real Stripe, we can't directly update status, but we can mimic it via test mode
    const updated = await stripe.paymentIntents.update(
      paymentIntentId,
      { metadata: { test_status_simulation: status } }
    );
    
    // For test accounts, this additional call would confirm and mark as succeeded
    // This will only work in test mode with test keys
    const confirmed = await stripe.paymentIntents.confirm(
      paymentIntentId,
      { payment_method: 'pm_card_visa' } // Using a test payment method
    );
    
    log(`Updated payment intent ${paymentIntentId} to status: ${status}`, 'stripe');
    return confirmed;
  } catch (error) {
    log(`Error updating payment intent status: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Create a new customer in Stripe
 */
export async function createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }
    
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  } catch (error) {
    log(`Error creating customer: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Process a refund for a payment
 */
export async function createRefund(paymentIntentId: string, reason?: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    }
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        reason: reason || 'Requested by administrator'
      }
    });
    
    log(`Created refund for payment intent ${paymentIntentId}`, 'stripe');
    return refund;
  } catch (error) {
    log(`Error processing refund: ${error}`, 'stripe');
    throw error;
  }
}