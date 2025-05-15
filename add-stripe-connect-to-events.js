/**
 * Add Stripe Connect Fields to Events Table
 * 
 * This script adds Stripe Connect fields to the events table so that
 * tournament organizers can receive payments directly through Stripe Connect.
 */

const { Pool } = require('pg');
require('dotenv').config();

async function addStripeConnectFieldsToEvents() {
  console.log('Starting migration to add Stripe Connect fields to events table...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name = 'stripe_connect_account_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log('Stripe Connect fields already exist in events table');
      return;
    }

    // Add columns to events table
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN stripe_connect_account_id TEXT,
      ADD COLUMN stripe_connect_status TEXT,
      ADD COLUMN stripe_connect_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN stripe_connect_details_submitted BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Stripe Connect fields added to events table successfully');
  } catch (error) {
    console.error('Error adding Stripe Connect fields to events table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute migration
addStripeConnectFieldsToEvents()
  .then(() => {
    console.log('Migration completed successfully');
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });