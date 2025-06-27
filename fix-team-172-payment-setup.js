/**
 * Fix Team 172 Payment Setup
 * 
 * This script creates a fresh Setup Intent for team 172 and generates
 * a payment completion URL that they can use to complete their payment setup.
 */

import Stripe from 'stripe';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function fixTeam172PaymentSetup() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    const teamId = 172;
    console.log(`Creating fresh Setup Intent for team ${teamId}...`);
    
    // Get team details
    const teamResult = await client.query('SELECT * FROM teams WHERE id = $1', [teamId]);
    
    if (teamResult.rows.length === 0) {
      throw new Error('Team not found');
    }
    
    const team = teamResult.rows[0];
    console.log(`Team: ${team.name} (${team.submitter_email})`);
    console.log(`Current Setup Intent: ${team.setup_intent_id}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Total Amount: $${(team.total_amount / 100).toFixed(2)}`);
    
    // Create a fresh Setup Intent for the team
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session',
      metadata: {
        teamId: teamId.toString(),
        teamName: team.name || 'Unknown Team',
        originalSetupIntent: team.setup_intent_id || 'none',
        eventType: 'admin_payment_fix',
        managerEmail: team.submitter_email || 'unknown'
      }
    });
    
    console.log(`\n✅ Created fresh Setup Intent: ${setupIntent.id}`);
    console.log(`Client Secret: ${setupIntent.client_secret}`);
    
    // Update team record
    const updateQuery = `
      UPDATE teams 
      SET 
        setup_intent_id = $1,
        payment_status = 'setup_intent_created',
        notes = COALESCE(notes, '') || $2
      WHERE id = $3
    `;
    
    const noteUpdate = `\nAdmin payment fix: Fresh Setup Intent created ${setupIntent.id} (${new Date().toISOString()})`;
    
    await client.query(updateQuery, [setupIntent.id, noteUpdate, teamId]);
    
    console.log(`\n✅ Updated team record with new Setup Intent`);
    
    // Generate payment completion URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.matchpro.ai' 
      : 'http://localhost:5000';
    
    const completionUrl = `${baseUrl}/complete-payment?setup_intent=${setupIntent.client_secret}&team_id=${teamId}`;
    
    console.log(`\n📋 Payment Completion URL:`);
    console.log(completionUrl);
    
    console.log(`\n📧 Instructions:`);
    console.log(`1. Send the payment completion URL to: ${team.submitter_email}`);
    console.log(`2. Team manager should complete payment setup using the URL`);
    console.log(`3. Once payment setup is complete, try approving the team again`);
    console.log(`4. The approval process will automatically charge the team upon approval`);
    
    console.log(`\n✅ Payment fix complete for team ${teamId}`);
    
    return {
      setupIntentId: setupIntent.id,
      completionUrl: completionUrl,
      teamEmail: team.submitter_email
    };
    
  } catch (error) {
    console.error('Error fixing team payment setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixTeam172PaymentSetup().catch(console.error);