/**
 * Debug Team 474 Payment Processing
 * 
 * This script tests the exact payment processing flow that's failing
 * for team 474 during approval attempts.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Database setup
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function debugTeam474Payment() {
  console.log('🔍 Debugging Team 474 Payment Processing\n');
  
  try {
    // Get team 474 details
    const teamResult = await client`
      SELECT t.*, e.stripe_connect_account_id, e.connect_account_status, e.connect_charges_enabled
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = 474
    `;
    
    if (teamResult.length === 0) {
      console.log('❌ Team 474 not found');
      return;
    }
    
    const team = teamResult[0];
    console.log('📋 Team Details:');
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Total Amount: $${team.total_amount / 100}`);
    console.log(`Setup Intent ID: ${team.setup_intent_id}`);
    console.log(`Payment Method ID: ${team.payment_method_id}`);
    console.log(`Customer ID: ${team.stripe_customer_id}`);
    console.log(`Connect Account: ${team.stripe_connect_account_id}`);
    console.log(`Connect Status: ${team.connect_account_status}`);
    console.log(`Connect Charges Enabled: ${team.connect_charges_enabled}\n`);
    
    // Check Setup Intent status
    if (team.setup_intent_id) {
      console.log('🔍 Checking Setup Intent Status:');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        console.log(`Status: ${setupIntent.status}`);
        console.log(`Payment Method: ${setupIntent.payment_method}`);
        console.log(`Customer: ${setupIntent.customer}`);
        console.log(`Usage: ${setupIntent.usage}\n`);
        
        // Check payment method details
        if (setupIntent.payment_method) {
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
          console.log('💳 Payment Method Details:');
          console.log(`Type: ${paymentMethod.type}`);
          console.log(`Customer: ${paymentMethod.customer}`);
          if (paymentMethod.card) {
            console.log(`Card Brand: ${paymentMethod.card.brand}`);
            console.log(`Last 4: ${paymentMethod.card.last4}`);
          }
          console.log();
        }
      } catch (error) {
        console.log(`❌ Error retrieving Setup Intent: ${error.message}\n`);
      }
    }
    
    // Check Connect account status
    if (team.stripe_connect_account_id) {
      console.log('🔍 Checking Connect Account Status:');
      try {
        const account = await stripe.accounts.retrieve(team.stripe_connect_account_id);
        console.log(`Account ID: ${account.id}`);
        console.log(`Charges Enabled: ${account.charges_enabled}`);
        console.log(`Payouts Enabled: ${account.payouts_enabled}`);
        console.log(`Details Submitted: ${account.details_submitted}`);
        console.log(`Type: ${account.type}`);
        
        if (account.requirements) {
          console.log(`Currently Due: ${account.requirements.currently_due?.join(', ') || 'none'}`);
          console.log(`Disabled Reason: ${account.requirements.disabled_reason || 'none'}`);
        }
        console.log();
      } catch (error) {
        console.log(`❌ Error retrieving Connect account: ${error.message}\n`);
      }
    }
    
    // Try to simulate the charge process
    console.log('🧪 Simulating Charge Process:');
    
    if (!team.setup_intent_id) {
      console.log('❌ No Setup Intent ID - team cannot be charged');
      return;
    }
    
    if (!team.stripe_connect_account_id) {
      console.log('❌ No Connect Account ID - cannot use platform fee flow');
      return;
    }
    
    if (team.connect_account_status !== 'active' || !team.connect_charges_enabled) {
      console.log('❌ Connect account not ready for charges');
      return;
    }
    
    // Calculate fees
    const tournamentCost = team.total_amount;
    const platformFeePercentage = 0.04; // 4%
    const platformFeeCents = Math.round(tournamentCost * platformFeePercentage) + 30; // 4% + $0.30
    const totalAmount = tournamentCost + platformFeeCents;
    
    console.log('💰 Fee Calculation:');
    console.log(`Tournament Cost: $${tournamentCost / 100}`);
    console.log(`Platform Fee: $${platformFeeCents / 100}`);
    console.log(`Total to Charge: $${totalAmount / 100}\n`);
    
    // Test the actual charge creation (without executing)
    console.log('⚡ Testing Payment Intent Creation:');
    
    try {
      const paymentIntentParams = {
        amount: totalAmount,
        currency: 'usd',
        payment_method: team.payment_method_id,
        customer: team.stripe_customer_id,
        confirmation_method: 'automatic',
        confirm: false, // Don't actually charge yet
        description: `Rise Cup - ${team.name}`,
        metadata: {
          teamId: '474',
          teamName: team.name,
          eventName: 'Rise Cup',
          tournamentCost: tournamentCost.toString(),
          platformFee: platformFeeCents.toString(),
          totalAmount: totalAmount.toString()
        },
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: team.stripe_connect_account_id
        }
      };
      
      console.log('Payment Intent Parameters:');
      console.log(JSON.stringify(paymentIntentParams, null, 2));
      
      // Create but don't confirm the payment intent
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      console.log(`✅ Payment Intent created successfully: ${paymentIntent.id}`);
      console.log(`Status: ${paymentIntent.status}`);
      console.log(`Amount: $${paymentIntent.amount / 100}`);
      console.log(`Application Fee: $${paymentIntent.application_fee_amount / 100}`);
      
      // Cancel the test payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id);
      console.log('✅ Test Payment Intent cancelled - no actual charge made');
      
    } catch (error) {
      console.log(`❌ Error creating Payment Intent: ${error.message}`);
      if (error.type) {
        console.log(`Error Type: ${error.type}`);
      }
      if (error.code) {
        console.log(`Error Code: ${error.code}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Script error: ${error.message}`);
  } finally {
    await client.end();
  }
}

debugTeam474Payment();