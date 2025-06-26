/**
 * Test Approval System for Test101010101
 * 
 * This script tests the improved approval system that handles
 * teams with incomplete setup intents through auto-recovery.
 */

import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';

// Import the charge function from stripe-connect-payments
async function testApprovalSystem() {
  console.log('🧪 Testing Approval System with Test101010101');
  console.log('===============================================');
  
  try {
    // Import the charging function
    const { chargeApprovedTeam } = await import('./server/routes/stripe-connect-payments.js');
    
    const teamId = 165; // Test101010101
    
    console.log(`\n1. Testing approval payment for team ${teamId}...`);
    
    // This should trigger our auto-recovery logic
    const result = await chargeApprovedTeam(teamId);
    
    console.log('\n✅ APPROVAL SYSTEM TEST RESULT:');
    console.log('Success:', result.success);
    console.log('Payment Intent:', result.paymentIntent?.id);
    console.log('Amount Charged:', result.breakdown?.totalCharged);
    
  } catch (error) {
    console.log('\n⚠️  EXPECTED ERROR (Auto-Recovery Triggered):');
    console.log('Error Message:', error.message);
    
    // Check if team was updated with auto-recovery info
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        setupIntentId: teams.setupIntentId,
        paymentStatus: teams.paymentStatus,
        notes: teams.notes
      })
      .from(teams)
      .where(eq(teams.id, 165));
    
    console.log('\n📋 TEAM STATUS AFTER AUTO-RECOVERY:');
    console.log('Team ID:', team.id);
    console.log('Name:', team.name);
    console.log('Setup Intent ID:', team.setupIntentId);
    console.log('Payment Status:', team.paymentStatus);
    console.log('Notes:', team.notes);
    
    if (team.paymentStatus === 'payment_required') {
      console.log('\n✅ AUTO-RECOVERY SUCCESSFUL');
      console.log('Team marked for payment completion URL generation');
      console.log('Admin should see "Generate Payment Completion URL" button');
    } else {
      console.log('\n❌ AUTO-RECOVERY MAY HAVE FAILED');
      console.log('Team status not updated as expected');
    }
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testApprovalSystem().catch(console.error);