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
    
    // Get the customer from the payment method to ensure proper association
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    let customerId = paymentMethod.customer as string | null;
    
    console.log(`PAYMENT METHOD DEBUG: Retrieved payment method ${paymentMethodId}`);
    console.log(`  - type: ${paymentMethod.type}`);
    console.log(`  - customer: ${paymentMethod.customer}`);
    console.log(`  - customerId variable: ${customerId}`);

    // Handle Link payment methods which fundamentally cannot be used with customers
    if (paymentMethod.type === 'link') {
      console.log(`Link payment method ${paymentMethodId} detected - Link payments cannot be used with customers in payment intents`);
      console.log(`BEFORE Link fix: customerId was ${customerId}, paymentMethod.customer was ${paymentMethod.customer}`);
      
      // If Link payment method is attached to a customer, detach it first
      if (paymentMethod.customer) {
        console.log(`Detaching Link payment method from customer ${paymentMethod.customer} to prevent attachment errors`);
        await stripe.paymentMethods.detach(paymentMethodId);
        console.log(`Successfully detached Link payment method ${paymentMethodId} from customer`);
      }
      
      // For Link payments, we MUST process without a customer to avoid attachment errors
      customerId = null;
      console.log(`AFTER Link fix: customerId is now ${customerId}`);
    }

    // Handle Link payment methods differently since they can't use destination charges
    let paymentIntent;
    
    if (paymentMethod.type === 'link') {
      console.log(`Processing Link payment method - using standard payment intent with manual transfer`);
      
      // Debug email retrieval for Link payments
      console.log(`LINK EMAIL DEBUG: team data:`, {
        teamId: team?.id,
        teamName: team?.name,
        submitterEmail: team?.submitterEmail,
        submitterName: team?.submitterName
      });
      
      // For Link payments, use standard payment intent (no destination charge)
      const paymentIntentParams: any = {
        amount: chargeAmount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        // NOTE: Removed receipt_email to ensure consistent receipt handling
        // Tournament organizers should handle their own receipt delivery
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          teamId: teamId.toString(),
          eventId: eventId,
          connectAccountId: connectAccountId,
          type: 'team_registration_link',
          tournamentCost: totalAmountCents.toString(),
          platformFeeAmount: feeCalculation.platformFeeAmount.toString(),
          needsManualTransfer: 'true'
        }
      };

      // DO NOT include customer for Link payments - they cannot be attached to customers
      console.log(`Link payment processing without customer to avoid attachment errors`);
      // Explicitly do not set customer for Link payments

      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      
      // After successful payment, create manual transfer to Connect account
      if (paymentIntent.status === 'succeeded') {
        console.log(`Link payment succeeded, creating manual transfer to Connect account`);
        
        try {
          const transfer = await stripe.transfers.create({
            amount: feeCalculation.tournamentReceivesAmount, // Send tournament portion to Connect account
            currency: 'usd',
            destination: connectAccountId,
            source_transaction: paymentIntent.latest_charge as string,
            metadata: {
              teamId: teamId.toString(),
              paymentIntentId: paymentIntent.id,
              type: 'link_tournament_payout'
            }
          });
          
          console.log(`Manual transfer created: ${transfer.id} for $${feeCalculation.tournamentReceivesAmount / 100}`);
        } catch (transferError) {
          console.error('Error creating manual transfer for Link payment:', transferError);
          // Payment succeeded but transfer failed - this needs manual handling
        }
      }
      
    } else {
      console.log(`Processing regular payment method - using destination charge`);
      
      // CRITICAL PLATFORM FEE VALIDATION
      if (!feeCalculation.platformFeeAmount || feeCalculation.platformFeeAmount <= 0) {
        throw new Error(`Invalid platform fee amount: ${feeCalculation.platformFeeAmount}. Fee calculation may be broken.`);
      }
      
      console.log(`🔥 PLATFORM FEE DEBUG - Team ${teamId}:`);
      console.log(`  Total Charge Amount: $${(chargeAmount / 100).toFixed(2)}`);
      console.log(`  Platform Fee Amount: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`);
      console.log(`  MatchPro Revenue: $${(feeCalculation.matchproReceives / 100).toFixed(2)}`);
      console.log(`  Tournament Receives: $${(feeCalculation.tournamentReceives / 100).toFixed(2)}`);
      
      // For regular payment methods, use destination charge as before
      const paymentIntentParams: any = {
        amount: chargeAmount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        on_behalf_of: connectAccountId,
        // NOTE: Removed receipt_email to allow Connect account to handle receipts
        // Setting receipt_email on platform account causes receipts to come from MatchPro instead of tournament organizer
        transfer_data: {
          destination: connectAccountId,
        },
        application_fee_amount: feeCalculation.platformFeeAmount, // This is the critical line that collects MatchPro revenue
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          teamId: teamId.toString(),
          eventId: eventId,
          connectAccountId: connectAccountId,
          type: 'team_registration',
          tournamentCost: totalAmountCents.toString(),
          platformFeeRate: feeCalculation.platformFeeRate.toString(),
          stripeFeeAmount: feeCalculation.stripeFeeAmount.toString(),
          // Add the calculated values to metadata for debugging
          calculatedPlatformFee: feeCalculation.platformFeeAmount.toString(),
          calculatedMatchProRevenue: feeCalculation.matchproReceives.toString()
        }
      };
      
      console.log(`✅ STRIPE CONNECT PARAMETERS - Team ${teamId}:`);
      console.log(`  application_fee_amount: ${paymentIntentParams.application_fee_amount} cents ($${(paymentIntentParams.application_fee_amount / 100).toFixed(2)})`);
      console.log(`  Connect account: ${connectAccountId}`);
      console.log(`  Total amount: ${paymentIntentParams.amount} cents ($${(paymentIntentParams.amount / 100).toFixed(2)})`);
      
      if (paymentIntentParams.application_fee_amount !== feeCalculation.platformFeeAmount) {
        throw new Error(`Platform fee mismatch: params=${paymentIntentParams.application_fee_amount} vs calculated=${feeCalculation.platformFeeAmount}`);
      }

      // Include customer if we have one
      if (customerId) {
        paymentIntentParams.customer = customerId;
        console.log(`Using customer: ${customerId}`);
      }

      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    }

    // Get card details from the completed payment intent
    let cardBrand = null;
    let cardLastFour = null;
    let paymentMethodType = null;
    
    try {
      // For successful payments, get the charge details to extract card information
      if (paymentIntent.status === 'succeeded' && paymentIntent.latest_charge) {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
        const cardDetails = charge.payment_method_details?.card;
        
        if (cardDetails) {
          cardBrand = cardDetails.brand; // visa, mastercard, amex, discover, etc.
          cardLastFour = cardDetails.last4;
          paymentMethodType = 'card';
          
          console.log(`Captured card details: ${cardBrand} ending in ${cardLastFour}`);
        } else if (charge.payment_method_details?.link) {
          paymentMethodType = 'link';
          console.log('Link payment method detected');
        }
      }
    } catch (cardError) {
      console.warn('Could not retrieve card details:', cardError);
      // Continue without card details rather than failing the entire transaction
    }

    // CRITICAL DATABASE VALIDATION - Ensure platform fees are recorded
    if (!feeCalculation.platformFeeAmount || feeCalculation.platformFeeAmount <= 0) {
      throw new Error(`Cannot record transaction: Invalid platform fee amount ${feeCalculation.platformFeeAmount}`);
    }
    
    if (!feeCalculation.matchproReceives && feeCalculation.matchproReceives !== 0) {
      throw new Error(`Cannot record transaction: Invalid MatchPro revenue ${feeCalculation.matchproReceives}`);
    }
    
    console.log(`💾 RECORDING TRANSACTION - Team ${teamId}:`);
    console.log(`  Payment Intent: ${paymentIntent.id}`);
    console.log(`  Platform Fee to Record: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`);
    console.log(`  MatchPro Revenue to Record: $${(feeCalculation.matchproReceives / 100).toFixed(2)}`);
    console.log(`  Application Fee Amount: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`);
    
    // Record comprehensive transaction in database with detailed fee breakdown
    await db.insert(paymentTransactions).values({
      teamId: parseInt(teamId.toString()),
      eventId: parseInt(eventId.toString()),
      paymentIntentId: paymentIntent.id,
      transactionType: 'payment',
      amount: chargeAmount, // Use the actual amount charged
      platformFeeAmount: feeCalculation.platformFeeAmount, // ✓ Add platform fee to dedicated column
      stripeFee: feeCalculation.stripeFeeAmount,
      netAmount: feeCalculation.tournamentReceives,
      matchproRevenue: feeCalculation.matchproReceives, // ✓ Add MatchPro revenue field
      applicationFeeAmount: feeCalculation.platformFeeAmount, // ✓ Record what was sent to Stripe
      status: paymentIntent.status,
      cardBrand: cardBrand, // ✓ Add card brand (visa, mastercard, etc.)
      cardLastFour: cardLastFour, // ✓ Add last 4 digits
      paymentMethodType: paymentMethodType, // ✓ Add payment method type
      metadata: {
        tournamentCost: totalAmountCents.toString(),
        platformFeeRate: feeCalculation.platformFeeRate,
        platformFeeAmount: feeCalculation.platformFeeAmount,
        connectAccountId: connectAccountId,
        feeCalculationBreakdown: feeCalculation,
        // Add verification data
        stripeApplicationFeeAmount: feeCalculation.platformFeeAmount,
        recordedAt: new Date().toISOString()
      },
      createdAt: new Date()
    });
    
    console.log(`✅ TRANSACTION RECORDED - Platform fee: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}, MatchPro revenue: $${(feeCalculation.matchproReceives / 100).toFixed(2)}`);

    // Update team payment status and card details
    await db.update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'payment_pending',
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        cardBrand: cardBrand, // Store card brand for future reference
        cardLast4: cardLastFour, // Store last 4 digits
        paymentMethodType: paymentMethodType // Store payment method type
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
    console.log(`CONNECT DEBUG: chargeApprovedTeam called for team ${teamId}`);
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

    // Check if team has payment setup - either direct payment method or completed setup intent
    if (!team.totalAmount) {
      throw new Error('Team does not have amount configured');
    }

    let paymentMethodId = team.paymentMethodId;
    
    // If no direct payment method, check if there's a completed setup intent
    if (!paymentMethodId && team.setupIntentId) {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          paymentMethodId = setupIntent.payment_method as string;
          console.log(`Using payment method from completed setup intent: ${paymentMethodId}`);
          
          // Check if this is a Link payment method before setting customer ID
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
          let customerIdToSet = setupIntent.customer as string || null;
          
          if (paymentMethod.type === 'link') {
            console.log(`LINK PAYMENT DETECTED: Setting customer ID to null for Link payment method ${paymentMethodId}`);
            customerIdToSet = null; // Link payment methods cannot be used with customers
          }
          
          // Update team record with the payment method for future use
          await db.update(teams)
            .set({ 
              paymentMethodId: paymentMethodId,
              stripeCustomerId: customerIdToSet
            })
            .where(eq(teams.id, teamId));
            
        } else {
          // For legacy teams with incomplete setup intents, try to auto-recover by creating a fresh payment flow
          console.log(`Attempting auto-recovery for team ${teamId} with incomplete setup intent...`);
          
          try {
            // Create a fresh setup intent for immediate completion and processing
            // Handle case where original setup intent has no customer
            const createParams: any = {
              usage: 'off_session',
              metadata: {
                teamId: teamId.toString(),
                teamName: team.name || 'Unknown Team',
                originalSetupIntent: team.setupIntentId,
                autoRecovery: 'true',
                eventType: 'approval_auto_recovery'
              }
            };
            
            // Only include customer if the original setup intent had one
            if (setupIntent.customer && typeof setupIntent.customer === 'string' && setupIntent.customer.trim() !== '') {
              createParams.customer = setupIntent.customer;
            }
            
            const recoverySetupIntent = await stripe.setupIntents.create(createParams);
            
            // Try to complete the payment flow automatically if the original setup had payment method data
            // This won't work for completely empty setup intents, but worth trying
            console.log(`Created recovery setup intent ${recoverySetupIntent.id} for team ${teamId}`);
            
            // For now, fall back to requiring manual completion, but with better messaging
            await db.update(teams)
              .set({
                paymentStatus: 'payment_required',
                setupIntentId: recoverySetupIntent.id, // Replace with fresh setup intent
                notes: `Auto-recovery successful. Original setup intent incomplete (status: ${setupIntent.status}). Fresh setup intent created: ${recoverySetupIntent.id}. Ready for payment completion URL generation.`
              })
              .where(eq(teams.id, teamId));
            
            throw new Error(`Setup Intent auto-recovery completed for team ${teamId}. Team ready for payment completion. Use "Generate Payment Completion URL" to allow team to complete payment setup.`);
            
          } catch (recoveryError) {
            // If auto-recovery fails, fall back to original error handling
            await db.update(teams)
              .set({
                paymentStatus: 'payment_required',
                notes: `Setup Intent incomplete (status: ${setupIntent.status}). Auto-recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}. Admin can generate payment completion URL for team to finish payment setup.`
              })
              .where(eq(teams.id, teamId));
            
            throw new Error(`Setup Intent ${team.setupIntentId} is incomplete (status: ${setupIntent.status}). Auto-recovery failed. Use "Generate Payment Completion URL" to allow team to complete payment setup.`);
          }
        }
      } catch (stripeError) {
        throw new Error(`Failed to retrieve setup intent: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
      }
    }
    
    if (!paymentMethodId) {
      throw new Error('Team does not have payment method or completed setup intent');
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
      paymentMethodId, // Use the payment method we determined above
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