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
  throw new Error('STRIPE_SECRET_KEY is required for Stripe Connect');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get an event's Stripe Connect account ID
 */
export async function getEventConnectAccountId(eventId: number): Promise<string | null> {
  const [event] = await db.select({
    stripeConnectAccountId: events.stripeConnectAccountId
  }).from(events).where(eq(events.id, eventId));
  
  return event?.stripeConnectAccountId || null;
}

/**
 * Create a Stripe Connect account for an event/tournament
 * @param eventId Event ID
 * @param businessType Type of business (individual or company)
 */
export async function createEventConnectAccount(eventId: number, businessType: 'individual' | 'company' = 'company') {
  // Get event details
  const [event] = await db.select({
    id: events.id,
    name: events.name,
    stripeConnectAccountId: events.stripeConnectAccountId,
  }).from(events).where(eq(events.id, eventId));
  
  if (!event) {
    throw new Error(`Event not found with ID: ${eventId}`);
  }
  
  // Check if event already has a Stripe Connect account
  if (event.stripeConnectAccountId) {
    throw new Error('This event already has a Stripe Connect account');
  }
  
  // Create Stripe Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    business_type: businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: event.name,
      // Website is not available in the events schema, so we'll skip it
    },
  });
  
  // Save Stripe Connect account ID to event record
  await db.update(events)
    .set({
      stripeConnectAccountId: account.id,
      stripeConnectStatus: 'pending',
      stripeConnectEnabled: false,
      stripeConnectDetailsSubmitted: false,
    })
    .where(eq(events.id, eventId));
  
  // Generate onboarding URL
  const accountLink = await generateAccountLink(account.id);
  
  return {
    accountId: account.id,
    accountLinkUrl: accountLink.url
  };
}

/**
 * Generate an account link for onboarding
 * @param accountId Stripe Connect account ID
 */
export async function generateAccountLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.SITE_URL || 'http://localhost:5000'}/admin/stripe-connect/refresh`,
    return_url: `${process.env.SITE_URL || 'http://localhost:5000'}/admin/stripe-connect/return`,
    type: 'account_onboarding',
  });
  
  return accountLink;
}

/**
 * Generate a new account link for an event's existing Connect account
 * @param eventId Event ID
 */
export async function generateEventAccountLink(eventId: number) {
  const accountId = await getEventConnectAccountId(eventId);
  
  if (!accountId) {
    throw new Error('This event does not have a Stripe Connect account');
  }
  
  const accountLink = await generateAccountLink(accountId);
  
  return {
    accountId,
    accountLinkUrl: accountLink.url
  };
}

/**
 * Generate a Stripe Connect dashboard login link
 * @param eventId Event ID
 */
export async function generateEventDashboardLink(eventId: number) {
  const accountId = await getEventConnectAccountId(eventId);
  
  if (!accountId) {
    throw new Error('This event does not have a Stripe Connect account');
  }
  
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  
  return {
    accountId,
    dashboardLink: loginLink.url
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
      hasConnectAccount: false,
      accountId: null,
      accountStatus: null,
    };
  }
  
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    hasConnectAccount: true,
    accountId,
    accountStatus: {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
    },
  };
}