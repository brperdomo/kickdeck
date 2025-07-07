/**
 * Debug Team 481 Payment Issue - Direct Stripe Investigation
 * 
 * This script directly checks the Stripe Setup Intent and Payment Method
 * to understand why the payment is failing during approval.
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugTeam481() {
  console.log('🔍 Investigating Team 481 Stripe Setup...\n');
  
  const setupIntentId = 'seti_1RiL4eP4BpmZARxtMr700gC4';
  const paymentMethodId = 'pm_1RiL7uP4BpmZARxtN1BrJlfm';
  const customerId = 'cus_SdcJbFgi4zm8Rb';
  const amount = 49750; // $497.50
  
  try {
    // Check Setup Intent
    console.log('1️⃣ Checking Setup Intent...');
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    console.log(`   Status: ${setupIntent.status}`);
    console.log(`   Payment Method: ${setupIntent.payment_method}`);
    console.log(`   Customer: ${setupIntent.customer}`);
    console.log(`   Usage: ${setupIntent.usage}`);
    
    // Check Payment Method
    console.log('\n2️⃣ Checking Payment Method...');
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log(`   Type: ${paymentMethod.type}`);
    console.log(`   Customer: ${paymentMethod.customer}`);
    if (paymentMethod.card) {
      console.log(`   Card: **** **** **** ${paymentMethod.card.last4} (${paymentMethod.card.brand})`);
      console.log(`   Exp: ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
    }
    
    // Check Customer
    console.log('\n3️⃣ Checking Customer...');
    const customer = await stripe.customers.retrieve(customerId);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Default Payment Method: ${customer.invoice_settings?.default_payment_method}`);
    
    // Test creating a Payment Intent
    console.log('\n4️⃣ Testing Payment Intent Creation...');
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        capture_method: 'automatic',
        description: 'Test payment for Empire Surf Academy B2014',
        metadata: {
          teamId: '481',
          eventId: '1844329078',
          teamName: 'Empire Surf Academy B2014'
        }
      });
      
      console.log(`   ✅ Payment Intent Created: ${paymentIntent.id}`);
      console.log(`   Status: ${paymentIntent.status}`);
      
      if (paymentIntent.status === 'requires_confirmation') {
        console.log('\n5️⃣ Testing Payment Confirmation...');
        const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id);
        console.log(`   Status after confirmation: ${confirmed.status}`);
        
        if (confirmed.status === 'succeeded') {
          console.log('   ✅ PAYMENT WOULD SUCCEED!');
          console.log(`   💰 Amount: $${(confirmed.amount / 100).toFixed(2)}`);
          
          // Cancel this test payment since it's just a test
          console.log('\n⚠️  Canceling test payment...');
          await stripe.paymentIntents.cancel(paymentIntent.id);
          console.log('   ✅ Test payment canceled');
        } else {
          console.log('   ❌ Payment failed after confirmation');
          console.log('   Error:', confirmed.last_payment_error);
        }
      }
      
    } catch (paymentError) {
      console.log('   ❌ Payment Intent failed:', paymentError.message);
      console.log('   Code:', paymentError.code);
      console.log('   Type:', paymentError.type);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Error details:', {
      type: error.type,
      code: error.code,
      param: error.param
    });
  }
}

debugTeam481().then(() => {
  console.log('\n🏁 Debug completed');
}).catch(error => {
  console.error('💥 Script failed:', error);
});