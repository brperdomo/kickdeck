/**
 * Test Team 478 Approval Process
 * 
 * This script tests whether Team 478 can now be approved successfully
 * after fixing the customer association issue.
 */

import { db } from './db/index.js';
import { teams, events, paymentTransactions } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testTeam478Approval() {
  try {
    console.log('🧪 Testing Team 478 Approval Process...\n');
    
    // 1. Check current team status
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, 478));
    
    if (!team) {
      console.log('❌ Team 478 not found');
      return;
    }
    
    console.log('📋 Current Team Status:');
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.paymentStatus}`);
    console.log(`Customer ID: ${team.stripeCustomerId || 'NONE'}`);
    console.log(`Payment Method ID: ${team.paymentMethodId || 'NONE'}`);
    console.log(`Total Amount: $${(team.totalAmount / 100).toFixed(2)}\n`);
    
    // 2. Test payment processing readiness
    if (!team.stripeCustomerId) {
      console.log('❌ Team still missing customer ID - approval will fail');
      return;
    }
    
    if (!team.paymentMethodId) {
      console.log('❌ Team missing payment method ID - approval will fail');
      return;
    }
    
    // 3. Verify payment method is properly attached to customer
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
      console.log('💳 Payment Method Verification:');
      console.log(`Payment Method ID: ${paymentMethod.id}`);
      console.log(`Type: ${paymentMethod.type}`);
      console.log(`Customer: ${paymentMethod.customer || 'NONE'}`);
      
      if (paymentMethod.customer !== team.stripeCustomerId) {
        console.log('⚠️  Payment method customer mismatch - this could cause issues');
      } else {
        console.log('✅ Payment method properly attached to customer');
      }
    } catch (error) {
      console.log(`❌ Failed to retrieve payment method: ${error}`);
      return;
    }
    
    // 4. Check payment transaction history
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.teamId, 478))
      .orderBy(desc(paymentTransactions.createdAt));
    
    console.log(`\n📊 Payment Transaction History (${transactions.length} records):`);
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.status.toUpperCase()} - $${(tx.amount / 100).toFixed(2)} - ${tx.createdAt.toLocaleString()}`);
      if (tx.errorMessage) {
        console.log(`   Error: ${tx.errorMessage}`);
      }
    });
    
    // 5. Assessment
    console.log('\n🎯 APPROVAL READINESS ASSESSMENT:');
    
    const hasCustomer = !!team.stripeCustomerId;
    const hasPaymentMethod = !!team.paymentMethodId;
    const isRegistered = team.status === 'registered';
    const needsPayment = team.paymentStatus !== 'paid';
    
    console.log(`✅ Has Customer ID: ${hasCustomer}`);
    console.log(`✅ Has Payment Method: ${hasPaymentMethod}`);
    console.log(`✅ Status is 'registered': ${isRegistered}`);
    console.log(`✅ Needs payment processing: ${needsPayment}`);
    
    if (hasCustomer && hasPaymentMethod && isRegistered && needsPayment) {
      console.log('\n🚀 READY FOR APPROVAL: Team 478 should now be approved successfully!');
      console.log('📝 Next Steps:');
      console.log('   1. Go to Admin Dashboard > Team Management');
      console.log('   2. Find Team 478 (Empire Surf G2016 Academy)');
      console.log('   3. Click "Approve" button');
      console.log('   4. Payment should process automatically');
      console.log('   5. Check Payment Logs to see the transaction record');
    } else {
      console.log('\n❌ NOT READY: Team still has issues that prevent approval');
    }
    
  } catch (error) {
    console.error('Error testing team approval:', error);
  }
}

// Run the test
testTeam478Approval().then(() => {
  console.log('\n✅ Test complete');
}).catch(console.error);