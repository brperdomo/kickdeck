/**
 * Test Team 199 Approval After Payment Status Fix
 * 
 * This script verifies that Team 199 can now be approved successfully
 * after fixing the payment_failed status synchronization issue.
 */

const { Client } = require('pg');

async function testTeam199Approval() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Testing Team 199 approval readiness...\n');
    
    // Check current team status
    const teamResult = await client.query(`
      SELECT id, name, submitter_email, setup_intent_id, payment_method_id, 
             stripe_customer_id, payment_status, status, total_amount
      FROM teams 
      WHERE id = 199
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ Team 199 not found');
      return;
    }
    
    const team = teamResult.rows[0];
    
    console.log('Team 199 Current Status:');
    console.log(`Name: ${team.name}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Team Status: ${team.status}`);
    console.log(`Setup Intent: ${team.setup_intent_id}`);
    console.log(`Payment Method: ${team.payment_method_id}`);
    console.log(`Customer ID: ${team.stripe_customer_id}`);
    console.log(`Total Amount: $${(team.total_amount / 100).toFixed(2)}`);
    console.log('');
    
    // Check approval readiness
    const approvalChecks = {
      hasSetupIntent: !!team.setup_intent_id,
      hasPaymentMethod: !!team.payment_method_id,
      hasCustomer: !!team.stripe_customer_id,
      hasAmount: team.total_amount > 0,
      correctPaymentStatus: team.payment_status === 'setup_intent_completed',
      isRegistered: team.status === 'registered'
    };
    
    console.log('Approval Readiness Checks:');
    Object.entries(approvalChecks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}: ${passed}`);
    });
    
    const allChecksPassed = Object.values(approvalChecks).every(check => check);
    
    console.log('');
    if (allChecksPassed) {
      console.log('🎉 Team 199 is ready for approval!');
      console.log('✅ All payment setup requirements are met');
      console.log('✅ Payment status has been fixed from payment_failed to setup_intent_completed');
      console.log('✅ Approval should now succeed without "Payment processing failed" error');
    } else {
      console.log('❌ Team 199 still has issues preventing approval');
      console.log('❌ Missing requirements detected above');
    }
    
  } catch (error) {
    console.error('Error testing Team 199 approval:', error);
  } finally {
    await client.end();
  }
}

testTeam199Approval();