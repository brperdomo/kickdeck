/**
 * Investigate Registration Payment Bypass Issue
 * 
 * This script examines how teams are bypassing payment setup
 * during registration in production.
 */

import pkg from 'pg';
const { Client } = pkg;

async function investigateRegistrationBypass() {
  console.log('Investigating how teams bypass payment in registration...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get recent registrations to analyze patterns
    const recentQuery = `
      SELECT id, name, status, payment_status, setup_intent_id, 
             stripe_customer_id, payment_method_id, total_amount,
             created_at, manager_email
      FROM teams 
      WHERE total_amount > 0
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    const recentResult = await client.query(recentQuery);
    
    console.log(`Analyzing ${recentResult.rows.length} recent team registrations:`);
    console.log('='.repeat(80));
    
    let patternsFound = {
      hasSetupIntent: 0,
      hasPaymentMethod: 0,
      hasCustomerId: 0,
      totalWithAmount: 0
    };
    
    recentResult.rows.forEach(team => {
      console.log(`\nTeam: ${team.name}`);
      console.log(`  Amount: $${team.total_amount / 100}`);
      console.log(`  Setup Intent: ${team.setup_intent_id ? 'YES' : 'NO'}`);
      console.log(`  Payment Method: ${team.payment_method_id ? 'YES' : 'NO'}`);
      console.log(`  Customer ID: ${team.stripe_customer_id ? 'YES' : 'NO'}`);
      console.log(`  Status: ${team.status}/${team.payment_status}`);
      
      patternsFound.totalWithAmount++;
      if (team.setup_intent_id) patternsFound.hasSetupIntent++;
      if (team.payment_method_id) patternsFound.hasPaymentMethod++;
      if (team.stripe_customer_id) patternsFound.hasCustomerId++;
    });
    
    console.log('\n=== REGISTRATION FLOW ANALYSIS ===');
    console.log(`Total teams with amounts: ${patternsFound.totalWithAmount}`);
    console.log(`Teams with setup intents: ${patternsFound.hasSetupIntent} (${(patternsFound.hasSetupIntent/patternsFound.totalWithAmount*100).toFixed(1)}%)`);
    console.log(`Teams with payment methods: ${patternsFound.hasPaymentMethod} (${(patternsFound.hasPaymentMethod/patternsFound.totalWithAmount*100).toFixed(1)}%)`);
    console.log(`Teams with customer IDs: ${patternsFound.hasCustomerId} (${(patternsFound.hasCustomerId/patternsFound.totalWithAmount*100).toFixed(1)}%)`);
    
    // Check for teams with no payment setup at all
    const noPaymentSetupQuery = `
      SELECT COUNT(*) as count
      FROM teams 
      WHERE total_amount > 0 
        AND setup_intent_id IS NULL
    `;
    
    const noSetupResult = await client.query(noPaymentSetupQuery);
    const noSetupCount = parseInt(noSetupResult.rows[0].count);
    
    console.log(`\nTeams with NO payment setup: ${noSetupCount}`);
    
    // Get pattern breakdown
    const patternAnalysisQuery = `
      SELECT 
        CASE 
          WHEN setup_intent_id IS NULL THEN 'No payment setup attempted'
          WHEN setup_intent_id IS NOT NULL AND payment_method_id IS NULL THEN 'Started but abandoned payment'
          WHEN setup_intent_id IS NOT NULL AND payment_method_id IS NOT NULL THEN 'Completed payment setup'
          ELSE 'Unknown pattern'
        END as payment_pattern,
        COUNT(*) as team_count,
        SUM(total_amount) as total_amount_cents
      FROM teams 
      WHERE total_amount > 0
      GROUP BY payment_pattern
    `;
    
    const patternResult = await client.query(patternAnalysisQuery);
    
    console.log('\n=== PAYMENT SETUP PATTERNS ===');
    patternResult.rows.forEach(pattern => {
      console.log(`${pattern.payment_pattern}: ${pattern.team_count} teams ($${(pattern.total_amount_cents/100).toFixed(0)} total)`);
    });
    
    if (noSetupCount > 0) {
      console.log('\n❌ CRITICAL ISSUE IDENTIFIED:');
      console.log('Teams are submitting registrations without any payment setup');
      console.log('This indicates the registration flow allows bypassing payment entirely');
      
      // Get examples of teams with no payment setup
      const examplesQuery = `
        SELECT id, name, manager_email, total_amount, created_at
        FROM teams 
        WHERE total_amount > 0 
          AND setup_intent_id IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      const examplesResult = await client.query(examplesQuery);
      
      console.log('\nExamples of teams with no payment setup:');
      examplesResult.rows.forEach(team => {
        console.log(`- ${team.name}: $${team.total_amount/100} (${team.manager_email})`);
      });
    }
    
    // Check if setup intents are being created but not linked
    const orphanSetupIntentsQuery = `
      SELECT COUNT(*) as count
      FROM teams 
      WHERE setup_intent_id IS NOT NULL 
        AND stripe_customer_id IS NULL
    `;
    
    const orphanResult = await client.query(orphanSetupIntentsQuery);
    const orphanCount = parseInt(orphanResult.rows[0].count);
    
    if (orphanCount > 0) {
      console.log(`\n⚠️  Found ${orphanCount} teams with setup intents but no customer IDs`);
      console.log('This suggests setup intents are created but not properly linked');
    }
    
    return {
      totalTeams: patternsFound.totalWithAmount,
      setupIntentRate: (patternsFound.hasSetupIntent/patternsFound.totalWithAmount*100),
      paymentMethodRate: (patternsFound.hasPaymentMethod/patternsFound.totalWithAmount*100),
      noPaymentSetup: noSetupCount,
      orphanSetupIntents: orphanCount
    };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  } finally {
    await client.end();
  }
}

investigateRegistrationBypass().then(result => {
  if (result) {
    console.log('\n=== ROOT CAUSE ANALYSIS ===');
    
    if (result.noPaymentSetup > 0) {
      console.log('FINDING: Registration flow allows submission without payment setup');
      console.log('IMPACT: Teams can register and get approved without any payment collection');
      console.log('SOLUTION NEEDED: Enforce payment setup as mandatory step');
    }
    
    if (result.setupIntentRate > 50 && result.paymentMethodRate < 20) {
      console.log('FINDING: Setup intents created but customers abandon payment');
      console.log('IMPACT: High abandonment rate in payment flow');
      console.log('SOLUTION NEEDED: Improve payment UX and error handling');
    }
    
    if (result.setupIntentRate < 50) {
      console.log('FINDING: Setup intents not being created for many registrations');
      console.log('IMPACT: Payment flow is being bypassed entirely');
      console.log('SOLUTION NEEDED: Fix registration flow to require payment');
    }
  }
}).catch(console.error);