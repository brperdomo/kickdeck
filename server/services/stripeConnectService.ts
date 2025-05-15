/**
 * Stripe Connect Service
 * 
 * This service handles integration with Stripe Connect to allow clubs and tournament
 * organizers to receive payments directly through the platform.
 */

import Stripe from 'stripe';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { clubs } from '@db/schema'; 

// Initialize Stripe with the platform account's secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a new Stripe Connect Express account for a club/organization
 * @param clubId The ID of the club in our database
 * @param email The email of the club's primary contact
 * @param name The name of the club/organization
 * @param businessType The type of business (individual or company)
 * @returns The created Stripe Connect account
 */
export async function createConnectAccount(
  clubId: number,
  email: string,
  name: string,
  businessType: 'individual' | 'company' = 'company'
): Promise<string> {
  // Create a Connect Express account
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    business_type: businessType,
    business_profile: {
      name,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      clubId: String(clubId),
    },
  });

  // Update the club record with the Stripe account ID
  await db
    .update(clubs)
    .set({ 
      stripeConnectAccountId: account.id,
      updatedAt: new Date()
    })
    .where(eq(clubs.id, clubId));

  return account.id;
}

/**
 * Generate an account link URL that redirects the user to Stripe's 
 * Express onboarding flow
 * @param accountId The Stripe account ID
 * @param refreshUrl The URL to redirect on failure
 * @param returnUrl The URL to redirect on success
 * @returns The account link URL
 */
export async function generateAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Get dashboard login link for connected account
 * @param accountId The Stripe Connect account ID
 * @returns Login link URL
 */
export async function generateDashboardLoginLink(
  accountId: string
): Promise<string> {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

/**
 * Get a Connect account by ID
 * @param accountId The Stripe Connect account ID
 * @returns The account details
 */
export async function getConnectAccount(accountId: string) {
  return await stripe.accounts.retrieve(accountId);
}

/**
 * Update a Connect account's external account (bank account)
 * @param accountId The Stripe Connect account ID
 * @param bankAccountToken The bank account token
 */
export async function addBankAccount(
  accountId: string, 
  bankAccountToken: string
) {
  return await stripe.accounts.createExternalAccount(
    accountId,
    { external_account: bankAccountToken }
  );
}

/**
 * Create a payment intent that will be processed on behalf of a connected account
 * @param amount The payment amount in cents
 * @param currency The currency code
 * @param connectAccountId The connected account ID
 * @param applicationFeeAmount The application fee amount in cents
 * @returns The created payment intent
 */
export async function createConnectPaymentIntent(
  amount: number,
  currency: string,
  connectAccountId: string,
  applicationFeeAmount: number
) {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: connectAccountId,
    },
  });
}

/**
 * Create a direct transfer to a connected account
 * @param amount The amount to transfer in cents
 * @param currency The currency code
 * @param connectAccountId The connected account ID
 * @param description Optional description for the transfer
 * @returns The created transfer
 */
export async function createTransferToConnectedAccount(
  amount: number,
  currency: string,
  connectAccountId: string,
  description?: string
) {
  return await stripe.transfers.create({
    amount,
    currency,
    destination: connectAccountId,
    description,
  });
}