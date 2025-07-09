/**
 * Debug 3D Secure Payment Issues
 * 
 * This script helps diagnose and resolve 3D Secure authentication problems
 * where payments appear incomplete but may have actually succeeded.
 * 
 * Usage:
 *   node debug-3d-secure-payment.js <email> - Debug specific user
 *   node debug-3d-secure-payment.js --all   - Check all incomplete payments
 */

import Stripe from 'stripe';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { teams } from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function debug3DSecurePayment(email) {
  console.log(`\n🔍 DEBUGGING 3D SECURE PAYMENT FOR: ${email}\n`);
  
  try {
    // Find teams with this email
    const teamResults = await db
      .select()
      .from(teams)
      .where(eq(teams.submitterEmail, email));
    
    if (!teamResults || teamResults.length === 0) {
      console.log(`❌ No teams found for email: ${email}`);
      return;
    }
    
    for (const team of teamResults) {
      console.log(`\n📋 TEAM: ${team.name} (ID: ${team.id})`);
      console.log(`   Status: ${team.status}`);
      console.log(`   Payment Status: ${team.paymentStatus}`);
      console.log(`   Setup Intent: ${team.setupIntentId}`);
      console.log(`   Payment Method: ${team.paymentMethodId}`);
      console.log(`   Stripe Customer: ${team.stripeCustomerId}`);
      
      if (team.setupIntentId) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          console.log(`\n🔍 STRIPE SETUP INTENT ANALYSIS:`);
          console.log(`   Stripe Status: ${setupIntent.status}`);
          console.log(`   Payment Method: ${setupIntent.payment_method || 'None'}`);
          console.log(`   Customer: ${setupIntent.customer || 'None'}`);
          console.log(`   Last Payment Error: ${setupIntent.last_payment_error?.message || 'None'}`);
          console.log(`   Client Secret: ${setupIntent.client_secret ? 'Present' : 'Missing'}`);
          
          // Check for 3D Secure specific issues
          if (setupIntent.last_payment_error) {
            const error = setupIntent.last_payment_error;
            console.log(`\n🚨 PAYMENT ERROR DETECTED:`);
            console.log(`   Code: ${error.code}`);
            console.log(`   Decline Code: ${error.decline_code || 'N/A'}`);
            console.log(`   Message: ${error.message}`);
            
            if (error.code === 'authentication_required' || 
                error.decline_code === 'authentication_required' ||
                error.message?.includes('3D Secure')) {
              console.log(`\n🔐 3D SECURE ISSUE IDENTIFIED`);
              console.log(`   This is a 3D Secure authentication problem.`);
              console.log(`   Customer started authentication but didn't complete it.`);
            }
          }
          
          // Analyze status mismatch
          if (setupIntent.status === 'succeeded' && team.paymentStatus !== 'payment_info_provided') {
            console.log(`\n✅ STATUS MISMATCH FOUND - PAYMENT ACTUALLY SUCCEEDED!`);
            console.log(`   Stripe shows: ${setupIntent.status}`);
            console.log(`   Database shows: ${team.paymentStatus}`);
            console.log(`   📋 RECOMMENDED ACTION: Update database to match Stripe`);
            
            // Offer to fix the database
            if (process.argv.includes('--fix')) {
              console.log(`\n🔧 FIXING DATABASE STATUS...`);
              await db
                .update(teams)
                .set({
                  paymentStatus: 'paid',
                  paymentMethodId: setupIntent.payment_method?.toString(),
                  stripeCustomerId: setupIntent.customer?.toString()
                })
                .where(eq(teams.id, team.id));
              console.log(`✅ Team ${team.id} payment status updated to 'paid'`);
            }
          }
          
          if (setupIntent.status === 'requires_action') {
            console.log(`\n⏳ 3D SECURE AUTHENTICATION PENDING`);
            console.log(`   Customer needs to complete 3D Secure authentication`);
            console.log(`   Next Action Required: ${JSON.stringify(setupIntent.next_action, null, 2)}`);
            console.log(`   📋 RECOMMENDED ACTION: Contact customer to complete authentication`);
          }
          
          if (setupIntent.status === 'requires_payment_method') {
            console.log(`\n❌ PAYMENT METHOD REQUIRED`);
            console.log(`   3D Secure authentication failed or was abandoned`);
            console.log(`   📋 RECOMMENDED ACTION: Generate new payment completion URL`);
          }
          
        } catch (stripeError) {
          console.log(`❌ Error retrieving Setup Intent: ${stripeError.message}`);
        }
      }
      
      console.log(`\n${'='.repeat(60)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error debugging payment: ${error.message}`);
  }
}

async function checkAll3DSecureIssues() {
  console.log(`\n🔍 CHECKING ALL TEAMS WITH POTENTIAL 3D SECURE ISSUES\n`);
  
  try {
    // Find teams with payment_info_provided status that might have completed 3D Secure
    const teamsWithIncompletePayments = await db
      .select()
      .from(teams)
      .where(inArray(teams.paymentStatus, ['payment_info_provided', 'setup_intent_created', 'setup_incomplete']));
    
    console.log(`Found ${teamsWithIncompletePayments.length} teams with potentially incomplete payments`);
    
    let fixableTeams = [];
    
    for (const team of teamsWithIncompletePayments) {
      if (team.setupIntentId) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          
          if (setupIntent.status === 'succeeded' && team.paymentStatus !== 'paid') {
            console.log(`\n✅ MISMATCH FOUND: Team ${team.id} (${team.name})`);
            console.log(`   Database: ${team.paymentStatus} | Stripe: ${setupIntent.status}`);
            fixableTeams.push({
              id: team.id,
              name: team.name,
              setupIntentId: setupIntent.id,
              paymentMethod: setupIntent.payment_method,
              customer: setupIntent.customer
            });
          }
          
          if (setupIntent.last_payment_error?.code === 'authentication_required') {
            console.log(`\n🔐 3D SECURE ISSUE: Team ${team.id} (${team.name})`);
            console.log(`   Error: ${setupIntent.last_payment_error.message}`);
          }
          
        } catch (error) {
          // Skip invalid Setup Intents
        }
      }
    }
    
    if (fixableTeams.length > 0) {
      console.log(`\n📋 SUMMARY: ${fixableTeams.length} teams can be automatically fixed`);
      fixableTeams.forEach(team => {
        console.log(`   - Team ${team.id}: ${team.name}`);
      });
      
      if (process.argv.includes('--fix')) {
        console.log(`\n🔧 FIXING ALL TEAMS...`);
        for (const team of fixableTeams) {
          await db
            .update(teams)
            .set({
              paymentStatus: 'paid',
              paymentMethodId: team.paymentMethod?.toString(),
              stripeCustomerId: team.customer?.toString()
            })
            .where(eq(teams.id, team.id));
          console.log(`✅ Fixed Team ${team.id}`);
        }
      } else {
        console.log(`\n💡 Run with --fix flag to automatically update these teams`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking all payments: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage:
  node debug-3d-secure-payment.js <email>     - Debug specific user
  node debug-3d-secure-payment.js --all       - Check all incomplete payments
  node debug-3d-secure-payment.js --all --fix - Check and fix all mismatches
  
Examples:
  node debug-3d-secure-payment.js omidh44@hotmail.com
  node debug-3d-secure-payment.js --all
  node debug-3d-secure-payment.js --all --fix
    `);
    return;
  }
  
  if (args.includes('--all')) {
    await checkAll3DSecureIssues();
  } else {
    const email = args[0];
    await debug3DSecurePayment(email);
  }
  
  await client.end();
}

main().catch(console.error);