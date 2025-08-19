import express from 'express';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '@db';
import { teams, events, paymentTransactions } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { chargeApprovedTeam } from '../stripe-connect-payments';
import { parseStripeError, formatErrorForDatabase } from '../../utils/stripeErrorHandler';

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

/**
 * Fix PaymentMethod attachment issues and retry payment
 */
async function fixPaymentMethodAttachment(teamId: number, paymentMethodId: string) {
  try {
    console.log(`RETRY PAYMENT: Fixing PaymentMethod attachment for team ${teamId}, payment method ${paymentMethodId}`);
    
    // Get team information
    const [teamInfo] = await db
      .select({
        team: teams,
        event: events,
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, teamId));

    if (!teamInfo) {
      throw new Error("Team not found");
    }

    const { team, event } = teamInfo;
    
    // Get the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log(`RETRY PAYMENT: PaymentMethod ${paymentMethodId} type: ${paymentMethod.type}, customer: ${paymentMethod.customer}`);
    
    let customerId = team.stripeCustomerId;
    
    // If payment method is not attached to any customer, create one
    if (!paymentMethod.customer) {
      if (!customerId) {
        console.log(`RETRY PAYMENT: Creating new customer for team ${teamId} on Connect account: ${event.stripeConnectAccountId || 'main account'}`);
        const customer = await stripe.customers.create({
          email: team.managerEmail || team.submitterEmail || undefined,
          name: team.managerName || team.name || undefined,
          metadata: {
            teamId: teamId.toString(),
            teamName: team.name || "Unknown Team",
            eventId: team.eventId?.toString() || "",
            eventName: event.name || "Unknown Event",
            systemSource: "MatchPro",
            createdFor: "payment_retry_admin"
          }
        }, event.stripeConnectAccountId ? { stripeAccount: event.stripeConnectAccountId } : {});
        customerId = customer.id;
        
        // Update team with new customer ID
        await db
          .update(teams)
          .set({ stripeCustomerId: customerId })
          .where(eq(teams.id, teamId));
        
        console.log(`RETRY PAYMENT: Created customer ${customerId} for team ${teamId}`);
      }
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      console.log(`RETRY PAYMENT: Attached PaymentMethod ${paymentMethodId} to customer ${customerId}`);
    } else if (paymentMethod.customer !== customerId) {
      // Payment method is attached to a different customer
      console.log(`RETRY PAYMENT: PaymentMethod ${paymentMethodId} attached to different customer. Expected: ${customerId}, Actual: ${paymentMethod.customer}`);
      
      // Update team record with the correct customer ID
      customerId = paymentMethod.customer as string;
      await db
        .update(teams)
        .set({ stripeCustomerId: customerId })
        .where(eq(teams.id, teamId));
      
      console.log(`RETRY PAYMENT: Updated team ${teamId} customer ID to ${customerId}`);
    }
    
    return { success: true, customerId };
  } catch (error) {
    console.error(`RETRY PAYMENT: Error fixing PaymentMethod attachment for team ${teamId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Retry failed payment for a specific team
 */
router.post('/retry/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    
    console.log(`RETRY PAYMENT: Starting retry for team ${teamId}`);
    
    // Get team information
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId));
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Check if team has payment method
    if (!team.paymentMethodId && !team.setupIntentId) {
      return res.status(400).json({ 
        error: 'Team has no payment method. Team needs to complete payment setup first.' 
      });
    }
    
    let paymentMethodId = team.paymentMethodId;
    
    // If no direct payment method, try to get it from setup intent
    if (!paymentMethodId && team.setupIntentId) {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          paymentMethodId = setupIntent.payment_method as string;
          console.log(`RETRY PAYMENT: Retrieved payment method ${paymentMethodId} from setup intent`);
        }
      } catch (error) {
        console.error(`RETRY PAYMENT: Error retrieving setup intent:`, error);
      }
    }
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        error: 'No valid payment method found. Team needs to complete payment setup.' 
      });
    }
    
    // Attempt to fix PaymentMethod attachment issue
    const fixResult = await fixPaymentMethodAttachment(teamId, paymentMethodId);
    if (!fixResult.success) {
      // Log the failure attempt
      await db.insert(paymentTransactions).values({
        teamId: teamId,
        transactionType: 'payment',
        amount: team.totalAmount || 0,
        status: 'failed',
        errorCode: 'attachment_failed',
        errorMessage: `PaymentMethod attachment fix failed: ${fixResult.error}`,
        createdAt: new Date()
      });
      
      return res.status(500).json({ 
        error: `Failed to fix payment method attachment: ${fixResult.error}` 
      });
    }
    
    // Update team payment method if we retrieved it from setup intent
    if (paymentMethodId !== team.paymentMethodId) {
      await db
        .update(teams)
        .set({ 
          paymentMethodId: paymentMethodId,
          stripeCustomerId: fixResult.customerId 
        })
        .where(eq(teams.id, teamId));
    }
    
    // Retry the payment using the existing charge function
    const result = await chargeApprovedTeam(teamId);
    
    console.log(`RETRY PAYMENT: chargeApprovedTeam result for team ${teamId}:`, result);
    
    if (result && typeof result === 'object' && result.success) {
      // Log successful retry
      await db.insert(paymentTransactions).values({
        teamId: teamId,
        transactionType: 'payment',
        amount: team.totalAmount || 0,
        status: 'succeeded',
        errorCode: null,
        errorMessage: 'Payment retry successful after fixing PaymentMethod attachment',
        createdAt: new Date()
      });
      
      res.json({ 
        success: true, 
        message: 'Payment retry successful',
        paymentStatus: 'paid'
      });
    } else {
      // Log failed retry with detailed reason
      await db.insert(paymentTransactions).values({
        teamId: teamId,
        transactionType: 'payment',
        amount: team.totalAmount || 0,
        status: 'failed',
        errorCode: 'retry_failed',
        errorMessage: `Payment retry failed with result: ${result}`,
        createdAt: new Date()
      });
      
      res.status(500).json({ 
        error: `Payment retry failed: ${typeof result === 'string' ? result : 'Unknown error'}`,
        paymentStatus: 'failed'
      });
    }
    
  } catch (error) {
    console.error(`RETRY PAYMENT: Error retrying payment for team ${req.params.teamId}:`, error);
    
    const detailedError = parseStripeError(error);
    const errorMessage = formatErrorForDatabase(detailedError);
    
    // Log the error
    const teamId = parseInt(req.params.teamId);
    if (teamId) {
      await db.insert(paymentTransactions).values({
        teamId: teamId,
        transactionType: 'payment',
        amount: 0, // We don't have amount in this context
        status: 'failed',
        errorCode: detailedError.code || 'unknown',
        errorMessage: errorMessage,
        createdAt: new Date()
      });
    }
    
    res.status(500).json({ 
      error: detailedError.userFriendlyMessage,
      adminMessage: detailedError.adminMessage
    });
  }
});

/**
 * Get retry eligibility for a team
 */
router.get('/eligibility/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    
    // Get team and recent failed transactions
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId));
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const recentFailures = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.teamId, teamId),
          eq(paymentTransactions.status, 'failed')
        )
      )
      .orderBy(paymentTransactions.createdAt)
      .limit(10);
    
    // Determine if team is eligible for retry
    const hasPaymentMethod = !!(team.paymentMethodId || team.setupIntentId);
    const isPaid = team.paymentStatus === 'paid';
    const recentAttachmentErrors = recentFailures.filter(f => 
      f.errorMessage?.includes('cannot be attached') || 
      f.errorMessage?.includes('attach it to a Customer first')
    );
    
    const eligibility = {
      eligible: hasPaymentMethod && !isPaid,
      reasons: [] as string[],
      hasPaymentMethod,
      isPaid,
      paymentStatus: team.paymentStatus,
      recentFailureCount: recentFailures.length,
      attachmentErrors: recentAttachmentErrors.length,
      canFixAttachment: recentAttachmentErrors.length > 0
    };
    
    if (!hasPaymentMethod) {
      eligibility.reasons.push('No payment method on file');
    }
    if (isPaid) {
      eligibility.reasons.push('Payment already completed');
    }
    if (recentAttachmentErrors.length > 0) {
      eligibility.reasons.push(`${recentAttachmentErrors.length} PaymentMethod attachment errors detected - can be fixed`);
    }
    
    res.json(eligibility);
    
  } catch (error) {
    console.error(`Error checking retry eligibility for team ${req.params.teamId}:`, error);
    res.status(500).json({ error: 'Failed to check retry eligibility' });
  }
});

export default router;