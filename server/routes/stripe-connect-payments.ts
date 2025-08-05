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
import { parseStripeError, formatErrorForDatabase, formatErrorForAdmin, type DetailedPaymentError } from '../utils/stripeErrorHandler';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
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
  isPreCalculated: boolean = false,
  customerId: string | null = null
) {
  try {
    // Get team and event information for receipt email  
    const [teamInfo] = await db
      .select({
        team: teams,
        event: events
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, teamId));

    if (!teamInfo) {
      throw new Error('Team or event not found');
    }

    const { team, event } = teamInfo;

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
    let customerIdToUse = customerId || paymentMethod.customer as string | null;
    
    console.log(`PAYMENT METHOD DEBUG: Retrieved payment method ${paymentMethodId}`);
    console.log(`  - type: ${paymentMethod.type}`);
    console.log(`  - customer: ${paymentMethod.customer}`);
    console.log(`  - customerId parameter: ${customerId}`);
    console.log(`  - customerIdToUse: ${customerIdToUse}`);

    // Handle payment methods without customers (common for team registrations)
    if (!customerIdToUse) {
      console.log(`Payment method ${paymentMethodId} has no customer - processing without customer (valid for off-session payments)`);
      console.log(`This is normal for team registrations where payment methods are created during setup intents`);
      customerIdToUse = null;
    }

    // Special handling for Link payment methods
    if (paymentMethod.type === 'link') {
      console.log(`Link payment method ${paymentMethodId} detected - forcing customer to null for compatibility`);
      customerIdToUse = null;
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
      
      // Create meaningful description for Stripe dashboard
      const description = `${event.name} - ${team.name}`;

      // For Link payments, use standard payment intent (no destination charge)
      const paymentIntentParams: any = {
        amount: chargeAmount,
        currency: 'usd',
        description: description, // Add meaningful description
        payment_method: paymentMethodId,
        confirm: true,
        // NOTE: Removed receipt_email to ensure consistent receipt handling
        // Tournament organizers should handle their own receipt delivery
        payment_method_types: ['card'],
        metadata: {
          teamId: teamId.toString(),
          teamName: team.name || '',
          eventName: event.name || '',
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
          // CRITICAL FIX: Link payments should transfer the same amount as card payments
          // The tournament should receive: chargeAmount - platformFeeAmount - stripeFeeAmount
          // This ensures Link users pay the same total structure as card users
          
          console.log(`LINK PAYMENT FEE DEBUG - Team ${teamId}:`);
          console.log(`  Total charged to customer: $${(chargeAmount / 100).toFixed(2)}`);
          console.log(`  Platform fee (MatchPro): $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`);
          console.log(`  Stripe processing fee: $${(feeCalculation.stripeFeeAmount / 100).toFixed(2)}`);
          console.log(`  Tournament should receive: $${(feeCalculation.tournamentReceives / 100).toFixed(2)}`);
          console.log(`  MatchPro net revenue: $${(feeCalculation.matchproReceives / 100).toFixed(2)}`);
          
          const transfer = await stripe.transfers.create({
            amount: feeCalculation.tournamentReceives, // Send tournament portion to Connect account
            currency: 'usd',
            destination: connectAccountId,
            source_transaction: paymentIntent.latest_charge as string,
            metadata: {
              teamId: teamId.toString(),
              paymentIntentId: paymentIntent.id,
              type: 'link_tournament_payout',
              totalCharged: chargeAmount.toString(),
              platformFeeAmount: feeCalculation.platformFeeAmount.toString(),
              stripeFeeAmount: feeCalculation.stripeFeeAmount.toString(),
              matchproNetRevenue: feeCalculation.matchproReceives.toString()
            }
          });
          
          console.log(`✅ Link manual transfer created: ${transfer.id} for $${feeCalculation.tournamentReceives / 100}`);
          console.log(`✅ MatchPro keeps $${(feeCalculation.matchproReceives / 100).toFixed(2)} net revenue (after paying Stripe fees)`);
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
      
      // Create meaningful description for Stripe dashboard
      const description = `${event.name} - ${team.name}`;

      // For regular payment methods, use destination charge as before
      const paymentIntentParams: any = {
        amount: chargeAmount,
        currency: 'usd',
        description: description, // Add meaningful description
        payment_method: paymentMethodId,
        confirm: true,
        on_behalf_of: connectAccountId,
        // NOTE: Removed receipt_email to allow Connect account to handle receipts
        // Setting receipt_email on platform account causes receipts to come from MatchPro instead of tournament organizer
        transfer_data: {
          destination: connectAccountId,
        },
        application_fee_amount: feeCalculation.platformFeeAmount, // This is the critical line that collects MatchPro revenue
        payment_method_types: ['card'],
        metadata: {
          teamId: teamId.toString(),
          teamName: team.name || '',
          eventName: event.name || '',
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

      // Handle customer attachment for payment methods (optional for off-session payments)
      if (customerIdToUse) {
        try {
          // Verify customer exists in Stripe first
          const customer = await stripe.customers.retrieve(customerIdToUse);
          console.log(`Verified customer ${customerIdToUse} exists in Stripe`);
          
          paymentIntentParams.customer = customerIdToUse;
          console.log(`Using customer: ${customerIdToUse}`);
          
        } catch (customerError: any) {
          console.log(`Customer ${customerIdToUse} error: ${customerError.message} - proceeding without customer`);
          // Don't fail the payment, just proceed without customer
          customerIdToUse = null;
        }
      }
      
      // For payment methods without customers, proceed with off-session payment
      if (!customerIdToUse) {
        console.log(`Processing payment without customer - valid for off-session team registration payments`);
        // paymentIntentParams.customer is intentionally not set
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
      cardBrand: cardBrand || null, // ✓ Add card brand (visa, mastercard, etc.)
      cardLastFour: cardLastFour || null, // ✓ Add last 4 digits
      paymentMethodType: paymentMethodType || null, // ✓ Add payment method type
      connectAccountId: connectAccountId,
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
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ TRANSACTION RECORDED - Platform fee: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}, MatchPro revenue: $${(feeCalculation.matchproReceives / 100).toFixed(2)}`);

    // Update team payment status and card details
    await db.update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'payment_pending',
        paymentDate: paymentIntent.status === 'succeeded' ? new Date() : null,
        cardBrand: cardBrand || null, // Store card brand for future reference
        cardLastFour: cardLastFour || null, // Store last 4 digits
        paymentMethodType: paymentMethodType || null // Store payment method type
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
    
    // Parse Stripe error for detailed context
    const detailedError = parseStripeError(error);
    console.log(`DESTINATION CHARGE FAILURE DETAILS for Team ${teamId}:`, formatErrorForAdmin(detailedError));
    
    // Log the failed payment attempt to payment_transactions table
    try {
      await db.insert(paymentTransactions).values({
        teamId: teamId,
        eventId: parseInt(eventId.toString()),
        transactionType: 'payment',
        amount: totalAmountCents,
        status: 'failed',
        errorMessage: formatErrorForDatabase(detailedError),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Logged failed destination charge for team ${teamId} to payment_transactions table`);
    } catch (logError) {
      console.error(`Failed to log payment transaction for team ${teamId}:`, logError);
    }
    
    // Throw enhanced error with detailed context
    const enhancedError = new Error(`Destination charge failed for team ${teamId}: ${detailedError.adminMessage}`);
    (enhancedError as any).detailedContext = formatErrorForAdmin(detailedError);
    throw enhancedError;
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
            
            // For Link payments, we need to verify the payment method is still usable
            console.log(`LINK PAYMENT VALIDATION: Checking if Link payment method ${paymentMethodId} is still valid`);
            
            // Link payments can work with or without customers, but we'll process without to be safe
            if (paymentMethod.customer) {
              console.log(`Link payment method ${paymentMethodId} is attached to customer ${paymentMethod.customer} - will process without customer to avoid conflicts`);
            }
          }
          
          // Update team record with the payment method for future use
          await db.update(teams)
            .set({ 
              paymentMethodId: paymentMethodId,
              stripeCustomerId: customerIdToSet,
              paymentStatus: 'payment_ready' // Mark as ready for processing
            })
            .where(eq(teams.id, teamId));
            
          // Update local team object with the customer ID for this session
          team.stripeCustomerId = customerIdToSet;
            
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
    console.log(`Team customer ID for charge: ${team.stripeCustomerId}`);
    const result = await processDestinationCharge(
      team.id,
      team.eventId,
      paymentMethodId, // Use the payment method we determined above
      feeCalculation.totalChargedAmount, // Use the total amount including platform fees
      event.stripeConnectAccountId,
      true, // Mark as pre-calculated to avoid double fee calculation
      team.stripeCustomerId // Pass customer ID for payment method attachment
    );

    console.log(`Successfully charged team ${teamId} and routed payment to Connect account ${event.stripeConnectAccountId}`);
    
    return result;

  } catch (error) {
    console.error(`Error charging approved team ${teamId}:`, error);
    
    // Parse Stripe error for detailed context
    const detailedError = parseStripeError(error);
    const errorMessage = formatErrorForDatabase(detailedError);
    
    console.log(`PAYMENT FAILURE DETAILS for Team ${teamId}:`, formatErrorForAdmin(detailedError));
    
    // Log the failed payment attempt to payment_transactions table
    try {
      await db.insert(paymentTransactions).values({
        teamId: teamId,
        eventId: parseInt(event.id), // Add eventId to complete the record
        transactionType: 'payment',
        amount: team.totalAmount || 0,
        status: 'failed',
        errorMessage: errorMessage,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Logged failed Connect payment attempt for team ${teamId} to payment_transactions table`);
    } catch (logError) {
      console.error(`Failed to log payment transaction for team ${teamId}:`, logError);
    }
    
    // Update team payment status to failed with detailed error context
    await db.update(teams)
      .set({
        paymentStatus: 'payment_failed',
        paymentFailureReason: errorMessage
      })
      .where(eq(teams.id, teamId));

    // Throw the detailed error with admin-friendly context
    const enhancedError = new Error(`Team ${teamId} payment failed: ${detailedError.adminMessage}`);
    (enhancedError as any).detailedContext = formatErrorForAdmin(detailedError);
    throw enhancedError;
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
              .where(eq(paymentTransactions.paymentIntentId, paymentIntent.id));

            console.log(`Team ${teamId} payment completed successfully via Connect`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          
          if (failedPayment.metadata?.type === 'team_registration') {
            const teamId = parseInt(failedPayment.metadata.teamId);
            
            // Parse detailed error information from webhook
            const webhookError = failedPayment.last_payment_error;
            let detailedErrorMessage = 'Payment failed';
            
            if (webhookError) {
              const detailedError = parseStripeError(webhookError);
              detailedErrorMessage = formatErrorForDatabase(detailedError);
              console.log(`WEBHOOK PAYMENT FAILURE for Team ${teamId}:`, formatErrorForAdmin(detailedError));
            }
            
            // Update team status to payment failed
            await db.update(teams)
              .set({
                paymentStatus: 'payment_failed',
                paymentFailureReason: detailedErrorMessage
              })
              .where(eq(teams.id, teamId));

            // Update transaction status
            await db.update(paymentTransactions)
              .set({
                status: 'failed',
                updatedAt: new Date()
              })
              .where(eq(paymentTransactions.paymentIntentId, failedPayment.id));

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
        breakdown: result.breakdown
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
        .where(eq(paymentTransactions.eventId, parseInt(eventId)));

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