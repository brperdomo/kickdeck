/**
 * Test Stripe Connectivity - ESM version
 * 
 * This script tests both server-side and client-side Stripe connectivity
 * to identify the root cause of the frontend fetch errors.
 */

import { config } from 'dotenv';
config();

console.log('=== STRIPE CONNECTIVITY DIAGNOSIS ===');

// Check environment variables
console.log('\n1. Environment Configuration:');
console.log(`VITE_STRIPE_PUBLISHABLE_KEY exists: ${!!process.env.VITE_STRIPE_PUBLISHABLE_KEY}`);
console.log(`STRIPE_SECRET_KEY exists: ${!!process.env.STRIPE_SECRET_KEY}`);

if (process.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  const pubKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  console.log(`Publishable key starts with: ${pubKey.substring(0, 8)}...`);
  console.log(`Key environment: ${pubKey.includes('test') ? 'TEST' : 'LIVE'}`);
}

// Test Stripe API connectivity from server side
console.log('\n2. Server-side Stripe API Test:');

async function testStripeConnectivity() {
  try {
    // Dynamic import of Stripe
    const Stripe = await import('stripe');
    const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    
    // Test basic API call
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe API connectivity: SUCCESS');
    console.log(`Account ID: ${account.id}`);
    console.log(`Account type: ${account.type}`);
    console.log(`Country: ${account.country}`);
    
    // Test setup intent creation
    console.log('\n3. Setup Intent Creation Test:');
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session',
      metadata: {
        test: 'connectivity_diagnosis'
      }
    });
    
    console.log('✅ Setup Intent creation: SUCCESS');
    console.log(`Setup Intent ID: ${setupIntent.id}`);
    console.log(`Client Secret exists: ${!!setupIntent.client_secret}`);
    console.log(`Status: ${setupIntent.status}`);
    
    // Test retrieving the setup intent
    const retrieved = await stripe.setupIntents.retrieve(setupIntent.id);
    console.log('✅ Setup Intent retrieval: SUCCESS');
    
    return true;
    
  } catch (error) {
    console.log('❌ Stripe API connectivity: FAILED');
    console.log(`Error: ${error.message}`);
    console.log(`Error type: ${error.type}`);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('DIAGNOSIS: Invalid Stripe secret key');
    } else if (error.type === 'StripeConnectionError') {
      console.log('DIAGNOSIS: Network connectivity issue to Stripe');
    }
    
    return false;
  }
}

// Test frontend publishable key format
console.log('\n4. Publishable Key Validation:');
const pubKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (pubKey) {
  if (pubKey.startsWith('pk_test_') || pubKey.startsWith('pk_live_')) {
    console.log('✅ Publishable key format: VALID');
  } else {
    console.log('❌ Publishable key format: INVALID');
    console.log('Key should start with pk_test_ or pk_live_');
  }
} else {
  console.log('❌ Publishable key: MISSING');
}

// Test frontend payment config endpoint
console.log('\n5. Frontend Payment Config Test:');
async function testPaymentConfig() {
  try {
    const fetch = await import('node-fetch');
    const response = await fetch.default('http://localhost:5000/api/payments/config');
    
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Payment config endpoint: SUCCESS');
      console.log(`Publishable key returned: ${config.publishableKey ? 'YES' : 'NO'}`);
      return true;
    } else {
      console.log('❌ Payment config endpoint: FAILED');
      console.log(`Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Payment config endpoint: ERROR');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runDiagnosis() {
  const serverTest = await testStripeConnectivity();
  const configTest = await testPaymentConfig();
  
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  
  if (serverTest && configTest) {
    console.log('✅ Server-side: All tests passed');
    console.log('❌ Frontend issue: Browser-side Stripe connectivity problem');
    console.log('\nLIKELY CAUSES:');
    console.log('1. Corporate firewall blocking r.stripe.com');
    console.log('2. Ad blocker interfering with Stripe resources');
    console.log('3. Content Security Policy blocking Stripe');
    console.log('4. Network connectivity issues to Stripe CDN');
    console.log('\nRECOMMENDATIONS:');
    console.log('1. Test in incognito mode without extensions');
    console.log('2. Check browser developer tools for CSP errors');
    console.log('3. Whitelist *.stripe.com in firewall/security software');
    console.log('4. Try different network connection');
  } else if (!serverTest) {
    console.log('❌ Server-side: API connectivity failed');
    console.log('Problem is with Stripe account or API keys');
  } else {
    console.log('❌ Configuration: Payment endpoints not working');
    console.log('Server configuration issue');
  }
}

runDiagnosis().catch(console.error);