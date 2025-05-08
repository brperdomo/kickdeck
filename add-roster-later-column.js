/**
 * Add Roster Later Column Migration
 * 
 * This script adds the add_roster_later column to the teams table to support
 * the "Add Roster Later" feature that allows team registration without immediate player roster.
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addRosterLaterColumn() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting migration to add add_roster_later column to teams table...');
    await client.connect();

    // First check if the column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      AND column_name = 'add_roster_later'
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('add_roster_later column already exists in teams table');
    } else {
      // Add the column if it doesn't exist
      const addColumnQuery = `
        ALTER TABLE teams 
        ADD COLUMN add_roster_later BOOLEAN DEFAULT FALSE
      `;
      
      await client.query(addColumnQuery);
      console.log('add_roster_later column added to teams table successfully');
    }

    console.log('Migration complete');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Execute the migration
addRosterLaterColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });