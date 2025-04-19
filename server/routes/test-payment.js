/**
 * Test Payment Routes
 * 
 * This file contains test routes for simulating payment processes in a development environment.
 * These routes are not available in production.
 */

import { createTestPaymentIntent as createTestIntent, handlePaymentSuccess } from '../services/stripeService.js';

/**
 * Creates a test payment intent for development purposes
 */
export const createTestPaymentIntent = async (req, res) => {
  try {
    const { amount, teamId, metadata } = req.body;
    
    if (!amount || !teamId) {
      return res.status(400).json({ error: 'Amount and teamId are required' });
    }
    
    const result = await createTestIntent(amount, teamId, metadata);
    res.json(result);
  } catch (error) {
    console.error('Error creating test payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Simulates a payment webhook event for testing
 */
export const simulatePaymentWebhook = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    // Simulate payment success webhook
    await handlePaymentSuccess({ 
      id: paymentIntentId,
      metadata: {
        teamId: req.body.teamId || '1' // Default to team ID 1 if not provided
      }
    });
    
    res.json({ success: true, message: 'Simulated payment success webhook' });
  } catch (error) {
    console.error('Error simulating payment webhook:', error);
    res.status(500).json({ error: error.message });
  }
};