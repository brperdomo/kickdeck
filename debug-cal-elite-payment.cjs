/**
 * Debug Cal Elite G2007 Payment Issues
 * 
 * This script investigates payment failures and payment completion URL generation
 * issues for the Cal Elite G2007 team.
 */

const { db } = require('./db');
const { teams, paymentTransactions } = require('./db/schema');
const { eq, like, desc } = require('drizzle-orm');

async function debugCalElitePayment() {
  try {
    console.log('=== DEBUGGING CAL ELITE G2007 PAYMENT ISSUES ===\n');
    
    // 1. Find the team
    console.log('1. Searching for Cal Elite G2007 team...');
    let team = await db.select().from(teams).where(like(teams.name, '%Cal Elite%G2007%')).limit(1);
    
    if (team.length === 0) {
      console.log('   Team not found with G2007, searching for Cal Elite teams...');
      const calEliteTeams = await db.select({
        id: teams.id,
        name: teams.name,
        status: teams.status,
        paymentStatus: teams.paymentStatus,
        submitterEmail: teams.submitterEmail
      }).from(teams).where(like(teams.name, '%Cal Elite%')).limit(10);
      
      console.log('   Cal Elite teams found:');
      calEliteTeams.forEach(t => {
        console.log(`   - ID: ${t.id}, Name: ${t.name}, Status: ${t.status}, Payment: ${t.paymentStatus}`);
      });
      
      if (calEliteTeams.length > 0) {
        // Use the first Cal Elite team for analysis
        team = await db.select().from(teams).where(eq(teams.id, calEliteTeams[0].id));
      } else {
        console.log('   No Cal Elite teams found in database');
        return;
      }
    }
    
    const teamData = team[0];
    console.log(`   Found team: ${teamData.name} (ID: ${teamData.id})\n`);
    
    // 2. Analyze team payment data
    console.log('2. Team Payment Analysis:');
    console.log(`   - Status: ${teamData.status}`);
    console.log(`   - Payment Status: ${teamData.paymentStatus}`);
    console.log(`   - Stripe Customer ID: ${teamData.stripeCustomerId || 'MISSING'}`);
    console.log(`   - Setup Intent ID: ${teamData.setupIntentId || 'MISSING'}`);
    console.log(`   - Payment Method ID: ${teamData.paymentMethodId || 'MISSING'}`);
    console.log(`   - Total Amount: ${teamData.totalAmount ? `$${(teamData.totalAmount / 100).toFixed(2)}` : 'MISSING'}`);
    console.log(`   - Submitter Email: ${teamData.submitterEmail || 'MISSING'}\n`);
    
    // 3. Check payment transaction logs
    console.log('3. Payment Transaction History:');
    const paymentLogs = await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.teamId, teamData.id))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(10);
    
    if (paymentLogs.length === 0) {
      console.log('   No payment transaction logs found for this team');
    } else {
      console.log(`   Found ${paymentLogs.length} payment transaction(s):`);
      paymentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.createdAt} - ${log.status} - ${log.errorMessage || 'Success'}`);
        if (log.stripeErrorCode) {
          console.log(`      Stripe Error: ${log.stripeErrorCode} - ${log.stripeErrorType}`);
        }
        console.log(`      Amount: $${(log.amount / 100).toFixed(2)}`);
      });
    }
    console.log('');
    
    // 4. Analyze payment readiness
    console.log('4. Payment Readiness Analysis:');
    const issues = [];
    
    if (!teamData.stripeCustomerId) {
      issues.push('Missing Stripe Customer ID - cannot charge payment method');
    }
    
    if (!teamData.setupIntentId) {
      issues.push('Missing Setup Intent ID - no payment method collected');
    }
    
    if (!teamData.paymentMethodId) {
      issues.push('Missing Payment Method ID - no card on file');
    }
    
    if (!teamData.totalAmount || teamData.totalAmount <= 0) {
      issues.push('Missing or invalid total amount');
    }
    
    if (teamData.paymentStatus === 'payment_failed') {
      issues.push('Payment status marked as failed - previous payment attempt failed');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ Team appears ready for payment processing');
    } else {
      console.log('   ❌ Payment issues identified:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    console.log('');
    
    // 5. Payment completion URL eligibility
    console.log('5. Payment Completion URL Eligibility:');
    if (teamData.setupIntentId && teamData.paymentStatus === 'setup_intent_completed') {
      console.log('   ✅ Team eligible for payment completion URL generation');
      console.log(`   Setup Intent: ${teamData.setupIntentId}`);
    } else if (!teamData.setupIntentId) {
      console.log('   ❌ Cannot generate payment completion URL - no Setup Intent found');
      console.log('   Team needs to complete registration payment setup first');
    } else if (teamData.paymentStatus !== 'setup_intent_completed') {
      console.log(`   ❌ Cannot generate payment completion URL - payment status is '${teamData.paymentStatus}'`);
      console.log('   Team needs to complete payment setup or have failed payment to retry');
    }
    
    // 6. Recommended actions
    console.log('\n6. Recommended Actions:');
    if (!teamData.stripeCustomerId && teamData.setupIntentId) {
      console.log('   1. Create Stripe customer and attach payment method from Setup Intent');
    }
    
    if (teamData.paymentStatus === 'payment_failed') {
      console.log('   2. Reset payment status to setup_intent_completed for retry');
    }
    
    if (!teamData.setupIntentId) {
      console.log('   3. Team needs to complete payment setup through registration process');
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

debugCalElitePayment();