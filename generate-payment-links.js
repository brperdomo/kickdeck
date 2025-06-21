/**
 * Generate Payment Completion Links for All Teams
 * 
 * This script generates secure payment completion links for all teams
 * that need to complete their payment setup and sends notification emails.
 */

import pkg from 'pg';
const { Client } = pkg;
import crypto from 'crypto';

// Generate secure payment completion token
function generatePaymentToken(teamId) {
  const secret = process.env.PAYMENT_COMPLETION_SECRET || 'fallback-secret-key';
  const timestamp = Date.now();
  const data = `${teamId}-${timestamp}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${teamId}.${timestamp}.${hash}`;
}

async function generatePaymentLinks() {
  console.log('Generating payment completion links for all teams...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get all teams that need payment completion
    const teamsQuery = `
      SELECT t.id, t.name, t.total_amount, t.submitter_email, t.manager_email,
             e.name as event_name, ag.age_group, ag.gender, t.status
      FROM teams t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      WHERE t.total_amount > 0 
        AND t.payment_method_id IS NULL
        AND t.status IN ('registered', 'pending')
      ORDER BY t.total_amount DESC
    `;
    
    const result = await client.query(teamsQuery);
    const teams = result.rows;
    
    console.log(`Found ${teams.length} teams requiring payment completion`);
    
    if (teams.length === 0) {
      console.log('No teams found that need payment completion');
      return;
    }
    
    const baseUrl = process.env.FRONTEND_URL || 'https://app.matchpro.ai';
    let totalAmount = 0;
    const teamsWithLinks = [];
    
    for (const team of teams) {
      const token = generatePaymentToken(team.id);
      const completionUrl = `${baseUrl}/complete-payment/${token}`;
      const contactEmail = team.submitter_email || team.manager_email;
      
      totalAmount += team.total_amount;
      
      teamsWithLinks.push({
        id: team.id,
        name: team.name,
        amount: (team.total_amount / 100).toFixed(2),
        eventName: team.event_name,
        ageGroup: `${team.age_group || ''} ${team.gender || ''}`.trim(),
        contactEmail,
        completionUrl,
        status: team.status
      });
    }
    
    // Display summary
    console.log('\n=== PAYMENT COMPLETION LINKS GENERATED ===');
    console.log(`Total teams: ${teams.length}`);
    console.log(`Total uncollected amount: $${(totalAmount / 100).toFixed(2)}`);
    console.log('\nTeam Details:');
    console.log('=' .repeat(100));
    
    teamsWithLinks.forEach(team => {
      console.log(`\nTeam: ${team.name}`);
      console.log(`  Event: ${team.eventName}`);
      console.log(`  Age Group: ${team.ageGroup}`);
      console.log(`  Amount: $${team.amount}`);
      console.log(`  Contact: ${team.contactEmail}`);
      console.log(`  Status: ${team.status}`);
      console.log(`  Payment Link: ${team.completionUrl}`);
    });
    
    // Generate CSV for easy sharing
    const csvData = [
      'Team Name,Event,Age Group,Amount,Contact Email,Payment Link,Status'
    ];
    
    teamsWithLinks.forEach(team => {
      csvData.push(`"${team.name}","${team.eventName}","${team.ageGroup}","$${team.amount}","${team.contactEmail}","${team.completionUrl}","${team.status}"`);
    });
    
    const fs = await import('fs');
    await fs.promises.writeFile('payment-completion-links.csv', csvData.join('\n'));
    
    console.log('\n=== SUMMARY ===');
    console.log(`✓ Generated ${teams.length} payment completion links`);
    console.log(`✓ Total revenue pending: $${(totalAmount / 100).toFixed(2)}`);
    console.log('✓ Links saved to payment-completion-links.csv');
    console.log('\nNext steps:');
    console.log('1. Share payment links with team contacts');
    console.log('2. Monitor payment completions via admin dashboard');
    console.log('3. Approve teams once payment setup is complete');
    
    return {
      totalTeams: teams.length,
      totalAmount: totalAmount / 100,
      teamsWithLinks
    };
    
  } catch (error) {
    console.error('Error generating payment links:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Test payment completion link validation
async function testPaymentLink(teamId) {
  console.log(`\nTesting payment link for team ID: ${teamId}`);
  
  try {
    const token = generatePaymentToken(teamId);
    const baseUrl = 'http://localhost:5000';
    
    // Test token validation
    const response = await fetch(`${baseUrl}/api/payment-completion/validate-token/${token}`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Payment link validation successful');
      console.log(`  Team: ${result.team.name}`);
      console.log(`  Amount: $${(result.team.amount / 100).toFixed(2)}`);
      console.log(`  Event: ${result.team.eventName}`);
    } else {
      console.log('✗ Payment link validation failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.log('✗ Error testing payment link:', error.message);
    return null;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePaymentLinks()
    .then(async (result) => {
      if (result && result.teamsWithLinks.length > 0) {
        // Test the first payment link
        await testPaymentLink(result.teamsWithLinks[0].id);
      }
      console.log('\nPayment link generation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { generatePaymentLinks, testPaymentLink };