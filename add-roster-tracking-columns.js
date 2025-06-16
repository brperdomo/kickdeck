/**
 * Add Roster Tracking Columns Migration
 * 
 * This script adds tracking columns to the teams table to audit
 * when rosters were uploaded after initial registration.
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addRosterTrackingColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting migration to add roster tracking columns...');
    
    // Check which columns already exist
    const existingColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    
    const columnNames = existingColumns.rows.map(row => row.column_name);
    
    // Add roster_uploaded_at column if it doesn't exist
    if (!columnNames.includes('roster_uploaded_at')) {
      await pool.query(`
        ALTER TABLE teams 
        ADD COLUMN roster_uploaded_at TIMESTAMP
      `);
      console.log('Added roster_uploaded_at column');
    }
    
    // Add roster_upload_method column if it doesn't exist
    if (!columnNames.includes('roster_upload_method')) {
      await pool.query(`
        ALTER TABLE teams 
        ADD COLUMN roster_upload_method TEXT
      `);
      console.log('Added roster_upload_method column');
    }
    
    // Add initial_roster_complete column if it doesn't exist
    if (!columnNames.includes('initial_roster_complete')) {
      await pool.query(`
        ALTER TABLE teams 
        ADD COLUMN initial_roster_complete BOOLEAN DEFAULT FALSE
      `);
      console.log('Added initial_roster_complete column');
    }
    
    // Update existing teams that have players to mark their rosters as complete
    // if they weren't registered with add_roster_later flag
    await pool.query(`
      UPDATE teams 
      SET initial_roster_complete = TRUE,
          roster_uploaded_at = created_at::timestamp,
          roster_upload_method = 'initial_registration'
      WHERE id IN (
        SELECT DISTINCT team_id 
        FROM players
      ) 
      AND (add_roster_later IS NULL OR add_roster_later = FALSE)
      AND initial_roster_complete IS NULL
    `);
    
    console.log('Updated existing teams with rosters');
    
    console.log('Migration complete: roster tracking columns added successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
addRosterTrackingColumns();