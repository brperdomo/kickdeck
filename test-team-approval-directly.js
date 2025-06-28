/**
 * Test Team Approval Directly
 * 
 * This script directly tests the approval process for teams 218 and 212
 * to capture the exact error causing payment failures.
 */

import { db } from './db/index.js';
import { teams, events } from './db/schema.js';
import { eq } from 'drizzle-orm';

// Import the approval function directly
import './server/routes/stripe-connect-payments.js';

async function testTeamApproval() {
  try {
    console.log('🧪 Testing team approval process directly...\n');
    
    const testTeamId = 218; // Start with team 218
    
    console.log(`=== Testing Team ${testTeamId} Approval ===`);
    
    // Get current team status
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, testTeamId)
    });
    
    if (!team) {
      console.log(`❌ Team ${testTeamId} not found`);
      return;
    }
    
    console.log(`📋 Team: ${team.name}`);
    console.log(`💰 Total Amount: $${team.totalAmount ? (team.totalAmount / 100).toFixed(2) : '0.00'}`);
    console.log(`📊 Current Status: ${team.status}`);
    console.log(`💳 Payment Status: ${team.paymentStatus}`);
    console.log(`🔗 Setup Intent: ${team.setupIntentId}`);
    console.log(`💳 Payment Method: ${team.paymentMethodId}`);
    console.log(`👤 Customer: ${team.stripeCustomerId}`);
    
    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, team.eventId)
    });
    
    if (event) {
      console.log(`🎯 Event: ${event.name}`);
      console.log(`🏦 Connect Account: ${event.stripeConnectAccountId}`);
      console.log(`📊 Connect Status: ${event.connectAccountStatus}`);
      console.log(`⚡ Charges Enabled: ${event.connectChargesEnabled}`);
    }
    
    console.log('\n🚀 Testing chargeApprovedTeam function...');
    
    // Try to manually call the charging function to see the actual error
    try {
      // Import and call the function directly
      const { chargeApprovedTeam } = await import('./server/routes/stripe-connect-payments.js');
      const result = await chargeApprovedTeam(testTeamId);
      
      console.log('✅ Charge successful:', result);
      
    } catch (chargeError) {
      console.log('❌ Charge failed with error:', chargeError.message);
      console.log('📝 Full error:', chargeError);
      
      // Check if it's a specific Stripe error
      if (chargeError.type) {
        console.log(`🔍 Stripe Error Type: ${chargeError.type}`);
        console.log(`🔍 Stripe Error Code: ${chargeError.code}`);
        console.log(`🔍 Stripe Error Param: ${chargeError.param}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTeamApproval().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});