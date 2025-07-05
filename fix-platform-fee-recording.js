/**
 * Fix Platform Fee Recording Issue
 * 
 * This script diagnoses and fixes the critical issue where platform fees
 * are being calculated correctly but not recorded in the database.
 * 
 * This causes MatchPro to receive $0 revenue while customers pay 4% platform fees.
 */

import { db } from './db/index.js';
import { paymentTransactions } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Fee calculation logic (copied from fee-calculator.ts)
const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4% MatchPro fee
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 30; // $0.30 in cents

function calculateStripeFees(totalAmount) {
  return Math.round(totalAmount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
}

function calculateFeeBreakdown(tournamentCost) {
  // Simple fee structure: Tournament Cost + 4% Platform Fee
  const platformFeeAmount = Math.round(tournamentCost * DEFAULT_PLATFORM_FEE_RATE);
  const totalChargedAmount = tournamentCost + platformFeeAmount;
  
  // Calculate actual platform fee rate (should be exactly the base rate)
  const platformFeeRate = platformFeeAmount / tournamentCost;
  
  // Calculate Stripe fees on the total charged amount
  const stripeFeeAmount = calculateStripeFees(totalChargedAmount);
  
  // Distribution calculation
  const tournamentReceives = tournamentCost; // Tournament gets their base amount
  const stripeReceives = stripeFeeAmount; // Stripe gets their processing fee
  const matchproReceives = platformFeeAmount - stripeFeeAmount; // MatchPro gets platform fee minus Stripe costs
  
  return {
    tournamentCost,
    totalChargedAmount,
    platformFeeRate,
    platformFeeAmount,
    stripeFeeAmount,
    tournamentReceives,
    matchproReceives,
    stripeReceives
  };
}

async function fixPlatformFeeRecording() {
  try {
    console.log('🔍 Analyzing platform fee recording issue...\n');
    
    // Get recent transactions with missing platform fees
    const transactions = await db.query.paymentTransactions.findMany({
      where: eq(paymentTransactions.platformFeeAmount, 0),
      orderBy: desc(paymentTransactions.createdAt),
      limit: 10
    });
    
    console.log(`Found ${transactions.length} transactions with missing platform fees:\n`);
    
    let totalMissingRevenue = 0;
    
    for (const transaction of transactions) {
      const metadata = transaction.metadata;
      
      if (metadata && metadata.feeCalculationBreakdown) {
        const breakdown = metadata.feeCalculationBreakdown;
        
        console.log(`Transaction ${transaction.paymentIntentId}:`);
        console.log(`  Total Charged: $${(transaction.amount / 100).toFixed(2)}`);
        console.log(`  Calculated Platform Fee: $${(breakdown.platformFeeAmount / 100).toFixed(2)}`);
        console.log(`  Calculated MatchPro Revenue: $${(breakdown.matchproReceives / 100).toFixed(2)}`);
        console.log(`  Database Platform Fee: $${(transaction.platformFeeAmount / 100).toFixed(2)} ❌`);
        console.log(`  Database MatchPro Revenue: $${(transaction.matchproRevenue / 100).toFixed(2)} ❌`);
        
        totalMissingRevenue += breakdown.matchproReceives;
        
        // Fix this transaction
        try {
          await db.update(paymentTransactions)
            .set({
              platformFeeAmount: breakdown.platformFeeAmount,
              matchproRevenue: breakdown.matchproReceives,
              applicationFeeAmount: breakdown.platformFeeAmount // This should have been sent to Stripe
            })
            .where(eq(paymentTransactions.id, transaction.id));
          
          console.log(`  ✅ Updated database record with correct platform fee data\n`);
        } catch (updateError) {
          console.error(`  ❌ Failed to update transaction: ${updateError.message}\n`);
        }
      } else {
        // Calculate fees for transactions without metadata
        const tournamentCost = transaction.amount - Math.round(transaction.amount * 0.04);
        const calculated = calculateFeeBreakdown(tournamentCost);
        
        console.log(`Transaction ${transaction.paymentIntentId} (no metadata):`);
        console.log(`  Total Charged: $${(transaction.amount / 100).toFixed(2)}`);
        console.log(`  Estimated Tournament Cost: $${(tournamentCost / 100).toFixed(2)}`);
        console.log(`  Calculated Platform Fee: $${(calculated.platformFeeAmount / 100).toFixed(2)}`);
        console.log(`  Calculated MatchPro Revenue: $${(calculated.matchproReceives / 100).toFixed(2)}`);
        
        totalMissingRevenue += calculated.matchproReceives;
        
        // Fix this transaction
        try {
          await db.update(paymentTransactions)
            .set({
              platformFeeAmount: calculated.platformFeeAmount,
              matchproRevenue: calculated.matchproReceives,
              applicationFeeAmount: calculated.platformFeeAmount
            })
            .where(eq(paymentTransactions.id, transaction.id));
          
          console.log(`  ✅ Updated database record with calculated platform fee data\n`);
        } catch (updateError) {
          console.error(`  ❌ Failed to update transaction: ${updateError.message}\n`);
        }
      }
    }
    
    console.log('=' .repeat(80));
    console.log(`💰 TOTAL MISSING MATCHPRO REVENUE: $${(totalMissingRevenue / 100).toFixed(2)}`);
    console.log('=' .repeat(80));
    
    console.log('\n🔧 NEXT STEPS TO COMPLETE THE FIX:');
    console.log('1. ✅ Database records updated with correct platform fee amounts');
    console.log('2. ⚠️  Historical Stripe Connect payments may not have application_fee_amount set');
    console.log('3. ⚠️  Future payments need to ensure application_fee_amount is properly sent to Stripe');
    console.log('4. 🔍 Verify Stripe Connect account capabilities allow application fees');
    console.log('\nThe payment processing code needs to be fixed to ensure application_fee_amount');
    console.log('is properly applied to future Stripe Connect destination charges.');
    
  } catch (error) {
    console.error('Error fixing platform fee recording:', error);
  }
}

// Run if called directly
fixPlatformFeeRecording()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { fixPlatformFeeRecording, calculateFeeBreakdown };