/**
 * Complete Incomplete Team Registrations
 * 
 * This script identifies teams with incomplete Setup Intents and provides
 * options to either complete their payment setup or mark them for manual payment.
 */

import dotenv from 'dotenv';
import { Client } from 'pg';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function completeIncompleteRegistrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('=== COMPLETING INCOMPLETE TEAM REGISTRATIONS ===\n');
    
    // Find teams with Setup Intents but no payment methods
    const teamsResult = await client.query(`
      SELECT id, name, status, payment_status, setup_intent_id, payment_method_id, 
             stripe_customer_id, total_amount, manager_email, created_at
      FROM teams 
      WHERE setup_intent_id IS NOT NULL 
        AND payment_method_id IS NULL
        AND status IN ('registered', 'approved')
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${teamsResult.rows.length} teams with incomplete Setup Intents\n`);
    
    for (const team of teamsResult.rows) {
      console.log(`\n--- Team: ${team.name} (ID: ${team.id}) ---`);
      console.log(`Status: ${team.status}`);
      console.log(`Payment Status: ${team.payment_status}`);
      console.log(`Amount: $${team.total_amount / 100}`);
      console.log(`Setup Intent: ${team.setup_intent_id}`);
      
      // Check Setup Intent status
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        
        if (setupIntent.status === 'requires_payment_method') {
          console.log('❌ Setup Intent was never completed by user');
          
          // Option 1: Create a new Setup Intent for this team
          console.log('🔧 Creating new Setup Intent for completion...');
          
          const newSetupIntent = await stripe.setupIntents.create({
            usage: 'off_session',
            metadata: {
              teamId: team.id.toString(),
              teamName: team.name,
              originalSetupIntent: team.setup_intent_id,
              eventType: 'incomplete_registration_recovery'
            }
          });
          
          // Update team with new Setup Intent
          await client.query(`
            UPDATE teams 
            SET setup_intent_id = $1,
                payment_status = 'setup_intent_created',
                notes = COALESCE(notes || E'\n', '') || 'New Setup Intent created for incomplete registration: ' || $2
            WHERE id = $3
          `, [newSetupIntent.id, newSetupIntent.id, team.id]);
          
          console.log(`✅ New Setup Intent created: ${newSetupIntent.id}`);
          console.log(`✅ Team updated with new Setup Intent`);
          
          // Generate completion URL
          const completionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/complete-payment?setup_intent=${newSetupIntent.client_secret}&team_id=${team.id}`;
          console.log(`📧 Send this URL to ${team.manager_email}:`);
          console.log(completionUrl);
          
        } else if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          console.log('✅ Setup Intent is actually complete - updating team record');
          
          // Update team with the payment method from Setup Intent
          await client.query(`
            UPDATE teams 
            SET payment_method_id = $1,
                stripe_customer_id = $2,
                payment_status = 'payment_info_provided',
                notes = COALESCE(notes || E'\n', '') || 'Payment method recovered from completed Setup Intent'
            WHERE id = $3
          `, [setupIntent.payment_method, setupIntent.customer, team.id]);
          
          console.log('✅ Team record updated with payment method');
          
          // If team is approved, try to process payment
          if (team.status === 'approved') {
            console.log('🔄 Team is approved - processing payment...');
            
            try {
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
                  eventType: 'recovered_registration_payment'
                }
              });
              
              if (paymentIntent.status === 'succeeded') {
                await client.query(`
                  UPDATE teams 
                  SET payment_intent_id = $1,
                      payment_status = 'paid'
                  WHERE id = $2
                `, [paymentIntent.id, team.id]);
                
                console.log(`✅ Payment processed: ${paymentIntent.id}`);
              }
              
            } catch (paymentError) {
              console.log(`❌ Payment failed: ${paymentError.message}`);
            }
          }
        }
        
      } catch (stripeError) {
        console.log(`❌ Stripe error: ${stripeError.message}`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Incomplete registrations have been processed.');
    console.log('Teams with new Setup Intents need to complete payment via the provided URLs.');
    console.log('Teams with recovered payment methods are ready for approval.');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

completeIncompleteRegistrations().catch(console.error);