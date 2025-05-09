/**
 * Add Setup Intent Columns Migration
 * 
 * This script adds the setupIntentId and paymentMethodId columns to the teams table
 * to support the two-step payment flow (collect card info now, charge later).
 */
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function addSetupIntentColumns() {
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    console.log('Starting migration to add setupIntentId and paymentMethodId columns to teams table...');
    
    // Check if setup_intent_id column already exists
    const checkSetupIntentIdQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams' AND column_name = 'setup_intent_id';
    `;
    const setupIntentResult = await client.query(checkSetupIntentIdQuery);
    
    if (setupIntentResult.rows.length === 0) {
      // Add setup_intent_id column
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN setup_intent_id TEXT;
      `);
      console.log('setup_intent_id column added to teams table');
    } else {
      console.log('setup_intent_id column already exists in teams table');
    }
    
    // Check if payment_method_id column already exists
    const checkPaymentMethodIdQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams' AND column_name = 'payment_method_id';
    `;
    const paymentMethodResult = await client.query(checkPaymentMethodIdQuery);
    
    if (paymentMethodResult.rows.length === 0) {
      // Add payment_method_id column
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN payment_method_id TEXT;
      `);
      console.log('payment_method_id column added to teams table');
    } else {
      console.log('payment_method_id column already exists in teams table');
    }
    
    // Now also update the payment transactions table to ensure it has setupIntentId
    const checkSetupIntentIdTransaction = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions' AND column_name = 'setup_intent_id';
    `;
    const setupIntentTransactionResult = await client.query(checkSetupIntentIdTransaction);
    
    if (setupIntentTransactionResult.rows.length === 0) {
      // Add setup_intent_id column to payment_transactions
      await client.query(`
        ALTER TABLE payment_transactions
        ADD COLUMN setup_intent_id TEXT;
      `);
      console.log('setup_intent_id column added to payment_transactions table');
    } else {
      console.log('setup_intent_id column already exists in payment_transactions table');
    }
    
    console.log('Migration complete: setup intent columns added successfully');
  } catch (error) {
    console.error('Error adding setup intent columns:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
addSetupIntentColumns()
  .then(() => console.log('Setup intent columns migration completed'))
  .catch(err => console.error('Migration failed:', err));