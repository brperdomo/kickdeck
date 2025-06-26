/**
 * Test Admin Approval API Endpoint
 * 
 * This script tests the actual admin approval endpoint that would be used
 * when clicking the Approve button in the admin dashboard.
 */

import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function testAdminApprovalAPI() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('=== TESTING ADMIN APPROVAL API ===\n');
    
    // Find a team with valid payment setup
    console.log('🔍 Finding team with valid payment setup...');
    
    const teamResult = await client.query(`
      SELECT id, name, status, total_amount, setup_intent_id, payment_method_id, 
             stripe_customer_id, manager_email, payment_status
      FROM teams 
      WHERE status = 'registered' 
        AND payment_method_id IS NOT NULL 
        AND setup_intent_id IS NOT NULL
        AND total_amount > 0
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ No teams found with valid payment setup');
      console.log('Please register a team through the website first with payment info');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log(`Found team: ${team.name} (ID: ${team.id})`);
    console.log(`Status: ${team.status}`);
    console.log(`Amount: $${team.total_amount / 100}`);
    console.log(`Payment Method: ${team.payment_method_id}`);
    console.log(`Setup Intent: ${team.setup_intent_id}`);
    console.log(`Customer: ${team.stripe_customer_id || 'null'}`);
    console.log(`Payment Status: ${team.payment_status}\n`);
    
    // Test the approval API endpoint
    console.log('⚡ Testing approval via API endpoint...');
    
    const response = await fetch('http://localhost:5000/api/admin/teams/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-admin-session' // Mock admin session
      },
      body: JSON.stringify({
        teamId: team.id,
        status: 'approved',
        notes: 'API test approval'
      })
    });
    
    const result = await response.json();
    console.log(`API Response Status: ${response.status}`);
    console.log(`Response:`, result);
    
    if (response.ok) {
      // Check the team status after approval
      console.log('\n📋 Checking team status after approval...');
      
      const updatedTeam = await client.query(`
        SELECT id, name, status, payment_status, payment_intent_id, total_amount
        FROM teams WHERE id = $1
      `, [team.id]);
      
      const updated = updatedTeam.rows[0];
      console.log(`Team: ${updated.name}`);
      console.log(`Status: ${updated.status}`);
      console.log(`Payment Status: ${updated.payment_status}`);
      console.log(`Payment Intent: ${updated.payment_intent_id || 'none'}`);
      console.log(`Amount: $${updated.total_amount / 100}`);
      
      if (updated.status === 'approved' && updated.payment_intent_id) {
        console.log('\n✅ SUCCESS! Approval workflow is working correctly');
        console.log('✅ Team approved and payment processed');
        console.log('✅ Payment Intent created in Stripe');
        console.log('✅ Database updated with payment details');
      } else if (updated.status === 'approved') {
        console.log('\n⚠️  Team approved but no payment processed');
        console.log('This indicates the payment method setup needs fixing');
      } else {
        console.log('\n❌ Approval failed - team status unchanged');
      }
    } else {
      console.log(`❌ API call failed: ${result.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

testAdminApprovalAPI().catch(console.error);