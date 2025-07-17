/**
 * Debug Payment Validation Failure
 * 
 * This script tests specific teams to understand why validation is failing
 */

const { Client } = require('pg');

async function debugValidationFailure() {
  console.log('🔍 DEBUGGING PAYMENT VALIDATION FAILURES');
  console.log('Checking why Desert Empire Surf G17 Academy and other teams fail validation');
  console.log('='.repeat(70));

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Find Desert Empire Surf G17 Academy
    const desertEmpireResult = await client.query(`
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, stripe_customer_id,
             submitter_email
      FROM teams 
      WHERE name ILIKE '%Desert Empire Surf G17%'
      ORDER BY id DESC
      LIMIT 1
    `);

    if (desertEmpireResult.rows.length === 0) {
      console.log('❌ Desert Empire Surf G17 Academy not found');
      return;
    }

    const team = desertEmpireResult.rows[0];
    
    console.log('\n📋 DESERT EMPIRE SURF G17 ACADEMY:');
    console.log(`ID: ${team.id}`);
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Amount: $${(team.total_amount / 100).toFixed(2)}`);
    console.log(`Customer: ${team.stripe_customer_id || 'MISSING ❌'}`);
    console.log(`Payment Method: ${team.payment_method_id || 'MISSING ❌'}`);
    console.log(`Setup Intent: ${team.setup_intent_id || 'MISSING ❌'}`);
    console.log(`Email: ${team.submitter_email}`);

    // Test payment validation manually
    console.log('\n🧪 MANUAL VALIDATION TEST:');
    console.log('-'.repeat(30));
    
    const validationIssues = [];
    
    if (!team.stripe_customer_id) {
      validationIssues.push('Missing Stripe customer ID');
    }
    
    if (!team.payment_method_id) {
      validationIssues.push('Missing payment method ID');
    }
    
    if (!team.setup_intent_id) {
      validationIssues.push('Missing setup intent ID');
    }
    
    if (team.payment_status !== 'setup_intent_completed' && team.payment_status !== 'payment_info_provided') {
      validationIssues.push(`Invalid payment status: ${team.payment_status}`);
    }

    if (validationIssues.length > 0) {
      console.log('❌ VALIDATION ISSUES FOUND:');
      validationIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 AUTO-FIX NEEDED:');
      if (!team.stripe_customer_id && team.payment_method_id) {
        console.log('✓ Can create customer and attach payment method');
      }
      if (!team.stripe_customer_id && !team.payment_method_id) {
        console.log('❌ Cannot fix - no payment method available');
      }
    } else {
      console.log('✅ No validation issues found - team should be approvable!');
    }

    // Check a few more recent teams
    console.log('\n📊 RECENT TEAMS VALIDATION STATUS:');
    console.log('-'.repeat(40));
    
    const recentTeams = await client.query(`
      SELECT id, name, status, payment_status, stripe_customer_id, payment_method_id
      FROM teams 
      WHERE status = 'registered' 
      AND payment_status IN ('setup_intent_completed', 'payment_info_provided')
      ORDER BY id DESC
      LIMIT 3
    `);
    
    recentTeams.rows.forEach(team => {
      const hasCustomer = team.stripe_customer_id ? '✅' : '❌';
      const hasPaymentMethod = team.payment_method_id ? '✅' : '❌';
      const canApprove = team.stripe_customer_id && team.payment_method_id ? '✅ Ready' : '❌ Blocked';
      
      console.log(`Team ${team.id}: ${team.name}`);
      console.log(`  Customer: ${hasCustomer} | Payment Method: ${hasPaymentMethod} | Status: ${canApprove}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await client.end();
  }
}

debugValidationFailure();