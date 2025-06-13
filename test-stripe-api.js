/**
 * Test Stripe API directly to identify the Connect account creation issue
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

async function testStripeAPI() {
  console.log('Testing Stripe API directly...\n');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY not found');
    return;
  }
  
  console.log('✅ Stripe secret key found');
  console.log('Key type:', process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST');
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
  
  try {
    // Test basic API connectivity
    console.log('\n1. Testing basic API connectivity...');
    const balance = await stripe.balance.retrieve();
    console.log('✅ API connection successful');
    
    // Test Connect account creation
    console.log('\n2. Testing Connect account creation...');
    
    const accountParams = {
      type: 'standard',
      country: 'US',
      email: 'test-' + Date.now() + '@example.com',
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
    
    console.log('Creating account with params:', JSON.stringify(accountParams, null, 2));
    
    const account = await stripe.accounts.create(accountParams);
    console.log('✅ Connect account created successfully');
    console.log('Account ID:', account.id);
    console.log('Account type:', account.type);
    
    // Test account link creation
    console.log('\n3. Testing account link creation...');
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://app.matchpro.ai/admin/events/test/settings?tab=banking&refresh=true',
      return_url: 'https://app.matchpro.ai/admin/events/test/settings?tab=banking&success=true',
      type: 'account_onboarding',
    });
    
    console.log('✅ Account link created successfully');
    console.log('Onboarding URL length:', accountLink.url.length);
    
    console.log('\n✅ All Stripe operations successful - the API is working correctly');
    
  } catch (error) {
    console.log('\n❌ Stripe API Error Details:');
    console.log('Message:', error.message);
    console.log('Type:', error.type);
    console.log('Code:', error.code);
    console.log('Param:', error.param);
    console.log('Request ID:', error.requestId);
    console.log('Status Code:', error.statusCode);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n🔍 This is a Stripe authentication error - check API key validity');
    } else if (error.type === 'StripePermissionError') {
      console.log('\n🔍 This is a Stripe permission error - account may not have Connect enabled');
    } else if (error.code === 'account_country_invalid_address') {
      console.log('\n🔍 This is a country/address validation error');
    } else if (error.code === 'email_invalid') {
      console.log('\n🔍 This is an email validation error');
    }
  }
}

testStripeAPI().catch(console.error);