/**
 * Event Stripe Connect API Routes
 * 
 * These routes handle the Stripe Connect integration for events/tournaments
 * to receive payments directly to their bank accounts.
 */

import express, { Request, Response } from 'express';
import {
  createEventConnectAccount,
  generateEventAccountLink,
  generateEventDashboardLink,
  getEventAccountStatus
} from '../services/eventStripeConnectService';

const router = express.Router();

// Middleware to validate event access and permissions
// In a real implementation, this would check if the user is an admin or has permission for this event
const validateEventAccess = async (req: Request, res: Response, next: Function) => {
  // Check if user has admin access to this event
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ message: 'You do not have permission to access this resource' });
  }
  next();
};

/**
 * Create a Stripe Connect account for an event
 * POST /api/events/:eventId/stripe-connect
 */
router.post('/:eventId/stripe-connect', validateEventAccess, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { businessType } = req.body;
    
    if (!businessType || (businessType !== 'individual' && businessType !== 'company')) {
      return res.status(400).json({ message: 'Invalid business type. Must be "individual" or "company".' });
    }
    
    const result = await createEventConnectAccount(eventId, businessType);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to create Stripe Connect account'
    });
  }
});

/**
 * Get the status of an event's Stripe Connect account
 * GET /api/events/:eventId/stripe-connect/status
 */
router.get('/:eventId/stripe-connect/status', validateEventAccess, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const status = await getEventAccountStatus(eventId);
    
    res.json(status);
  } catch (error) {
    console.error('Error getting Stripe Connect status:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get Stripe Connect status'
    });
  }
});

/**
 * Generate a new account link for onboarding
 * POST /api/events/:eventId/stripe-connect/account-link
 */
router.post('/:eventId/stripe-connect/account-link', validateEventAccess, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const result = await generateEventAccountLink(eventId);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating account link:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate account link'
    });
  }
});

/**
 * Generate a dashboard login link
 * GET /api/events/:eventId/stripe-connect/dashboard-link
 */
router.get('/:eventId/stripe-connect/dashboard-link', validateEventAccess, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const result = await generateEventDashboardLink(eventId);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating dashboard link:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate dashboard link'
    });
  }
});

export default router;