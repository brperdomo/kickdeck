/**
 * Payment Completion Routes
 * 
 * Handles secure payment completion links for teams that registered
 * without completing payment setup.
 */

import { Router } from 'express';
import { db } from '@db';
import { teams, events, eventAgeGroups } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { createSetupIntent } from '../services/stripeService';
import crypto from 'crypto';

const router = Router();

// Generate secure payment completion token
function generatePaymentToken(teamId: number): string {
  const secret = process.env.PAYMENT_COMPLETION_SECRET || 'fallback-secret-key';
  const timestamp = Date.now();
  const data = `${teamId}-${timestamp}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${teamId}.${timestamp}.${hash}`;
}

// Verify payment completion token
function verifyPaymentToken(token: string): { teamId: number; isValid: boolean } {
  try {
    const [teamIdStr, timestampStr, hash] = token.split('.');
    const teamId = parseInt(teamIdStr);
    const timestamp = parseInt(timestampStr);
    
    // Check if token is expired (24 hours)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > maxAge) {
      return { teamId, isValid: false };
    }
    
    // Verify hash
    const secret = process.env.PAYMENT_COMPLETION_SECRET || 'fallback-secret-key';
    const data = `${teamId}-${timestamp}`;
    const expectedHash = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    const isValid = hash === expectedHash;
    return { teamId, isValid };
  } catch (error) {
    return { teamId: 0, isValid: false };
  }
}

// Generate payment completion link for a team
router.post('/generate-payment-link/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    // Verify team exists and needs payment completion
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        paymentMethodId: teams.paymentMethodId,
        setupIntentId: teams.setupIntentId,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail
      })
      .from(teams)
      .where(eq(teams.id, teamId));
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.totalAmount <= 0) {
      return res.status(400).json({ error: 'Team has no payment required' });
    }
    
    if (team.paymentMethodId) {
      return res.status(400).json({ error: 'Team has already completed payment setup' });
    }
    
    // Generate secure token
    const token = generatePaymentToken(teamId);
    const baseUrl = process.env.FRONTEND_URL || 'https://app.matchpro.ai';
    const completionUrl = `${baseUrl}/complete-payment/${token}`;
    
    res.json({
      teamId,
      teamName: team.name,
      amount: team.totalAmount,
      completionUrl,
      expiresIn: '24 hours'
    });
    
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

// Validate payment completion token and get team info
router.get('/validate-token/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const { teamId, isValid } = verifyPaymentToken(token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired payment token' });
    }
    
    // Get team and event information
    const [teamInfo] = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        totalAmount: teams.totalAmount,
        paymentMethodId: teams.paymentMethodId,
        setupIntentId: teams.setupIntentId,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail,
        eventName: events.name,
        eventId: teams.eventId,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(teams.id, teamId));
    
    if (!teamInfo) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (teamInfo.paymentMethodId) {
      return res.status(400).json({ 
        error: 'Payment already completed',
        message: 'This team has already completed payment setup'
      });
    }
    
    res.json({
      valid: true,
      team: {
        id: teamInfo.teamId,
        name: teamInfo.teamName,
        amount: teamInfo.totalAmount,
        eventName: teamInfo.eventName,
        ageGroup: `${teamInfo.ageGroup} ${teamInfo.gender}`,
        hasExistingSetupIntent: !!teamInfo.setupIntentId
      }
    });
    
  } catch (error) {
    console.error('Error validating payment token:', error);
    res.status(500).json({ error: 'Failed to validate payment token' });
  }
});

// Complete payment setup for a team using token
router.post('/complete-payment/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const { teamId, isValid } = verifyPaymentToken(token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired payment token' });
    }
    
    // Get team information
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        paymentMethodId: teams.paymentMethodId,
        setupIntentId: teams.setupIntentId,
        stripeCustomerId: teams.stripeCustomerId,
        eventId: teams.eventId
      })
      .from(teams)
      .where(eq(teams.id, teamId));
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.paymentMethodId) {
      return res.status(400).json({ 
        error: 'Payment already completed',
        message: 'This team has already completed payment setup'
      });
    }
    
    // Create or reuse setup intent
    let setupIntentResult;
    
    if (team.setupIntentId) {
      // Check if existing setup intent is still usable
      const stripe = (await import('stripe')).default;
      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });
      
      try {
        const existingSetupIntent = await stripeInstance.setupIntents.retrieve(team.setupIntentId);
        
        if (existingSetupIntent.status === 'requires_payment_method') {
          // Reuse existing setup intent
          setupIntentResult = {
            setupIntentId: existingSetupIntent.id,
            clientSecret: existingSetupIntent.client_secret
          };
        } else {
          // Create new setup intent
          setupIntentResult = await createSetupIntent(teamId, {
            replaceExisting: 'true',
            tokenCompletion: 'true'
          });
        }
      } catch (error) {
        // Create new setup intent if existing one is invalid
        setupIntentResult = await createSetupIntent(teamId, {
          replaceExisting: 'true',
          tokenCompletion: 'true'
        });
      }
    } else {
      // Create new setup intent
      setupIntentResult = await createSetupIntent(teamId, {
        tokenCompletion: 'true'
      });
    }
    
    // Update team with new setup intent if created
    if (setupIntentResult.setupIntentId !== team.setupIntentId) {
      await db.update(teams)
        .set({
          setupIntentId: setupIntentResult.setupIntentId,
          paymentStatus: 'payment_info_pending'
        })
        .where(eq(teams.id, teamId));
    }
    
    res.json({
      success: true,
      clientSecret: setupIntentResult.clientSecret,
      setupIntentId: setupIntentResult.setupIntentId,
      teamName: team.name,
      amount: team.totalAmount
    });
    
  } catch (error) {
    console.error('Error completing payment setup:', error);
    res.status(500).json({ 
      error: 'Failed to setup payment',
      message: 'Please try again or contact support'
    });
  }
});

// Get all teams needing payment completion
router.get('/teams-needing-payment', async (req, res) => {
  try {
    const teamsNeedingPayment = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail,
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        status: teams.status,
        paymentStatus: teams.paymentStatus
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          isNull(teams.paymentMethodId),
          sql`${teams.totalAmount} > 0`
        )
      );
    
    const teamsWithLinks = teamsNeedingPayment.map(team => {
      const token = generatePaymentToken(team.id);
      const baseUrl = process.env.FRONTEND_URL || 'https://app.matchpro.ai';
      
      return {
        ...team,
        completionUrl: `${baseUrl}/complete-payment/${token}`,
        contactEmail: team.submitterEmail || team.managerEmail
      };
    });
    
    res.json({
      teams: teamsWithLinks,
      totalAmount: teamsNeedingPayment.reduce((sum, team) => sum + (team.totalAmount || 0), 0)
    });
    
  } catch (error) {
    console.error('Error fetching teams needing payment:', error);
    res.status(500).json({ error: 'Failed to fetch teams needing payment' });
  }
});

export default router;