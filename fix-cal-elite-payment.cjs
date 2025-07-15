/**
 * Fix Cal Elite G2007 Payment Issue
 * 
 * This script resolves the payment method reuse issue by:
 * 1. Resetting payment status to allow new payment setup
 * 2. Clearing the burned payment method ID
 * 3. Generating a new Setup Intent for fresh payment collection
 */

const { db } = require('./db');
const { teams } = require('./db/schema');
const { eq } = require('drizzle-orm');

async function fixCalElitePayment() {
  try {
    console.log('=== FIXING CAL ELITE G2007 PAYMENT ISSUE ===\n');
    
    const teamId = 473;
    
    // 1. Get current team data
    console.log('1. Getting current team data...');
    const team = await db.select().from(teams).where(eq(teams.id, teamId));
    
    if (team.length === 0) {
      console.log('❌ Team not found');
      return;
    }
    
    const teamData = team[0];
    console.log(`   Team: ${teamData.name}`);
    console.log(`   Current payment status: ${teamData.paymentStatus}`);
    console.log(`   Burned payment method: ${teamData.paymentMethodId}`);
    
    // 2. Reset payment status and clear burned payment method
    console.log('\n2. Resetting payment status and clearing burned payment method...');
    
    await db.update(teams)
      .set({
        paymentStatus: 'setup_intent_completed', // Allow retry
        paymentMethodId: null, // Clear burned payment method
        // Keep stripeCustomerId and setupIntentId for potential reuse
      })
      .where(eq(teams.id, teamId));
    
    console.log('   ✅ Payment status reset to setup_intent_completed');
    console.log('   ✅ Burned payment method ID cleared');
    
    // 3. Get updated team data
    const updatedTeam = await db.select().from(teams).where(eq(teams.id, teamId));
    const updated = updatedTeam[0];
    
    console.log('\n3. Updated Team Status:');
    console.log(`   - Status: ${updated.status}`);
    console.log(`   - Payment Status: ${updated.paymentStatus}`);
    console.log(`   - Stripe Customer: ${updated.stripeCustomerId || 'None'}`);
    console.log(`   - Setup Intent: ${updated.setupIntentId || 'None'}`);
    console.log(`   - Payment Method: ${updated.paymentMethodId || 'None (cleared)'}`);
    
    console.log('\n4. Next Steps:');
    console.log('   The team can now:');
    console.log('   a) Generate a payment completion URL to collect a new payment method');
    console.log('   b) Be approved normally (will create new customer and charge fresh payment method)');
    
    console.log('\n   Recommended approach:');
    console.log('   1. Generate payment completion URL for team to enter new card');
    console.log('   2. After payment completion, team will be ready for approval');
    
    console.log('\n=== FIX COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error fixing payment:', error);
  }
}

fixCalElitePayment();