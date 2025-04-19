/**
 * Fix Card Details Columns
 * 
 * This script fixes the issue with missing card_last_4 column in the teams table
 * It adds the column if it doesn't exist in the database.
 */

const { pool } = require('./server/db-connection');

async function fixCardDetailsColumns() {
  console.log('Starting migration to fix card details columns in teams table...');
  const client = await pool.connect();
  
  try {
    // Check if columns already exist to avoid errors
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    
    const columns = rows.map(row => row.column_name);
    
    // Add the card_last_4 column if it doesn't exist
    if (!columns.includes('card_last_4')) {
      console.log('Adding card_last_4 column to teams table...');
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN card_last_4 TEXT
      `);
      console.log('Added card_last_4 column to teams table');
    } else {
      console.log('card_last_4 column already exists in teams table');
    }
    
    // Add the card_brand column if it doesn't exist
    if (!columns.includes('card_brand')) {
      console.log('Adding card_brand column to teams table...');
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN card_brand TEXT
      `);
      console.log('Added card_brand column to teams table');
    } else {
      console.log('card_brand column already exists in teams table');
    }
    
    // Add the payment_method_type column if it doesn't exist
    if (!columns.includes('payment_method_type')) {
      console.log('Adding payment_method_type column to teams table...');
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN payment_method_type TEXT
      `);
      console.log('Added payment_method_type column to teams table');
    } else {
      console.log('payment_method_type column already exists in teams table');
    }
    
    console.log('Card details columns migration completed successfully');
  } catch (error) {
    console.error('Error fixing card details columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  fixCardDetailsColumns()
    .then(() => {
      console.log('Card details columns fixed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}