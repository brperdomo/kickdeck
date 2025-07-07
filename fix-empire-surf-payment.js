/**
 * Fix Empire Surf Academy B2014 Payment Issue
 * 
 * This script diagnoses and fixes the payment failure for Team ID 481
 * by checking the Setup Intent status and processing the payment.
 */

import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

async function fixEmpireSurfPayment() {
  console.log('🔍 Investigating Empire Surf Academy B2014 payment failure...');
  
  try {
    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, 481)
    });
    
    if (!team) {
      console.log('❌ Team 481 not found');
      return;
    }
    
    console.log('📋 Team Details:');
    console.log(`- Name: ${team.name}`);
    console.log(`- Status: ${team.status}`);
    console.log(`- Payment Status: ${team.paymentStatus}`);
    console.log(`- Total Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    console.log(`- Setup Intent: ${team.setupIntentId}`);
    console.log(`- Payment Method: ${team.paymentMethodId}`);
    console.log(`- Customer: ${team.stripeCustomerId}`);
    console.log(`- Approved At: ${team.approvedAt}`);
    
    // Check if we need to process the payment
    if (team.paymentStatus === 'payment_failed' && team.setupIntentId && team.paymentMethodId) {
      console.log('\n🔧 Attempting to process payment...');
      
      // Simulate the approval payment process
      const response = await fetch('http://localhost:5000/api/admin/teams/481/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceReprocess: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment processing result:', result);
      } else {
        const error = await response.text();
        console.log('❌ Payment processing failed:', error);
        
        // Try to get more details about the Stripe customer
        console.log('\n🔍 Checking Stripe customer status...');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        try {
          const customer = await stripe.customers.retrieve(team.stripeCustomerId);
          console.log('💳 Customer exists in Stripe:', customer.id);
          
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          console.log('🎯 Setup Intent status:', setupIntent.status);
          console.log('🎯 Payment Method attached:', setupIntent.payment_method);
          
          if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
            console.log('\n💰 Setup Intent is valid, attempting direct payment...');
            
            // Create payment intent with the attached payment method
            const paymentIntent = await stripe.paymentIntents.create({
              amount: team.totalAmount,
              currency: 'usd',
              customer: team.stripeCustomerId,
              payment_method: setupIntent.payment_method,
              confirm: true,
              description: `Rise Cup - ${team.name} (Team ID: ${team.id})`,
              metadata: {
                teamId: team.id.toString(),
                eventId: team.eventId.toString(),
                teamName: team.name
              }
            });
            
            if (paymentIntent.status === 'succeeded') {
              console.log('✅ Payment successful!');
              console.log(`💳 Payment Intent: ${paymentIntent.id}`);
              console.log(`💰 Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
              
              // Update database
              await db.update(teams)
                .set({
                  paymentStatus: 'paid',
                  paymentIntentId: paymentIntent.id,
                  paidAt: new Date(),
                  paymentFailureReason: null
                })
                .where(eq(teams.id, 481));
              
              console.log('📝 Database updated with successful payment');
            } else {
              console.log('❌ Payment failed:', paymentIntent.status, paymentIntent.last_payment_error);
            }
          }
          
        } catch (stripeError) {
          console.log('❌ Stripe error:', stripeError.message);
        }
      }
    } else {
      console.log('ℹ️ Team payment status doesn\'t require reprocessing');
    }
    
  } catch (error) {
    console.error('❌ Error fixing payment:', error);
  }
}

// Run the fix
fixEmpireSurfPayment().then(() => {
  console.log('\n🏁 Payment fix attempt completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});