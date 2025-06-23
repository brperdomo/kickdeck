/**
 * Test Setup Intent Validity Without Processing Real Payments
 * 
 * This script checks the actual Setup Intents in your Stripe account
 * to verify they're valid and ready to be charged when teams are approved.
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testSetupIntentValidity() {
  console.log('Testing Setup Intent validity for stored payment methods...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get a few teams with setup intents to test
    const teamsQuery = `
      SELECT 
        t.id, t.name, t.setup_intent_id, t.total_amount, 
        t.payment_status, t.submitter_email, e.name as event_name
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.setup_intent_id IS NOT NULL 
      AND t.setup_intent_id != ''
      AND t.status = 'registered'
      ORDER BY t.created_at
      LIMIT 5
    `;
    
    const teamsResult = await client.query(teamsQuery);
    const teams = teamsResult.rows;
    
    if (teams.length === 0) {
      console.log('❌ No teams found with setup intents');
      return;
    }
    
    console.log(`Found ${teams.length} teams with setup intents to test:\n`);
    
    let validSetupIntents = 0;
    let invalidSetupIntents = 0;
    
    for (const team of teams) {
      console.log(`\n=== Testing Team: ${team.name} (${team.event_name}) ===`);
      console.log(`Setup Intent ID: ${team.setup_intent_id}`);
      console.log(`Amount to charge: $${team.total_amount / 100}`);
      
      try {
        // Retrieve setup intent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          console.log('✅ VALID - Payment method is attached and ready');
          console.log(`Customer ID: ${setupIntent.customer}`);
          console.log(`Payment Method ID: ${setupIntent.payment_method}`);
          
          // Get payment method details
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            console.log(`Card: ${paymentMethod.card?.brand} ****${paymentMethod.card?.last4}`);
            console.log(`Expires: ${paymentMethod.card?.exp_month}/${paymentMethod.card?.exp_year}`);
          } catch (pmError) {
            console.log(`Could not retrieve payment method details: ${pmError.message}`);
          }
          
          // Test if we can create a payment intent (without confirming it)
          try {
            const testPaymentIntent = await stripe.paymentIntents.create({
              amount: Math.min(team.total_amount, 100), // Test with $1.00 max
              currency: 'usd',
              payment_method: setupIntent.payment_method,
              customer: setupIntent.customer,
              confirm: false, // DON'T confirm - just test creation
              off_session: true,
              metadata: {
                teamId: team.id.toString(),
                teamName: team.name,
                eventType: 'validation_test_only'
              }
            });
            
            console.log('✅ Payment Intent creation test: SUCCESS');
            console.log(`Test Payment Intent ID: ${testPaymentIntent.id} (not confirmed)`);
            
            // Cancel the test payment intent immediately
            await stripe.paymentIntents.cancel(testPaymentIntent.id);
            console.log('✅ Test payment intent cancelled - no charge made');
            
            validSetupIntents++;
            
          } catch (piError) {
            console.log(`❌ Payment Intent creation test FAILED: ${piError.message}`);
            invalidSetupIntents++;
          }
          
        } else if (setupIntent.status === 'requires_payment_method') {
          console.log('❌ INVALID - Customer never completed payment method setup');
          console.log('This team cannot be charged upon approval');
          invalidSetupIntents++;
          
        } else {
          console.log(`❌ INVALID - Setup intent status: ${setupIntent.status}`);
          invalidSetupIntents++;
        }
        
      } catch (stripeError) {
        console.log(`❌ Error retrieving setup intent: ${stripeError.message}`);
        invalidSetupIntents++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Teams tested: ${teams.length}`);
    console.log(`Valid payment methods ready for charging: ${validSetupIntents}`);
    console.log(`Invalid/incomplete payment methods: ${invalidSetupIntents}`);
    console.log(`Success rate: ${((validSetupIntents / teams.length) * 100).toFixed(1)}%`);
    
    if (validSetupIntents > 0) {
      console.log('\n✅ CONCLUSION: Teams with valid setup intents WILL be charged upon approval');
      console.log('The approval workflow should work correctly for these teams');
    } else {
      console.log('\n❌ CONCLUSION: No valid payment methods found');
      console.log('Teams cannot be charged until they complete payment setup');
    }
    
  } catch (error) {
    console.error('Error during validation:', error);
  } finally {
    await client.end();
  }
}

testSetupIntentValidity().catch(console.error);