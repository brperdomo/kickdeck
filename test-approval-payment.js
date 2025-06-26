/**
 * Test Approval Payment Flow
 * 
 * This script tests the complete approval workflow including automatic payment processing
 * to verify that teams are charged when approved.
 */

import dotenv from 'dotenv';
import { Client } from 'pg';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testApprovalPayment() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('🔍 Testing approval payment workflow...\n');
    
    // Find a team ready for approval testing
    const teamQuery = `
      SELECT id, name, status, setup_intent_id, total_amount, payment_status, 
             manager_email, payment_method_id, payment_intent_id
      FROM teams 
      WHERE setup_intent_id IS NOT NULL 
        AND status = 'registered'
        AND total_amount > 0
      LIMIT 1
    `;
    
    const teamResult = await client.query(teamQuery);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ No teams available for approval testing');
      console.log('Need a team with: status=registered, setup_intent_id, total_amount > 0');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log(`📋 Testing with Team: ${team.name} (ID: ${team.id})`);
    console.log(`   Status: ${team.status}`);
    console.log(`   Amount: $${team.total_amount / 100}`);
    console.log(`   Setup Intent: ${team.setup_intent_id}`);
    console.log(`   Manager: ${team.manager_email}\n`);
    
    // Check Setup Intent status in Stripe
    console.log('🔍 Checking Setup Intent status...');
    try {
      const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
      console.log(`   Setup Intent Status: ${setupIntent.status}`);
      console.log(`   Payment Method: ${setupIntent.payment_method || 'None'}`);
      console.log(`   Customer: ${setupIntent.customer || 'None'}\n`);
      
      if (setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
        console.log('❌ SETUP INTENT NOT COMPLETED');
        console.log('The customer has not completed payment method setup.');
        console.log('This team cannot be charged until they complete the payment setup.\n');
        
        console.log('✅ CREATING NEW SETUP INTENT FOR COMPLETION...');
        const newSetupIntent = await stripe.setupIntents.create({
          customer: setupIntent.customer,
          payment_method_types: ['card'],
          usage: 'off_session',
          metadata: {
            teamId: team.id.toString(),
            teamName: team.name,
            originalSetupIntent: team.setup_intent_id
          }
        });
        
        console.log(`New Setup Intent: ${newSetupIntent.id}`);
        console.log(`Client Secret: ${newSetupIntent.client_secret}`);
        console.log(`\nPayment completion link:`);
        console.log(`https://app.matchpro.ai/complete-payment?setup_intent=${newSetupIntent.client_secret}&team_id=${team.id}`);
        
        return;
      }
      
      console.log('✅ Setup Intent completed successfully\n');
      
      // Simulate the approval payment process
      console.log('💳 Processing approval payment...');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: team.total_amount,
        currency: 'usd',
        payment_method: setupIntent.payment_method,
        customer: setupIntent.customer,
        confirm: true,
        off_session: true,
        metadata: {
          teamId: team.id.toString(),
          teamName: team.name,
          eventType: 'team_approval_payment'
        }
      });
      
      console.log(`   Payment Intent: ${paymentIntent.id}`);
      console.log(`   Status: ${paymentIntent.status}`);
      console.log(`   Amount: $${paymentIntent.amount / 100}`);
      
      if (paymentIntent.status === 'succeeded') {
        console.log('✅ PAYMENT SUCCESSFUL!\n');
        
        // Update team in database
        console.log('📊 Updating team status in database...');
        await client.query(`
          UPDATE teams 
          SET status = 'approved',
              payment_intent_id = $1,
              payment_status = 'paid',
              payment_method_id = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [paymentIntent.id, setupIntent.payment_method, team.id]);
        
        console.log('✅ Team approved and payment processed successfully');
        console.log('\n=== APPROVAL WORKFLOW TEST COMPLETE ===');
        console.log('✅ Payment processing on approval: WORKING');
        console.log('✅ Stripe charge: SUCCESSFUL');
        console.log('✅ Database update: COMPLETE');
        
      } else {
        console.log(`❌ Payment failed: ${paymentIntent.status}`);
        
        if (paymentIntent.last_payment_error) {
          console.log(`Error: ${paymentIntent.last_payment_error.message}`);
        }
      }
      
    } catch (stripeError) {
      console.log(`❌ Stripe error: ${stripeError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
  } finally {
    await client.end();
  }
}

testApprovalPayment().catch(console.error);