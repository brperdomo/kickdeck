import { Request, Response } from 'express';
import { log } from '../vite';
import { createPaymentIntent, updatePaymentIntentStatus } from '../services/stripeService';
import { teams } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';

/**
 * Test endpoint to create a payment intent for testing
 */
export async function createTestPaymentIntent(req: Request, res: Response) {
  try {
    const { amount = 2500, teamId } = req.body;
    
    if (!teamId) {
      return res.status(400).json({ error: 'teamId is required' });
    }
    
    // Verify the team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Create metadata for the payment intent
    const metadata = {
      teamId: String(teamId),
      eventId: team.eventId,
      description: 'Test payment for team registration'
    };
    
    // Create the payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      description: `Test Payment for Team: ${team.name}`,
      metadata
    });
    
    log(`Created test payment intent: ${paymentIntent.id} for team: ${teamId}`, 'test-payment');
    
    return res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating test payment intent:', error);
    return res.status(500).json({
      error: 'Failed to create test payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test endpoint to simulate a successful webhook event
 */
export async function simulatePaymentWebhook(req: Request, res: Response) {
  try {
    const { paymentIntentId, teamId } = req.body;
    
    if (!paymentIntentId || !teamId) {
      return res.status(400).json({ error: 'paymentIntentId and teamId are required' });
    }
    
    // Update the team record to simulate successful payment
    await db
      .update(teams)
      .set({
        status: 'paid',
        registrationFee: 2500, // $25.00 in cents
        paymentIntentId: paymentIntentId, // Store the payment intent ID
        cardBrand: 'visa', // Mock card brand (typically visa for test cards)
        cardLastFour: '4242', // Mock last 4 digits for test card 4242424242424242
        paymentMethodType: 'card', // Set payment method type
        paymentDate: new Date(), // Record payment date
        notes: `Test payment completed. Payment ID: ${paymentIntentId}`,
        termsAcknowledged: true,
        termsAcknowledgedAt: new Date()
      })
      .where(eq(teams.id, Number(teamId)));
    
    // Update the Stripe payment intent status to succeeded (for test purposes only)
    try {
      await updatePaymentIntentStatus(paymentIntentId, 'succeeded');
      log(`Updated Stripe payment intent ${paymentIntentId} to succeeded status`, 'test-payment');
    } catch (stripeError) {
      log(`Warning: Could not update Stripe payment intent status: ${stripeError}`, 'test-payment');
      // Continue even if Stripe update fails - we've updated our database already
    }
    
    log(`Simulated successful payment for team ${teamId} with payment ID: ${paymentIntentId}`, 'test-payment');
    
    return res.json({
      success: true,
      message: 'Payment simulation completed successfully',
      teamId,
      paymentIntentId
    });
  } catch (error) {
    console.error('Error simulating payment webhook:', error);
    return res.status(500).json({
      error: 'Failed to simulate payment webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}