/**
 * Test Approval Payment Fix
 * 
 * This script tests the fixed approval payment logic to ensure
 * teams with incomplete setup intents get proper error handling.
 */

import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function testApprovalFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('=== TESTING APPROVAL PAYMENT FIX ===\n');
    
    // Get Test101010101 team data
    const teamResult = await client.query(`
      SELECT id, name, status, payment_status, setup_intent_id, payment_method_id, 
             stripe_customer_id, total_amount, manager_email
      FROM teams 
      WHERE name = 'Test101010101'
      LIMIT 1
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ Test101010101 team not found');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log('📋 Current Team Data:');
    console.log(`ID: ${team.id}`);
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Setup Intent: ${team.setup_intent_id}`);
    console.log(`Payment Method: ${team.payment_method_id || 'null'}`);
    console.log(`Customer ID: ${team.stripe_customer_id || 'null'}`);
    console.log(`Amount: $${team.total_amount / 100}\n`);
    
    // Reset team status to 'registered' to test approval again
    console.log('🔄 Resetting team status to "registered" to test approval...');
    await client.query(`
      UPDATE teams 
      SET status = 'registered', 
          payment_status = NULL,
          notes = NULL
      WHERE id = $1
    `, [team.id]);
    
    console.log('✅ Team status reset to "registered"\n');
    
    // Now test the approval endpoint
    console.log('🧪 Testing approval endpoint...');
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/teams/${team.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Testing approval payment fix'
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Approval request successful');
        console.log('Response:', JSON.stringify(result, null, 2));
        
        // Check the updated team status
        const updatedTeamResult = await client.query(`
          SELECT id, name, status, payment_status, notes
          FROM teams 
          WHERE id = $1
        `, [team.id]);
        
        if (updatedTeamResult.rows.length > 0) {
          const updatedTeam = updatedTeamResult.rows[0];
          console.log('\n📋 Updated Team Status:');
          console.log(`Status: ${updatedTeam.status}`);
          console.log(`Payment Status: ${updatedTeam.payment_status}`);
          console.log(`Notes: ${updatedTeam.notes}`);
          
          if (updatedTeam.payment_status === 'payment_failed') {
            console.log('\n✅ SUCCESS: Incomplete setup intent properly detected!');
            console.log('The approval system now correctly identifies teams that need payment completion.');
          } else {
            console.log('\n❌ UNEXPECTED: Payment status should be "payment_failed" for incomplete setup intent');
          }
        }
      } else {
        console.log('❌ Approval request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error details:', errorText);
      }
      
    } catch (fetchError) {
      console.log('❌ Error calling approval endpoint:', fetchError.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testApprovalFix();