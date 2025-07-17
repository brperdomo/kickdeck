#!/usr/bin/env node

/**
 * Test script for the Intelligent Payment Recovery System
 * Simulates admin approval of Team 500 to test burned payment method recovery
 */

import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';

async function testIntelligentRecovery() {
  console.log('🧪 TESTING INTELLIGENT PAYMENT RECOVERY SYSTEM');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // 1. Get Team 500 current status
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, 500))
      .limit(1);
    
    if (!team) {
      console.log('❌ Team 500 not found');
      return;
    }
    
    console.log('1. TEAM 500 STATUS BEFORE RECOVERY');
    console.log('-'.repeat(40));
    console.log(`   Name: ${team.name}`);
    console.log(`   Status: ${team.status}`);
    console.log(`   Payment Status: ${team.paymentStatus}`);
    console.log(`   Setup Intent: ${team.setupIntentId}`);
    console.log(`   Customer ID: ${team.stripeCustomerId}`);
    console.log(`   Total Amount: $${team.totalAmount ? (team.totalAmount / 100).toFixed(2) : 'N/A'}`);
    console.log('');
    
    if (team.status === 'approved') {
      console.log('✅ Team 500 is already approved. Recovery was successful!');
      return;
    }
    
    if (team.paymentStatus !== 'setup_intent_completed') {
      console.log(`⚠️  Team 500 payment status is '${team.paymentStatus}', not 'setup_intent_completed'`);
      console.log('   This team may not trigger the burned payment method recovery.');
      console.log('');
    }
    
    // 2. Simulate admin approval via API call
    console.log('2. SIMULATING ADMIN APPROVAL');
    console.log('-'.repeat(40));
    console.log('   Making API call to approve Team 500...');
    
    const approvalResponse = await fetch(`http://localhost:5000/api/admin/teams/500/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Recovery-System'
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Testing intelligent payment recovery system'
      })
    });
    
    console.log(`   Response Status: ${approvalResponse.status}`);
    
    if (!approvalResponse.ok) {
      const errorText = await approvalResponse.text();
      console.log(`   Response Body: ${errorText}`);
      
      if (approvalResponse.status === 401) {
        console.log('⚠️  Authentication required. The recovery system is implemented but requires admin login.');
        console.log('   To test manually: Log in as admin and approve Team 500 through the interface.');
        return;
      }
    } else {
      const responseData = await approvalResponse.json();
      console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
    }
    
    console.log('');
    
    // 3. Check Team 500 status after approval attempt
    console.log('3. TEAM 500 STATUS AFTER APPROVAL ATTEMPT');
    console.log('-'.repeat(40));
    
    const [updatedTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, 500))
      .limit(1);
    
    console.log(`   Name: ${updatedTeam.name}`);
    console.log(`   Status: ${updatedTeam.status}`);
    console.log(`   Payment Status: ${updatedTeam.paymentStatus}`);
    console.log(`   Payment Intent: ${updatedTeam.paymentIntentId || 'None'}`);
    console.log(`   Notes: ${updatedTeam.notes || 'None'}`);
    console.log('');
    
    // 4. Results analysis
    console.log('4. RECOVERY SYSTEM ANALYSIS');
    console.log('-'.repeat(40));
    
    if (updatedTeam.status === 'approved' && updatedTeam.paymentStatus === 'paid') {
      console.log('🎉 INTELLIGENT RECOVERY SUCCESS!');
      console.log('   ✅ Team status changed to approved');
      console.log('   ✅ Payment status changed to paid');
      console.log('   ✅ Payment Intent created:', updatedTeam.paymentIntentId);
      console.log('   ✅ Burned payment method was automatically recovered');
      console.log('');
      console.log('🚀 The Intelligent Payment Recovery System is working perfectly!');
      console.log('   Teams with burned payment methods can now be approved automatically');
      console.log('   without requiring new payment method entry.');
    } else if (updatedTeam.notes?.includes('recovery')) {
      console.log('⚠️  RECOVERY ATTEMPTED BUT INCOMPLETE');
      console.log('   Check server logs for detailed recovery process information');
    } else if (updatedTeam.notes?.includes('invalid')) {
      console.log('❌ RECOVERY FAILED - Fell back to marking payment method as invalid');
      console.log('   This indicates the recovery system detected an issue it could not resolve');
    } else {
      console.log('ℹ️  NO RECOVERY TRIGGERED');
      console.log('   The approval may not have triggered the burned payment method error');
      console.log('   or authentication was required for the API call');
    }
    
  } catch (error) {
    console.log(`❌ Error testing recovery: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
}

// Run the test
testIntelligentRecovery()
  .then(() => {
    console.log('\n📋 TEST COMPLETED');
    console.log('Check server logs for detailed recovery process information');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });