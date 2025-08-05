import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, isNotNull } from 'drizzle-orm';
import postgres from 'postgres';
import { teams } from './db/schema.js';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: 'require' });
const db = drizzle(sql);

async function fixMissingCustomerIds() {
  try {
    console.log('🔍 Finding teams with missing customer IDs but valid setup intents...');
    
    // Get teams that have setup intents but no customer ID
    const teamsWithMissingCustomers = await db
      .select()
      .from(teams)
      .where(eq(teams.stripeCustomerId, null))
      .where(isNotNull(teams.setupIntentId));
    
    console.log(`Found ${teamsWithMissingCustomers.length} teams with missing customer IDs`);
    
    for (const team of teamsWithMissingCustomers) {
      if (!team.setupIntentId) continue;
      
      try {
        console.log(`\n🔧 Processing team ${team.id}: ${team.name}`);
        
        // Retrieve the setup intent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        
        console.log(`  Setup Intent status: ${setupIntent.status}`);
        console.log(`  Setup Intent customer: ${setupIntent.customer}`);
        console.log(`  Setup Intent payment method: ${setupIntent.payment_method}`);
        
        if (setupIntent.status === 'succeeded' && setupIntent.customer) {
          // Update the team with the correct customer ID
          await db.update(teams)
            .set({
              stripeCustomerId: setupIntent.customer,
              paymentMethodId: setupIntent.payment_method || team.paymentMethodId
            })
            .where(eq(teams.id, team.id));
          
          console.log(`  ✅ Updated team ${team.id} with customer ID: ${setupIntent.customer}`);
        } else if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          // Check if this is a Link payment method that doesn't need a customer
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
          
          if (paymentMethod.type === 'link') {
            console.log(`  🔗 Team ${team.id} uses Link payment - no customer ID needed`);
            
            // Update payment method but keep customer ID as null for Link payments
            await db.update(teams)
              .set({
                paymentMethodId: setupIntent.payment_method,
                stripeCustomerId: null // Explicitly null for Link payments
              })
              .where(eq(teams.id, team.id));
            
            console.log(`  ✅ Updated team ${team.id} with Link payment method: ${setupIntent.payment_method}`);
          } else {
            console.log(`  ⚠️  Team ${team.id} has payment method but no customer - payment may fail`);
          }
        } else {
          console.log(`  ⚠️  Team ${team.id} setup intent not completed (status: ${setupIntent.status})`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing team ${team.id}:`, error.message);
      }
    }
    
    console.log('\n✅ Customer ID fix completed');
    
  } catch (error) {
    console.error('❌ Error in fixMissingCustomerIds:', error);
  } finally {
    await sql.end();
  }
}

// Run the fix automatically
fixMissingCustomerIds();