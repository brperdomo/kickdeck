/**
 * Fix Team Payment on Approval
 * 
 * This script processes the payment for team B2017 Academy-1 and fixes
 * the approval workflow to handle payment processing correctly.
 */

import pkg from 'pg';
const { Client } = pkg;
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixTeamPaymentApproval() {
  console.log('Fixing payment for team B2017 Academy-1...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get team details
    const teamQuery = `
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, stripe_customer_id,
             submitter_email, manager_email
      FROM teams 
      WHERE name = 'B2017 Academy-1'
    `;
    
    const teamResult = await client.query(teamQuery);
    const team = teamResult.rows[0];
    
    if (!team) {
      console.log('Team B2017 Academy-1 not found');
      return;
    }
    
    console.log(`Team found: ${team.name} (ID: ${team.id})`);
    console.log(`Status: ${team.status}, Payment Status: ${team.payment_status}`);
    console.log(`Total Amount: $${team.total_amount / 100}`);
    
    // Check setup intent status
    if (team.setup_intent_id) {
      console.log('\nChecking Stripe setup intent...');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        
        if (setupIntent.status === 'requires_payment_method') {
          console.log('❌ Setup intent never completed - customer did not enter payment method');
          console.log('Creating new payment method setup...');
          
          // Create a new setup intent for the customer to complete
          const newSetupIntent = await stripe.setupIntents.create({
            usage: 'off_session',
            metadata: {
              teamId: team.id.toString(),
              teamName: team.name,
              purpose: 'team_registration_payment_fix'
            }
          });
          
          // Update team with new setup intent
          await client.query(`
            UPDATE teams 
            SET setup_intent_id = $1,
                payment_status = 'setup_required'
            WHERE id = $2
          `, [newSetupIntent.id, team.id]);
          
          console.log('✅ New setup intent created:', newSetupIntent.id);
          console.log('Team manager needs to complete payment setup');
          
          // Send notification email to team manager
          console.log('\nSending payment setup notification...');
          const notificationResult = await fetch('http://localhost:5000/api/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: team.manager_email || team.submitter_email,
              template: 'payment_setup_required',
              data: {
                teamName: team.name,
                amount: (team.total_amount / 100).toFixed(2),
                setupUrl: `${process.env.PUBLIC_URL}/complete-payment/${team.id}?setup_intent=${newSetupIntent.client_secret}`,
                loginUrl: `${process.env.PUBLIC_URL}/dashboard`
              }
            })
          });
          
          if (notificationResult.ok) {
            console.log('Payment setup notification sent to team manager');
          }
          
          return;
        }
        
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          console.log('✅ Setup intent succeeded, processing payment...');
          
          // Create payment intent for the approved team
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
          
          console.log(`Payment intent created: ${paymentIntent.id}`);
          console.log(`Payment status: ${paymentIntent.status}`);
          
          if (paymentIntent.status === 'succeeded') {
            // Update team with payment details
            await client.query(`
              UPDATE teams 
              SET payment_intent_id = $1,
                  payment_status = 'paid',
                  payment_method_id = $2
              WHERE id = $3
            `, [paymentIntent.id, setupIntent.payment_method, team.id]);
            
            // Create payment transaction record
            await client.query(`
              INSERT INTO payment_transactions (
                team_id, transaction_type, amount, status, 
                payment_intent_id, created_at
              ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            `, [
              team.id, 
              'payment', 
              team.total_amount, 
              'completed',
              paymentIntent.id
            ]);
            
            console.log('✅ Payment processed successfully');
            console.log(`Team B2017 Academy-1 charged $${team.total_amount / 100}`);
            
            // Send payment confirmation email
            const confirmationResult = await fetch('http://localhost:5000/api/send-templated-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: team.manager_email || team.submitter_email,
                template: 'payment_confirmation',
                data: {
                  teamName: team.name,
                  amount: (team.total_amount / 100).toFixed(2),
                  paymentId: paymentIntent.id,
                  loginUrl: `${process.env.PUBLIC_URL}/dashboard`
                }
              })
            });
            
            if (confirmationResult.ok) {
              console.log('Payment confirmation email sent');
            }
            
          } else if (paymentIntent.status === 'requires_action') {
            console.log('Payment requires additional authentication');
            
            await client.query(`
              UPDATE teams 
              SET payment_intent_id = $1,
                  payment_status = 'requires_action'
              WHERE id = $2
            `, [paymentIntent.id, team.id]);
            
          } else {
            console.log(`Payment failed with status: ${paymentIntent.status}`);
            
            await client.query(`
              UPDATE teams 
              SET payment_status = 'failed'
              WHERE id = $1
            `, [team.id]);
          }
        }
        
      } catch (stripeError) {
        console.log(`Stripe error: ${stripeError.message}`);
        
        if (stripeError.code === 'authentication_required') {
          console.log('Payment requires customer authentication');
          await client.query(`
            UPDATE teams 
            SET payment_status = 'requires_authentication'
            WHERE id = $1
          `, [team.id]);
        }
      }
    }
    
    console.log('\n=== TEAM PAYMENT FIX COMPLETE ===');
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

fixTeamPaymentApproval().catch(console.error);