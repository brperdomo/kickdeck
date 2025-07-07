/**
 * Test Production Payment Processing
 * 
 * This script tests the exact payment processing flow for teams 472 and 474
 * to identify why payment processing is failing in production.
 */

import 'dotenv/config';
import postgres from 'postgres';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = postgres(process.env.DATABASE_URL);

async function testPaymentProcessing() {
  console.log('🔍 Testing Production Payment Processing\n');
  
  try {
    // Test teams 472 and 474
    const testTeams = [472, 474];
    
    for (const teamId of testTeams) {
      console.log(`\n=== Testing Team ${teamId} ===`);
      
      // Get team and event details
      const teamResult = await client`
        SELECT t.*, e.stripe_connect_account_id, e.connect_account_status, e.connect_charges_enabled, e.name as event_name
        FROM teams t
        JOIN events e ON t.event_id = e.id
        WHERE t.id = ${teamId}
      `;
      
      if (teamResult.length === 0) {
        console.log(`❌ Team ${teamId} not found`);
        continue;
      }
      
      const team = teamResult[0];
      console.log(`Team: ${team.name}`);
      console.log(`Event: ${team.event_name}`);
      console.log(`Payment Status: ${team.payment_status}`);
      console.log(`Total Amount: $${team.total_amount / 100}`);
      console.log(`Setup Intent: ${team.setup_intent_id}`);
      console.log(`Payment Method: ${team.payment_method_id}`);
      console.log(`Customer ID: ${team.stripe_customer_id}`);
      console.log(`Connect Account: ${team.stripe_connect_account_id}`);
      console.log(`Connect Status: ${team.connect_account_status}`);
      console.log(`Connect Charges Enabled: ${team.connect_charges_enabled}`);
      
      // Test 1: Validate Connect account readiness
      console.log('\n🧪 Test 1: Connect Account Validation');
      if (!team.stripe_connect_account_id || 
          team.connect_account_status !== 'active' || 
          !team.connect_charges_enabled) {
        console.log('❌ FAIL: Connect account not properly configured');
        console.log(`  Account ID: ${team.stripe_connect_account_id || 'missing'}`);
        console.log(`  Status: ${team.connect_account_status || 'missing'}`);
        console.log(`  Charges Enabled: ${team.connect_charges_enabled || 'missing'}`);
        continue;
      }
      console.log('✅ PASS: Connect account is properly configured');
      
      // Test 2: Check Setup Intent status
      console.log('\n🧪 Test 2: Setup Intent Validation');
      if (!team.setup_intent_id) {
        console.log('❌ FAIL: No Setup Intent ID');
        continue;
      }
      
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        
        if (setupIntent.status !== 'succeeded') {
          console.log('❌ FAIL: Setup Intent not succeeded');
          console.log(`  Current status: ${setupIntent.status}`);
          continue;
        }
        
        if (!setupIntent.payment_method) {
          console.log('❌ FAIL: Setup Intent has no payment method');
          continue;
        }
        
        console.log('✅ PASS: Setup Intent is valid and succeeded');
        
        // Test 3: Payment Method validation
        console.log('\n🧪 Test 3: Payment Method Validation');
        const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
        console.log(`Payment Method Type: ${paymentMethod.type}`);
        console.log(`Payment Method Customer: ${paymentMethod.customer}`);
        
        // Test 4: Customer validation for non-Link payments
        console.log('\n🧪 Test 4: Customer Validation');
        if (paymentMethod.type === 'link') {
          console.log('✅ PASS: Link payment - customer should be NULL');
          if (team.stripe_customer_id !== null) {
            console.log('⚠️  WARNING: Link payment has customer ID, should be NULL');
          }
        } else {
          if (!team.stripe_customer_id) {
            console.log('❌ FAIL: Regular payment method but no customer ID');
            continue;
          }
          
          try {
            const customer = await stripe.customers.retrieve(team.stripe_customer_id);
            console.log(`✅ PASS: Customer ${customer.id} exists`);
          } catch (error) {
            console.log(`❌ FAIL: Customer ${team.stripe_customer_id} not found - ${error.message}`);
            continue;
          }
        }
        
        // Test 5: Simulate payment creation (without actually charging)
        console.log('\n🧪 Test 5: Payment Intent Simulation');
        
        const tournamentCost = team.total_amount;
        const platformFeePercentage = 0.04; // 4%
        const platformFeeCents = Math.round(tournamentCost * platformFeePercentage) + 30; // 4% + $0.30
        const totalAmount = tournamentCost + platformFeeCents;
        
        console.log(`Tournament Cost: $${tournamentCost / 100}`);
        console.log(`Platform Fee: $${platformFeeCents / 100}`);
        console.log(`Total Amount: $${totalAmount / 100}`);
        
        const paymentIntentParams = {
          amount: totalAmount,
          currency: 'usd',
          payment_method: setupIntent.payment_method,
          confirmation_method: 'automatic',
          confirm: false, // Don't actually charge
          description: `${team.event_name} - ${team.name}`,
          application_fee_amount: platformFeeCents,
          transfer_data: {
            destination: team.stripe_connect_account_id
          },
          metadata: {
            teamId: teamId.toString(),
            teamName: team.name,
            eventName: team.event_name,
            testRun: 'true'
          }
        };
        
        // For non-Link payments, include customer
        if (paymentMethod.type !== 'link' && team.stripe_customer_id) {
          paymentIntentParams.customer = team.stripe_customer_id;
        }
        
        try {
          const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
          console.log(`✅ PASS: Payment Intent created successfully - ${paymentIntent.id}`);
          console.log(`   Status: ${paymentIntent.status}`);
          console.log(`   Amount: $${paymentIntent.amount / 100}`);
          console.log(`   Application Fee: $${paymentIntent.application_fee_amount / 100}`);
          
          // Cancel the test payment intent
          await stripe.paymentIntents.cancel(paymentIntent.id);
          console.log('✅ Test Payment Intent cancelled');
          
        } catch (paymentError) {
          console.log(`❌ FAIL: Payment Intent creation failed - ${paymentError.message}`);
          if (paymentError.type) {
            console.log(`   Error Type: ${paymentError.type}`);
          }
          if (paymentError.code) {
            console.log(`   Error Code: ${paymentError.code}`);
          }
        }
        
      } catch (setupIntentError) {
        console.log(`❌ FAIL: Setup Intent retrieval failed - ${setupIntentError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Script error: ${error.message}`);
  } finally {
    await client.end();
  }
}

testPaymentProcessing();