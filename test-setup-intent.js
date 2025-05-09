/**
 * Test Setup Intent Functionality
 * 
 * This script tests the Stripe Setup Intent functionality that
 * enables collecting payment information without charging immediately.
 * 
 * It performs the following steps:
 * 1. Create a setup intent for a team
 * 2. Simulate successful completion of the setup intent
 * 3. Check that team's payment method details were updated
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';
const { Client } = pg;

// Server URL - assuming local development
const API_URL = 'http://localhost:5000/api';

async function testSetupIntent() {
  console.log('Starting setup intent test');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');
    
    // Step 1: Find a test team to use
    const teamQuery = `
      SELECT id, name, payment_status 
      FROM teams
      WHERE name LIKE '%Test%'
      LIMIT 1;
    `;
    
    const teamResult = await client.query(teamQuery);
    if (teamResult.rows.length === 0) {
      throw new Error('No test team found. Create a team with "Test" in the name first.');
    }
    
    const testTeam = teamResult.rows[0];
    console.log(`Using test team: ${testTeam.name} (ID: ${testTeam.id})`);
    
    // Step 2: Create a setup intent for the team
    console.log('Creating setup intent...');
    const setupIntentResponse = await fetch(`${API_URL}/payments/create-setup-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: testTeam.id,
        metadata: {
          testMode: 'true',
          teamName: testTeam.name
        }
      })
    });
    
    if (!setupIntentResponse.ok) {
      const error = await setupIntentResponse.text();
      throw new Error(`Failed to create setup intent: ${error}`);
    }
    
    const setupIntentData = await setupIntentResponse.json();
    console.log(`Setup intent created with ID: ${setupIntentData.setupIntentId}`);
    console.log(`Client secret: ${setupIntentData.clientSecret}`);
    
    // Step 3: Simulate the successful completion of the setup intent
    console.log('Simulating webhook for setup intent completion...');
    const webhookResponse = await fetch(`${API_URL}/payments/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupIntentId: setupIntentData.setupIntentId
      })
    });
    
    if (!webhookResponse.ok) {
      const error = await webhookResponse.text();
      throw new Error(`Failed to simulate webhook: ${error}`);
    }
    
    const webhookResult = await webhookResponse.json();
    console.log(`Webhook simulation result: ${JSON.stringify(webhookResult)}`);
    
    // Step 4: Verify team was updated with payment method details
    console.log('Verifying team payment method details...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to ensure DB is updated
    
    const verifyQuery = `
      SELECT id, name, payment_status, setup_intent_id, payment_method_id, card_brand, card_last_4
      FROM teams
      WHERE id = $1;
    `;
    
    const verifyResult = await client.query(verifyQuery, [testTeam.id]);
    const updatedTeam = verifyResult.rows[0];
    
    console.log('Team payment details after setup intent:');
    console.log(`  Payment Status: ${updatedTeam.payment_status}`);
    console.log(`  Setup Intent ID: ${updatedTeam.setup_intent_id}`);
    console.log(`  Payment Method ID: ${updatedTeam.payment_method_id}`);
    console.log(`  Card Brand: ${updatedTeam.card_brand}`);
    console.log(`  Card Last 4: ${updatedTeam.card_last_4}`);
    
    if (updatedTeam.payment_status !== 'payment_info_provided') {
      throw new Error(`Expected payment_status to be 'payment_info_provided', but got '${updatedTeam.payment_status}'`);
    }
    
    if (!updatedTeam.payment_method_id) {
      throw new Error('Expected payment_method_id to be set, but it was not');
    }
    
    console.log('✅ Test completed successfully! The setup intent functionality is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the test
testSetupIntent();