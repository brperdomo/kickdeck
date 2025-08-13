// Investigation script for ELI7E FC G-2013 Select payment failure
import { db } from './server/db/index.js';
import { teams, paymentTransactions, events } from './server/db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function investigatePaymentIssue() {
  console.log('🔍 INVESTIGATING PAYMENT FAILURE FOR TEAM 998 - ELI7E FC G-2013 Select');
  console.log('=' .repeat(80));
  
  try {
    // 1. Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, 998),
      with: {
        event: true,
        ageGroup: true
      }
    });
    
    if (!team) {
      console.log('❌ Team 998 not found');
      return;
    }
    
    console.log('\n📋 TEAM DETAILS:');
    console.log(`Name: ${team.name}`);
    console.log(`Manager: ${team.managerName} (${team.managerEmail})`);
    console.log(`Payment Status: ${team.paymentStatus}`);
    console.log(`Total Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    console.log(`Payment Intent ID: ${team.paymentIntentId || 'NONE'}`);
    console.log(`Setup Intent ID: ${team.setupIntentId || 'NONE'}`);
    console.log(`Payment Method ID: ${team.paymentMethodId || 'NONE'}`);
    console.log(`Stripe Customer ID: ${team.stripeCustomerId || 'NONE'}`);
    
    // 2. Check payment transactions
    const transactions = await db.query.paymentTransactions.findMany({
      where: eq(paymentTransactions.teamId, 998),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)]
    });
    
    console.log('\n💳 PAYMENT TRANSACTIONS:');
    if (transactions.length === 0) {
      console.log('No payment transactions found');
    } else {
      transactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.status.toUpperCase()} - $${(tx.amount / 100).toFixed(2)}`);
        console.log(`   Setup Intent: ${tx.setupIntentId || 'N/A'}`);
        console.log(`   Payment Intent: ${tx.paymentIntentId || 'N/A'}`);
        console.log(`   Error: ${tx.errorCode || 'N/A'} - ${tx.errorMessage || 'N/A'}`);
        console.log(`   Created: ${tx.createdAt}`);
      });
    }
    
    // 3. Check Stripe Setup Intent status
    if (team.setupIntentId) {
      console.log('\n🔧 STRIPE SETUP INTENT STATUS:');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log(`Status: ${setupIntent.status}`);
        console.log(`Client Secret: ${setupIntent.client_secret ? 'EXISTS' : 'MISSING'}`);
        console.log(`Payment Method: ${setupIntent.payment_method || 'NONE'}`);
        console.log(`Usage: ${setupIntent.usage}`);
        
        if (setupIntent.last_setup_error) {
          console.log(`❌ Last Error: ${setupIntent.last_setup_error.code} - ${setupIntent.last_setup_error.message}`);
        }
        
        if (setupIntent.payment_method) {
          console.log('\n💳 PAYMENT METHOD DETAILS:');
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
          console.log(`Type: ${paymentMethod.type}`);
          if (paymentMethod.card) {
            console.log(`Card: **** **** **** ${paymentMethod.card.last4} (${paymentMethod.card.brand.toUpperCase()})`);
            console.log(`Exp: ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error retrieving setup intent: ${error.message}`);
      }
    }
    
    // 4. Check if payment intent exists
    if (team.paymentIntentId) {
      console.log('\n💰 STRIPE PAYMENT INTENT STATUS:');
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(team.paymentIntentId);
        console.log(`Status: ${paymentIntent.status}`);
        console.log(`Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
        console.log(`Payment Method: ${paymentIntent.payment_method || 'NONE'}`);
        
        if (paymentIntent.last_payment_error) {
          console.log(`❌ Last Error: ${paymentIntent.last_payment_error.code} - ${paymentIntent.last_payment_error.message}`);
        }
      } catch (error) {
        console.log(`❌ Error retrieving payment intent: ${error.message}`);
      }
    }
    
    // 5. Analysis and recommendations
    console.log('\n🎯 ANALYSIS & RECOMMENDATIONS:');
    
    if (team.paymentStatus === 'payment_failed' && !team.paymentIntentId && team.setupIntentId) {
      console.log('✅ ISSUE IDENTIFIED: Setup Intent completed but Payment Intent never created');
      console.log('💡 SOLUTION: Need to create and process Payment Intent using the setup Payment Method');
      
      // Check if we can create a payment intent
      if (team.setupIntentId && team.totalAmount > 0) {
        console.log('\n🚀 ATTEMPTING TO FIX PAYMENT:');
        
        try {
          // Get the setup intent to find the payment method
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          
          if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
            console.log(`Found payment method: ${setupIntent.payment_method}`);
            
            // Create payment intent
            const paymentIntent = await stripe.paymentIntents.create({
              amount: team.totalAmount,
              currency: 'usd',
              payment_method: setupIntent.payment_method,
              customer: team.stripeCustomerId,
              confirm: true,
              description: `${team.event?.name || 'Tournament'} - ${team.name}`,
              metadata: {
                teamId: team.id.toString(),
                teamName: team.name,
                eventName: team.event?.name || '',
              }
            });
            
            console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
            console.log(`Status: ${paymentIntent.status}`);
            
            // Update team record
            await db.update(teams)
              .set({
                paymentIntentId: paymentIntent.id,
                paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'processing'
              })
              .where(eq(teams.id, 998));
              
            console.log('✅ Team record updated');
            
            if (paymentIntent.status === 'succeeded') {
              console.log('🎉 PAYMENT SUCCESSFUL!');
            } else {
              console.log(`⏳ Payment status: ${paymentIntent.status}`);
            }
            
          } else {
            console.log(`❌ Setup Intent status: ${setupIntent.status}, Payment Method: ${setupIntent.payment_method}`);
          }
          
        } catch (error) {
          console.log(`❌ Error fixing payment: ${error.message}`);
        }
      }
    } else {
      console.log('Need more investigation to determine the exact issue');
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

// Run the investigation
investigatePaymentIssue();