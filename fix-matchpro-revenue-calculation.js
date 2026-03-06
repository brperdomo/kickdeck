/**
 * Fix KickDeck Revenue Calculation in Payment Transactions
 * 
 * This script corrects the kickdeck_revenue field to show the actual KickDeck revenue
 * (4% platform fee minus Stripe processing costs) rather than the total platform fee.
 * 
 * For Vista Storm example:
 * - Tournament cost: $1,195.00
 * - 4% platform fee: $47.80 + $0.30 = $48.10
 * - Stripe fees: $37.43 (2.9% + $0.30 on $1,280.23)
 * - KickDeck revenue: $48.10 - $37.43 = $10.67
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

async function fixKickdeckRevenueCalculation() {
  try {
    console.log('Starting KickDeck revenue calculation fix...');
    
    // Get all payment transactions that need fixing
    const transactionsQuery = sql`
      SELECT 
        id,
        amount,
        stripe_fee,
        kickdeck_revenue,
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
      const currentKickdeckRevenue = transaction.kickdeck_revenue || 0;
      const netAmount = transaction.net_amount || 0;
      const platformFeeAmount = transaction.platform_fee_amount || 0;
      
      // Calculate the tournament cost (what tournament receives)
      const tournamentCost = netAmount;
      
      // Calculate 4% platform fee + $0.30
      const targetPlatformFee = Math.round(tournamentCost * 0.04 + 30);
      
      // KickDeck revenue = Platform fee - Stripe processing fee
      const correctKickdeckRevenue = targetPlatformFee - stripeFee;
      
      console.log(`\nTransaction ID ${transaction.id}:`);
      console.log(`  Total charged: $${(amount / 100).toFixed(2)}`);
      console.log(`  Tournament receives: $${(tournamentCost / 100).toFixed(2)}`);
      console.log(`  Stripe fee: $${(stripeFee / 100).toFixed(2)}`);
      console.log(`  Target platform fee (4% + $0.30): $${(targetPlatformFee / 100).toFixed(2)}`);
      console.log(`  Current KickDeck revenue: $${(currentKickdeckRevenue / 100).toFixed(2)}`);
      console.log(`  Correct KickDeck revenue: $${(correctKickdeckRevenue / 100).toFixed(2)}`);
      
      // Only update if the value is different
      if (Math.abs(currentKickdeckRevenue - correctKickdeckRevenue) > 1) { // Allow 1 cent tolerance
        console.log(`  ⚠️  Updating record - difference of $${((currentKickdeckRevenue - correctKickdeckRevenue) / 100).toFixed(2)}`);
        
        await db.execute(sql`
          UPDATE payment_transactions 
          SET kickdeck_revenue = ${correctKickdeckRevenue}
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
      console.log('\n✅ KickDeck revenue calculations have been corrected!');
      console.log('The payment logs will now show accurate KickDeck revenue figures.');
    } else {
      console.log('\n✅ All KickDeck revenue calculations were already correct.');
    }
    
  } catch (error) {
    console.error('Error fixing KickDeck revenue calculations:', error);
    throw error;
  }
}

// Run the fix
fixKickdeckRevenueCalculation()
  .then(() => {
    console.log('\nKickDeck revenue calculation fix completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fix KickDeck revenue calculations:', error);
    process.exit(1);
  });