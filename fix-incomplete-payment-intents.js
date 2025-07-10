/**
 * Fix Incomplete Payment Intents
 * 
 * This script identifies teams with incomplete payment intents that are incorrectly
 * marked as paid and corrects their status to allow proper payment completion.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkPaymentIntentStatus(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      client_secret: paymentIntent.client_secret,
      last_payment_error: paymentIntent.last_payment_error
    };
  } catch (error) {
    console.error(`Error retrieving payment intent ${paymentIntentId}:`, error.message);
    return null;
  }
}

async function fixIncompletePaymentIntents() {
  console.log('🔍 Scanning for teams with incomplete payment intents...');
  
  // Find all teams marked as paid with payment intents
  const teamsWithPaymentIntents = await sql`
    SELECT 
      id, 
      name, 
      status, 
      payment_status, 
      payment_intent_id,
      setup_intent_id,
      payment_method_id,
      stripe_customer_id,
      total_amount
    FROM teams 
    WHERE payment_intent_id IS NOT NULL 
      AND payment_status = 'paid'
    ORDER BY id
  `;

  console.log(`Found ${teamsWithPaymentIntents.length} teams with payment intents marked as paid`);

  let incompleteCount = 0;
  let fixedCount = 0;

  for (const team of teamsWithPaymentIntents) {
    console.log(`\n📋 Checking Team ${team.id}: ${team.name}`);
    console.log(`   Payment Intent: ${team.payment_intent_id}`);
    
    // Check the actual Stripe payment intent status
    const paymentIntentData = await checkPaymentIntentStatus(team.payment_intent_id);
    
    if (!paymentIntentData) {
      console.log(`   ❌ Could not retrieve payment intent from Stripe`);
      continue;
    }

    console.log(`   Stripe Status: ${paymentIntentData.status}`);
    
    if (paymentIntentData.status !== 'succeeded') {
      incompleteCount++;
      console.log(`   🚨 ISSUE: Team marked as paid but payment intent is ${paymentIntentData.status}`);
      
      if (paymentIntentData.last_payment_error) {
        console.log(`   Error: ${paymentIntentData.last_payment_error.message}`);
      }

      // Determine appropriate status based on payment intent status
      let newPaymentStatus;
      switch (paymentIntentData.status) {
        case 'requires_payment_method':
          newPaymentStatus = 'payment_failed';
          break;
        case 'requires_confirmation':
          newPaymentStatus = 'setup_intent_completed';
          break;
        case 'requires_action':
        case 'processing':
          newPaymentStatus = 'payment_pending';
          break;
        case 'canceled':
          newPaymentStatus = 'payment_failed';
          break;
        default:
          newPaymentStatus = 'payment_failed';
      }

      console.log(`   🔧 Updating payment status from 'paid' to '${newPaymentStatus}'`);

      // Update the team's payment status
      await sql`
        UPDATE teams 
        SET payment_status = ${newPaymentStatus}
        WHERE id = ${team.id}
      `;

      fixedCount++;
      console.log(`   ✅ Team ${team.id} payment status corrected`);
    } else {
      console.log(`   ✅ Payment intent is actually succeeded - status correct`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total teams checked: ${teamsWithPaymentIntents.length}`);
  console.log(`   Incomplete payment intents found: ${incompleteCount}`);
  console.log(`   Teams corrected: ${fixedCount}`);

  if (incompleteCount > 0) {
    console.log(`\n💡 Next steps for incomplete payments:`);
    console.log(`   1. Generate payment completion URLs for affected teams`);
    console.log(`   2. Contact team managers to complete payment`);
    console.log(`   3. Monitor for successful payment completion`);
  }
}

async function generatePaymentCompletionUrls() {
  console.log('\n🔗 Generating payment completion URLs for teams needing payment...');
  
  const teamsNeedingPayment = await sql`
    SELECT 
      id, 
      name, 
      payment_intent_id,
      setup_intent_id,
      total_amount,
      submitter_email
    FROM teams 
    WHERE payment_status IN ('payment_failed', 'payment_pending', 'setup_intent_completed')
      AND payment_intent_id IS NOT NULL
    ORDER BY id
  `;

  for (const team of teamsNeedingPayment) {
    console.log(`\nTeam ${team.id}: ${team.name}`);
    console.log(`Payment Intent: ${team.payment_intent_id}`);
    
    const paymentIntentData = await checkPaymentIntentStatus(team.payment_intent_id);
    if (paymentIntentData && paymentIntentData.client_secret) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://app.matchpro.ai' 
        : 'http://localhost:5000';
      
      const completionUrl = `${baseUrl}/complete-payment?payment_intent=${team.payment_intent_id}&payment_intent_client_secret=${paymentIntentData.client_secret}`;
      
      console.log(`📧 Send to ${team.submitter_email}:`);
      console.log(`🔗 ${completionUrl}`);
    }
  }
}

async function main() {
  try {
    await fixIncompletePaymentIntents();
    await generatePaymentCompletionUrls();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();