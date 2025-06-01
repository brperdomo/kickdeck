/**
 * Diagnose Stripe Mode Issue
 * 
 * This script checks why live Stripe keys are creating test mode setup intents
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

async function diagnoseStripeMode() {
  console.log('🔍 Diagnosing Stripe mode issue...\n');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY;
  
  console.log('📋 Key Information:');
  console.log(`Secret Key: ${secretKey ? secretKey.substring(0, 12) + '...' : 'MISSING'}`);
  console.log(`Publishable Key: ${publishableKey ? publishableKey.substring(0, 12) + '...' : 'MISSING'}`);
  
  // Check if keys match (both should be live)
  const secretIsLive = secretKey?.startsWith('sk_live_');
  const publishableIsLive = publishableKey?.startsWith('pk_live_');
  
  console.log(`\n🔑 Key Types:`);
  console.log(`Secret Key is Live: ${secretIsLive}`);
  console.log(`Publishable Key is Live: ${publishableIsLive}`);
  
  if (!secretKey) {
    console.log('❌ Missing STRIPE_SECRET_KEY');
    return;
  }
  
  // Test Stripe API with the secret key
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
    
    console.log(`\n🧪 Testing Stripe API...`);
    
    // Get account details
    const account = await stripe.accounts.retrieve();
    console.log(`Account ID: ${account.id}`);
    console.log(`Account Email: ${account.email || 'Not set'}`);
    console.log(`Charges Enabled: ${account.charges_enabled}`);
    console.log(`Payouts Enabled: ${account.payouts_enabled}`);
    
    // Check account capabilities
    console.log(`\n📊 Account Capabilities:`);
    const capabilities = account.capabilities || {};
    for (const [capability, status] of Object.entries(capabilities)) {
      console.log(`  ${capability}: ${status}`);
    }
    
    // Create a test setup intent to check the mode
    console.log(`\n🧪 Creating test setup intent...`);
    const setupIntent = await stripe.setupIntents.create({
      automatic_payment_methods: {
        enabled: true,
      },
      usage: 'off_session',
      metadata: {
        test: 'mode_diagnosis'
      }
    });
    
    console.log(`\n📝 Setup Intent Results:`);
    console.log(`Setup Intent ID: ${setupIntent.id}`);
    console.log(`Live Mode: ${setupIntent.livemode}`);
    console.log(`Status: ${setupIntent.status}`);
    
    if (!setupIntent.livemode && secretIsLive) {
      console.log('\n❌ CRITICAL ISSUE: Using live keys but setup intent created in test mode!');
      console.log('This suggests your Stripe account may be restricted or not fully activated.');
      console.log('\nPossible causes:');
      console.log('1. Account not fully activated for live payments');
      console.log('2. Account restricted due to compliance issues');
      console.log('3. Payment method configurations forcing test mode');
    } else if (setupIntent.livemode && secretIsLive) {
      console.log('\n✅ Keys and setup intent mode are correctly configured for live mode.');
    }
    
    // Check payment method configurations
    console.log(`\n🔧 Checking payment method configurations...`);
    const configs = await stripe.paymentMethodConfigurations.list({
      limit: 10
    });
    
    console.log(`Found ${configs.data.length} payment method configurations:`);
    
    for (const config of configs.data) {
      console.log(`\n  Configuration ID: ${config.id}`);
      console.log(`  Name: ${config.name || 'Default'}`);
      console.log(`  Live Mode: ${config.livemode}`);
      console.log(`  Is Default: ${config.is_default}`);
      
      if (!config.livemode && config.is_default) {
        console.log('  ❌ WARNING: This test configuration is set as default!');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error testing Stripe API:', error.message);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Type: ${error.type}`);
    
    if (error.code === 'account_invalid') {
      console.log('\n💡 This suggests your Stripe account is not properly activated for live payments.');
    }
  }
}

diagnoseStripeMode().then(() => {
  console.log('\n✅ Diagnosis complete');
}).catch(error => {
  console.error('❌ Diagnosis failed:', error.message);
});