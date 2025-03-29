import Stripe from 'stripe';
import { log } from '../vite';

// Check if Stripe API key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Only initialize Stripe if we have an API key
if (stripeSecretKey) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16', // Use the latest API version or specify one
    });
    log('Stripe initialized successfully', 'stripe');
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    stripe = null;
  }
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
 * Fallback response for when Stripe is not available
 * This helps prevent the application from crashing in production
 */
function getStripeUnavailableResponse() {
  return {
    id: 'stripe_unavailable',
    clientSecret: 'stripe_unavailable',
    status: 'not_available',
    amount: 0,
    message: 'Stripe payment processing is currently unavailable. Please contact support.'
  };
}

/**
 * Create a payment intent for processing payments
 */
export async function createPaymentIntent(params: PaymentIntentParams) {
  try {
    if (!stripe) {
      const errorMsg = 'Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.';
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error('Payment processing unavailable in production - missing Stripe API key');
        return getStripeUnavailableResponse();
      }
    }

    const { amount, currency = 'usd', description, metadata = {} } = params;
    
    if (!params || typeof amount !== 'number' || amount <= 0) {
      const errorMsg = `Invalid payment parameters: amount must be a positive number, received: ${amount}`;
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error(errorMsg);
        return getStripeUnavailableResponse();
      }
    }
    
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
      status: paymentIntent.status,
      amount: paymentIntent.amount
    };
  } catch (error) {
    log(`Error creating payment intent: ${error}`, 'stripe');
    
    if (isDevelopment) {
      throw error;
    } else {
      console.error('Failed to create payment intent in production:', error);
      return getStripeUnavailableResponse();
    }
  }
}

/**
 * Retrieve a payment intent by ID
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    if (!stripe) {
      const errorMsg = 'Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.';
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error('Payment retrieval unavailable in production - missing Stripe API key');
        return getStripeUnavailableResponse();
      }
    }
    
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      const errorMsg = `Invalid payment intent ID: ${paymentIntentId}`;
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error(errorMsg);
        return getStripeUnavailableResponse();
      }
    }
    
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    log(`Error retrieving payment intent: ${error}`, 'stripe');
    
    if (isDevelopment) {
      throw error;
    } else {
      console.error('Failed to retrieve payment intent in production:', error);
      return getStripeUnavailableResponse();
    }
  }
}

/**
 * Update a payment intent status to simulate successful payment
 * Only used for testing purposes
 */
export async function updatePaymentIntentStatus(paymentIntentId: string, status: 'succeeded') {
  try {
    if (!stripe) {
      const errorMsg = 'Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.';
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error('Payment status update unavailable in production - missing Stripe API key');
        return getStripeUnavailableResponse();
      }
    }
    
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      const errorMsg = `Invalid payment intent ID: ${paymentIntentId}`;
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error(errorMsg);
        return getStripeUnavailableResponse();
      }
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
    
    if (isDevelopment) {
      throw error;
    } else {
      console.error('Failed to update payment intent status in production:', error);
      return getStripeUnavailableResponse();
    }
  }
}

/**
 * Create a new customer in Stripe
 */
export async function createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  try {
    if (!stripe) {
      const errorMsg = 'Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.';
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error('Customer creation unavailable in production - missing Stripe API key');
        return { id: 'stripe_unavailable', email, name, object: 'customer' };
      }
    }
    
    if (!email || typeof email !== 'string') {
      const errorMsg = `Invalid customer email: ${email}`;
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error(errorMsg);
        return { id: 'stripe_unavailable', email: 'unavailable', name, object: 'customer' };
      }
    }
    
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  } catch (error) {
    log(`Error creating customer: ${error}`, 'stripe');
    
    if (isDevelopment) {
      throw error;
    } else {
      console.error('Failed to create customer in production:', error);
      return { id: 'stripe_unavailable', email, name, object: 'customer' };
    }
  }
}

/**
 * Process a refund for a payment
 */
export async function createRefund(paymentIntentId: string, reason?: string) {
  try {
    if (!stripe) {
      const errorMsg = 'Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.';
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error('Refund processing unavailable in production - missing Stripe API key');
        return { 
          id: 'stripe_unavailable', 
          object: 'refund',
          status: 'failed',
          payment_intent: paymentIntentId,
          amount: 0
        };
      }
    }
    
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      const errorMsg = `Invalid payment intent ID for refund: ${paymentIntentId}`;
      log(errorMsg, 'stripe');
      
      if (isDevelopment) {
        throw new Error(errorMsg);
      } else {
        console.error(errorMsg);
        return { 
          id: 'stripe_unavailable', 
          object: 'refund',
          status: 'failed',
          payment_intent: paymentIntentId,
          amount: 0
        };
      }
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
    
    if (isDevelopment) {
      throw error;
    } else {
      console.error('Failed to process refund in production:', error);
      return { 
        id: 'stripe_unavailable', 
        object: 'refund',
        status: 'failed',
        payment_intent: paymentIntentId,
        amount: 0
      };
    }
  }
}