/**
 * Create Fee Adjustments Table Migration
 * 
 * This script creates the fee_adjustments table for tracking registration fee changes
 * with comprehensive audit logging functionality.
 */

import { db } from './db/index.js';

async function createFeeAdjustmentsTable() {

  try {
    console.log('Creating fee_adjustments table...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS fee_adjustments (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        original_amount INTEGER NOT NULL,
        adjusted_amount INTEGER NOT NULL,
        adjustment INTEGER NOT NULL,
        reason TEXT NOT NULL,
        adjusted_by INTEGER NOT NULL REFERENCES users(id),
        adjusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        event_id TEXT NOT NULL,
        team_name TEXT NOT NULL,
        admin_email TEXT NOT NULL
      );
    `);
    
    console.log('✓ fee_adjustments table created successfully');
    
    // Add indexes for better query performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_fee_adjustments_team_id ON fee_adjustments(team_id);
      CREATE INDEX IF NOT EXISTS idx_fee_adjustments_event_id ON fee_adjustments(event_id);
      CREATE INDEX IF NOT EXISTS idx_fee_adjustments_adjusted_by ON fee_adjustments(adjusted_by);
      CREATE INDEX IF NOT EXISTS idx_fee_adjustments_adjusted_at ON fee_adjustments(adjusted_at);
    `);
    
    console.log('✓ fee_adjustments indexes created successfully');
    console.log('Migration complete: fee_adjustments table is ready for use');
    
  } catch (error) {
    console.error('Error creating fee_adjustments table:', error);
    process.exit(1);
  } catch (finalError) {
    console.error('Migration failed:', finalError);
  }
}

// Run the migration
createFeeAdjustmentsTable();