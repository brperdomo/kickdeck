import { config } from 'dotenv';
config();

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixCardDetails() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get teams with setup intents but missing card details
    const result = await client.query(`
      SELECT id, name, setup_intent_id 
      FROM teams 
      WHERE payment_status = 'payment_info_pending' 
      AND setup_intent_id IS NOT NULL
    `);
    
    console.log(`Found ${result.rows.length} teams to process`);
    
    let updated = 0;
    let errors = 0;
    
    for (const team of result.rows) {
      try {
        console.log(`Processing team ${team.id}: ${team.name}`);
        
        // Get setup intent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        
        if (setupIntent.status !== 'succeeded') {
          console.log(`  Setup intent not succeeded: ${setupIntent.status}`);
          continue;
        }
        
        if (!setupIntent.payment_method) {
          console.log(`  No payment method attached`);
          continue;
        }
        
        // Get payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
        
        if (!paymentMethod.card) {
          console.log(`  Payment method is not a card`);
          continue;
        }
        
        const cardBrand = paymentMethod.card.brand;
        const cardLast4 = paymentMethod.card.last4;
        
        console.log(`  Found: ${cardBrand} ending in ${cardLast4}`);
        
        // Update the team record
        await client.query(`
          UPDATE teams 
          SET card_brand = $1, 
              card_last_4 = $2, 
              payment_method_id = $3,
              payment_status = 'payment_info_provided'
          WHERE id = $4
        `, [cardBrand, cardLast4, setupIntent.payment_method, team.id]);
        
        console.log(`  ✓ Updated team ${team.id}`);
        updated++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ✗ Error processing team ${team.id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Teams processed: ${result.rows.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await client.end();
  }
}

fixCardDetails();