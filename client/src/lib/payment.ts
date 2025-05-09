import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Initializes the Stripe instance with the provided API key
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      console.error('Stripe public key is missing');
      return Promise.reject('Stripe public key is missing');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/**
 * Creates a payment intent through the API
 * @param amount The amount to charge in dollars (will be converted to cents)
 * @param teamId The ID of the team being registered
 * @param metadata Additional metadata to include with the payment
 */
export async function createPaymentIntent(amount: number, teamId: number, metadata: Record<string, string> = {}) {
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        teamId,
        metadata
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Creates a setup intent for collecting payment information without charging
 * This is used for the "collect now, charge later" approach
 * @param teamId The ID of the team being registered
 * @param metadata Additional metadata to include with the setup intent
 */
export async function createSetupIntent(teamId: number, metadata: Record<string, string> = {}) {
  try {
    const response = await fetch('/api/payments/create-setup-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId,
        metadata
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create setup intent');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}

/**
 * Confirms a setup intent with the Stripe Elements
 * @param elements The Stripe Elements instance
 * @param clientSecret The setup intent client secret
 * @param returnUrl The URL to redirect to after setup is complete
 */
export async function confirmSetup(elements: StripeElements, clientSecret: string, returnUrl: string) {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }
  
  return await stripe.confirmSetup({
    elements,
    confirmParams: {
      return_url: returnUrl,
    },
  });
}

/**
 * Confirms a payment intent with the Stripe Elements
 * @param elements The Stripe Elements instance
 * @param clientSecret The payment intent client secret
 * @param returnUrl The URL to redirect to after payment
 */
export async function confirmPayment(elements: StripeElements, clientSecret: string, returnUrl: string) {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }
  
  return await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: returnUrl,
    },
  });
}

/**
 * Gets the payment configuration including publishable key
 */
export async function getPaymentConfig() {
  try {
    const response = await fetch('/api/payments/config');
    
    if (!response.ok) {
      throw new Error('Failed to get payment configuration');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting payment configuration:', error);
    throw error;
  }
}

/**
 * Gets a payment intent status
 * @param paymentIntentId The ID of the payment intent
 */
export async function getPaymentStatus(paymentIntentId: string) {
  try {
    const response = await fetch(`/api/payments/status/${paymentIntentId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
}

/**
 * Gets a setup intent status
 * @param setupIntentId The ID of the setup intent
 */
export async function getSetupStatus(setupIntentId: string) {
  try {
    const response = await fetch(`/api/payments/setup-status/${setupIntentId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get setup intent status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting setup intent status:', error);
    throw error;
  }
}