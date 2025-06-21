/**
 * Investigate Registration Flow Issue
 * 
 * This script examines the registration flow to understand how teams
 * are submitting registrations without completing payment setup.
 */

import pkg from 'pg';
const { Client } = pkg;

async function investigateRegistrationFlow() {
  console.log('Investigating registration flow and setup intent process...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get detailed registration timeline for recent teams
    console.log('1. Analyzing recent registration patterns...');
    
    const recentRegistrationsQuery = `
      SELECT id, name, status, payment_status, setup_intent_id, 
             stripe_customer_id, payment_method_id,
             created_at, manager_email, total_amount,
             notes
      FROM teams 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND total_amount > 0
      ORDER BY created_at DESC
      LIMIT 15
    `;
    
    const recentResult = await client.query(recentRegistrationsQuery);
    
    console.log(`Found ${recentResult.rows.length} recent registrations with amounts:`);
    console.log('='.repeat(100));
    
    for (const team of recentResult.rows) {
      console.log(`\nTeam: ${team.name}`);
      console.log(`  Created: ${team.created_at}`);
      console.log(`  Amount: $${team.total_amount / 100}`);
      console.log(`  Setup Intent: ${team.setup_intent_id || 'NONE'}`);
      console.log(`  Customer ID: ${team.stripe_customer_id || 'NONE'}`);
      console.log(`  Payment Method: ${team.payment_method_id || 'NONE'}`);
      console.log(`  Status: ${team.status} / ${team.payment_status}`);
      
      if (team.notes) {
        console.log(`  Notes: ${team.notes.substring(0, 100)}...`);
      }
    }
    
    // Check registration workflow patterns
    console.log('\n2. Analyzing setup intent creation patterns...');
    
    const setupIntentAnalysis = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(setup_intent_id) as with_setup_intent,
        COUNT(payment_method_id) as with_payment_method,
        COUNT(stripe_customer_id) as with_customer_id,
        AVG(total_amount) as avg_amount
      FROM teams 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND total_amount > 0
    `;
    
    const analysisResult = await client.query(setupIntentAnalysis);
    const stats = analysisResult.rows[0];
    
    console.log('\nRegistration Flow Analysis (Last 7 days):');
    console.log(`- Total registrations with amounts: ${stats.total_registrations}`);
    console.log(`- Teams with setup intents: ${stats.with_setup_intent}`);
    console.log(`- Teams with payment methods: ${stats.with_payment_method}`);
    console.log(`- Teams with customer IDs: ${stats.with_customer_id}`);
    console.log(`- Average amount: $${parseFloat(stats.avg_amount / 100).toFixed(2)}`);
    
    // Check for registration flow anomalies
    console.log('\n3. Identifying registration flow anomalies...');
    
    const anomaliesQuery = `
      SELECT 
        'No setup intent but has amount' as anomaly_type,
        COUNT(*) as count
      FROM teams 
      WHERE setup_intent_id IS NULL AND total_amount > 0
      
      UNION ALL
      
      SELECT 
        'Setup intent but no customer' as anomaly_type,
        COUNT(*) as count
      FROM teams 
      WHERE setup_intent_id IS NOT NULL AND stripe_customer_id IS NULL
      
      UNION ALL
      
      SELECT 
        'Customer but no payment method' as anomaly_type,
        COUNT(*) as count
      FROM teams 
      WHERE stripe_customer_id IS NOT NULL AND payment_method_id IS NULL
    `;
    
    const anomaliesResult = await client.query(anomaliesQuery);
    
    console.log('\nRegistration Flow Anomalies:');
    anomaliesResult.rows.forEach(anomaly => {
      console.log(`- ${anomaly.anomaly_type}: ${anomaly.count} teams`);
    });
    
    // Check if there are any completed setup intents that weren't processed
    console.log('\n4. Checking for completed but unprocessed setup intents...');
    
    const completedIntentsQuery = `
      SELECT id, name, setup_intent_id, payment_method_id, payment_status
      FROM teams 
      WHERE setup_intent_id IS NOT NULL 
        AND payment_method_id IS NULL
        AND created_at >= CURRENT_DATE - INTERVAL '3 days'
      LIMIT 5
    `;
    
    const completedResult = await client.query(completedIntentsQuery);
    
    if (completedResult.rows.length > 0) {
      console.log('Teams with setup intents but no payment methods:');
      for (const team of completedResult.rows) {
        console.log(`- ${team.name}: ${team.setup_intent_id} (Status: ${team.payment_status})`);
      }
    }
    
    // Look for registration submission patterns
    console.log('\n5. Analyzing registration submission patterns...');
    
    const submissionPatternsQuery = `
      SELECT 
        DATE(created_at) as registration_date,
        COUNT(*) as total_submissions,
        COUNT(setup_intent_id) as with_setup_intent,
        COUNT(payment_method_id) as with_payment_complete,
        SUM(total_amount) / 100 as total_amount_submitted
      FROM teams 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND total_amount > 0
      GROUP BY DATE(created_at)
      ORDER BY registration_date DESC
    `;
    
    const patternsResult = await client.query(submissionPatternsQuery);
    
    console.log('\nDaily Registration Patterns:');
    console.log('Date          | Total | w/Setup | w/Payment | Amount');
    console.log('-'.repeat(55));
    patternsResult.rows.forEach(day => {
      console.log(`${day.registration_date} |   ${day.total_submissions}   |    ${day.with_setup_intent}    |     ${day.with_payment_complete}     | $${parseFloat(day.total_amount_submitted).toFixed(0)}`);
    });
    
    console.log('\n6. Root cause analysis...');
    
    const setupIntentPercentage = (stats.with_setup_intent / stats.total_registrations) * 100;
    const paymentMethodPercentage = (stats.with_payment_method / stats.total_registrations) * 100;
    
    console.log(`Setup Intent Creation Rate: ${setupIntentPercentage.toFixed(1)}%`);
    console.log(`Payment Method Completion Rate: ${paymentMethodPercentage.toFixed(1)}%`);
    
    if (setupIntentPercentage < 50) {
      console.log('\n❌ CRITICAL: Setup intents are not being created for most registrations');
      console.log('This suggests the registration flow is bypassing payment setup entirely');
    } else if (paymentMethodPercentage < 20) {
      console.log('\n❌ CRITICAL: Setup intents are created but customers abandon payment');
      console.log('This suggests UX issues in the payment flow or technical problems');
    }
    
    return {
      totalRegistrations: parseInt(stats.total_registrations),
      withSetupIntent: parseInt(stats.with_setup_intent),
      withPaymentMethod: parseInt(stats.with_payment_method),
      setupIntentRate: setupIntentPercentage,
      paymentCompletionRate: paymentMethodPercentage
    };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

investigateRegistrationFlow().then(result => {
  if (result) {
    console.log('\n=== DIAGNOSIS ===');
    
    if (result.setupIntentRate < 50) {
      console.log('ISSUE: Registration flow is not creating setup intents');
      console.log('Teams can submit registrations without any payment process');
      console.log('This indicates a fundamental bypass in the payment flow');
    } else if (result.paymentCompletionRate < 20) {
      console.log('ISSUE: Setup intents are created but customers abandon payment');
      console.log('The payment UX may be confusing or have technical issues');
    }
    
    console.log('\nThis explains why no teams have completed payment setup');
  }
}).catch(console.error);