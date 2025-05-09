/**
 * Add Stripe Customer ID Column Migration
 * 
 * This script adds the stripeCustomerId column to the teams table
 * to support the two-step payment flow with Stripe.
 */
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addStripeCustomerIdColumn() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add stripeCustomerId to teams table...');
    
    // Check if the column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'stripe_customer_id'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('stripe_customer_id column already exists in teams table');
      return;
    }
    
    // Add the column
    await client.query(`
      ALTER TABLE teams
      ADD COLUMN stripe_customer_id TEXT
    `);
    
    console.log('Migration complete: stripe_customer_id column added successfully');
  } catch (error) {
    console.error('Error in migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addStripeCustomerIdColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });