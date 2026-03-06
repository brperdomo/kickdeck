import express from 'express';
import { Request, Response } from 'express';
import { processConnectAccountRefund, getRefundStatus, listTournamentRefunds } from '../../services/connectAccountRefundService';
import { db } from 'db';
import { teams, events } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * CONNECT ACCOUNT REFUND ROUTES
 * 
 * All refunds processed directly on tournament Connect accounts to guarantee:
 * 1. Tournament organizers pay refunds (not KickDeck)
 * 2. Complete refund visibility in Connect dashboards
 * 3. Full metadata for easy refund management
 */

/**
 * POST /api/admin/connect-refunds/process
 * Process a refund directly on the tournament's Connect account
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { teamId, amount, reason, notes } = req.body;

    if (!teamId) {
      return res.status(400).json({
        error: 'Team ID is required'
      });
    }

    console.log(`🔄 Admin refund request for team ${teamId}`);

    // Get admin user ID from session if available
    const adminId = (req.session as any)?.user?.id;

    const result = await processConnectAccountRefund({
      teamId: parseInt(teamId),
      amount: amount ? parseInt(amount) : undefined,
      reason: reason || 'Admin refund request',
      adminId: adminId,
      notes: notes
    });

    if (result.success) {
      console.log(`✅ Refund successful: ${result.refundId} for $${result.amount / 100}`);
      
      res.json({
        success: true,
        message: 'Refund processed successfully on tournament Connect account',
        refund: {
          id: result.refundId,
          amount: result.amount,
          connectAccountId: result.connectAccountId,
          teamName: result.metadata.teamName,
          eventName: result.metadata.eventName,
        }
      });
    } else {
      console.error(`❌ Refund failed: ${result.error}`);
      
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Refund failed - see error details'
      });
    }

  } catch (error: any) {
    console.error('Connect refund route error:', error);
    res.status(500).json({
      error: 'Internal server error processing refund',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/connect-refunds/status/:teamId
 * Get refund status for a specific team
 */
router.get('/status/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({
        error: 'Valid team ID is required'
      });
    }

    const status = await getRefundStatus(teamId);
    
    res.json({
      teamId: teamId,
      ...status
    });

  } catch (error: any) {
    console.error('Get refund status error:', error);
    res.status(500).json({
      error: 'Failed to get refund status',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/connect-refunds/tournament/:eventId
 * List all refunds for a tournament
 */
router.get('/tournament/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (!eventId) {
      return res.status(400).json({
        error: 'Valid event ID is required'
      });
    }

    // Verify event exists and get Connect account info
    const event = await db
      .select({
        id: events.id,
        name: events.name,
        stripeConnectAccountId: events.stripeConnectAccountId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event[0]) {
      return res.status(404).json({
        error: 'Tournament not found'
      });
    }

    if (!event[0].stripeConnectAccountId) {
      return res.status(400).json({
        error: 'Tournament does not have Connect account configured'
      });
    }

    const refunds = await listTournamentRefunds(eventId);
    
    res.json({
      event: {
        id: event[0].id,
        name: event[0].name,
        connectAccountId: event[0].stripeConnectAccountId,
      },
      refunds: refunds,
      summary: {
        totalRefunds: refunds.length,
        totalRefundAmount: refunds.reduce((sum, r) => sum + r.refundAmount, 0),
      }
    });

  } catch (error: any) {
    console.error('List tournament refunds error:', error);
    res.status(500).json({
      error: 'Failed to list tournament refunds',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/connect-refunds/team-details/:teamId
 * Get complete team and refund details for admin interface
 */
router.get('/team-details/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({
        error: 'Valid team ID is required'
      });
    }

    // Get team details with event info
    const teamData = await db
      .select({
        team: {
          id: teams.id,
          name: teams.name,
          paymentStatus: teams.paymentStatus,
          totalAmount: teams.totalAmount,
          paymentIntentId: teams.paymentIntentId,
          managerEmail: teams.managerEmail,
          refundAmount: teams.refundAmount,
          refundDate: teams.refundDate,
          refundReason: teams.refundReason,
        },
        event: {
          id: events.id,
          name: events.name,
          stripeConnectAccountId: events.stripeConnectAccountId,
        }
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!teamData[0]) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    const { team, event } = teamData[0];

    // Get refund status
    const refundStatus = await getRefundStatus(teamId);

    res.json({
      team: {
        id: team.id,
        name: team.name,
        paymentStatus: team.paymentStatus,
        totalAmount: team.totalAmount,
        paymentIntentId: team.paymentIntentId,
        managerEmail: team.managerEmail,
        canRefund: team.paymentStatus === 'paid' || team.paymentStatus === 'approved',
      },
      event: {
        id: event?.id,
        name: event?.name,
        hasConnectAccount: !!event?.stripeConnectAccountId,
        connectAccountId: event?.stripeConnectAccountId,
      },
      refund: refundStatus,
      refundCapabilities: {
        fullRefundAmount: team.totalAmount || 0,
        canProcessRefund: !!(event?.stripeConnectAccountId && team.paymentIntentId && (team.paymentStatus === 'paid' || team.paymentStatus === 'approved')),
        hasExistingRefund: refundStatus.hasRefund,
      }
    });

  } catch (error: any) {
    console.error('Get team refund details error:', error);
    res.status(500).json({
      error: 'Failed to get team refund details',
      message: error.message
    });
  }
});

export default router;