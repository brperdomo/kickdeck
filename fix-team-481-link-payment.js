/**
 * Fix Team 481 Link Payment Issue
 * 
 * This script creates a new customer and payment method for the Link payment
 * so the approval can succeed.
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixTeam481LinkPayment() {
  console.log('🔧 Fixing Team 481 Link Payment Issue...\n');
  
  const teamId = 481;
  const amount = 49750; // $497.50
  const email = 'hector.deleon39@yahoo.com';
  
  try {
    // Create a new customer for this team
    console.log('1️⃣ Creating new Stripe customer...');
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        teamId: teamId.toString(),
        eventId: '1844329078',
        teamName: 'Empire Surf Academy B2014',
        originalCustomer: 'cus_SdcJbFgi4zm8Rb',
        reason: 'Link payment method detached - creating new customer'
      }
    });
    console.log(`   ✅ Customer created: ${customer.id}`);
    
    // Create and confirm a Payment Intent directly
    console.log('\n2️⃣ Creating Payment Intent with new customer...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card', 'link'],
      capture_method: 'automatic',
      description: 'Rise Cup - Empire Surf Academy B2014 (Team ID: 481)',
      metadata: {
        teamId: teamId.toString(),
        eventId: '1844329078',
        teamName: 'Empire Surf Academy B2014',
        fixedLinkPayment: 'true'
      }
    });
    
    console.log(`   ✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`   💰 Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`   🔑 Client Secret: ${paymentIntent.client_secret}`);
    
    // Update database with new payment info
    console.log('\n3️⃣ Updating database...');
    
    const updateResponse = await fetch('http://localhost:5000/api/admin/teams/481/fix-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newCustomerId: customer.id,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'payment_intent_created',
        paymentFailureReason: null
      })
    });
    
    if (updateResponse.ok) {
      console.log('   ✅ Database updated successfully');
    } else {
      console.log('   ⚠️  Database update via API failed, updating manually...');
      
      // Manual SQL update since the API endpoint might not exist
      console.log('   📝 Manual database update needed:');
      console.log(`   UPDATE teams SET`);
      console.log(`     stripe_customer_id = '${customer.id}',`);
      console.log(`     payment_intent_id = '${paymentIntent.id}',`);
      console.log(`     payment_status = 'payment_intent_created',`);
      console.log(`     payment_failure_reason = null`);
      console.log(`   WHERE id = 481;`);
    }
    
    console.log('\n4️⃣ Next Steps:');
    console.log('   1. Admin needs to send payment completion URL to customer');
    console.log('   2. Customer completes payment using the client secret');
    console.log('   3. Admin can then approve the team normally');
    console.log(`   💡 Payment completion URL: https://js.stripe.com/v3/`);
    console.log(`   💡 Or use admin panel "Generate Payment Completion URL" feature`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Error details:', {
      type: error.type,
      code: error.code,
      param: error.param
    });
  }
}

fixTeam481LinkPayment().then(() => {
  console.log('\n🏁 Fix completed');
}).catch(error => {
  console.error('💥 Script failed:', error);
});