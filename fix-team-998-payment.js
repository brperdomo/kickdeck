// Fix payment for ELI7E FC G-2013 Select (Team 998)
// Issue: PaymentMethod not attached to Customer
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { db } = require('./server/db/index.js');
const { teams } = require('./server/db/schema.js');
const { eq } = require('drizzle-orm');
require('dotenv').config();

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixPaymentIssue() {
  console.log('🔧 FIXING PAYMENT ISSUE FOR TEAM 998 - ELI7E FC G-2013 Select');
  console.log('=' .repeat(70));
  
  try {
    // Get team details
    const team = await db.select().from(teams).where(eq(teams.id, 998)).limit(1);
    if (!team || team.length === 0) {
      console.log('❌ Team 998 not found');
      return;
    }
    
    const teamData = team[0];
    console.log(`Team: ${teamData.name}`);
    console.log(`Payment Status: ${teamData.paymentStatus}`);
    console.log(`Setup Intent: ${teamData.setupIntentId}`);
    console.log(`Stripe Customer: ${teamData.stripeCustomerId}`);
    console.log(`Payment Method: ${teamData.paymentMethodId}`);
    
    if (!teamData.setupIntentId) {
      console.log('❌ No Setup Intent found');
      return;
    }
    
    // 1. Retrieve Setup Intent
    console.log('\n🔍 Checking Setup Intent...');
    const setupIntent = await stripe.setupIntents.retrieve(teamData.setupIntentId);
    console.log(`Setup Intent Status: ${setupIntent.status}`);
    console.log(`Payment Method: ${setupIntent.payment_method}`);
    console.log(`Customer: ${setupIntent.customer}`);
    
    if (setupIntent.status !== 'succeeded') {
      console.log(`❌ Setup Intent not succeeded: ${setupIntent.status}`);
      return;
    }
    
    if (!setupIntent.payment_method) {
      console.log('❌ No payment method in Setup Intent');
      return;
    }
    
    // 2. Check if Customer exists in Stripe
    let customer = null;
    if (teamData.stripeCustomerId) {
      console.log('\n👤 Checking existing customer...');
      try {
        customer = await stripe.customers.retrieve(teamData.stripeCustomerId);
        console.log(`Customer exists: ${customer.id}`);
      } catch (error) {
        console.log(`❌ Customer not found: ${error.message}`);
        customer = null;
      }
    }
    
    // 3. Create customer if needed
    if (!customer) {
      console.log('\n👤 Creating new Stripe customer...');
      customer = await stripe.customers.create({
        email: teamData.managerEmail,
        name: teamData.managerName,
        metadata: {
          teamId: teamData.id.toString(),
          teamName: teamData.name
        }
      });
      
      console.log(`✅ Customer created: ${customer.id}`);
      
      // Update team with customer ID
      await db.update(teams)
        .set({ stripeCustomerId: customer.id })
        .where(eq(teams.id, 998));
      console.log('✅ Team updated with customer ID');
    }
    
    // 4. Attach Payment Method to Customer
    console.log('\n💳 Attaching payment method to customer...');
    try {
      const paymentMethod = await stripe.paymentMethods.attach(setupIntent.payment_method, {
        customer: customer.id
      });
      console.log(`✅ Payment method attached: ${paymentMethod.id}`);
    } catch (error) {
      if (error.message.includes('already been attached')) {
        console.log('✅ Payment method already attached');
      } else {
        console.log(`❌ Error attaching payment method: ${error.message}`);
        return;
      }
    }
    
    // 5. Create Payment Intent
    console.log('\n💰 Creating Payment Intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: teamData.totalAmount,
      currency: 'usd',
      customer: customer.id,
      payment_method: setupIntent.payment_method,
      confirm: true,
      description: `Rise Cup - ${teamData.name}`,
      metadata: {
        teamId: teamData.id.toString(),
        teamName: teamData.name,
        eventName: 'Rise Cup',
        managerEmail: teamData.managerEmail
      }
    });
    
    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`Payment Status: ${paymentIntent.status}`);
    
    // 6. Update team record
    const newPaymentStatus = paymentIntent.status === 'succeeded' ? 'paid' : 'processing';
    
    await db.update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
        paymentStatus: newPaymentStatus,
        paymentMethodId: setupIntent.payment_method,
        stripeCustomerId: customer.id
      })
      .where(eq(teams.id, 998));
    
    console.log(`✅ Team updated - Payment Status: ${newPaymentStatus}`);
    
    if (paymentIntent.status === 'succeeded') {
      console.log('\n🎉 PAYMENT SUCCESSFUL!');
      console.log(`Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
    } else if (paymentIntent.status === 'requires_action') {
      console.log('\n⚠️ Payment requires additional action');
      console.log(`Next Action: ${paymentIntent.next_action?.type}`);
    } else {
      console.log(`\n📋 Payment Status: ${paymentIntent.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing payment:', error.message);
    console.error(error.stack);
  }
}

// Run the fix
fixPaymentIssue();