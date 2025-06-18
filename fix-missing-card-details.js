/**
 * Fix Missing Card Details for Existing Teams
 * 
 * This script retrieves card details from Stripe for teams that have
 * setup intents but are missing card brand and last 4 digits information.
 */

import { config } from 'dotenv';
config();

import Stripe from 'stripe';
import { db } from '@db';
import { teams } from '@db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixMissingCardDetails() {
  console.log('Starting to fix missing card details for teams with setup intents...');
  
  try {
    // Find teams that have setup intents but missing card details
    const teamsWithSetupIntents = await db
      .select()
      .from(teams)
      .where(eq(teams.paymentStatus, 'payment_info_pending'));
    
    console.log(`Found ${teamsWithSetupIntents.length} teams with payment_info_pending status`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const team of teamsWithSetupIntents) {
      if (!team.setupIntentId) {
        console.log(`Team ${team.id} (${team.name}) has no setup intent ID, skipping...`);
        continue;
      }
      
      try {
        console.log(`Processing team ${team.id} (${team.name}) with setup intent ${team.setupIntentId}...`);
        
        // Retrieve the setup intent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        
        if (setupIntent.status !== 'succeeded') {
          console.log(`  Setup intent status is ${setupIntent.status}, skipping...`);
          continue;
        }
        
        if (!setupIntent.payment_method) {
          console.log(`  No payment method attached to setup intent, skipping...`);
          continue;
        }
        
        // Retrieve the payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
        
        if (!paymentMethod.card) {
          console.log(`  Payment method is not a card, skipping...`);
          continue;
        }
        
        const cardBrand = paymentMethod.card.brand;
        const cardLast4 = paymentMethod.card.last4;
        
        console.log(`  Found card details: ${cardBrand} ending in ${cardLast4}`);
        
        // Update the team with the card details
        await db.update(teams)
          .set({
            cardBrand: cardBrand,
            cardLast4: cardLast4,
            paymentMethodId: setupIntent.payment_method,
            paymentStatus: 'payment_info_provided'
          })
          .where(eq(teams.id, team.id));
        
        console.log(`  ✓ Updated team ${team.id} with card details`);
        updatedCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ✗ Error processing team ${team.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Teams processed: ${teamsWithSetupIntents.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('Card details fix completed!');
    
  } catch (error) {
    console.error('Error fixing missing card details:', error);
  }
}

// Run the fix
fixMissingCardDetails().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});