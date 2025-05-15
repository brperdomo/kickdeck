/**
 * Add Stripe Connect Fields Migration
 * 
 * This script adds the necessary columns to support Stripe Connect
 * functionality in our database.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize config
dotenv.config();

const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addStripeConnectFields() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration to add Stripe Connect fields...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Add stripeConnectAccountId to clubs table
    console.log('Adding stripe_connect_account_id to clubs table...');
    const checkConnectIdColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clubs' AND column_name = 'stripe_connect_account_id'
    `);
    
    if (checkConnectIdColumn.rowCount === 0) {
      await client.query(`
        ALTER TABLE clubs
        ADD COLUMN stripe_connect_account_id TEXT,
        ADD COLUMN stripe_connect_status TEXT,
        ADD COLUMN stripe_connect_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN stripe_connect_details_submitted BOOLEAN DEFAULT FALSE,
        ADD COLUMN email TEXT
      `);
      console.log('Added Stripe Connect fields to clubs table');
    } else {
      console.log('Stripe Connect fields already exist in clubs table');
    }
    
    // Add stripeConnectPayoutId to payment_transactions table
    console.log('Adding stripe_connect_payout_id to payment_transactions table...');
    const checkPayoutIdColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_transactions' AND column_name = 'stripe_connect_payout_id'
    `);
    
    if (checkPayoutIdColumn.rowCount === 0) {
      await client.query(`
        ALTER TABLE payment_transactions
        ADD COLUMN stripe_connect_payout_id TEXT,
        ADD COLUMN stripe_connect_account_id TEXT,
        ADD COLUMN platform_fee_amount INTEGER DEFAULT 0,
        ADD COLUMN club_id INTEGER
      `);
      console.log('Added Stripe Connect fields to payment_transactions table');
    } else {
      console.log('Stripe Connect fields already exist in payment_transactions table');
    }
    
    // Add stripeConnectFeePercent to organization_settings
    console.log('Adding stripe_connect_fee_percent to organization_settings table...');
    const checkFeeColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organization_settings' AND column_name = 'stripe_connect_fee_percent'
    `);
    
    if (checkFeeColumn.rowCount === 0) {
      await client.query(`
        ALTER TABLE organization_settings
        ADD COLUMN stripe_connect_fee_percent DECIMAL(5,2) DEFAULT 5.0,
        ADD COLUMN stripe_connect_enabled BOOLEAN DEFAULT FALSE
      `);
      console.log('Added Stripe Connect fields to organization_settings table');
    } else {
      console.log('Stripe Connect fields already exist in organization_settings table');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration successful: Stripe Connect fields added successfully');
    
  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the migration
addStripeConnectFields()
  .then(() => {
    console.log('Completed Stripe Connect fields migration');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });