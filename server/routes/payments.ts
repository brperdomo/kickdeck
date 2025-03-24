import { Request, Response } from 'express';
import { log } from '../vite';
import { createPaymentIntent, retrievePaymentIntent } from '../services/stripeService';
import { z } from 'zod';
import { db } from '../../db';
import { teams, eventAgeGroups } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Validate payment intent creation request
const createPaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('usd').optional(),
  description: z.string().optional(),
  eventId: z.string(),
  teamId: z.number().optional(),
  ageGroupId: z.number()
});

/**
 * Create a Stripe payment intent
 */
export async function createStripePaymentIntent(req: Request, res: Response) {
  try {
    const validation = createPaymentIntentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request parameters', 
        details: validation.error.errors 
      });
    }

    const { amount, currency, description, eventId, teamId, ageGroupId } = validation.data;

    // Verify age group exists for this event
    const ageGroup = await db.query.eventAgeGroups.findFirst({
      where: eq(eventAgeGroups.id, ageGroupId)
    });

    if (!ageGroup) {
      return res.status(404).json({ error: 'Age group not found' });
    }
    
    // Create metadata for the payment intent
    const metadata = {
      eventId,
      ageGroupId: ageGroupId.toString(),
      userId: req.user?.id.toString() || '',
    };
    
    if (teamId) {
      metadata.teamId = teamId.toString();
    }

    // Create the payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      description: description || `Registration for Event #${eventId}`,
      metadata
    });

    res.status(200).json(paymentIntent);
  } catch (error) {
    log(`Error creating payment intent: ${error}`, 'payment');
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}

/**
 * Get payment intent status
 */
export async function getPaymentIntentStatus(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    
    res.status(200).json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    log(`Error retrieving payment intent: ${error}`, 'payment');
    res.status(500).json({ error: 'Failed to retrieve payment intent status' });
  }
}

/**
 * Handle webhook events from Stripe
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // For now, just log that we received a webhook
  // In a production app, you'd validate the signature and process the event
  log('Received Stripe webhook event', 'payment');
  
  res.status(200).json({ received: true });
}