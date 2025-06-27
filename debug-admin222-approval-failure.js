#!/usr/bin/env node

/**
 * Debug Admin222 Approval Payment Failure
 * 
 * This script diagnoses why the approval payment failed for team Admin222 (ID: 167)
 * by checking the Setup Intent status and payment method attachment.
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugAdmin222ApprovalFailure() {
  console.log('🔍 Debugging Admin222 Approval Payment Failure');
  console.log('=' .repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();

    // Get team details
    const teamQuery = `
      SELECT id, name, status, setup_intent_id, payment_method_id, 
             stripe_customer_id, payment_intent_id, total_amount,
             payment_status
      FROM teams 
      WHERE id = 167
    `;

    const teamResult = await client.query(teamQuery);
    const team = teamResult.rows[0];

    if (!team) {
      console.log('❌ Team 167 not found');
      return;
    }

    console.log('\n📋 Team Information:');
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status || 'None'}`);
    console.log(`Total Amount: $${team.total_amount / 100}`);
    console.log(`Setup Intent ID: ${team.setup_intent_id || 'None'}`);
    console.log(`Payment Method ID: ${team.payment_method_id || 'None'}`);
    console.log(`Stripe Customer ID: ${team.stripe_customer_id || 'None'}`);
    console.log(`Payment Intent ID: ${team.payment_intent_id || 'None'}`);
    


    // Check Setup Intent in Stripe
    if (team.setup_intent_id) {
      console.log('\n🔍 Checking Setup Intent in Stripe...');
      
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        console.log(`Setup Intent Payment Method: ${setupIntent.payment_method || 'None'}`);
        console.log(`Setup Intent Customer: ${setupIntent.customer || 'None'}`);
        console.log(`Setup Intent Usage: ${setupIntent.usage}`);
        console.log(`Setup Intent Created: ${new Date(setupIntent.created * 1000).toISOString()}`);
        
        if (setupIntent.last_setup_error) {
          console.log(`Setup Intent Error: ${setupIntent.last_setup_error.message}`);
        }
        
        // Check if there are any payment methods attached to customer
        if (setupIntent.customer) {
          console.log('\n🔍 Checking customer payment methods...');
          const paymentMethods = await stripe.paymentMethods.list({
            customer: setupIntent.customer,
            type: 'card'
          });
          
          console.log(`Customer has ${paymentMethods.data.length} payment methods`);
          paymentMethods.data.forEach((pm, index) => {
            console.log(`  ${index + 1}. ${pm.id} - ${pm.card.brand} ****${pm.card.last4}`);
          });
        }
        
        // Analyze the issue
        console.log('\n🎯 Analysis:');
        
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          console.log('✅ Setup Intent is complete with payment method');
          console.log('❌ BUT database is missing payment_method_id - this is the issue!');
          console.log('💡 Solution: Update database with payment method from Setup Intent');
          
          // Offer to fix the database
          console.log('\n🔧 Auto-fix: Updating database with Setup Intent payment method...');
          
          const updateQuery = `
            UPDATE teams 
            SET payment_method_id = $1,
                stripe_customer_id = $2,
                payment_status = 'payment_method_attached'
            WHERE id = $3
          `;
          
          await client.query(updateQuery, [
            setupIntent.payment_method,
            setupIntent.customer,
            team.id
          ]);
          
          console.log('✅ Database updated! Team should now be chargeable on approval.');
          
        } else if (setupIntent.status === 'requires_payment_method') {
          console.log('❌ Setup Intent was never completed by user');
          console.log('💡 Solution: User needs to complete payment setup');
          
        } else if (setupIntent.status === 'requires_confirmation') {
          console.log('❌ Setup Intent needs confirmation');
          console.log('💡 Solution: User needs to confirm payment method');
          
        } else {
          console.log(`❌ Unexpected Setup Intent status: ${setupIntent.status}`);
        }
        
      } catch (stripeError) {
        console.log(`❌ Error retrieving Setup Intent: ${stripeError.message}`);
      }
    } else {
      console.log('❌ No Setup Intent ID found - team has no payment setup');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Summary: Approval payment failed because Setup Intent');
    console.log('   was not properly completed or database was not updated');
    console.log('   with the payment method from the completed Setup Intent.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await client.end();
  }
}

debugAdmin222ApprovalFailure();