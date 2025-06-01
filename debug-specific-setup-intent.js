/**
 * Debug the specific setup intent that's failing
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugSpecificSetupIntent() {
  console.log('🔍 Debugging specific setup intent...\n');
  
  try {
    // Check the specific failing setup intent
    const setupIntentId = 'seti_1RVGscCGdBwOWAK0oYG9iczh';
    
    console.log(`Retrieving setup intent: ${setupIntentId}`);
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    console.log(`Status: ${setupIntent.status}`);
    console.log(`Client secret exists: ${!!setupIntent.client_secret}`);
    console.log(`Payment method: ${setupIntent.payment_method || 'None'}`);
    console.log(`Usage: ${setupIntent.usage}`);
    console.log(`Customer: ${setupIntent.customer || 'None'}`);
    
    if (setupIntent.last_setup_error) {
      console.log('\n❌ Last setup error:');
      console.log(`Code: ${setupIntent.last_setup_error.code}`);
      console.log(`Message: ${setupIntent.last_setup_error.message}`);
      console.log(`Type: ${setupIntent.last_setup_error.type}`);
    }
    
    // Check account capabilities more thoroughly
    console.log('\n🔍 Checking account capabilities...');
    const account = await stripe.accounts.retrieve();
    
    console.log(`Card payments: ${account.capabilities?.card_payments}`);
    console.log(`Transfers: ${account.capabilities?.transfers}`);
    
    if (account.requirements?.errors?.length > 0) {
      console.log('\n❌ Account errors:');
      account.requirements.errors.forEach(error => {
        console.log(`  - ${error.code}: ${error.reason}`);
      });
    }
    
    // Try to create a new setup intent with more debugging info
    console.log('\n🧪 Creating test setup intent with debug info...');
    const testSetupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        debug: 'production_test',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`✅ New test setup intent: ${testSetupIntent.id}`);
    console.log(`Status: ${testSetupIntent.status}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
    if (error.type) {
      console.log(`Error type: ${error.type}`);
    }
  }
}

debugSpecificSetupIntent();