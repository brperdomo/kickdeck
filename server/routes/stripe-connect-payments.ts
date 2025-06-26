/**
 * Stripe Connect Payment Processing for Tournament Revenue Distribution
 * 
 * This module handles destination charges that route payments directly to
 * tournament-specific Connect accounts when teams are approved.
 */

import type { Express } from "express";
import Stripe from 'stripe';
import { db } from "@db";
import { teams, events, paymentTransactions } from "@db/schema";
import { eq, and } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

import { calculateEventFees, formatFeeCalculation } from "../services/fee-calculator";

// Note: Fee calculation is now handled by the fee-calculator service
// This supports configurable platform fees and volume discounts

/**
 * Processes a destination charge for a team registration
 * Routes payment to the tournament's Connect account with precise fee distribution
 */
export async function processDestinationCharge(
  teamId: number,
  eventId: string,
  paymentMethodId: string,
  totalAmountCents: number,
  connectAccountId: string,
  isPreCalculated: boolean = false
) {
  try {
    // Get team information for receipt email
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    let feeCalculation;
    
    if (isPreCalculated) {
      // Amount already includes platform fees, reverse-calculate the tournament cost
      // This handles the case where we're called from chargeApprovedTeam with pre-calculated totals
      const baseTournamentCost = team?.totalAmount || 0;
      feeCalculation = await calculateEventFees(eventId, baseTournamentCost);
      
      console.log('Using pre-calculated fee structure:', {
        teamId,
        eventId,
        totalAmountProvided: `$${(totalAmountCents / 100).toFixed(2)}`,
        baseTournamentCost: `$${(baseTournamentCost / 100).toFixed(2)}`,
        calculatedTotal: `$${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`
      });
    } else {
      // Calculate comprehensive fee breakdown using the enhanced calculator
      feeCalculation = await calculateEventFees(eventId, totalAmountCents);
      
      console.log('Fee calculation for team registration:', {
        teamId,
        eventId,
        tournamentCost: `$${(totalAmountCents / 100).toFixed(2)}`,
        breakdown: formatFeeCalculation(feeCalculation)
      });
    }
    
    // Validate calculation is balanced
    if (!feeCalculation.isBalanced) {
      throw new Error(`Fee calculation is not balanced: ${feeCalculation.totalAccounted} vs ${feeCalculation.totalChargedAmount}`);
    }
    
    // For pre-calculated amounts, use the provided total; otherwise use calculated total
    const chargeAmount = isPreCalculated ? totalAmountCents : feeCalculation.totalChargedAmount;
    
    // Create payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount, // Use the correct total amount
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      on_behalf_of: connectAccountId,
      receipt_email: team?.submitterEmail, // Enable Stripe's automatic receipt email
      transfer_data: {
        destination: connectAccountId,
        amount: feeCalculation.tournamentReceives, // Tournament gets their base amount
      },
      application_fee_amount: feeCalculation.platformFeeAmount, // MatchPro gets platform fee
      metadata: {
        teamId: teamId.toString(),
        eventId: eventId,
        connectAccountId: connectAccountId,
        type: 'team_registration',
        tournamentCost: totalAmountCents.toString(),
        platformFeeRate: feeCalculation.platformFeeRate.toString(),
        stripeFeeAmount: feeCalculation.stripeFeeAmount.toString()
      }
    });

    // Record comprehensive transaction in database with detailed fee breakdown
    await db.insert(paymentTransactions).values({
      teamId: teamId,
      eventId: eventId,
      paymentIntentId: paymentIntent.id,
      transactionType: 'payment',
      amount: chargeAmount, // Use the actual amount charged
      stripeFee: feeCalculation.stripeFeeAmount,
      netAmount: feeCalculation.tournamentReceives,
      status: paymentIntent.status,
      metadata: {
        tournamentCost: tournamentCostCents,
        platformFeeRate: feeCalculation.platformFeeRate,
        platformFeeAmount: feeCalculation.platformFeeAmount,
        connectAccountId: connectAccountId,
        feeCalculationBreakdown: feeCalculation
      },
      createdAt: new Date()
    });

    // Update team payment status
    await db.update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'payment_pending',
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null
      })
      .where(eq(teams.id, teamId));

    return {
      success: true,
      paymentIntent: paymentIntent,
      feeCalculation: feeCalculation,
      breakdown: {
        totalCharged: feeCalculation.totalChargedAmount,
        tournamentReceives: feeCalculation.tournamentReceives,
        platformFeeAmount: feeCalculation.platformFeeAmount,
        stripeFeeAmount: feeCalculation.stripeFeeAmount,
        matchproReceives: feeCalculation.matchproReceives
      }
    };

  } catch (error) {
    console.error('Error processing destination charge:', error);
    throw error;
  }
}

/**
 * Processes payment when a team is approved by tournament admin
 */
export async function chargeApprovedTeam(teamId: number) {
  try {
    // Get team and event information
    const [teamInfo] = await db
      .select({
        team: teams,
        event: {
          id: events.id,
          name: events.name,
          stripeConnectAccountId: events.stripeConnectAccountId,
          connectAccountStatus: events.connectAccountStatus,
          connectChargesEnabled: events.connectChargesEnabled
        }
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, teamId));

    if (!teamInfo) {
      throw new Error('Team not found');
    }

    const { team, event } = teamInfo;

    // Validate Connect account is ready for charges
    if (!event.stripeConnectAccountId || 
        event.connectAccountStatus !== 'active' || 
        !event.connectChargesEnabled) {
      throw new Error('Event does not have a properly configured Stripe Connect account');
    }

    // Validate team has payment method and amount
    if (!team.paymentMethodId || !team.totalAmount) {
      throw new Error('Team does not have payment method or amount configured');
    }

    // Calculate the total amount that should be charged to the customer (including platform fees)
    const feeCalculation = await calculateEventFees(team.eventId, team.totalAmount);
    
    console.log(`Fee calculation for team ${teamId}:`, {
      tournamentCost: `$${(team.totalAmount / 100).toFixed(2)}`,
      totalToCharge: `$${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`,
      platformFee: `$${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`,
      feeRate: `${(feeCalculation.platformFeeRate * 100).toFixed(1)}%`
    });

    // Process the destination charge using the calculated total amount
    const result = await processDestinationCharge(
      team.id,
      team.eventId,
      team.paymentMethodId,
      feeCalculation.totalChargedAmount, // Use the total amount including platform fees
      event.stripeConnectAccountId,
      true // Mark as pre-calculated to avoid double fee calculation
    );

    console.log(`Successfully charged team ${teamId} and routed payment to Connect account ${event.stripeConnectAccountId}`);
    
    return result;

  } catch (error) {
    console.error(`Error charging approved team ${teamId}:`, error);
    
    // Update team payment status to failed
    await db.update(teams)
      .set({
        paymentStatus: 'payment_failed',
        paymentFailureReason: error instanceof Error ? error.message : 'Unknown error'
      })
      .where(eq(teams.id, teamId));

    throw error;
  }
}

/**
 * Registers Connect payment routes
 */
export function registerConnectPaymentRoutes(app: Express) {
  
  // Webhook for handling Stripe Connect payment events
  app.post('/api/stripe/connect-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing Stripe signature');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.log('Webhook signature verification failed.', err);
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          if (paymentIntent.metadata?.type === 'team_registration') {
            const teamId = parseInt(paymentIntent.metadata.teamId);
            
            // Update team status to paid
            await db.update(teams)
              .set({
                paymentStatus: 'paid',
                paidAt: new Date(),
                status: 'approved'
              })
              .where(eq(teams.id, teamId));

            // Update transaction status
            await db.update(paymentTransactions)
              .set({
                status: 'succeeded',
                updatedAt: new Date()
              })
              .where(eq(paymentTransactions.stripePaymentIntentId, paymentIntent.id));

            console.log(`Team ${teamId} payment completed successfully via Connect`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          
          if (failedPayment.metadata?.type === 'team_registration') {
            const teamId = parseInt(failedPayment.metadata.teamId);
            
            // Update team status to payment failed
            await db.update(teams)
              .set({
                paymentStatus: 'payment_failed',
                paymentFailureReason: failedPayment.last_payment_error?.message || 'Payment failed'
              })
              .where(eq(teams.id, teamId));

            // Update transaction status
            await db.update(paymentTransactions)
              .set({
                status: 'failed',
                updatedAt: new Date()
              })
              .where(eq(paymentTransactions.stripePaymentIntentId, failedPayment.id));

            console.log(`Team ${teamId} payment failed via Connect`);
          }
          break;

        default:
          console.log(`Unhandled Connect webhook event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling Connect webhook:', error);
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  });

  // Admin endpoint to manually charge an approved team
  app.post('/api/admin/teams/:teamId/charge', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (!teamId) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const result = await chargeApprovedTeam(teamId);
      
      res.json({
        success: true,
        message: 'Team charged successfully',
        paymentIntent: result.paymentIntent.id,
        applicationFee: result.applicationFee,
        netToTournament: result.netToTournament
      });

    } catch (error) {
      console.error('Error charging team:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to charge team' 
      });
    }
  });

  // Get payment analytics for a tournament
  app.get('/api/admin/events/:eventId/payment-analytics', async (req, res) => {
    try {
      const { eventId } = req.params;

      const transactions = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.eventId, eventId));

      const analytics = {
        totalTransactions: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        totalApplicationFees: transactions.reduce((sum, t) => sum + (t.applicationFeeAmount || 0), 0),
        netToTournament: transactions.reduce((sum, t) => sum + (t.netAmount || 0), 0),
        successfulPayments: transactions.filter(t => t.status === 'succeeded').length,
        failedPayments: transactions.filter(t => t.status === 'failed').length,
        pendingPayments: transactions.filter(t => t.status === 'pending').length
      };

      res.json({
        analytics,
        transactions
      });

    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      res.status(500).json({ error: 'Failed to fetch payment analytics' });
    }
  });
}