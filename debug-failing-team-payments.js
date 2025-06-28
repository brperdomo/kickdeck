/**
 * Debug Failing Team Payments Script
 * 
 * This script investigates why teams 218, 199, and 212 are failing
 * during the approval payment process.
 */

import { db } from './db/index.js';
import { teams, events } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function debugFailingPayments() {
  try {
    const failingTeamIds = [218, 199, 212];
    
    console.log('🔍 Debugging failing team payments...\n');
    
    for (const teamId of failingTeamIds) {
      console.log(`\n=== TEAM ${teamId} ===`);
      
      // Get team details
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, teamId)
      });
      
      if (!team) {
        console.log(`❌ Team ${teamId} not found`);
        continue;
      }
      
      console.log(`📋 Team Name: ${team.name}`);
      console.log(`📧 Manager Email: ${team.managerEmail}`);
      console.log(`💰 Total Amount: $${team.totalAmount ? (team.totalAmount / 100).toFixed(2) : '0.00'}`);
      console.log(`📊 Payment Status: ${team.paymentStatus}`);
      console.log(`🔗 Setup Intent ID: ${team.setupIntentId || 'None'}`);
      console.log(`💳 Payment Method ID: ${team.paymentMethodId || 'None'}`);
      console.log(`👤 Customer ID: ${team.stripeCustomerId || 'None'}`);
      
      // Get event details
      const event = await db.query.events.findFirst({
        where: eq(events.id, team.eventId)
      });
      
      if (event) {
        console.log(`\n🎯 Event: ${event.name}`);
        console.log(`🏦 Connect Account: ${event.stripeConnectAccountId || 'None'}`);
        console.log(`📊 Connect Status: ${event.connectAccountStatus || 'None'}`);
        console.log(`⚡ Charges Enabled: ${event.connectChargesEnabled ? 'Yes' : 'No'}`);
      }
      
      // Check Setup Intent if it exists
      if (team.setupIntentId) {
        try {
          console.log(`\n🔍 Checking Setup Intent...`);
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          
          console.log(`   Status: ${setupIntent.status}`);
          console.log(`   Customer: ${setupIntent.customer || 'None'}`);
          console.log(`   Payment Method: ${setupIntent.payment_method || 'None'}`);
          console.log(`   Last Error: ${setupIntent.last_setup_error ? setupIntent.last_setup_error.message : 'None'}`);
          
          // Check payment method details if available
          if (setupIntent.payment_method) {
            try {
              const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
              console.log(`   PM Type: ${paymentMethod.type}`);
              console.log(`   PM Customer: ${paymentMethod.customer || 'None'}`);
              
              if (paymentMethod.card) {
                console.log(`   Card Brand: ${paymentMethod.card.brand}`);
                console.log(`   Card Last4: ${paymentMethod.card.last4}`);
              }
            } catch (pmError) {
              console.log(`   ❌ Error retrieving payment method: ${pmError.message}`);
            }
          }
        } catch (siError) {
          console.log(`   ❌ Error retrieving Setup Intent: ${siError.message}`);
        }
      }
      
      // Check Payment Method if it exists separately
      if (team.paymentMethodId && team.paymentMethodId !== team.setupIntentId) {
        try {
          console.log(`\n💳 Checking Payment Method...`);
          const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
          
          console.log(`   Type: ${paymentMethod.type}`);
          console.log(`   Customer: ${paymentMethod.customer || 'None'}`);
          
          if (paymentMethod.card) {
            console.log(`   Card Brand: ${paymentMethod.card.brand}`);
            console.log(`   Card Last4: ${paymentMethod.card.last4}`);
          }
        } catch (pmError) {
          console.log(`   ❌ Error retrieving payment method: ${pmError.message}`);
        }
      }
      
      // Check Customer if it exists
      if (team.stripeCustomerId) {
        try {
          console.log(`\n👤 Checking Customer...`);
          const customer = await stripe.customers.retrieve(team.stripeCustomerId);
          
          if (customer.deleted) {
            console.log(`   ❌ Customer is deleted`);
          } else {
            console.log(`   Email: ${customer.email || 'None'}`);
            console.log(`   Name: ${customer.name || 'None'}`);
          }
        } catch (custError) {
          console.log(`   ❌ Error retrieving customer: ${custError.message}`);
        }
      }
      
      console.log(`\n📝 Team Notes: ${team.notes || 'None'}`);
    }
    
    console.log('\n✅ Debug analysis complete');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugFailingPayments().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});