/**
 * Test Stripe Connect Account Creation Directly
 * 
 * This bypasses authentication to test the actual Stripe API call
 * that's failing in production.
 */

import Stripe from 'stripe';
import { db } from './db/index.js';
import { events } from './db/schema.js';
import { eq } from 'drizzle-orm';

const TEST_EVENT_ID = '1825427780';

async function testStripeConnectDirect() {
  console.log('🔍 Testing Stripe Connect Account Creation Directly...\n');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY not found');
    return;
  }
  
  console.log('✅ Stripe secret key found');
  console.log('Key starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...');
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
  
  try {
    // Check if event exists first
    console.log('\n1. Checking event existence...');
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(TEST_EVENT_ID))
    });
    
    if (!event) {
      console.log('❌ Event not found in database');
      return;
    }
    
    console.log('✅ Event found:', event.name);
    console.log('Current Connect Account ID:', event.stripeConnectAccountId || 'none');
    
    if (event.stripeConnectAccountId) {
      console.log('⚠️  Connect account already exists, testing retrieval...');
      
      try {
        const existingAccount = await stripe.accounts.retrieve(event.stripeConnectAccountId);
        console.log('✅ Existing account retrieved successfully');
        console.log('Account status:', {
          id: existingAccount.id,
          payouts_enabled: existingAccount.payouts_enabled,
          charges_enabled: existingAccount.charges_enabled,
          type: existingAccount.type
        });
        return;
      } catch (retrieveError) {
        console.log('❌ Failed to retrieve existing account:', retrieveError.message);
        console.log('Continuing with new account creation...');
      }
    }
    
    // Test Stripe Connect account creation
    console.log('\n2. Testing Stripe Connect account creation...');
    
    const accountParams = {
      type: 'standard',
      country: 'US',
      email: 'test-tournament@example.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: 'Test Tournament Organization',
      },
      company: {
        name: 'Test Tournament Organization',
      }
    };
    
    console.log('Account parameters:', JSON.stringify(accountParams, null, 2));
    
    const account = await stripe.accounts.create(accountParams);
    console.log('✅ Stripe account created successfully');
    console.log('Account ID:', account.id);
    console.log('Account type:', account.type);
    console.log('Account country:', account.country);
    
    // Test account link creation
    console.log('\n3. Testing account link creation...');
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `https://app.matchpro.ai/admin/events/${TEST_EVENT_ID}/settings?tab=banking&refresh=true`,
      return_url: `https://app.matchpro.ai/admin/events/${TEST_EVENT_ID}/settings?tab=banking&success=true`,
      type: 'account_onboarding',
    });
    
    console.log('✅ Account link created successfully');
    console.log('Onboarding URL created:', !!accountLink.url);
    
    console.log('\n✅ All Stripe operations completed successfully');
    
  } catch (error) {
    console.log('\n❌ Stripe API Error:');
    console.log('Error message:', error.message);
    console.log('Error type:', error.type);
    console.log('Error code:', error.code);
    console.log('Error param:', error.param);
    console.log('Request ID:', error.requestId);
    
    if (error.headers) {
      console.log('Response headers:', error.headers);
    }
    
    // Additional error analysis
    if (error.message.includes('authentication')) {
      console.log('\n🔍 This appears to be a Stripe API key authentication issue');
    } else if (error.message.includes('permission')) {
      console.log('\n🔍 This appears to be a Stripe account permission issue');
    } else if (error.message.includes('country')) {
      console.log('\n🔍 This appears to be a country-specific restriction');
    } else if (error.message.includes('business_type')) {
      console.log('\n🔍 This appears to be a business type validation issue');
    }
  }
}

testStripeConnectDirect().catch(console.error);