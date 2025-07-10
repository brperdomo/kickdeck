/**
 * Test script to debug payment amount display issue
 * 
 * This script directly tests the member search functionality to see
 * what values are being calculated and returned.
 */

import { db } from './db/index.js';
import { users, teams, events, eventAgeGroups, paymentTransactions } from './db/schema.js';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function testPaymentCalculation() {
  console.log('Testing payment amount calculation...');
  
  // Find a member who has registrations
  const [member] = await db
    .select()
    .from(users)
    .where(like(users.email, '%lisbeth%'))
    .limit(1);
    
  if (!member) {
    console.log('No member found with email containing "lisbeth"');
    return;
  }
  
  console.log(`Found member: ${member.firstName} ${member.lastName} (${member.email})`);
  
  // Get team registrations for this member
  const teamRegistrations = await db
    .select({
      team: teams,
      event: events,
      ageGroup: eventAgeGroups
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
    .where(
      or(
        sql`${teams.coach}::text LIKE ${'%' + member.email + '%'}`,
        eq(teams.managerEmail, member.email)
      )
    )
    .orderBy(desc(teams.createdAt));
    
  console.log(`Found ${teamRegistrations.length} team registrations`);
  
  for (const reg of teamRegistrations) {
    console.log(`\n--- Team ${reg.team.id}: ${reg.team.name} ---`);
    console.log(`Status: ${reg.team.status}`);
    console.log(`Payment Intent ID: ${reg.team.paymentIntentId}`);
    console.log(`Total Amount (from teams): ${reg.team.totalAmount}`);
    console.log(`Registration Fee (from teams): ${reg.team.registrationFee}`);
    
    // Test the exact same calculation logic as the API
    let actualAmountPaid = reg.team.totalAmount ? (reg.team.totalAmount / 100) : (reg.team.registrationFee ? (reg.team.registrationFee / 100) : 0);
    console.log(`Initial calculation: ${actualAmountPaid}`);
    
    if (reg.team.status === 'approved' && reg.team.paymentIntentId) {
      console.log('Looking up payment transaction...');
      
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.paymentIntentId, reg.team.paymentIntentId))
        .limit(1);
        
      if (paymentTransaction && paymentTransaction.amount) {
        console.log(`Raw payment transaction amount: ${paymentTransaction.amount} (type: ${typeof paymentTransaction.amount})`);
        const calculatedAmount = paymentTransaction.amount / 100;
        console.log(`After division by 100: ${calculatedAmount} (type: ${typeof calculatedAmount})`);
        actualAmountPaid = calculatedAmount;
      } else {
        console.log('No payment transaction found');
      }
    }
    
    console.log(`Final amount: ${actualAmountPaid}`);
  }
}

// Run the test
testPaymentCalculation().catch(console.error);