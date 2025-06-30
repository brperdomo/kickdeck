/**
 * Fix MatchPro Revenue Calculation in Payment Transactions
 * 
 * This script corrects the matchpro_revenue field to show the actual MatchPro revenue
 * (4% platform fee minus Stripe processing costs) rather than the total platform fee.
 * 
 * For Vista Storm example:
 * - Tournament cost: $1,195.00
 * - 4% platform fee: $47.80 + $0.30 = $48.10
 * - Stripe fees: $37.43 (2.9% + $0.30 on $1,280.23)
 * - MatchPro revenue: $48.10 - $37.43 = $10.67
 */

import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

// Try to import from the correct path
let dbInstance;
try {
  const dbModule = await import("./db/index.js");
  dbInstance = dbModule.db;
} catch (e) {
  // Try alternative path
  const dbModule = await import("./server/db.js");
  dbInstance = dbModule.db;
}

async function fixMatchproRevenueCalculation() {
  try {
    console.log('Starting MatchPro revenue calculation fix...');
    
    // Get all payment transactions that need fixing
    const transactionsQuery = sql`
      SELECT 
        id,
        amount,
        stripe_fee,
        matchpro_revenue,
        net_amount,
        platform_fee_amount
      FROM payment_transactions 
      WHERE status = 'succeeded' 
      AND transaction_type = 'payment'
      AND amount > 0
      ORDER BY id
    `;
    
    const transactions = await db.execute(transactionsQuery);
    console.log(`Found ${transactions.length} payment transactions to analyze`);
    
    let updatedCount = 0;
    
    for (const transaction of transactions) {
      const amount = transaction.amount || 0;
      const stripeFee = transaction.stripe_fee || 0;
      const currentMatchproRevenue = transaction.matchpro_revenue || 0;
      const netAmount = transaction.net_amount || 0;
      const platformFeeAmount = transaction.platform_fee_amount || 0;
      
      // Calculate the tournament cost (what tournament receives)
      const tournamentCost = netAmount;
      
      // Calculate 4% platform fee + $0.30
      const targetPlatformFee = Math.round(tournamentCost * 0.04 + 30);
      
      // MatchPro revenue = Platform fee - Stripe processing fee
      const correctMatchproRevenue = targetPlatformFee - stripeFee;
      
      console.log(`\nTransaction ID ${transaction.id}:`);
      console.log(`  Total charged: $${(amount / 100).toFixed(2)}`);
      console.log(`  Tournament receives: $${(tournamentCost / 100).toFixed(2)}`);
      console.log(`  Stripe fee: $${(stripeFee / 100).toFixed(2)}`);
      console.log(`  Target platform fee (4% + $0.30): $${(targetPlatformFee / 100).toFixed(2)}`);
      console.log(`  Current MatchPro revenue: $${(currentMatchproRevenue / 100).toFixed(2)}`);
      console.log(`  Correct MatchPro revenue: $${(correctMatchproRevenue / 100).toFixed(2)}`);
      
      // Only update if the value is different
      if (Math.abs(currentMatchproRevenue - correctMatchproRevenue) > 1) { // Allow 1 cent tolerance
        console.log(`  ⚠️  Updating record - difference of $${((currentMatchproRevenue - correctMatchproRevenue) / 100).toFixed(2)}`);
        
        await db.execute(sql`
          UPDATE payment_transactions 
          SET matchpro_revenue = ${correctMatchproRevenue}
          WHERE id = ${transaction.id}
        `);
        
        updatedCount++;
      } else {
        console.log(`  ✓ Record already correct`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total transactions analyzed: ${transactions.length}`);
    console.log(`Records updated: ${updatedCount}`);
    console.log(`Records already correct: ${transactions.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log('\n✅ MatchPro revenue calculations have been corrected!');
      console.log('The payment logs will now show accurate MatchPro revenue figures.');
    } else {
      console.log('\n✅ All MatchPro revenue calculations were already correct.');
    }
    
  } catch (error) {
    console.error('Error fixing MatchPro revenue calculations:', error);
    throw error;
  }
}

// Run the fix
fixMatchproRevenueCalculation()
  .then(() => {
    console.log('\nMatchPro revenue calculation fix completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fix MatchPro revenue calculations:', error);
    process.exit(1);
  });