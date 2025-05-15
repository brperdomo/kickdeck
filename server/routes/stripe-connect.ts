/**
 * Stripe Connect API Routes
 * 
 * These routes handle the Stripe Connect integration for clubs
 * to receive payments directly to their bank accounts.
 */

import express, { Request, Response } from 'express';
import {
  createConnectAccount,
  generateClubAccountLink,
  generateDashboardLink,
  getAccountStatus
} from '../services/stripeConnectService';

const router = express.Router();

// Middleware to validate club ownership and permissions
// This is a placeholder - you should implement proper authorization
const validateClubAccess = async (req: Request, res: Response, next: Function) => {
  // In a real implementation, check if the user has permission to access this club
  // For now, we'll just pass through
  next();
};

/**
 * Create a Stripe Connect account for a club
 * POST /api/clubs/:clubId/stripe-connect
 */
router.post('/:clubId/stripe-connect', validateClubAccess, async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const { businessType } = req.body;
    
    if (!businessType || (businessType !== 'individual' && businessType !== 'company')) {
      return res.status(400).json({ message: 'Invalid business type. Must be "individual" or "company".' });
    }
    
    const result = await createConnectAccount(clubId, businessType);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to create Stripe Connect account'
    });
  }
});

/**
 * Get the status of a club's Stripe Connect account
 * GET /api/clubs/:clubId/stripe-connect/status
 */
router.get('/:clubId/stripe-connect/status', validateClubAccess, async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const status = await getAccountStatus(clubId);
    
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
 * POST /api/clubs/:clubId/stripe-connect/account-link
 */
router.post('/:clubId/stripe-connect/account-link', validateClubAccess, async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const result = await generateClubAccountLink(clubId);
    
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
 * GET /api/clubs/:clubId/stripe-connect/dashboard-link
 */
router.get('/:clubId/stripe-connect/dashboard-link', validateClubAccess, async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.clubId);
    const result = await generateDashboardLink(clubId);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating dashboard link:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate dashboard link'
    });
  }
});

export default router;