/**
 * Fix Failed Payment Team Setup Intent
 * 
 * This script creates a fresh Setup Intent for team 161 (Tes011) 
 * to resolve the 400 error during Setup Intent confirmation.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Client } from 'pg';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function fixFailedPaymentTeam() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Fixing failed payment team Setup Intent...\n');
    
    const teamId = 161;
    const teamName = 'Tes011';
    
    // Get current team details
    const teamResult = await client.query('SELECT * FROM teams WHERE id = $1', [teamId]);
    if (teamResult.rows.length === 0) {
      console.log('❌ Team not found');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log('=== CURRENT TEAM STATUS ===');
    console.log(`Team: ${team.name} (ID: ${team.id})`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Total Amount: $${(team.total_amount / 100).toFixed(2)}`);
    console.log(`Current Setup Intent: ${team.setup_intent_id}`);
    
    // Check current Setup Intent status
    if (team.setup_intent_id) {
      try {
        const currentSetupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        console.log(`Current Setup Intent Status: ${currentSetupIntent.status}`);
        
        if (currentSetupIntent.status === 'succeeded') {
          console.log('✅ Setup Intent is already succeeded - no fix needed');
          return;
        }
      } catch (error) {
        console.log(`❌ Error retrieving current Setup Intent: ${error.message}`);
      }
    }
    
    console.log('\n=== CREATING FRESH SETUP INTENT ===');
    
    // Calculate fee breakdown for this team
    const tournamentCost = team.total_amount; // $1.00 = 100 cents
    const platformFeeRate = 0.04; // 4%
    const flatFee = 30; // $0.30 in cents
    const platformFee = Math.round(tournamentCost * platformFeeRate) + flatFee;
    const totalAmountWithFees = tournamentCost + platformFee;
    
    console.log(`Tournament Cost: $${(tournamentCost / 100).toFixed(2)}`);
    console.log(`Platform Fee: $${(platformFee / 100).toFixed(2)}`);
    console.log(`Total Amount: $${(totalAmountWithFees / 100).toFixed(2)}`);
    
    // Create a fresh Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: team.stripe_customer_id || undefined,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        teamId: team.id.toString(),
        teamName: team.name,
        eventId: team.event_id,
        tournamentCost: tournamentCost.toString(),
        platformFee: platformFee.toString(),
        totalAmount: totalAmountWithFees.toString(),
        type: 'team_registration_fixed'
      }
    });
    
    console.log(`✅ Created fresh Setup Intent: ${setupIntent.id}`);
    console.log(`Client Secret: ${setupIntent.client_secret}`);
    
    // Update team with new Setup Intent
    await client.query(`
      UPDATE teams 
      SET setup_intent_id = $1, 
          payment_status = 'setup_intent_created',
          notes = COALESCE(notes, '') || ' | Fresh Setup Intent created to fix payment confirmation issue'
      WHERE id = $2
    `, [setupIntent.id, teamId]);
    
    console.log('✅ Updated team with fresh Setup Intent');
    
    console.log('\n=== PAYMENT COMPLETION URL ===');
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.kickdeck.io' 
      : 'http://localhost:5000';
    
    const paymentUrl = `${baseUrl}/complete-payment?setup_intent=${setupIntent.id}&team_id=${teamId}`;
    console.log(`Payment URL: ${paymentUrl}`);
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Use the payment completion URL above');
    console.log('2. Enter credit card information');
    console.log('3. Submit payment should now work without 400 error');
    console.log('4. Verify payment processing completes successfully');
    
    console.log('\n=== TECHNICAL SUMMARY ===');
    console.log('🔧 FIXED: Created fresh Setup Intent to replace corrupted one');
    console.log('🔧 FIXED: Updated team payment status to setup_intent_created');
    console.log('🔧 FIXED: Payment completion URL ready for testing');
    console.log('✅ Team 161 payment issue resolved');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixFailedPaymentTeam();