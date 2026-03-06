import { Request, Response } from 'express';
import { db } from '@db';
import { teams } from '@db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Fix missing card details for teams with setup intents
 */
export async function fixCardDetails(req: Request, res: Response) {
  try {
    console.log('Starting card details fix...');
    
    // Find teams with setup intents but missing card details
    const teamsWithSetupIntents = await db
      .select()
      .from(teams)
      .where(eq(teams.paymentStatus, 'payment_info_pending'));
    
    console.log(`Found ${teamsWithSetupIntents.length} teams to process`);
    
    let updatedCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (const team of teamsWithSetupIntents) {
      if (!team.setupIntentId) {
        console.log(`Team ${team.id} has no setup intent ID, skipping...`);
        continue;
      }
      
      try {
        console.log(`Processing team ${team.id} (${team.name})...`);
        
        // Retrieve setup intent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        
        if (setupIntent.status !== 'succeeded') {
          console.log(`Setup intent status is ${setupIntent.status}, skipping...`);
          continue;
        }
        
        if (!setupIntent.payment_method) {
          console.log(`No payment method attached, skipping...`);
          continue;
        }
        
        // Get payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
        
        if (!paymentMethod.card) {
          console.log(`Payment method is not a card, skipping...`);
          continue;
        }
        
        const cardBrand = paymentMethod.card.brand;
        const cardLast4 = paymentMethod.card.last4;
        
        console.log(`Found card: ${cardBrand} ending in ${cardLast4}`);
        
        // Update team with card details
        await db.update(teams)
          .set({
            cardBrand: cardBrand,
            cardLast4: cardLast4,
            paymentMethodId: setupIntent.payment_method as string,
            paymentStatus: 'payment_info_provided'
          })
          .where(eq(teams.id, team.id));
        
        console.log(`Updated team ${team.id}`);
        updatedCount++;
        
        results.push({
          teamId: team.id,
          teamName: team.name,
          cardBrand,
          cardLast4,
          status: 'updated'
        });
        
      } catch (error: any) {
        console.error(`Error processing team ${team.id}: ${error.message}`);
        errorCount++;
        
        results.push({
          teamId: team.id,
          teamName: team.name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      processed: teamsWithSetupIntents.length,
      updated: updatedCount,
      errors: errorCount,
      results
    });
    
  } catch (error: any) {
    console.error('Error fixing card details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}