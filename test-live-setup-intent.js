/**
 * Test Live Setup Intent Creation
 * 
 * This script tests creating a setup intent with the current configuration
 * to verify it's properly using live mode.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

async function testLiveSetupIntent() {
  console.log('🧪 Testing live setup intent creation...\n');
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  try {
    // Create a setup intent exactly like our application does
    const setupIntent = await stripe.setupIntents.create({
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      usage: 'off_session',
      metadata: {
        teamId: 'test-123',
        test: 'live_mode_verification'
      }
    });

    console.log('✅ Setup Intent Created Successfully:');
    console.log(`ID: ${setupIntent.id}`);
    console.log(`Live Mode: ${setupIntent.livemode}`);
    console.log(`Status: ${setupIntent.status}`);
    console.log(`Client Secret: ${setupIntent.client_secret ? 'Present' : 'Missing'}`);
    
    if (setupIntent.payment_method_configuration_details) {
      console.log(`Payment Method Config: ${setupIntent.payment_method_configuration_details.id}`);
    }

    if (setupIntent.livemode) {
      console.log('\n🎉 SUCCESS: Setup intent is correctly in live mode!');
      console.log('Users should now be able to enter real credit cards.');
    } else {
      console.log('\n❌ ISSUE: Setup intent is still in test mode despite live keys.');
      console.log('This suggests there may be an account restriction or configuration issue.');
    }

  } catch (error) {
    console.error('❌ Error creating setup intent:', error.message);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Type: ${error.type}`);
    
    if (error.code === 'account_invalid') {
      console.log('\n💡 This suggests your Stripe account needs additional verification for live payments.');
    }
  }
}

testLiveSetupIntent().then(() => {
  console.log('\n✅ Test complete');
}).catch(error => {
  console.error('❌ Test failed:', error.message);
});