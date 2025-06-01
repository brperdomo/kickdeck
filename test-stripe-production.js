/**
 * Stripe Production Diagnostic Script
 * 
 * This script tests your live Stripe configuration to identify why cards are being declined
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function diagnosticTests() {
  console.log('🔍 Running Stripe Production Diagnostics...\n');
  
  try {
    // Test 1: Verify API connection
    console.log('1. Testing Stripe API connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.id}`);
    console.log(`   Business name: ${account.business_profile?.name || 'Not set'}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}\n`);
    
    // Test 2: Check account capabilities
    console.log('2. Checking account capabilities...');
    if (!account.charges_enabled) {
      console.log('❌ ISSUE: Charges are not enabled on your Stripe account');
      console.log('   This is likely why cards are being declined');
      console.log('   Please complete your Stripe account setup\n');
    }
    
    // Test 3: Test payment intent creation
    console.log('3. Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 test amount
      currency: 'usd',
      description: 'Production connectivity test',
      metadata: {
        test: 'production_diagnostic'
      }
    });
    console.log(`✅ Payment intent created: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Amount: $${(paymentIntent.amount / 100).toFixed(2)}\n`);
    
    // Test 4: Check for common decline reasons
    console.log('4. Common card decline reasons in production:');
    console.log('   • Insufficient funds');
    console.log('   • Card expired or invalid');
    console.log('   • CVC check failed');
    console.log('   • Bank blocking international transactions');
    console.log('   • Stripe account not fully activated');
    console.log('   • Risk management rules triggered\n');
    
    // Test 5: Recommendations
    console.log('5. Recommendations:');
    console.log('   • Test with a different card');
    console.log('   • Check Stripe Dashboard for decline details');
    console.log('   • Verify your Stripe account is fully activated');
    console.log('   • Contact your bank if using your own card');
    
  } catch (error) {
    console.error('❌ Stripe API Error:', error.message);
    if (error.code === 'account_invalid') {
      console.log('\n🔧 Your Stripe account may not be fully set up for live transactions');
    }
  }
}

diagnosticTests();