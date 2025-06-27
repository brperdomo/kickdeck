/**
 * Fix Remaining Teams for Immediate Charging Capability
 * 
 * This script targets specific teams that have succeeded Setup Intents
 * but need customer associations to become chargeable.
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

async function fixRemainingTeams() {
  const targetTeamIds = [163, 165]; // Teams with potential for immediate fixing
  
  console.log('🔧 Fixing remaining teams for immediate charging capability...');
  
  for (const teamId of targetTeamIds) {
    try {
      console.log(`\n🔧 Processing team ${teamId}...`);
      
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, teamId),
        columns: {
          id: true,
          name: true,
          setupIntentId: true,
          stripeCustomerId: true,
          submitterEmail: true,
          submitterName: true,
          paymentMethodId: true
        }
      });
      
      if (!team) {
        console.log(`❌ Team ${teamId} not found`);
        continue;
      }
      
      if (!team.setupIntentId) {
        console.log(`❌ Team ${teamId} has no Setup Intent`);
        continue;
      }
      
      if (team.stripeCustomerId) {
        console.log(`✅ Team ${teamId} already has customer: ${team.stripeCustomerId}`);
        continue;
      }
      
      // Get Setup Intent from Stripe
      const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
      console.log(`Setup Intent status: ${setupIntent.status}, payment_method: ${setupIntent.payment_method}`);
      
      if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
        // Create customer
        const customer = await stripe.customers.create({
          email: team.submitterEmail,
          name: team.submitterName || 'Team Manager',
          metadata: {
            teamId: team.id.toString(),
            teamName: team.name || 'Unknown Team'
          }
        });
        
        console.log(`Created customer: ${customer.id}`);
        
        // Attach payment method to customer
        try {
          await stripe.paymentMethods.attach(setupIntent.payment_method, {
            customer: customer.id
          });
          console.log(`Attached payment method ${setupIntent.payment_method} to customer`);
        } catch (attachError) {
          console.log(`Payment method attachment: ${attachError.message}`);
        }
        
        // Update team record
        const updateData = { 
          stripeCustomerId: customer.id,
          paymentStatus: 'payment_info_provided'
        };
        
        if (!team.paymentMethodId) {
          updateData.paymentMethodId = setupIntent.payment_method;
        }
        
        await db.update(teams)
          .set(updateData)
          .where(eq(teams.id, team.id));
        
        console.log(`✅ Team ${teamId} (${team.name}) is now ready for approval charging!`);
        console.log(`   Customer: ${customer.id}`);
        console.log(`   Payment Method: ${setupIntent.payment_method}`);
        
      } else {
        console.log(`⚠️ Team ${teamId} Setup Intent not ready (status: ${setupIntent.status})`);
      }
      
    } catch (error) {
      console.error(`❌ Error fixing team ${teamId}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Remaining teams fix completed!');
  
  // Final verification
  const readyTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      stripeCustomerId: teams.stripeCustomerId,
      paymentMethodId: teams.paymentMethodId,
      status: teams.status
    })
    .from(teams)
    .where(eq(teams.status, 'registered'))
    .then(results => results.filter(team => 
      team.stripeCustomerId && 
      team.paymentMethodId
    ));
  
  console.log(`\n✅ ${readyTeams.length} teams are now ready for approval charging:`);
  readyTeams.forEach(team => {
    console.log(`  - Team ${team.id}: ${team.name}`);
  });
}

fixRemainingTeams();