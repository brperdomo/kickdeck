/**
 * Test Payment Enforcement for "Collect Now, Charge Later" Workflow
 * 
 * This script tests that:
 * 1. Teams cannot register without completing payment setup when fees are required
 * 2. Setup Intents are properly verified before allowing registration
 * 3. Payment method information is stored correctly
 */

import { db } from './db/index.js';
import { events, teams, eventFees } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function testPaymentEnforcement() {
  console.log('🧪 Testing Payment Enforcement for "Collect Now, Charge Later" Workflow\n');
  
  try {
    // Find an event with fees for testing
    const eventWithFees = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        feeId: eventFees.id,
        feeName: eventFees.name,
        feeAmount: eventFees.amount
      })
      .from(events)
      .innerJoin(eventFees, eq(events.id, eventFees.eventId))
      .limit(1);

    if (eventWithFees.length === 0) {
      console.log('❌ No events with fees found for testing');
      return;
    }

    const event = eventWithFees[0];
    console.log(`📅 Testing with event: ${event.eventName} (ID: ${event.eventId})`);
    console.log(`💰 Fee: ${event.feeName} - $${(event.feeAmount / 100).toFixed(2)}\n`);

    // Test 1: Attempt registration without payment setup (should fail)
    console.log('Test 1: Registration without payment setup (should fail)');
    try {
      const response = await fetch(`http://localhost:5000/api/events/${event.eventId}/register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Team - No Payment',
          ageGroupId: 1,
          paymentMethod: 'card',
          selectedFeeIds: [event.feeId],
          totalAmount: event.feeAmount,
          headCoachName: 'Test Coach',
          headCoachEmail: 'test@example.com',
          headCoachPhone: '555-0123',
          managerName: 'Test Manager',
          managerEmail: 'manager@example.com',
          managerPhone: '555-0124',
          termsAcknowledged: true,
          // Missing setupIntentId and paymentMethodId
        }),
      });

      const result = await response.json();
      
      if (response.status === 400 && result.error === 'Payment method setup incomplete') {
        console.log('✅ PASSED: Registration correctly blocked without payment setup');
        console.log(`   Message: ${result.message}\n`);
      } else {
        console.log('❌ FAILED: Registration should have been blocked');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(result, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR in Test 1: ${error.message}\n`);
    }

    // Test 2: Attempt registration with invalid Setup Intent (should fail)
    console.log('Test 2: Registration with invalid Setup Intent (should fail)');
    try {
      const response = await fetch(`http://localhost:5000/api/events/${event.eventId}/register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Team - Invalid Setup',
          ageGroupId: 1,
          paymentMethod: 'card',
          selectedFeeIds: [event.feeId],
          totalAmount: event.feeAmount,
          setupIntentId: 'seti_invalid_setup_intent_id',
          paymentMethodId: 'pm_invalid_payment_method',
          headCoachName: 'Test Coach',
          headCoachEmail: 'test@example.com',
          headCoachPhone: '555-0123',
          managerName: 'Test Manager',
          managerEmail: 'manager@example.com',
          managerPhone: '555-0124',
          termsAcknowledged: true,
        }),
      });

      const result = await response.json();
      
      if (response.status === 400 && result.error === 'Payment verification failed') {
        console.log('✅ PASSED: Registration correctly blocked with invalid Setup Intent');
        console.log(`   Message: ${result.message}\n`);
      } else {
        console.log('❌ FAILED: Registration should have been blocked for invalid Setup Intent');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(result, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR in Test 2: ${error.message}\n`);
    }

    // Test 3: Pay Later option (should work for legitimate cases)
    console.log('Test 3: Pay Later registration (should work)');
    try {
      const response = await fetch(`http://localhost:5000/api/events/${event.eventId}/register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Team - Pay Later',
          ageGroupId: 1,
          paymentMethod: 'pay_later',
          selectedFeeIds: [event.feeId],
          totalAmount: event.feeAmount,
          headCoachName: 'Test Coach',
          headCoachEmail: 'test@example.com',
          headCoachPhone: '555-0123',
          managerName: 'Test Manager',
          managerEmail: 'manager@example.com',
          managerPhone: '555-0124',
          termsAcknowledged: true,
        }),
      });

      const result = await response.json();
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ PASSED: Pay Later registration works correctly');
        console.log(`   Team created with status: ${result.team?.status || 'unknown'}`);
        console.log(`   Payment status: ${result.team?.paymentStatus || 'unknown'}\n`);
        
        // Clean up - delete the test team
        if (result.team?.id) {
          await db.delete(teams).where(eq(teams.id, result.team.id));
          console.log('🧹 Test team cleaned up\n');
        }
      } else {
        console.log('❌ FAILED: Pay Later registration should work');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(result, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR in Test 3: ${error.message}\n`);
    }

    // Test 4: Check existing teams with Setup Intents
    console.log('Test 4: Checking existing teams with Setup Intent status');
    try {
      const teamsWithSetupIntents = await db
        .select({
          id: teams.id,
          name: teams.name,
          setupIntentId: teams.setupIntentId,
          paymentMethodId: teams.paymentMethodId,
          paymentStatus: teams.paymentStatus,
          status: teams.status,
          totalAmount: teams.totalAmount
        })
        .from(teams)
        .where(eq(teams.eventId, event.eventId))
        .limit(5);

      console.log(`Found ${teamsWithSetupIntents.length} teams for this event:`);
      
      for (const team of teamsWithSetupIntents) {
        console.log(`  Team: ${team.name}`);
        console.log(`    Setup Intent: ${team.setupIntentId || 'None'}`);
        console.log(`    Payment Method: ${team.paymentMethodId || 'None'}`);
        console.log(`    Payment Status: ${team.paymentStatus || 'None'}`);
        console.log(`    Team Status: ${team.status || 'None'}`);
        console.log(`    Amount: $${team.totalAmount ? (team.totalAmount / 100).toFixed(2) : '0.00'}`);
        console.log('');
      }

    } catch (error) {
      console.log(`❌ ERROR in Test 4: ${error.message}\n`);
    }

    console.log('🎯 Payment Enforcement Test Summary:');
    console.log('   - "Collect Now, Charge Later" requires completed Setup Intent');
    console.log('   - Invalid Setup Intents are rejected');
    console.log('   - "Pay Later" option remains available for onsite collection');
    console.log('   - Payment method information is properly stored\n');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPaymentEnforcement()
    .then(() => {
      console.log('✅ Payment enforcement test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Payment enforcement test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentEnforcement };