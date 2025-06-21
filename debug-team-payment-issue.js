/**
 * Debug Team Payment Issue
 * 
 * This script investigates why team B2017 Academy-1 wasn't charged
 * when approved, checking payment setup and approval flow.
 */

import pkg from 'pg';
const { Client } = pkg;

async function debugTeamPaymentIssue() {
  console.log('Investigating payment issue for team B2017 Academy-1...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Find the team
    console.log('\n1. Finding team B2017 Academy-1...');
    const teamQuery = `
      SELECT id, name, status, payment_status, total_amount, 
             setup_intent_id, payment_method_id, stripe_customer_id,
             payment_intent_id, card_last_four, card_brand,
             created_at
      FROM teams 
      WHERE name ILIKE '%B2017 Academy-1%' OR name ILIKE '%B2017%Academy%1%'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const teamResult = await client.query(teamQuery);
    
    if (teamResult.rows.length === 0) {
      console.log('Team not found. Searching for similar names...');
      const searchQuery = `
        SELECT id, name, status, payment_status 
        FROM teams 
        WHERE name ILIKE '%B2017%' OR name ILIKE '%Academy%'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const searchResult = await client.query(searchQuery);
      console.log('Similar teams found:');
      searchResult.rows.forEach(team => {
        console.log(`  ID: ${team.id}, Name: ${team.name}, Status: ${team.status}, Payment: ${team.payment_status}`);
      });
      return;
    }
    
    const team = teamResult.rows[0];
    console.log('Team found:');
    console.log(`  ID: ${team.id}`);
    console.log(`  Name: ${team.name}`);
    console.log(`  Status: ${team.status}`);
    console.log(`  Payment Status: ${team.payment_status}`);
    console.log(`  Total Amount: $${team.total_amount || 0}`);
    console.log(`  Setup Intent ID: ${team.setup_intent_id || 'None'}`);
    console.log(`  Payment Method ID: ${team.payment_method_id || 'None'}`);
    console.log(`  Payment Intent ID: ${team.payment_intent_id || 'None'}`);
    console.log(`  Card: ${team.card_brand || 'None'} ****${team.card_last_four || 'None'}`);
    
    // Check payment transactions
    console.log('\n2. Checking payment transactions...');
    const transactionQuery = `
      SELECT id, team_id, transaction_type, amount, status, 
             created_at, error_message
      FROM payment_transactions 
      WHERE team_id = $1 
      ORDER BY created_at DESC
    `;
    
    const transactionResult = await client.query(transactionQuery, [team.id]);
    
    if (transactionResult.rows.length > 0) {
      console.log('Payment transactions found:');
      transactionResult.rows.forEach(tx => {
        console.log(`  ${tx.created_at}: ${tx.transaction_type} - $${tx.amount} - ${tx.status}`);
        if (tx.error_message) {
          console.log(`    Error: ${tx.error_message}`);
        }
      });
    } else {
      console.log('No payment transactions found for this team');
    }
    
    // Check event fees
    console.log('\n3. Checking event fees configuration...');
    const eventQuery = `
      SELECT e.id as event_id, e.name as event_name,
             ef.id as fee_id, ef.name as fee_name, ef.amount, ef.fee_type, ef.is_required
      FROM teams t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN event_fees ef ON e.id = ef.event_id
      WHERE t.id = $1
    `;
    
    const eventResult = await client.query(eventQuery, [team.id]);
    
    if (eventResult.rows.length > 0) {
      console.log('Event and fees:');
      const event = eventResult.rows[0];
      console.log(`  Event: ${event.event_name} (ID: ${event.event_id})`);
      
      if (event.fee_id) {
        console.log('  Fees:');
        eventResult.rows.forEach(row => {
          if (row.fee_id) {
            console.log(`    ${row.fee_name}: $${row.amount} (${row.fee_type}, Required: ${row.is_required})`);
          }
        });
      } else {
        console.log('  No fees configured for this event');
      }
    }
    
    // Check if setup intent exists in Stripe
    if (team.setup_intent_id) {
      console.log('\n4. Checking Stripe setup intent...');
      try {
        const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        
        console.log('Stripe setup intent status:');
        console.log(`  Status: ${setupIntent.status}`);
        console.log(`  Payment Method: ${setupIntent.payment_method || 'None'}`);
        console.log(`  Customer: ${setupIntent.customer || 'None'}`);
        
        if (setupIntent.payment_method) {
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
          console.log(`  Card: ${paymentMethod.card.brand} ****${paymentMethod.card.last4}`);
          console.log(`  Card Status: ${paymentMethod.card.checks?.cvc_check || 'Unknown'}`);
        }
        
      } catch (stripeError) {
        console.log(`Stripe error: ${stripeError.message}`);
      }
    }
    
    // Check approval process
    console.log('\n5. Analyzing approval process issue...');
    
    if (!team.setup_intent_id && !team.payment_method_id) {
      console.log('❌ ISSUE: No payment method set up for this team');
      console.log('   The team may have registered without completing payment setup');
    } else if (team.setup_intent_id && !team.payment_intent_id) {
      console.log('❌ ISSUE: Payment method exists but no payment was attempted');
      console.log('   The approval process may not be triggering payment');
    } else if (team.total_amount === null || team.total_amount === 0) {
      console.log('❌ ISSUE: No total amount set for this team');
      console.log('   Cannot charge without a defined amount');
    } else {
      console.log('✅ Payment setup appears complete');
      console.log('   Issue may be in the approval workflow');
    }
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('\nRecommended actions:');
    if (!team.setup_intent_id) {
      console.log('1. Team needs to complete payment method setup');
      console.log('2. Contact team to re-submit with payment information');
    } else if (!team.payment_intent_id && team.total_amount > 0) {
      console.log('1. Manually trigger payment for this team');
      console.log('2. Check approval workflow code for payment processing');
    } else {
      console.log('1. Review approval process logs');
      console.log('2. Check Stripe dashboard for failed payment attempts');
    }
    
  } catch (error) {
    console.log(`Database error: ${error.message}`);
  } finally {
    await client.end();
  }
}

debugTeamPaymentIssue().catch(console.error);