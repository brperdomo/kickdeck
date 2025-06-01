/**
 * Debug Setup Intent 402 Error
 * 
 * This script investigates the specific 402 error you're getting
 * with setup intent confirmation in production.
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugSetupIntentIssue() {
  console.log('🔍 Debugging Setup Intent 402 Error...\n');
  
  try {
    // Check account status thoroughly
    console.log('1. Checking account status...');
    const account = await stripe.accounts.retrieve();
    
    console.log(`Account ID: ${account.id}`);
    console.log(`Charges enabled: ${account.charges_enabled}`);
    console.log(`Payouts enabled: ${account.payouts_enabled}`);
    console.log(`Details submitted: ${account.details_submitted}`);
    console.log(`Past due: ${account.requirements?.past_due?.length || 0} items`);
    console.log(`Currently due: ${account.requirements?.currently_due?.length || 0} items`);
    
    if (account.requirements?.past_due?.length > 0) {
      console.log('\n❌ CRITICAL: Past due requirements:');
      account.requirements.past_due.forEach(req => console.log(`  - ${req}`));
    }
    
    if (account.requirements?.currently_due?.length > 0) {
      console.log('\n⚠️ Currently due requirements:');
      account.requirements.currently_due.forEach(req => console.log(`  - ${req}`));
    }
    
    // Test setup intent creation
    console.log('\n2. Testing setup intent creation...');
    const setupIntent = await stripe.setupIntents.create({
      customer: undefined, // Test without customer first
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        test: 'debug_402_error'
      }
    });
    
    console.log(`✅ Setup intent created: ${setupIntent.id}`);
    console.log(`Status: ${setupIntent.status}`);
    console.log(`Client secret available: ${!!setupIntent.client_secret}`);
    
    // Check for account issues that cause 402
    console.log('\n3. Checking for common 402 causes...');
    
    if (!account.charges_enabled) {
      console.log('❌ ISSUE: Account cannot accept charges');
    }
    
    if (account.requirements?.disabled_reason) {
      console.log(`❌ ISSUE: Account disabled - ${account.requirements.disabled_reason}`);
    }
    
    // Check balance for negative amounts (debt)
    try {
      const balance = await stripe.balance.retrieve();
      console.log('\n4. Account balance check...');
      balance.available.forEach(bal => {
        console.log(`${bal.currency.toUpperCase()}: ${bal.amount / 100}`);
        if (bal.amount < 0) {
          console.log(`❌ NEGATIVE BALANCE DETECTED in ${bal.currency.toUpperCase()}`);
          console.log('This can cause 402 errors on setup intents');
        }
      });
    } catch (err) {
      console.log('Could not retrieve balance:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error during diagnostics:', error.message);
    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
  }
}

debugSetupIntentIssue();