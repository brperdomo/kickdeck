/**
 * Check Stripe Account Capabilities
 * 
 * This script checks your Stripe account's capabilities and restrictions
 * to understand why setup intent confirmation is failing.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function checkAccountCapabilities() {
  console.log('🔍 Checking Stripe account capabilities...\n');
  
  try {
    // Get account information
    const account = await stripe.accounts.retrieve();
    
    console.log('📋 Account Information:');
    console.log(`Account ID: ${account.id}`);
    console.log(`Business Type: ${account.business_type}`);
    console.log(`Country: ${account.country}`);
    console.log(`Default Currency: ${account.default_currency}`);
    console.log(`Charges Enabled: ${account.charges_enabled}`);
    console.log(`Payouts Enabled: ${account.payouts_enabled}`);
    console.log(`Details Submitted: ${account.details_submitted}`);
    
    console.log('\n💳 Capabilities:');
    for (const [capability, status] of Object.entries(account.capabilities || {})) {
      console.log(`${capability}: ${status}`);
    }
    
    console.log('\n📝 Requirements:');
    if (account.requirements) {
      console.log(`Currently Due: ${account.requirements.currently_due?.length || 0} items`);
      if (account.requirements.currently_due?.length > 0) {
        account.requirements.currently_due.forEach(req => {
          console.log(`  - ${req}`);
        });
      }
      
      console.log(`Eventually Due: ${account.requirements.eventually_due?.length || 0} items`);
      if (account.requirements.eventually_due?.length > 0) {
        account.requirements.eventually_due.forEach(req => {
          console.log(`  - ${req}`);
        });
      }
      
      console.log(`Past Due: ${account.requirements.past_due?.length || 0} items`);
      if (account.requirements.past_due?.length > 0) {
        account.requirements.past_due.forEach(req => {
          console.log(`  - ${req}`);
        });
      }
    }
    
    // Test creating a simple setup intent
    console.log('\n🧪 Testing Setup Intent Creation...');
    try {
      const setupIntent = await stripe.setupIntents.create({
        automatic_payment_methods: {
          enabled: true,
        },
        usage: 'off_session',
        metadata: {
          test: 'account_capability_check'
        }
      });
      
      console.log(`✅ Setup Intent Created: ${setupIntent.id}`);
      console.log(`Status: ${setupIntent.status}`);
      console.log(`Client Secret: ${setupIntent.client_secret ? 'Present' : 'Missing'}`);
      
      // Try to retrieve it immediately
      const retrieved = await stripe.setupIntents.retrieve(setupIntent.id);
      console.log(`✅ Setup Intent Retrieved: ${retrieved.status}`);
      
    } catch (setupError) {
      console.log(`❌ Setup Intent Creation Failed: ${setupError.message}`);
      console.log(`Error Code: ${setupError.code}`);
      console.log(`Error Type: ${setupError.type}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking account:', error.message);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Type: ${error.type}`);
  }
}

checkAccountCapabilities();