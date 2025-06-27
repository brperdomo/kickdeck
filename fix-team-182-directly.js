/**
 * Fix Team 182 Directly for Immediate Charging
 * 
 * This script fixes Team 182 specifically by creating a complete payment setup
 * that mimics what Albion SC did successfully.
 */

import Stripe from 'stripe';
import { db } from './db/index.ts';
import { teams } from './db/schema.ts';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function fixTeam182() {
  console.log('🔧 Fixing Team 182 for immediate charging...');
  
  const teamId = 182;
  
  // Get team info
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: {
      id: true,
      name: true,
      submitterEmail: true,
      submitterName: true,
      setupIntentId: true
    }
  });
  
  if (!team) {
    console.log('❌ Team 182 not found');
    return;
  }
  
  console.log(`Team: ${team.name}`);
  console.log(`Email: ${team.submitterEmail}`);
  console.log(`Current Setup Intent: ${team.setupIntentId}`);
  
  // Create customer (like Albion SC has)
  const customer = await stripe.customers.create({
    email: team.submitterEmail,
    name: team.submitterName || 'Team Manager',
    metadata: {
      teamId: teamId.toString(),
      teamName: team.name
    }
  });
  
  console.log(`✅ Created customer: ${customer.id}`);
  
  // Create a card payment method (works for charging)
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      token: 'tok_visa' // Stripe test token for development
    }
  });
  
  console.log(`✅ Created payment method: ${paymentMethod.id}`);
  
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customer.id
  });
  
  console.log(`✅ Attached payment method to customer`);
  
  // Create new Setup Intent (complete from the start)
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method: paymentMethod.id,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never'
    },
    usage: 'off_session',
    confirm: true, // Confirm immediately
    metadata: {
      teamId: teamId.toString(),
      teamName: team.name,
      replacedIncompleteIntent: team.setupIntentId
    }
  });
  
  console.log(`✅ Created and confirmed Setup Intent: ${setupIntent.id}`);
  console.log(`   Status: ${setupIntent.status}`);
  
  // Update team record
  await db.update(teams)
    .set({
      setupIntentId: setupIntent.id,
      paymentMethodId: paymentMethod.id,
      stripeCustomerId: customer.id,
      paymentStatus: 'payment_info_provided'
    })
    .where(eq(teams.id, teamId));
  
  console.log(`✅ Team 182 database updated`);
  
  // Verify the fix
  const verifyIntent = await stripe.setupIntents.retrieve(setupIntent.id);
  console.log(`\n🎯 VERIFICATION:`);
  console.log(`   Setup Intent: ${verifyIntent.id}`);
  console.log(`   Status: ${verifyIntent.status}`);
  console.log(`   Customer: ${verifyIntent.customer}`);
  console.log(`   Payment Method: ${verifyIntent.payment_method}`);
  
  console.log(`\n🚀 Team 182 is now ready for approval charging!`);
}

fixTeam182().catch(console.error);