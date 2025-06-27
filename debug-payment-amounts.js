/**
 * Debug Payment Amounts Script
 * 
 * Test script to verify payment transaction lookup logic
 * and ensure correct amounts are being returned for team registrations
 */

import { db } from './db/index.js';
import { teams, paymentTransactions, events } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function debugPaymentAmounts() {
  try {
    console.log('Testing payment transaction lookup logic...');
    
    // Get teams with payment transactions
    const testTeamIds = [213, 201, 200, 175, 168, 164, 161];
    
    console.log(`\nChecking teams: ${testTeamIds.join(', ')}`);
    
    for (const teamId of testTeamIds) {
      console.log(`\n--- Team ${teamId} ---`);
      
      // Get team data
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
      
      if (!team) {
        console.log(`Team ${teamId} not found`);
        continue;
      }
      
      console.log(`Team name: ${team.name}`);
      console.log(`Payment Intent ID: ${team.paymentIntentId}`);
      console.log(`Total Amount (database): ${team.totalAmount}`);
      console.log(`Status: ${team.status}`);
      
      // Look up payment transaction
      if (team.paymentIntentId) {
        try {
          const [paymentTransaction] = await db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.paymentIntentId, team.paymentIntentId))
            .limit(1);
          
          if (paymentTransaction) {
            console.log(`✓ Payment transaction found:`);
            console.log(`  - Amount charged: ${paymentTransaction.amount} cents ($${(paymentTransaction.amount / 100).toFixed(2)})`);
            console.log(`  - Stripe fee: ${paymentTransaction.stripeFee} cents`);
            console.log(`  - Net amount: ${paymentTransaction.netAmount} cents`);
            console.log(`  - Created at: ${paymentTransaction.createdAt}`);
          } else {
            console.log(`✗ No payment transaction found for Payment Intent: ${team.paymentIntentId}`);
          }
        } catch (error) {
          console.log(`✗ Error looking up payment transaction:`, error.message);
        }
      } else {
        console.log(`✗ No Payment Intent ID found`);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('Expected behavior: Teams with payment transactions should show actual charged amounts ($1.38) in member dashboard');
    console.log('Current issue: Member dashboard showing $0.00 for all approved teams');
    
  } catch (error) {
    console.error('Debug script failed:', error);
  }
}

debugPaymentAmounts();