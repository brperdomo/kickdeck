import Stripe from "stripe";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { events } from "../../db/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Stripe Connect Service for creating customers in tournament accounts
 * This ensures refunds are processed from the tournament's account, not MatchPro's
 */
export class StripeConnectService {
  
  /**
   * Get tournament's Stripe Connect account ID
   */
  private static async getTournamentStripeAccount(eventId: string): Promise<string> {
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });

    if (!event?.stripeAccountId) {
      throw new Error(`No Stripe Connect account found for event ${eventId}`);
    }

    return event.stripeAccountId;
  }

  /**
   * Create customer in tournament's Stripe Connect account
   * This ensures refunds come from the tournament account, not MatchPro
   */
  static async createCustomerInTournamentAccount(data: {
    eventId?: string;
    stripeAccountId?: string;
    email: string;
    name: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<{ customerId: string; accountId: string }> {
    
    let accountId = data.stripeAccountId;
    
    // If no account ID provided, get it from event
    if (!accountId && data.eventId) {
      accountId = await this.getTournamentStripeAccount(data.eventId);
    }
    
    if (!accountId) {
      throw new Error('No Stripe Connect account ID provided or found');
    }

    console.log(`💳 Creating customer in tournament account: ${accountId}`);

    try {
      // Create customer in the tournament's Stripe Connect account
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: {
          tournament_account: accountId,
          created_via: 'matchpro_connect_test',
          ...data.metadata
        }
      }, {
        stripeAccount: accountId // This is the key - creates customer in Connect account
      });

      console.log(`✅ Customer created in tournament account: ${customer.id}`);

      return {
        customerId: customer.id,
        accountId: accountId
      };

    } catch (error) {
      console.error('❌ Failed to create customer in tournament account:', error);
      throw new Error(`Failed to create customer in tournament account: ${error.message}`);
    }
  }

  /**
   * Create setup intent in tournament's Stripe Connect account
   * This enables future payments and refunds to be processed through the tournament account
   */
  static async createSetupIntentInTournamentAccount(data: {
    customerId: string;
    accountId: string;
    metadata?: Record<string, string>;
  }): Promise<{ setupIntent: Stripe.SetupIntent; clientSecret: string }> {
    
    console.log(`💳 Creating setup intent in tournament account: ${data.accountId}`);

    try {
      // Create setup intent in the tournament's Stripe Connect account
      const setupIntent = await stripe.setupIntents.create({
        customer: data.customerId,
        payment_method_types: ['card'],
        usage: 'off_session', // Allows future payments without customer present
        metadata: {
          tournament_account: data.accountId,
          created_via: 'matchpro_connect_test',
          ...data.metadata
        }
      }, {
        stripeAccount: data.accountId // Creates setup intent in Connect account
      });

      console.log(`✅ Setup intent created in tournament account: ${setupIntent.id}`);

      return {
        setupIntent,
        clientSecret: setupIntent.client_secret!
      };

    } catch (error) {
      console.error('❌ Failed to create setup intent in tournament account:', error);
      throw new Error(`Failed to create setup intent in tournament account: ${error.message}`);
    }
  }

  /**
   * Create payment intent in tournament's Stripe Connect account
   * For testing charges that will be refundable from the tournament account
   */
  static async createPaymentIntentInTournamentAccount(data: {
    customerId: string;
    accountId: string;
    amount: number; // in cents
    currency: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<{ paymentIntent: Stripe.PaymentIntent; clientSecret: string }> {
    
    console.log(`💳 Creating payment intent in tournament account: ${data.accountId}`);

    try {
      const createData: Stripe.PaymentIntentCreateParams = {
        amount: data.amount,
        currency: data.currency,
        customer: data.customerId,
        metadata: {
          tournament_account: data.accountId,
          created_via: 'matchpro_connect_test',
          ...data.metadata
        }
      };

      // Add payment method if provided
      if (data.paymentMethodId) {
        createData.payment_method = data.paymentMethodId;
        createData.confirm = true; // Auto-confirm if payment method provided
      }

      // Create payment intent in the tournament's Stripe Connect account
      const paymentIntent = await stripe.paymentIntents.create(createData, {
        stripeAccount: data.accountId // Creates payment intent in Connect account
      });

      console.log(`✅ Payment intent created in tournament account: ${paymentIntent.id}`);

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!
      };

    } catch (error) {
      console.error('❌ Failed to create payment intent in tournament account:', error);
      throw new Error(`Failed to create payment intent in tournament account: ${error.message}`);
    }
  }

  /**
   * Process refund from tournament's Stripe Connect account
   * This is the key difference - refunds come from tournament funds, not MatchPro
   */
  static async processRefundFromTournamentAccount(data: {
    paymentIntentId: string;
    accountId: string;
    amount?: number; // Optional partial refund amount in cents
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }): Promise<{ refund: Stripe.Refund }> {
    
    console.log(`💸 Processing refund from tournament account: ${data.accountId}`);

    try {
      // Create refund in the tournament's Stripe Connect account
      const refund = await stripe.refunds.create({
        payment_intent: data.paymentIntentId,
        amount: data.amount, // If not provided, refunds full amount
        reason: data.reason || 'requested_by_customer',
        metadata: {
          tournament_account: data.accountId,
          refunded_via: 'matchpro_connect_test',
          ...data.metadata
        }
      }, {
        stripeAccount: data.accountId // Processes refund from Connect account funds
      });

      console.log(`✅ Refund processed from tournament account: ${refund.id}`);

      return { refund };

    } catch (error) {
      console.error('❌ Failed to process refund from tournament account:', error);
      throw new Error(`Failed to process refund from tournament account: ${error.message}`);
    }
  }
}