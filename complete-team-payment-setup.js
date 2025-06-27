/**
 * Complete Payment Setup for Teams with Incomplete Payment Methods
 * 
 * This script handles teams that were approved but couldn't be charged
 * because they didn't complete payment method setup during registration.
 */

import { config } from 'dotenv';
import { db } from './db/index.ts';
import { teams } from './db/schema.ts';
import { eq } from 'drizzle-orm';

config();

async function completeTeamPaymentSetup(teamId) {
  try {
    console.log(`🔧 Generating payment completion URL for Team ${teamId}...`);
    
    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      console.log(`❌ Team ${teamId} not found`);
      return;
    }
    
    console.log(`📋 Team: ${team.name}`);
    console.log(`📋 Status: ${team.status}`);
    console.log(`📋 Total Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    
    // Make API call to generate payment completion URL
    const response = await fetch('http://localhost:5000/api/admin/teams/' + teamId + '/payment-completion-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.completionUrl) {
      console.log('✅ Payment completion URL generated successfully:');
      console.log('');
      console.log('🔗 PAYMENT COMPLETION URL:');
      console.log(result.completionUrl);
      console.log('');
      console.log('📧 Send this URL to the team manager to complete their payment setup.');
      console.log('⏱️ This URL is secure and unique to this team registration.');
      
      // Also copy to clipboard if supported
      try {
        const { writeSync } = await import('clipboardy');
        writeSync(result.completionUrl);
        console.log('📋 URL copied to clipboard!');
      } catch (clipboardError) {
        console.log('💡 You can manually copy the URL above');
      }
      
    } else {
      console.log('❌ Failed to generate completion URL:');
      console.log(result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

const teamId = process.argv[2];
if (!teamId) {
  console.log('Usage: node complete-team-payment-setup.js <teamId>');
  console.log('Example: node complete-team-payment-setup.js 179');
  process.exit(1);
}

completeTeamPaymentSetup(parseInt(teamId, 10));