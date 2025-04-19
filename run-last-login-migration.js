/**
 * Run Last Login Migration
 * 
 * This script runs the migration to add last_login and last_viewed_registrations columns
 * to the users table in the database.
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addLastLoginColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting migration to add admin last login fields...');
    
    // Check if columns already exist to avoid errors
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = checkResult.rows.map(row => row.column_name);
    
    // Add the last_login column if it doesn't exist
    if (!columns.includes('last_login')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log("Added last_login column to users table");
    } else {
      console.log("last_login column already exists");
    }
    
    // Add the last_viewed_registrations column if it doesn't exist
    if (!columns.includes('last_viewed_registrations')) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN last_viewed_registrations TIMESTAMP
      `);
      console.log("Added last_viewed_registrations column to users table");
    } else {
      console.log("last_viewed_registrations column already exists");
    }
    
    console.log("Migration complete: admin last login fields added successfully");
    return true;
  } catch (error) {
    console.error("Error adding admin last login fields:", error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the migration
addLastLoginColumns()
  .then(success => {
    console.log(`Migration ${success ? 'completed successfully' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("Unexpected error during migration:", error);
    process.exit(1);
  });