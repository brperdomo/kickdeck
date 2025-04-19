import { sql } from 'drizzle-orm';
import { db } from '@db';

/**
 * Migration to add payment_status column to teams table
 */
export async function addPaymentStatusToTeams() {
  console.log('Starting migration to add payment_status to teams table...');
  
  try {
    // Check if the column already exists
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'payment_status';
    `);
    
    // If column doesn't exist, add it
    if (!tableInfo.rowCount || tableInfo.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN payment_status TEXT DEFAULT 'pending';
      `);
      console.log('payment_status column added to teams table successfully');
    } else {
      console.log('payment_status column already exists in teams table');
    }
    
    // Check for payment_date column
    const dateColumnInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'payment_date';
    `);
    
    // If payment_date column doesn't exist, add it
    if (!dateColumnInfo.rowCount || dateColumnInfo.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN payment_date TIMESTAMP;
      `);
      console.log('payment_date column added to teams table successfully');
    } else {
      console.log('payment_date column already exists in teams table');
    }
    
    // Check for payment_intent_id column
    const intentColumnInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'payment_intent_id';
    `);
    
    // If payment_intent_id column doesn't exist, add it
    if (!intentColumnInfo.rowCount || intentColumnInfo.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN payment_intent_id TEXT;
      `);
      console.log('payment_intent_id column added to teams table successfully');
    } else {
      console.log('payment_intent_id column already exists in teams table');
    }
    
    // Check for refund_date column
    const refundDateColumnInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'refund_date';
    `);
    
    // If refund_date column doesn't exist, add it
    if (!refundDateColumnInfo.rowCount || refundDateColumnInfo.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN refund_date TIMESTAMP;
      `);
      console.log('refund_date column added to teams table successfully');
    } else {
      console.log('refund_date column already exists in teams table');
    }
    
    console.log('Migration complete: Payment status fields added successfully');
  } catch (error) {
    console.error('Error adding payment_status to teams table:', error);
    throw error;
  }
}

// Execute migration if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addPaymentStatusToTeams()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}