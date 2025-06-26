/**
 * Debug Test 12 Team Approval Issue
 * 
 * This script investigates why Test 12 team approval results in "payment required"
 * instead of processing the payment from the Setup Intent.
 */

import dotenv from 'dotenv';
import { Client } from 'pg';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugTest12Approval() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('=== DEBUGGING TEST 12 APPROVAL ISSUE ===\n');
    
    // Get Test 12 team data
    const teamResult = await client.query(`
      SELECT id, name, status, payment_status, setup_intent_id, payment_method_id, 
             stripe_customer_id, total_amount, manager_email, created_at
      FROM teams 
      WHERE name = 'Test 12'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ Test 12 team not found');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log('📋 Team Data:');
    console.log(`ID: ${team.id}`);
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Setup Intent: ${team.setup_intent_id}`);
    console.log(`Payment Method: ${team.payment_method_id || 'null'}`);
    console.log(`Customer ID: ${team.stripe_customer_id || 'null'}`);
    console.log(`Amount: $${team.total_amount / 100}`);
    console.log(`Manager Email: ${team.manager_email}`);
    console.log(`Created: ${team.created_at}\n`);
    
    // Check Setup Intent in Stripe
    if (team.setup_intent_id) {
      console.log('🔍 Checking Setup Intent in Stripe...');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        console.log(`Setup Intent ID: ${setupIntent.id}`);
        console.log(`Status: ${setupIntent.status}`);
        console.log(`Payment Method: ${setupIntent.payment_method || 'null'}`);
        console.log(`Customer: ${setupIntent.customer || 'null'}`);
        console.log(`Created: ${new Date(setupIntent.created * 1000).toISOString()}`);
        
        if (setupIntent.last_setup_error) {
          console.log(`Last Error: ${setupIntent.last_setup_error.message}`);
        }
        
        // This explains why payment_method_id is null in database
        if (!setupIntent.payment_method) {
          console.log('\n❌ ISSUE FOUND: Setup Intent has no payment method attached');
          console.log('This means the Setup Intent was created but never confirmed by the user');
          console.log('The registration flow may have been interrupted before payment completion');
        }
        
        if (setupIntent.status !== 'succeeded') {
          console.log(`\n❌ ISSUE FOUND: Setup Intent status is "${setupIntent.status}", not "succeeded"`);
          console.log('This means the payment method was never properly confirmed');
        }
        
      } catch (stripeError) {
        console.log(`❌ Stripe API Error: ${stripeError.message}`);
      }
    }
    
    // Simulate what happens during approval
    console.log('\n⚡ Simulating Approval Process...');
    
    if (!team.setup_intent_id) {
      console.log('❌ No Setup Intent - approval would return "no_payment_method"');
    } else if (!team.payment_method_id && !team.stripe_customer_id) {
      console.log('❌ No payment method ID and no customer - checking Setup Intent...');
      
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        
        if (setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
          console.log('❌ Setup Intent incomplete - approval would update status to "payment_required"');
          console.log('This matches the behavior you observed');
          
          console.log('\n📋 What the approval function does:');
          console.log('1. Checks Setup Intent status');
          console.log('2. Finds status is not "succeeded" or no payment method');
          console.log('3. Updates team payment_status to "payment_required"');
          console.log('4. Adds note about incomplete Setup Intent');
          console.log('5. Returns "payment_method_incomplete"');
        }
        
      } catch (error) {
        console.log(`❌ Error checking Setup Intent: ${error.message}`);
      }
    }
    
    console.log('\n🔧 SOLUTION:');
    console.log('The team needs to complete their payment setup properly.');
    console.log('This happens when:');
    console.log('1. User starts registration but doesn\'t complete payment step');
    console.log('2. Payment form has errors during Setup Intent confirmation');
    console.log('3. User closes browser before payment completion');
    console.log('4. Network issues during payment confirmation');
    
    console.log('\nTo fix this specific team:');
    console.log('1. Team should re-register with proper payment completion, OR');
    console.log('2. Admin should manually collect payment outside the system, OR');
    console.log('3. Create a manual payment collection process for incomplete registrations');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

debugTest12Approval().catch(console.error);