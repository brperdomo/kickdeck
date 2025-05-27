/**
 * Enhanced Payment Transaction Tracking Migration
 * 
 * Adds comprehensive Stripe fee tracking and settlement data to payment transactions
 * for accurate financial reporting and revenue analysis.
 */

import { Client } from 'pg';

async function enhancePaymentTransactionTracking() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add stripe_fee column
    const checkStripeFee = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions' AND column_name = 'stripe_fee';
    `;
    const stripeFeeResult = await client.query(checkStripeFee);
    
    if (stripeFeeResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE payment_transactions
        ADD COLUMN stripe_fee INTEGER;
      `);
      console.log('stripe_fee column added to payment_transactions table');
    } else {
      console.log('stripe_fee column already exists in payment_transactions table');
    }

    // Add net_amount column
    const checkNetAmount = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions' AND column_name = 'net_amount';
    `;
    const netAmountResult = await client.query(checkNetAmount);
    
    if (netAmountResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE payment_transactions
        ADD COLUMN net_amount INTEGER;
      `);
      console.log('net_amount column added to payment_transactions table');
    } else {
      console.log('net_amount column already exists in payment_transactions table');
    }

    // Add settlement_date column
    const checkSettlementDate = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions' AND column_name = 'settlement_date';
    `;
    const settlementDateResult = await client.query(checkSettlementDate);
    
    if (settlementDateResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE payment_transactions
        ADD COLUMN settlement_date TIMESTAMP;
      `);
      console.log('settlement_date column added to payment_transactions table');
    } else {
      console.log('settlement_date column already exists in payment_transactions table');
    }

    // Add payout_id column
    const checkPayoutId = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions' AND column_name = 'payout_id';
    `;
    const payoutIdResult = await client.query(checkPayoutId);
    
    if (payoutIdResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE payment_transactions
        ADD COLUMN payout_id TEXT;
      `);
      console.log('payout_id column added to payment_transactions table');
    } else {
      console.log('payout_id column already exists in payment_transactions table');
    }

    // Update existing records with calculated Stripe fees (estimated)
    console.log('Updating existing records with estimated Stripe fees...');
    await client.query(`
      UPDATE payment_transactions 
      SET 
        stripe_fee = CASE 
          WHEN status = 'succeeded' AND transaction_type = 'payment' AND amount > 0 THEN 
            ROUND(amount * 0.029 + 30)
          ELSE 0
        END,
        net_amount = CASE 
          WHEN status = 'succeeded' AND transaction_type = 'payment' AND amount > 0 THEN 
            amount - ROUND(amount * 0.029 + 30)
          ELSE amount
        END
      WHERE stripe_fee IS NULL OR net_amount IS NULL;
    `);
    console.log('Updated existing records with estimated fees');

    console.log('Migration complete: Enhanced payment transaction tracking added successfully');
  } catch (error) {
    console.error('Error enhancing payment transaction tracking:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  enhancePaymentTransactionTracking()
    .then(() => {
      console.log('Enhanced payment transaction tracking migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { enhancePaymentTransactionTracking };