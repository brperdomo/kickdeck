/**
 * Debug Stripe Connectivity Issue
 * 
 * This script tests Stripe connectivity to identify why the frontend
 * is getting "Failed to fetch https://r.stripe.com/b" errors.
 */

// Test if the environment has the correct Stripe key
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
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
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
    console.log(`Client Secret: ${setupIntent.client_secret}`);
    console.log(`Status: ${setupIntent.status}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Stripe API connectivity: FAILED');
    console.log(`Error: ${error.message}`);
    
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

// Run the test
testStripeConnectivity().then(success => {
  if (success) {
    console.log('\n=== DIAGNOSIS SUMMARY ===');
    console.log('✅ Server-side Stripe connectivity is working');
    console.log('✅ API keys are valid');
    console.log('❌ Frontend issue: Likely browser or CSP blocking Stripe resources');
    console.log('\nRECOMMENDATIONS:');
    console.log('1. Check browser console for CSP errors');
    console.log('2. Verify no ad blockers are interfering');
    console.log('3. Test in incognito mode');
    console.log('4. Check if corporate firewall is blocking r.stripe.com');
  } else {
    console.log('\n=== DIAGNOSIS SUMMARY ===');
    console.log('❌ Server-side Stripe connectivity failed');
    console.log('Problem is with API keys or account configuration');
  }
}).catch(error => {
  console.error('Diagnosis script failed:', error);
});