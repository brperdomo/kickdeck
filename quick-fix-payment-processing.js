/**
 * Quick Fix Payment Processing
 * 
 * This script creates a working payment approval function that bypasses 
 * all the TypeScript schema issues and directly processes team approvals.
 */

import { db } from './db/index.js';
import { teams, events } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * Simple, working payment processing function
 */
async function processTeamApproval(teamId) {
  try {
    console.log(`🚀 Processing approval for team ${teamId}...`);
    
    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }
    
    console.log(`📋 Team: ${team.name}`);
    console.log(`💰 Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    
    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, team.eventId)
    });
    
    if (!event) {
      throw new Error(`Event ${team.eventId} not found`);
    }
    
    console.log(`🎯 Event: ${event.name}`);
    console.log(`🏦 Connect Account: ${event.stripeConnectAccountId}`);
    
    // Calculate fees
    const totalAmount = team.totalAmount; // already in cents
    const platformFeePercent = 5; // 5% platform fee
    const platformFee = Math.round(totalAmount * (platformFeePercent / 100));
    const tournamentAmount = totalAmount - platformFee;
    
    console.log(`💰 Total: $${(totalAmount / 100).toFixed(2)}`);
    console.log(`🏆 To Tournament: $${(tournamentAmount / 100).toFixed(2)}`);
    console.log(`🏢 Platform Fee: $${(platformFee / 100).toFixed(2)}`);
    
    // Create Payment Intent with destination charge (using transfer_data only)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      payment_method: team.paymentMethodId,
      customer: team.stripeCustomerId,
      confirm: true,
      return_url: 'https://app.matchpro.ai/payment-complete',
      transfer_data: {
        destination: event.stripeConnectAccountId,
        amount: tournamentAmount
      },
      // application_fee_amount: platformFee,  // Can't use with transfer_data[amount]
      metadata: {
        type: 'team_approval',
        teamId: teamId.toString(),
        eventId: team.eventId.toString(),
        teamName: team.name,
        eventName: event.name,
        platformFee: platformFee.toString()
      }
    });
    
    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`💳 Status: ${paymentIntent.status}`);
    
    if (paymentIntent.status === 'succeeded') {
      // Update team status to approved and paid
      await db.update(teams)
        .set({
          status: 'approved',
          paymentStatus: 'paid',
          paymentIntentId: paymentIntent.id,
          notes: `Payment processed successfully. Amount: $${(totalAmount / 100).toFixed(2)}`
        })
        .where(eq(teams.id, teamId));
      
      console.log(`✅ Team ${teamId} approved and payment processed successfully!`);
      
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        platformFee: platformFee,
        tournamentAmount: tournamentAmount
      };
      
    } else {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing team ${teamId}:`, error.message);
    
    // Update team with error status
    try {
      await db.update(teams)
        .set({
          paymentStatus: 'payment_failed',
          notes: `Payment failed: ${error.message}`
        })
        .where(eq(teams.id, teamId));
    } catch (updateError) {
      console.error('Failed to update team with error status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Test the function with the failing teams
 */
async function testApprovals() {
  console.log('🧪 Testing payment approvals...\n');
  
  const testTeams = [212]; // Now test team 212
  
  for (const teamId of testTeams) {
    try {
      console.log(`=== Testing Team ${teamId} ===`);
      const result = await processTeamApproval(teamId);
      console.log('✅ Success:', result);
      console.log('');
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log('');
    }
  }
}

// Export the function for use in the main server
export { processTeamApproval };

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testApprovals().then(() => {
    console.log('🏁 Testing complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}