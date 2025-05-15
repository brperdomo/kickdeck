/**
 * Stripe Connect API Routes
 * 
 * These endpoints handle Stripe Connect account management for clubs
 * and organizations.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { clubs, SelectClub } from '@db/schema';
import { isAdmin } from '../middleware';
import { 
  createConnectAccount, 
  generateAccountLink,
  generateDashboardLoginLink,
  getConnectAccount
} from '../services/stripeConnectService';

// Extended request type to include club
interface ClubRequest extends Request {
  club?: SelectClub;
}

const router = Router();

// Middleware to ensure club exists and belongs to the right organization
const validateClub = async (req: ClubRequest, res: Response, next: NextFunction) => {
  try {
    const clubId = parseInt(req.params.clubId);
    
    if (isNaN(clubId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }
    
    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);
    
    if (!club) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found' 
      });
    }
    
    // Store club in request for route handlers
    req.club = club;
    next();
    
  } catch (error) {
    console.error('Club validation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/**
 * Create a Stripe Connect account for a club
 * POST /api/clubs/:clubId/stripe-connect
 */
router.post('/:clubId/stripe-connect', isAdmin, validateClub, async (req: ClubRequest, res: Response) => {
  try {
    const { club } = req;
    const { businessType } = req.body;
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if club already has a Connect account
    if (club.stripeConnectAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Club already has a Stripe Connect account'
      });
    }
    
    // Create a Connect account
    const accountId = await createConnectAccount(
      club.id,
      club.email || '',
      club.name,
      businessType as 'individual' | 'company'
    );
    
    // Get base URL for links
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Generate account link for onboarding
    const accountLinkUrl = await generateAccountLink(
      accountId,
      `${baseUrl}/admin/clubs/${club.id}/connect-refresh`,
      `${baseUrl}/admin/clubs/${club.id}/connect-return`
    );
    
    return res.json({
      success: true,
      accountId,
      accountLinkUrl
    });
    
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Stripe Connect account'
    });
  }
});

/**
 * Get Stripe Connect account status
 * GET /api/clubs/:clubId/stripe-connect/status
 */
router.get('/:clubId/stripe-connect/status', isAdmin, validateClub, async (req: ClubRequest, res: Response) => {
  try {
    const { club } = req;
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if club has a Connect account
    if (!club.stripeConnectAccountId) {
      return res.json({
        success: true,
        hasConnectAccount: false
      });
    }
    
    // Get account details from Stripe
    const account = await getConnectAccount(club.stripeConnectAccountId);
    
    return res.json({
      success: true,
      hasConnectAccount: true,
      connectAccountId: club.stripeConnectAccountId,
      accountStatus: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements
      }
    });
    
  } catch (error) {
    console.error('Error getting Stripe Connect account status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get Stripe Connect account status'
    });
  }
});

/**
 * Generate a fresh account link for onboarding
 * POST /api/clubs/:clubId/stripe-connect/account-link
 */
router.post('/:clubId/stripe-connect/account-link', isAdmin, validateClub, async (req: ClubRequest, res: Response) => {
  try {
    const { club } = req;
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if club has a Connect account
    if (!club.stripeConnectAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Club does not have a Stripe Connect account'
      });
    }
    
    // Get base URL for links
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Generate account link for onboarding
    const accountLinkUrl = await generateAccountLink(
      club.stripeConnectAccountId,
      `${baseUrl}/admin/clubs/${club.id}/connect-refresh`,
      `${baseUrl}/admin/clubs/${club.id}/connect-return`
    );
    
    return res.json({
      success: true,
      accountLinkUrl
    });
    
  } catch (error) {
    console.error('Error generating account link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate account link'
    });
  }
});

/**
 * Generate a Stripe dashboard login link
 * GET /api/clubs/:clubId/stripe-connect/dashboard-link
 */
router.get('/:clubId/stripe-connect/dashboard-link', isAdmin, validateClub, async (req: ClubRequest, res: Response) => {
  try {
    const { club } = req;
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if club has a Connect account
    if (!club.stripeConnectAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Club does not have a Stripe Connect account'
      });
    }
    
    // Generate dashboard login link
    const dashboardLink = await generateDashboardLoginLink(club.stripeConnectAccountId);
    
    return res.json({
      success: true,
      dashboardLink
    });
    
  } catch (error) {
    console.error('Error generating dashboard link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard link'
    });
  }
});

export default router;