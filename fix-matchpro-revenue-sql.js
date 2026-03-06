/**
 * Fix KickDeck Revenue Calculation - SQL Version
 * 
 * This script corrects the kickdeck_revenue field to show the actual KickDeck revenue
 * (4% platform fee minus Stripe processing costs) rather than the total platform fee.
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixKickdeckRevenueCalculation() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get all payment transactions that need analysis
    const query = `
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
    
    const result = await client.query(query);
    console.log(`Found ${result.rows.length} payment transactions to analyze`);
    
    let updatedCount = 0;
    
    for (const transaction of result.rows) {
      const amount = transaction.amount || 0;
      const stripeFee = transaction.stripe_fee || 0;
      const currentKickdeckRevenue = transaction.kickdeck_revenue || 0;
      const netAmount = transaction.net_amount || 0;
      
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
        
        await client.query(
          'UPDATE payment_transactions SET kickdeck_revenue = $1 WHERE id = $2',
          [correctKickdeckRevenue, transaction.id]
        );
        
        updatedCount++;
      } else {
        console.log(`  ✅ Record already correct`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total transactions analyzed: ${result.rows.length}`);
    console.log(`Records updated: ${updatedCount}`);
    console.log(`Records already correct: ${result.rows.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log('\n✅ KickDeck revenue calculations have been corrected!');
      console.log('The payment logs will now show accurate KickDeck revenue figures.');
    } else {
      console.log('\n✅ All KickDeck revenue calculations were already correct.');
    }
    
  } catch (error) {
    console.error('Error fixing KickDeck revenue calculations:', error);
    throw error;
  } finally {
    await client.end();
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