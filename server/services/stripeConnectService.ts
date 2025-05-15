/**
 * Stripe Connect Service
 * 
 * This service handles server-side operations for Stripe Connect accounts
 * Used to integrate clubs with direct payment processing via Stripe
 */

import Stripe from 'stripe';
import { db } from '@db';
import { clubs } from '@db/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe with API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required for Stripe Connect');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get a club's Stripe Connect account ID
 */
export async function getConnectAccountId(clubId: number): Promise<string | null> {
  const [club] = await db.select({
    stripeConnectAccountId: clubs.stripeConnectAccountId
  }).from(clubs).where(eq(clubs.id, clubId));
  
  return club?.stripeConnectAccountId || null;
}

/**
 * Create a Stripe Connect account for a club
 * @param clubId Club ID
 * @param businessType Type of business (individual or company)
 */
export async function createConnectAccount(clubId: number, businessType: 'individual' | 'company' = 'company') {
  // Get club details
  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  
  if (!club) {
    throw new Error(`Club not found with ID: ${clubId}`);
  }
  
  // Check if club already has a Stripe Connect account
  if (club.stripeConnectAccountId) {
    throw new Error('Club already has a Stripe Connect account');
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
      name: club.name,
      // Website is not available in the club schema, so we'll skip it
    },
  });
  
  // Save Stripe Connect account ID to club record
  await db.update(clubs)
    .set({
      stripeConnectAccountId: account.id,
      stripeConnectStatus: 'pending',
      stripeConnectEnabled: false,
      stripeConnectDetailsSubmitted: false,
    })
    .where(eq(clubs.id, clubId));
  
  // Generate onboarding URL
  const accountLink = await generateAccountLink(account.id);
  
  return {
    accountId: account.id,
    accountLinkUrl: accountLink.url,
  };
}

/**
 * Generate an account link for onboarding
 * @param accountId Stripe Connect account ID
 */
export async function generateAccountLink(accountId: string) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.APP_URL || 'http://localhost:5000'}/admin/stripe-connect/refresh`,
    return_url: `${process.env.APP_URL || 'http://localhost:5000'}/admin/stripe-connect/return`,
    type: 'account_onboarding',
  });
}

/**
 * Generate a new account link for a club's existing Connect account
 * @param clubId Club ID
 */
export async function generateClubAccountLink(clubId: number) {
  const accountId = await getConnectAccountId(clubId);
  
  if (!accountId) {
    throw new Error('Club does not have a Stripe Connect account');
  }
  
  const accountLink = await generateAccountLink(accountId);
  
  return {
    accountId,
    accountLinkUrl: accountLink.url,
  };
}

/**
 * Generate a Stripe Connect dashboard login link
 * @param clubId Club ID
 */
export async function generateDashboardLink(clubId: number) {
  const accountId = await getConnectAccountId(clubId);
  
  if (!accountId) {
    throw new Error('Club does not have a Stripe Connect account');
  }
  
  const link = await stripe.accounts.createLoginLink(accountId);
  
  return {
    accountId,
    dashboardLink: link.url,
  };
}

/**
 * Get the status of a club's Stripe Connect account
 * @param clubId Club ID
 */
export async function getAccountStatus(clubId: number) {
  const accountId = await getConnectAccountId(clubId);
  
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