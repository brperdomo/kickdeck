/**
 * Check Team 179 Payment Details
 * 
 * This script checks the payment setup for Team 179 to diagnose
 * why the approval payment is failing.
 */

import { config } from 'dotenv';
import { db } from './db/index.ts';
import { teams } from './db/schema.ts';
import { eq } from 'drizzle-orm';

config();

async function checkTeam179() {
  try {
    console.log('🔍 Checking Team 179 payment details...');
    
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, 179)
    });
    
    if (!team) {
      console.log('❌ Team 179 not found');
      return;
    }
    
    console.log('📋 Team 179 Details:');
    console.log('- Name:', team.name);
    console.log('- Status:', team.status);
    console.log('- Setup Intent ID:', team.setupIntentId || 'NOT SET');
    console.log('- Payment Method ID:', team.paymentMethodId || 'NOT SET');
    console.log('- Stripe Customer ID:', team.stripeCustomerId || 'NOT SET');
    console.log('- Total Amount:', team.totalAmount || 'NOT SET');
    console.log('- Event ID:', team.eventId);
    console.log('- Created At:', team.createdAt);
    
    // Check payment readiness
    console.log('\n🔍 Payment Readiness Check:');
    if (team.setupIntentId && team.paymentMethodId) {
      console.log('✅ Team has both Setup Intent and Payment Method - should be chargeable');
    } else if (team.setupIntentId && !team.paymentMethodId) {
      console.log('⚠️ Team has Setup Intent but missing Payment Method ID');
    } else if (!team.setupIntentId && team.paymentMethodId) {
      console.log('⚠️ Team has Payment Method but missing Setup Intent ID');
    } else {
      console.log('❌ Team missing both Setup Intent and Payment Method - payment will fail');
    }
    
    if (team.totalAmount) {
      console.log(`💰 Expected charge amount: $${(team.totalAmount / 100).toFixed(2)}`);
    } else {
      console.log('⚠️ No total amount set - fee calculation needed');
    }
    
    // Check Setup Intent status in Stripe if present
    if (team.setupIntentId) {
      try {
        console.log('\n🔍 Checking Setup Intent status in Stripe...');
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log(`📊 Setup Intent ${team.setupIntentId}:`);
        console.log('- Status:', setupIntent.status);
        console.log('- Payment Method:', setupIntent.payment_method || 'NOT ATTACHED');
        console.log('- Customer:', setupIntent.customer || 'NOT SET');
        console.log('- Last Payment Error:', setupIntent.last_payment_error?.message || 'NONE');
        
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          console.log('✅ Setup Intent is complete and ready for charging');
        } else {
          console.log('❌ Setup Intent is incomplete - cannot charge this team');
          console.log(`   Status: ${setupIntent.status}, Payment Method: ${setupIntent.payment_method || 'missing'}`);
        }
      } catch (stripeError) {
        console.error('❌ Error checking Setup Intent in Stripe:', stripeError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking team:', error);
  } finally {
    process.exit(0);
  }
}

checkTeam179();