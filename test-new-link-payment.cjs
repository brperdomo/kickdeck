/**
 * Test Link Payment with New Setup Intent
 * Creates a fresh Link payment Setup Intent and team registration
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

async function createNewLinkPaymentTest() {
  try {
    console.log('Creating new Link payment Setup Intent...');
    
    // Create Setup Intent for Link payment type
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['link'],
      usage: 'off_session',
      metadata: {
        eventId: '1755746106',
        teamName: 'New Link Test Team',
        test_mode: 'true'
      }
    });
    
    console.log(`Created Setup Intent: ${setupIntent.id}`);
    console.log(`Client Secret: ${setupIntent.client_secret}`);
    console.log(`Status: ${setupIntent.status}`);
    
    // Since we can't complete Link payments programmatically, just show the data needed
    console.log('\n=== MANUAL STEPS REQUIRED ===');
    console.log('1. Use this client secret in the frontend to complete the Link payment setup');
    console.log('2. After completion, create a team registration with the confirmed Setup Intent');
    console.log('3. Test the approval workflow');
    
    console.log(`\nSetup Intent ID: ${setupIntent.id}`);
    console.log(`Client Secret: ${setupIntent.client_secret}`);
    
  } catch (error) {
    console.error('Error creating Setup Intent:', error);
  }
}

createNewLinkPaymentTest();