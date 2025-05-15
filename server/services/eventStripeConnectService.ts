/**
 * Event Stripe Connect Service
 * 
 * This service handles server-side operations for Stripe Connect accounts for events/tournaments
 * Used to integrate tournament organizers with direct payment processing via Stripe
 */

import Stripe from 'stripe';
import { db } from '@db';
import { events } from '@db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

// Initialize Stripe with the platform account's secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get an event's Stripe Connect account ID
 */
export async function getEventConnectAccountId(eventId: number): Promise<string | null> {
  const [event] = await db
    .select({ stripeConnectAccountId: events.stripeConnectAccountId })
    .from(events)
    .where(eq(events.id, eventId));

  return event?.stripeConnectAccountId || null;
}

/**
 * Create a Stripe Connect account for an event/tournament
 * @param eventId Event ID
 * @param businessType Type of business (individual or company)
 */
export async function createEventConnectAccount(eventId: number, businessType: 'individual' | 'company' = 'company') {
  // Check if event already has a Connect account
  const existingAccountId = await getEventConnectAccountId(eventId);
  if (existingAccountId) {
    return { 
      accountId: existingAccountId,
      message: 'Event already has a Stripe Connect account' 
    };
  }

  // Get event details
  const [event] = await db
    .select({
      id: events.id,
      name: events.name
    })
    .from(events)
    .where(eq(events.id, eventId));

  if (!event) {
    throw new Error(`Event with ID ${eventId} not found`);
  }

  // Create a new Stripe Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    business_type: businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    metadata: {
      eventId: event.id.toString(),
      type: 'tournament'
    }
  });

  // Update the event with the new account ID
  await db
    .update(events)
    .set({
      stripeConnectAccountId: account.id,
      stripeConnectStatus: account.details_submitted ? 'completed' : 'pending'
    })
    .where(eq(events.id, eventId));

  // Generate an account link for onboarding
  const accountLink = await generateAccountLink(account.id);

  return {
    accountId: account.id,
    accountLink: accountLink.url,
    message: 'Stripe Connect account created successfully'
  };
}

/**
 * Generate an account link for onboarding
 * @param accountId Stripe Connect account ID
 */
export async function generateAccountLink(accountId: string) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.APP_URL || 'http://localhost:5000'}/admin/events/stripe-connect/refresh`,
    return_url: `${process.env.APP_URL || 'http://localhost:5000'}/admin/events/stripe-connect/success`,
    type: 'account_onboarding'
  });
}

/**
 * Generate a new account link for an event's existing Connect account
 * @param eventId Event ID
 */
export async function generateEventAccountLink(eventId: number) {
  const accountId = await getEventConnectAccountId(eventId);
  
  if (!accountId) {
    throw new Error(`Event ${eventId} does not have a Stripe Connect account`);
  }
  
  const accountLink = await generateAccountLink(accountId);
  
  return {
    accountLink: accountLink.url
  };
}

/**
 * Generate a Stripe Connect dashboard login link
 * @param eventId Event ID
 */
export async function generateEventDashboardLink(eventId: number) {
  const accountId = await getEventConnectAccountId(eventId);
  
  if (!accountId) {
    throw new Error(`Event ${eventId} does not have a Stripe Connect account`);
  }
  
  const link = await stripe.accounts.createLoginLink(accountId);
  
  return {
    url: link.url
  };
}

/**
 * Get the status of an event's Stripe Connect account
 * @param eventId Event ID
 */
export async function getEventAccountStatus(eventId: number) {
  const accountId = await getEventConnectAccountId(eventId);
  
  if (!accountId) {
    return {
      hasStripeConnect: false,
      message: 'Event does not have a Stripe Connect account'
    };
  }
  
  const account = await stripe.accounts.retrieve(accountId);
  
  // Update the account status in our database
  await db
    .update(events)
    .set({
      stripeConnectStatus: account.details_submitted ? 'completed' : 'pending',
      stripeConnectDetailsSubmitted: !!account.details_submitted,
      stripeConnectEnabled: account.charges_enabled || false
    })
    .where(eq(events.id, eventId));
  
  return {
    hasStripeConnect: true,
    accountId: account.id,
    detailsSubmitted: !!account.details_submitted,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    requirements: account.requirements,
    status: account.details_submitted ? 'completed' : 'pending'
  };
}