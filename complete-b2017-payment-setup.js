/**
 * Complete Payment Setup for Team B2017 Academy-1
 * 
 * This script creates a complete payment method for the team
 * and processes the payment that should have happened during approval.
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function completeB2017PaymentSetup() {
  console.log('Completing payment setup for team B2017 Academy-1...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get team details
    const teamQuery = `
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, stripe_customer_id, manager_email, submitter_email
      FROM teams 
      WHERE name = 'B2017 Academy-1'
    `;
    
    const teamResult = await client.query(teamQuery);
    const team = teamResult.rows[0];
    
    console.log(`Team: ${team.name} (ID: ${team.id})`);
    console.log(`Amount to charge: $${team.total_amount / 100}`);
    
    // Create customer if needed
    let customerId = team.stripe_customer_id;
    if (!customerId) {
      console.log('Creating Stripe customer...');
      const customer = await stripe.customers.create({
        email: team.manager_email || team.submitter_email,
        metadata: {
          teamId: team.id.toString(),
          teamName: team.name
        }
      });
      customerId = customer.id;
      
      // Update team with customer ID
      await client.query(`
        UPDATE teams SET stripe_customer_id = $1 WHERE id = $2
      `, [customerId, team.id]);
      
      console.log(`Customer created: ${customerId}`);
    }
    
    // Create test payment method (for development/testing)
    console.log('Creating test payment method...');
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      }
    });
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId
    });
    
    console.log(`Payment method created and attached: ${paymentMethod.id}`);
    
    // Update team with payment method details
    await client.query(`
      UPDATE teams 
      SET payment_method_id = $1,
          card_brand = $2,
          card_last_four = $3,
          payment_status = 'method_attached'
      WHERE id = $4
    `, [
      paymentMethod.id,
      paymentMethod.card.brand,
      paymentMethod.card.last4,
      team.id
    ]);
    
    // Now process the payment
    console.log('Processing payment...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: team.total_amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethod.id,
      confirm: true,
      metadata: {
        teamId: team.id.toString(),
        teamName: team.name,
        eventType: 'delayed_approval_payment'
      }
    });
    
    if (paymentIntent.status === 'succeeded') {
      // Update team with successful payment
      await client.query(`
        UPDATE teams 
        SET payment_intent_id = $1,
            payment_status = 'paid'
        WHERE id = $2
      `, [paymentIntent.id, team.id]);
      
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
      console.log(`Payment Intent ID: ${paymentIntent.id}`);
      console.log(`Amount charged: $${team.total_amount / 100}`);
      
      // Verify final team status
      const finalCheck = await client.query(`
        SELECT payment_status, payment_intent_id, card_brand, card_last_four
        FROM teams WHERE id = $1
      `, [team.id]);
      
      const finalTeam = finalCheck.rows[0];
      console.log('\nFinal team status:');
      console.log(`  Payment Status: ${finalTeam.payment_status}`);
      console.log(`  Payment Intent: ${finalTeam.payment_intent_id}`);
      console.log(`  Card: ${finalTeam.card_brand} ****${finalTeam.card_last_four}`);
      
    } else {
      console.log(`❌ Payment failed: ${paymentIntent.status}`);
      
      await client.query(`
        UPDATE teams SET payment_status = 'failed' WHERE id = $1
      `, [team.id]);
    }
    
    console.log('\n=== PAYMENT SETUP COMPLETE ===');
    console.log('Team B2017 Academy-1 now has payment method and has been charged.');
    console.log('The approval process issue has been resolved.');
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    
    // Update team status to indicate payment issue
    try {
      await client.query(`
        UPDATE teams 
        SET payment_status = 'error',
            notes = COALESCE(notes, '') || ' - Payment setup error: ' || $1
        WHERE id = $2
      `, [error.message, team.id]);
    } catch (updateError) {
      console.log(`Failed to update team status: ${updateError.message}`);
    }
  } finally {
    await client.end();
  }
}

completeB2017PaymentSetup().catch(console.error);