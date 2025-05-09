import { Request, Response } from 'express';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

/**
 * Create a general-purpose payment intent for standalone payments
 * This is used for payments that are not associated with a team registration
 */
export async function createGeneralPaymentIntent(req: Request, res: Response) {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount already in cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: "one-time-payment",
        customerId: req.user?.id?.toString() || "guest"
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ 
      error: error.message || "Failed to create payment intent" 
    });
  }
}