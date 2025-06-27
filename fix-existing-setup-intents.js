/**
 * Fix Existing Setup Intents to Include Customer Associations
 * 
 * This script fixes teams that have Setup Intents without customer associations,
 * making them chargeable upon approval.
 */

import Stripe from 'stripe';
import { db } from './db/index.ts';
import { teams } from './db/schema.ts';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function fixExistingSetupIntents() {
  try {
    console.log('🔧 Starting Setup Intent customer association fix...');
    
    // Find teams with Setup Intents but no customer ID
    const teamsNeedingFix = await db
      .select({
        id: teams.id,
        name: teams.name,
        setupIntentId: teams.setupIntentId,
        stripeCustomerId: teams.stripeCustomerId,
        submitterEmail: teams.submitterEmail,
        submitterName: teams.submitterName,
        paymentMethodId: teams.paymentMethodId
      })
      .from(teams)
      .where(eq(teams.setupIntentId, teams.setupIntentId)) // Teams with Setup Intent IDs
      .then(results => results.filter(team => 
        team.setupIntentId && 
        !team.stripeCustomerId && 
        team.submitterEmail
      ));
    
    console.log(`Found ${teamsNeedingFix.length} teams with Setup Intents needing customer association`);
    
    for (const team of teamsNeedingFix) {
      try {
        console.log(`\n🔧 Fixing team ${team.id}: ${team.name}`);
        
        // Get the Setup Intent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log(`Setup Intent status: ${setupIntent.status}, customer: ${setupIntent.customer}`);
        
        // Only process if Setup Intent is succeeded or processing
        if (setupIntent.status === 'succeeded' || setupIntent.status === 'processing') {
          
          // Create customer if Setup Intent doesn't have one
          let customerId = setupIntent.customer;
          
          if (!customerId) {
            console.log(`Creating customer for team ${team.id}...`);
            const customer = await stripe.customers.create({
              email: team.submitterEmail,
              name: team.submitterName || 'Team Manager',
              metadata: {
                teamId: team.id.toString(),
                teamName: team.name || 'Unknown Team'
              }
            });
            customerId = customer.id;
            console.log(`Created customer: ${customerId}`);
            
            // Attach the payment method to the customer if it exists
            if (setupIntent.payment_method) {
              try {
                await stripe.paymentMethods.attach(setupIntent.payment_method, {
                  customer: customerId
                });
                console.log(`Attached payment method ${setupIntent.payment_method} to customer`);
              } catch (attachError) {
                console.log(`Payment method already attached or attachment failed: ${attachError.message}`);
              }
            }
          }
          
          // Update team record with customer ID and payment method
          const updateData = { stripeCustomerId: customerId };
          if (setupIntent.payment_method && !team.paymentMethodId) {
            updateData.paymentMethodId = setupIntent.payment_method;
          }
          
          await db.update(teams)
            .set(updateData)
            .where(eq(teams.id, team.id));
          
          console.log(`✅ Team ${team.id} updated with customer ID: ${customerId}`);
          
        } else {
          console.log(`⚠️ Setup Intent ${team.setupIntentId} has status: ${setupIntent.status} - skipping`);
        }
        
      } catch (teamError) {
        console.error(`❌ Error fixing team ${team.id}: ${teamError.message}`);
      }
    }
    
    console.log('\n🎉 Setup Intent customer association fix completed!');
    
    // Verify the fix by checking teams that should now be chargeable
    const fixedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        setupIntentId: teams.setupIntentId,
        stripeCustomerId: teams.stripeCustomerId,
        paymentMethodId: teams.paymentMethodId,
        status: teams.status
      })
      .from(teams)
      .where(eq(teams.setupIntentId, teams.setupIntentId))
      .then(results => results.filter(team => 
        team.setupIntentId && 
        team.stripeCustomerId && 
        team.paymentMethodId &&
        team.status === 'registered'
      ));
    
    console.log(`\n✅ ${fixedTeams.length} teams are now ready for approval charging:`);
    fixedTeams.forEach(team => {
      console.log(`  - Team ${team.id}: ${team.name} (Customer: ${team.stripeCustomerId})`);
    });
    
  } catch (error) {
    console.error('❌ Error in Setup Intent fix:', error);
    process.exit(1);
  }
}

fixExistingSetupIntents();