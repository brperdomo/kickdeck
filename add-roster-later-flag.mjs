/**
 * Add Roster Later Flag to Teams Table
 * 
 * This script adds the add_roster_later column to the teams table
 * to support the feature allowing teams to register without a roster initially
 * and add players later.
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

async function addRosterLaterFlag() {
  console.log('Starting migration to add add_roster_later to teams table...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Check if the column already exists
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams'
      AND column_name = 'add_roster_later'
    `;
    
    const result = await pool.query(checkQuery);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      const alterQuery = `
        ALTER TABLE teams
        ADD COLUMN add_roster_later BOOLEAN NOT NULL DEFAULT FALSE
      `;
      await pool.query(alterQuery);
      console.log('add_roster_later column added to teams table');
    } else {
      console.log('add_roster_later column already exists in teams table');
    }
    
    console.log('Migration complete: add_roster_later field added successfully');
  } catch (error) {
    console.error(`Error adding add_roster_later column: ${error}`);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addRosterLaterFlag()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Migration failed: ${error}`);
    process.exit(1);
  });