/**
 * Debug Team 478 Payment Failure
 * 
 * This script investigates why team 478 payment processing is failing
 * and attempts to fix the customer association issue.
 */

import { db } from './db/index.js';
import { teams, events, paymentTransactions } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugTeam478Payment() {
  try {
    console.log('🔍 Debugging Team 478 Payment Failure...\n');
    
    // Get team details
    const [teamInfo] = await db
      .select({
        team: teams,
        event: {
          id: events.id,
          name: events.name,
          stripeConnectAccountId: events.stripeConnectAccountId,
          connectAccountStatus: events.connectAccountStatus,
          connectChargesEnabled: events.connectChargesEnabled
        }
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, 478));

    if (!teamInfo) {
      console.log('❌ Team 478 not found');
      return;
    }

    const { team, event } = teamInfo;
    
    console.log('📋 Team Information:');
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.paymentStatus}`);
    console.log(`Total Amount: $${team.totalAmount / 100}`);
    console.log(`Setup Intent ID: ${team.setupIntentId}`);
    console.log(`Payment Method ID: ${team.paymentMethodId}`);
    console.log(`Stripe Customer ID: ${team.stripeCustomerId || 'NONE - THIS IS THE PROBLEM!'}`);
    
    console.log('\n🏆 Event Information:');
    console.log(`Event: ${event.name}`);
    console.log(`Connect Account ID: ${event.stripeConnectAccountId}`);
    console.log(`Connect Status: ${event.connectAccountStatus}`);
    console.log(`Charges Enabled: ${event.connectChargesEnabled}`);
    
    // Check Setup Intent in Stripe
    console.log('\n🔍 Checking Setup Intent in Stripe...');
    try {
      const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
      console.log(`Setup Intent Status: ${setupIntent.status}`);
      console.log(`Setup Intent Customer: ${setupIntent.customer || 'NULL - Problem identified!'}`);
      console.log(`Setup Intent Payment Method: ${setupIntent.payment_method}`);
      
      // Check Payment Method details
      if (setupIntent.payment_method) {
        const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
        console.log(`Payment Method Type: ${paymentMethod.type}`);
        console.log(`Payment Method Customer: ${paymentMethod.customer || 'NULL - Not attached to customer'}`);
        
        // This is the fix - create a customer and attach the payment method
        console.log('\n🔧 FIXING: Creating customer and attaching payment method...');
        
        const customer = await stripe.customers.create({
          email: team.submitterEmail || team.managerEmail || 'noemail@example.com',
          name: team.submitterName || team.managerName || team.name,
          metadata: {
            teamId: team.id.toString(),
            teamName: team.name,
            eventId: team.eventId.toString(),
            eventName: event.name,
            fixApplied: 'team-478-customer-recovery',
            originalIssue: 'Missing customer for completed setup intent'
          }
        });
        
        console.log(`✅ Created customer: ${customer.id}`);
        
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: customer.id
        });
        
        console.log(`✅ Attached payment method ${paymentMethod.id} to customer ${customer.id}`);
        
        // Update team in database
        await db.update(teams)
          .set({ 
            stripeCustomerId: customer.id,
            paymentStatus: 'setup_intent_completed' // Reset from payment_failed
          })
          .where(eq(teams.id, 478));
        
        console.log('✅ Updated team database record with customer ID');
        
        console.log('\n🎯 READY FOR APPROVAL: Team 478 can now be approved successfully!');
        console.log('The payment failure was due to missing customer association.');
        console.log('Team now has:');
        console.log(`- Customer ID: ${customer.id}`);
        console.log(`- Payment Method: ${paymentMethod.id} (attached to customer)`);
        console.log(`- Amount to charge: $${team.totalAmount / 100}`);
        
      } else {
        console.log('❌ No payment method found in setup intent');
      }
      
    } catch (stripeError) {
      console.log(`❌ Stripe API Error: ${stripeError.message}`);
    }
    
    // Check payment transaction history
    console.log('\n📊 Checking Payment Transaction History...');
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.teamId, 478))
      .orderBy(desc(paymentTransactions.createdAt));
    
    if (transactions.length === 0) {
      console.log('❌ No payment transactions found - this explains why Payment Logs is empty');
      console.log('💡 Failed payment attempts should be logged to payment_transactions table');
    } else {
      console.log(`Found ${transactions.length} payment transactions:`);
      transactions.forEach((tx, i) => {
        console.log(`${i + 1}. ${tx.transactionType} - ${tx.status} - $${tx.amount ? tx.amount / 100 : 'N/A'}`);
        if (tx.errorMessage) {
          console.log(`   Error: ${tx.errorMessage}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugTeam478Payment().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});