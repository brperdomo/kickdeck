/**
 * Complete Payment Setup for Teams with Incomplete Payment Methods
 * 
 * This script handles teams that were approved but couldn't be charged
 * because they didn't complete payment method setup during registration.
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function completeTeamPaymentSetup(teamId) {
  console.log(`Processing payment completion for team ID: ${teamId}`);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get team details
    const teamQuery = `
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, manager_email, manager_name
      FROM teams 
      WHERE id = $1
    `;
    
    const teamResult = await client.query(teamQuery, [teamId]);
    
    if (teamResult.rows.length === 0) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    
    const team = teamResult.rows[0];
    
    console.log(`Team: ${team.name}`);
    console.log(`Status: ${team.status}, Payment Status: ${team.payment_status}`);
    console.log(`Amount: $${team.total_amount / 100}`);
    console.log(`Setup Intent: ${team.setup_intent_id || 'None'}`);
    console.log(`Manager: ${team.manager_name} (${team.manager_email})`);
    
    if (!team.setup_intent_id) {
      console.log('\n❌ NO SETUP INTENT FOUND');
      console.log('This team needs to complete the entire payment setup process.');
      console.log('RECOMMENDATION: Contact the team to re-register with proper payment information.');
      return false;
    }
    
    // Check Setup Intent status
    const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
    console.log(`\nSetup Intent Status: ${setupIntent.status}`);
    
    if (setupIntent.status === 'requires_payment_method') {
      console.log('\n❌ PAYMENT METHOD NEVER PROVIDED');
      console.log('The customer started payment setup but never completed it.');
      console.log('RECOMMENDATIONS:');
      console.log('1. Send payment collection link to the team manager');
      console.log('2. Create new payment link for them to complete setup');
      console.log('3. Once they provide payment method, run this script again');
      
      // Create a new Setup Intent for the team to complete
      const newSetupIntent = await stripe.setupIntents.create({
        usage: 'off_session',
        metadata: {
          teamId: team.id.toString(),
          teamName: team.name,
          originalSetupIntent: team.setup_intent_id,
          purpose: 'complete_incomplete_registration'
        }
      });
      
      console.log(`\n✅ NEW SETUP INTENT CREATED: ${newSetupIntent.id}`);
      console.log(`Client Secret: ${newSetupIntent.client_secret}`);
      console.log('\nSend this payment link to the team:');
      console.log(`https://app.kickdeck.io/complete-payment?setup_intent=${newSetupIntent.client_secret}&team_id=${team.id}`);
      
      return {
        success: false,
        reason: 'payment_method_required',
        newSetupIntent: newSetupIntent.id,
        paymentLink: `https://app.kickdeck.io/complete-payment?setup_intent=${newSetupIntent.client_secret}&team_id=${team.id}`
      };
    }
    
    if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
      console.log('\n✅ SETUP INTENT COMPLETED - PROCESSING PAYMENT');
      console.log(`Payment Method: ${setupIntent.payment_method}`);
      
      // Create and confirm payment
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
        // Update team with payment details
        await client.query(`
          UPDATE teams 
          SET payment_intent_id = $1,
              payment_status = 'paid',
              payment_method_id = $2,
              notes = COALESCE(notes, '') || ' | Payment processed after approval completion'
          WHERE id = $3
        `, [paymentIntent.id, setupIntent.payment_method, team.id]);
        
        console.log('\n✅ PAYMENT SUCCESSFUL');
        console.log(`Payment Intent: ${paymentIntent.id}`);
        console.log(`Amount charged: $${team.total_amount / 100}`);
        
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: team.total_amount / 100
        };
      } else {
        console.log(`\n❌ PAYMENT FAILED: ${paymentIntent.status}`);
        return {
          success: false,
          reason: 'payment_failed',
          status: paymentIntent.status
        };
      }
    }
    
    console.log(`\n❓ UNEXPECTED SETUP INTENT STATUS: ${setupIntent.status}`);
    return {
      success: false,
      reason: 'unexpected_status',
      status: setupIntent.status
    };
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      success: false,
      reason: 'error',
      error: error.message
    };
  } finally {
    await client.end();
  }
}

// Run for the specific team
const teamId = process.argv[2] || 156;
completeTeamPaymentSetup(teamId).then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('COMPLETION SUMMARY');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ Payment completed successfully');
    console.log(`✅ Team can now proceed with event participation`);
  } else if (result.reason === 'payment_method_required') {
    console.log('⚠️  Payment method setup required');
    console.log('⚠️  Send payment link to team manager');
  } else {
    console.log('❌ Payment completion failed');
    console.log(`❌ Reason: ${result.reason}`);
  }
}).catch(console.error);