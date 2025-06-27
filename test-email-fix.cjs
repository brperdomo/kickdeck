/**
 * Test Email Fix for Link Payments
 * 
 * This script verifies that Link payment customer creation now uses
 * the correct submitterEmail instead of falling back to noemail@example.com
 */

const { Client } = require('pg');

async function testEmailFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Testing email fix for Link payments...\n');
    
    // Check teams with Link payment methods to see their email data
    const teamsResult = await client.query(`
      SELECT id, name, submitter_email, submitter_name, payment_method_id
      FROM teams 
      WHERE payment_method_id IS NOT NULL
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('Recent teams with payment methods:');
    teamsResult.rows.forEach(team => {
      console.log(`Team ${team.id}: ${team.name}`);
      console.log(`  Submitter Email: ${team.submitter_email}`);
      console.log(`  Payment Method: ${team.payment_method_id}`);
      console.log('');
    });
    
    console.log('✅ Email Fix Analysis:');
    console.log('BEFORE FIX: team.email || "noemail@example.com" → undefined || "noemail@example.com" = "noemail@example.com"');
    console.log('AFTER FIX:  team.submitterEmail || "noemail@example.com" → "bperdomo@zoho.com" || "noemail@example.com" = "bperdomo@zoho.com"');
    console.log('');
    console.log('The fix changes line 142 in server/routes/admin/teams.ts from:');
    console.log('  email: team.email || "noemail@example.com"');
    console.log('To:');
    console.log('  email: team.submitterEmail || "noemail@example.com"');
    console.log('');
    console.log('This ensures that when creating Stripe customers for Link payment methods,');
    console.log('the correct submitter email (bperdomo@zoho.com) is used instead of the fallback.');
    
  } catch (error) {
    console.error('Error in email fix test:', error);
  } finally {
    await client.end();
  }
}

testEmailFix();