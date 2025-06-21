/**
 * Process Real Payment for Team B2017 Academy-1
 * 
 * This script attempts to collect the actual payment from the customer
 * since no real charge has been made yet.
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function processRealPayment() {
  console.log('Attempting to process real payment for team B2017 Academy-1...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    const teamQuery = `
      SELECT id, name, total_amount, setup_intent_id, 
             manager_email, submitter_email
      FROM teams 
      WHERE name = 'B2017 Academy-1'
    `;
    
    const teamResult = await client.query(teamQuery);
    const team = teamResult.rows[0];
    
    console.log(`Team: ${team.name}`);
    console.log(`Amount due: $${team.total_amount / 100}`);
    console.log(`Setup Intent: ${team.setup_intent_id}`);
    
    // Check if setup intent was ever completed
    const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
    
    if (setupIntent.status === 'requires_payment_method') {
      console.log('\n❌ CANNOT PROCESS PAYMENT');
      console.log('Customer never completed payment method setup during registration');
      console.log('We need to collect payment information from the customer');
      
      // Create new setup intent for customer to complete payment
      const newSetupIntent = await stripe.setupIntents.create({
        customer: setupIntent.customer || undefined,
        usage: 'off_session',
        metadata: {
          teamId: team.id.toString(),
          teamName: team.name,
          purpose: 'complete_delayed_payment'
        }
      });
      
      console.log('\n✅ NEW PAYMENT SETUP CREATED');
      console.log(`New Setup Intent: ${newSetupIntent.id}`);
      console.log(`Client Secret: ${newSetupIntent.client_secret}`);
      
      // Update team status to indicate payment collection needed
      await client.query(`
        UPDATE teams 
        SET payment_status = 'collection_required',
            setup_intent_id = $1,
            notes = COALESCE(notes, '') || ' | New payment setup required - customer must complete payment'
        WHERE id = $2
      `, [newSetupIntent.id, team.id]);
      
      console.log('\nACTION REQUIRED:');
      console.log('1. Contact the team manager to complete payment');
      console.log(`2. Email: ${team.manager_email || team.submitter_email}`);
      console.log('3. Direct them to complete payment setup');
      console.log(`4. Payment URL: ${process.env.PUBLIC_URL}/complete-payment/${team.id}?setup_intent=${newSetupIntent.client_secret}`);
      
      return {
        success: false,
        action: 'customer_payment_required',
        setupIntentId: newSetupIntent.id,
        paymentUrl: `${process.env.PUBLIC_URL}/complete-payment/${team.id}?setup_intent=${newSetupIntent.client_secret}`
      };
      
    } else if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
      console.log('\n✅ PROCESSING REAL PAYMENT');
      console.log('Customer payment method is available');
      
      // Process the actual payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: team.total_amount,
        currency: 'usd',
        customer: setupIntent.customer,
        payment_method: setupIntent.payment_method,
        confirm: true,
        off_session: true,
        metadata: {
          teamId: team.id.toString(),
          teamName: team.name,
          eventType: 'delayed_approval_payment'
        }
      });
      
      if (paymentIntent.status === 'succeeded') {
        // Update team with real payment
        await client.query(`
          UPDATE teams 
          SET payment_intent_id = $1,
              payment_status = 'paid',
              payment_method_id = $2,
              notes = COALESCE(notes, '') || ' | Real payment processed after approval'
        WHERE id = $3
        `, [paymentIntent.id, setupIntent.payment_method, team.id]);
        
        // Update payment transaction with real payment intent
        await client.query(`
          UPDATE payment_transactions 
          SET payment_intent_id = $1,
              notes = 'Updated with real Stripe payment intent'
          WHERE team_id = $2 AND payment_intent_id LIKE 'pi_manual_%'
        `, [paymentIntent.id, team.id]);
        
        console.log('✅ REAL PAYMENT SUCCESSFUL');
        console.log(`Payment Intent: ${paymentIntent.id}`);
        console.log(`Amount charged: $${team.total_amount / 100}`);
        
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: team.total_amount / 100
        };
      } else {
        console.log(`❌ Payment failed: ${paymentIntent.status}`);
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`
        };
      }
    }
    
  } catch (error) {
    console.log(`Error processing real payment: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await client.end();
  }
}

processRealPayment().then(result => {
  console.log('\n=== FINAL RESULT ===');
  if (result.success) {
    console.log('Real payment has been processed in Stripe');
  } else if (result.action === 'customer_payment_required') {
    console.log('Customer must complete payment setup to be charged');
    console.log('No money has been collected yet');
  } else {
    console.log('Payment processing failed');
  }
}).catch(console.error);