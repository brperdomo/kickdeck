/**
 * Test Approved Team Payment Functionality
 * 
 * This script tests the functionality to charge a team after it's been approved.
 * It uses the payment method that was previously saved via the Setup Intent process.
 * 
 * Steps:
 * 1. Find a team with a valid payment method (that went through the setup intent process)
 * 2. Process a payment for that team
 * 3. Verify that the payment was processed successfully
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';
const { Client } = pg;

// Server URL - assuming local development
const API_URL = 'http://localhost:5000/api';
const TEST_PAYMENT_AMOUNT = 100.00; // $100.00 test payment

async function testApprovedTeamPayment() {
  console.log('Starting approved team payment test');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');
    
    // Step 1: Find a test team with payment method attached
    const teamQuery = `
      SELECT id, name, event_id, payment_status, payment_method_id, card_brand, card_last_4 
      FROM teams
      WHERE payment_method_id IS NOT NULL AND payment_status = 'payment_info_provided'
      LIMIT 1;
    `;
    
    const teamResult = await client.query(teamQuery);
    if (teamResult.rows.length === 0) {
      throw new Error('No team with payment method found. Run test-setup-intent.js first to set up a team payment method.');
    }
    
    const testTeam = teamResult.rows[0];
    console.log(`Using team: ${testTeam.name} (ID: ${testTeam.id})`);
    console.log(`Current payment status: ${testTeam.payment_status}`);
    console.log(`Current payment method: ${testTeam.card_brand} ending in ${testTeam.card_last_4}`);
    
    // Step 2: Process a payment for the team
    console.log(`Processing payment of $${TEST_PAYMENT_AMOUNT.toFixed(2)} for team...`);
    const paymentResponse = await fetch(`${API_URL}/payments/process-approved-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: testTeam.id,
        amount: TEST_PAYMENT_AMOUNT
      })
    });
    
    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Failed to process payment: ${error}`);
    }
    
    const paymentResult = await paymentResponse.json();
    console.log(`Payment result: ${JSON.stringify(paymentResult)}`);
    
    // Step 3: Verify team was updated with payment details
    console.log('Verifying team payment details...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to ensure DB is updated
    
    const verifyQuery = `
      SELECT id, name, payment_status, payment_intent_id, payment_date
      FROM teams
      WHERE id = $1;
    `;
    
    const verifyResult = await client.query(verifyQuery, [testTeam.id]);
    const updatedTeam = verifyResult.rows[0];
    
    console.log('Team payment details after payment processing:');
    console.log(`  Payment Status: ${updatedTeam.payment_status}`);
    console.log(`  Payment Intent ID: ${updatedTeam.payment_intent_id}`);
    console.log(`  Payment Date: ${updatedTeam.payment_date}`);
    
    if (updatedTeam.payment_status !== 'succeeded') {
      throw new Error(`Expected payment_status to be 'succeeded', but got '${updatedTeam.payment_status}'`);
    }
    
    if (!updatedTeam.payment_intent_id) {
      throw new Error('Expected payment_intent_id to be set, but it was not');
    }
    
    // Step 4: Check for payment transaction record
    const transactionQuery = `
      SELECT id, team_id, payment_intent_id, amount, status, payment_date
      FROM payment_transactions
      WHERE team_id = $1 AND payment_intent_id = $2;
    `;
    
    const transactionResult = await client.query(transactionQuery, [
      testTeam.id, 
      updatedTeam.payment_intent_id
    ]);
    
    if (transactionResult.rows.length === 0) {
      throw new Error('No payment transaction record was created');
    }
    
    const transaction = transactionResult.rows[0];
    console.log('Payment transaction record:');
    console.log(`  Transaction ID: ${transaction.id}`);
    console.log(`  Amount: $${transaction.amount}`);
    console.log(`  Status: ${transaction.status}`);
    console.log(`  Payment Date: ${transaction.payment_date}`);
    
    console.log('✅ Test completed successfully! The approved team payment functionality is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the test
testApprovedTeamPayment();