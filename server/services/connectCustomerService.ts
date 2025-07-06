/**
 * Stripe Connect Customer Management Service
 * 
 * This service handles creating and managing customers directly in tournament
 * Connect accounts instead of the main MatchPro account. This gives tournament
 * directors full access to customer data, refund management, and chargeback handling.
 */

import Stripe from 'stripe';
import { db } from "@db";
import { teams, events } from "@db/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface ConnectCustomerData {
  customerId: string;
  connectAccountId: string;
  teamId: number;
  email: string;
  name: string;
}

/**
 * Creates a customer directly in the tournament's Connect account
 * This gives the tournament director full access to customer management
 */
export async function createConnectCustomer(
  teamId: number,
  connectAccountId: string,
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<ConnectCustomerData> {
  try {
    console.log(`Creating customer in Connect account ${connectAccountId} for team ${teamId}`);

    // Get team information for enhanced metadata
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        event: true,
        ageGroup: true
      }
    });

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Create customer directly in the Connect account
    const customer = await stripe.customers.create(
      {
        email: email,
        name: name,
        description: `${team.name} - ${team.event?.name || 'Tournament Registration'}`,
        metadata: {
          team_id: teamId.toString(),
          team_name: team.name || '',
          club_name: team.clubName || '',
          event_id: team.eventId?.toString() || '',
          event_name: team.event?.name || '',
          age_group: team.ageGroup?.name || '',
          created_by: 'connect_customer_service',
          platform: 'matchpro_ai',
          ...metadata
        }
      },
      {
        stripeAccount: connectAccountId // This creates the customer in the Connect account
      }
    );

    console.log(`✅ Customer created in Connect account: ${customer.id}`);

    // Update team record with Connect customer ID
    await db.update(teams)
      .set({
        stripeCustomerId: customer.id,
        connectCustomerAccountId: connectAccountId // Track which Connect account owns this customer
      })
      .where(eq(teams.id, teamId));

    return {
      customerId: customer.id,
      connectAccountId: connectAccountId,
      teamId: teamId,
      email: email,
      name: name
    };

  } catch (error) {
    console.error(`Error creating Connect customer: ${error.message}`);
    throw new Error(`Failed to create customer in Connect account: ${error.message}`);
  }
}

/**
 * Creates a Setup Intent in the Connect account for collecting payment methods
 * This ensures payment methods are attached to the Connect account's customer
 */
export async function createConnectSetupIntent(
  teamId: number,
  connectAccountId: string,
  customerId: string,
  metadata?: Record<string, string>
): Promise<Stripe.SetupIntent> {
  try {
    console.log(`Creating Setup Intent in Connect account ${connectAccountId} for customer ${customerId}`);

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customerId,
        usage: 'off_session',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          team_id: teamId.toString(),
          team_name: team?.name || '',
          connect_account_id: connectAccountId,
          created_by: 'connect_customer_service',
          ...metadata
        }
      },
      {
        stripeAccount: connectAccountId // Create in Connect account
      }
    );

    // Update team with Connect Setup Intent
    await db.update(teams)
      .set({
        setupIntentId: setupIntent.id,
        connectSetupIntentAccountId: connectAccountId
      })
      .where(eq(teams.id, teamId));

    console.log(`✅ Setup Intent created in Connect account: ${setupIntent.id}`);
    return setupIntent;

  } catch (error) {
    console.error(`Error creating Connect Setup Intent: ${error.message}`);
    throw new Error(`Failed to create Setup Intent in Connect account: ${error.message}`);
  }
}

/**
 * Retrieves a customer from the Connect account
 */
export async function getConnectCustomer(
  customerId: string,
  connectAccountId: string
): Promise<Stripe.Customer> {
  try {
    return await stripe.customers.retrieve(
      customerId,
      {
        stripeAccount: connectAccountId
      }
    );
  } catch (error) {
    console.error(`Error retrieving Connect customer: ${error.message}`);
    throw new Error(`Failed to retrieve customer from Connect account: ${error.message}`);
  }
}

/**
 * Updates a customer in the Connect account
 */
export async function updateConnectCustomer(
  customerId: string,
  connectAccountId: string,
  updateData: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  try {
    return await stripe.customers.update(
      customerId,
      updateData,
      {
        stripeAccount: connectAccountId
      }
    );
  } catch (error) {
    console.error(`Error updating Connect customer: ${error.message}`);
    throw new Error(`Failed to update customer in Connect account: ${error.message}`);
  }
}

/**
 * Creates a Payment Intent using the Connect account's customer
 * This ensures the payment is fully managed within the Connect account
 */
export async function createConnectPaymentIntent(
  teamId: number,
  connectAccountId: string,
  customerId: string,
  amount: number,
  paymentMethodId?: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  try {
    console.log(`Creating Payment Intent in Connect account ${connectAccountId} for customer ${customerId}`);

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        event: true,
        ageGroup: true
      }
    });

    const description = team?.event?.name && team?.name ? 
      `${team.event.name} - ${team.name}${team.ageGroup?.name ? ` (${team.ageGroup.name})` : ''}` :
      'Tournament Registration';

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amount,
      currency: 'usd',
      customer: customerId,
      description: description,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        team_id: teamId.toString(),
        team_name: team?.name || '',
        event_name: team?.event?.name || '',
        age_group: team?.ageGroup?.name || '',
        created_by: 'connect_customer_service',
        ...metadata
      }
    };

    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirmation_method = 'manual';
      paymentIntentParams.confirm = true;
    }

    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentParams,
      {
        stripeAccount: connectAccountId
      }
    );

    console.log(`✅ Payment Intent created in Connect account: ${paymentIntent.id}`);
    return paymentIntent;

  } catch (error) {
    console.error(`Error creating Connect Payment Intent: ${error.message}`);
    throw new Error(`Failed to create Payment Intent in Connect account: ${error.message}`);
  }
}

/**
 * Migrates an existing team from main account customer to Connect account customer
 * This is useful for teams that were created before Connect customer implementation
 */
export async function migrateToConnectCustomer(teamId: number): Promise<ConnectCustomerData | null> {
  try {
    console.log(`Migrating team ${teamId} to Connect customer`);

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        event: true
      }
    });

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    if (!team.event?.stripeConnectAccountId) {
      throw new Error(`Team ${teamId} event does not have a Connect account`);
    }

    // Check if already has Connect customer
    if (team.stripeCustomerId && team.connectCustomerAccountId === team.event.stripeConnectAccountId) {
      console.log(`Team ${teamId} already has Connect customer`);
      return {
        customerId: team.stripeCustomerId,
        connectAccountId: team.event.stripeConnectAccountId,
        teamId: teamId,
        email: team.submitterEmail || '',
        name: team.submitterName || team.name || ''
      };
    }

    // Create new Connect customer
    const email = team.submitterEmail || team.managerEmail || `team-${teamId}@tournament.local`;
    const name = team.submitterName || team.managerName || team.name || `Team ${teamId}`;

    const connectCustomer = await createConnectCustomer(
      teamId,
      team.event.stripeConnectAccountId,
      email,
      name,
      {
        migration: 'true',
        original_customer_id: team.stripeCustomerId || '',
        migrated_at: new Date().toISOString()
      }
    );

    console.log(`✅ Team ${teamId} migrated to Connect customer ${connectCustomer.customerId}`);
    return connectCustomer;

  } catch (error) {
    console.error(`Error migrating team to Connect customer: ${error.message}`);
    return null;
  }
}

/**
 * Gets or creates a Connect customer for a team
 * This is the main function to use when you need a Connect customer
 */
export async function getOrCreateConnectCustomer(teamId: number): Promise<ConnectCustomerData> {
  try {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        event: true
      }
    });

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    if (!team.event?.stripeConnectAccountId) {
      throw new Error(`Team ${teamId} event does not have a Connect account configured`);
    }

    // Check if team already has a Connect customer in the correct account
    if (team.stripeCustomerId && team.connectCustomerAccountId === team.event.stripeConnectAccountId) {
      console.log(`Using existing Connect customer ${team.stripeCustomerId} for team ${teamId}`);
      return {
        customerId: team.stripeCustomerId,
        connectAccountId: team.event.stripeConnectAccountId,
        teamId: teamId,
        email: team.submitterEmail || '',
        name: team.submitterName || team.name || ''
      };
    }

    // Create new Connect customer
    const email = team.submitterEmail || team.managerEmail || `team-${teamId}@tournament.local`;
    const name = team.submitterName || team.managerName || team.name || `Team ${teamId}`;

    return await createConnectCustomer(
      teamId,
      team.event.stripeConnectAccountId,
      email,
      name
    );

  } catch (error) {
    console.error(`Error getting or creating Connect customer: ${error.message}`);
    throw error;
  }
}