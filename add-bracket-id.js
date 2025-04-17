/**
 * Add Bracket ID to Teams Table
 * 
 * This script adds the bracket_id column to the teams table
 * to fix the issue with the teams query failing.
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addBracketIdColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting migration to add bracket_id column to teams table...');
    
    // Check if column already exists first
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'bracket_id'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('bracket_id column already exists in teams table');
      return;
    }
    
    // Add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE teams 
      ADD COLUMN bracket_id INTEGER REFERENCES event_brackets(id)
    `);
    
    console.log('Migration complete: bracket_id column added successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
addBracketIdColumn();