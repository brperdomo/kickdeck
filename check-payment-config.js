/**
 * Check which payment method configuration is being used
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

async function checkPaymentConfig() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  console.log('🔍 Checking payment method configurations...\n');
  
  try {
    // List all payment method configurations
    const configs = await stripe.paymentMethodConfigurations.list({
      limit: 100
    });
    
    console.log(`Found ${configs.data.length} payment method configurations:\n`);
    
    for (const config of configs.data) {
      console.log(`ID: ${config.id}`);
      console.log(`Name: ${config.name || 'Default'}`);
      console.log(`Live Mode: ${config.livemode}`);
      console.log(`Is Default: ${config.is_default}`);
      console.log(`Created: ${new Date(config.created * 1000).toISOString()}`);
      console.log('---');
    }
    
    // Check the specific IDs mentioned
    const hardcodedId = 'pmc_1RJmWdP4BpmZARxtTPn2Ek9K';
    const errorId = 'pmc_1R6IxdCGdBwOWAK0WSxoKWa1';
    
    console.log(`\n🔧 Checking specific configurations:\n`);
    
    try {
      const hardcodedConfig = await stripe.paymentMethodConfigurations.retrieve(hardcodedId);
      console.log(`Hardcoded config (${hardcodedId}):`);
      console.log(`  Live Mode: ${hardcodedConfig.livemode}`);
      console.log(`  Is Default: ${hardcodedConfig.is_default}`);
    } catch (error) {
      console.log(`❌ Hardcoded config (${hardcodedId}) not found: ${error.message}`);
    }
    
    try {
      const errorConfig = await stripe.paymentMethodConfigurations.retrieve(errorId);
      console.log(`Error config (${errorId}):`);
      console.log(`  Live Mode: ${errorConfig.livemode}`);
      console.log(`  Is Default: ${errorConfig.is_default}`);
    } catch (error) {
      console.log(`❌ Error config (${errorId}) not found: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking configurations:', error.message);
  }
}

checkPaymentConfig().then(() => {
  console.log('\n✅ Check complete');
}).catch(error => {
  console.error('❌ Check failed:', error.message);
});