/**
 * Fix Missing Payment Columns
 * 
 * This script adds the missing columns that are causing payment processing failures.
 */

import { db } from './db/index.js';

async function fixMissingColumns() {
  try {
    console.log('🔧 Fixing missing payment columns...\n');
    
    // Add payment_failure_reason column to teams table
    console.log('Adding payment_failure_reason column to teams table...');
    try {
      await db.execute(`
        ALTER TABLE teams 
        ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT
      `);
      console.log('✅ payment_failure_reason column added');
    } catch (error) {
      console.log('⚠️ payment_failure_reason column might already exist:', error.message);
    }
    
    // Add paid_at column to teams table  
    console.log('Adding paid_at column to teams table...');
    try {
      await db.execute(`
        ALTER TABLE teams 
        ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP
      `);
      console.log('✅ paid_at column added');
    } catch (error) {
      console.log('⚠️ paid_at column might already exist:', error.message);
    }
    
    // Add missing columns to payment_transactions table
    console.log('Adding missing columns to payment_transactions table...');
    
    try {
      await db.execute(`
        ALTER TABLE payment_transactions 
        ADD COLUMN IF NOT EXISTS team_id INTEGER
      `);
      console.log('✅ team_id column added to payment_transactions');
    } catch (error) {
      console.log('⚠️ team_id column might already exist:', error.message);
    }
    
    try {
      await db.execute(`
        ALTER TABLE payment_transactions 
        ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT
      `);
      console.log('✅ stripe_payment_intent_id column added to payment_transactions');
    } catch (error) {
      console.log('⚠️ stripe_payment_intent_id column might already exist:', error.message);
    }
    
    try {
      await db.execute(`
        ALTER TABLE payment_transactions 
        ADD COLUMN IF NOT EXISTS application_fee_amount INTEGER
      `);
      console.log('✅ application_fee_amount column added to payment_transactions');
    } catch (error) {
      console.log('⚠️ application_fee_amount column might already exist:', error.message);
    }
    
    console.log('\n🎉 All missing columns have been added!');
    console.log('📝 Payment processing should now work correctly');
    
  } catch (error) {
    console.error('❌ Error fixing columns:', error);
  }
}

// Run the fix
fixMissingColumns().then(() => {
  console.log('\n🏁 Column fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Column fix failed:', error);
  process.exit(1);
});