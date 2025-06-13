/**
 * Migrate Stripe Connect Fields to Events Table
 * 
 * This script adds the necessary Stripe Connect fields to the events table
 * to support per-tournament bank account setup and revenue distribution.
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function migrateStripeConnectFields() {
  console.log('Starting Stripe Connect fields migration...');

  try {
    // Add all Stripe Connect fields to events table
    const migrations = [
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_account_status TEXT DEFAULT \'not_connected\'',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_onboarding_url TEXT',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_dashboard_url TEXT',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_account_type TEXT DEFAULT \'standard\'',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_requirements_needed TEXT',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_payouts_enabled BOOLEAN DEFAULT FALSE',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_charges_enabled BOOLEAN DEFAULT FALSE',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_account_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS connect_last_updated TIMESTAMP'
    ];

    for (const migration of migrations) {
      console.log(`Executing: ${migration}`);
      await sql.unsafe(migration);
    }

    console.log('✓ Stripe Connect fields migration completed successfully');

    // Update payment_transactions table to support Connect account tracking
    const paymentMigrations = [
      'ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS connect_account_id TEXT',
      'ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS application_fee_amount INTEGER',
      'ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS transfer_id TEXT'
    ];

    for (const migration of paymentMigrations) {
      console.log(`Executing: ${migration}`);
      await sql.unsafe(migration);
    }

    console.log('✓ Payment transactions table updated for Connect support');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run migration
migrateStripeConnectFields();