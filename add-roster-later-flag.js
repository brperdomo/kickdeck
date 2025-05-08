/**
 * Add Roster Later Flag to Teams Table
 * 
 * This script adds the add_roster_later column to the teams table
 * to support the feature allowing teams to register without a roster initially
 * and add players later.
 */
const { db } = require('./server/db');
const { sql } = require('drizzle-orm');
const { log } = require('./server/utils/logging');

async function addRosterLaterFlag() {
  log('Starting migration to add add_roster_later to teams table...', 'express');
  
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams'
      AND column_name = 'add_roster_later'
    `);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN add_roster_later BOOLEAN NOT NULL DEFAULT FALSE
      `);
      log('add_roster_later column added to teams table', 'express');
    } else {
      log('add_roster_later column already exists in teams table', 'express');
    }
    
    log('Migration complete: add_roster_later field added successfully', 'express');
  } catch (error) {
    log(`Error adding add_roster_later column: ${error}`, 'express');
    throw error;
  }
}

// Run the migration
addRosterLaterFlag()
  .then(() => {
    log('Migration completed successfully', 'express');
    process.exit(0);
  })
  .catch((error) => {
    log(`Migration failed: ${error}`, 'express');
    process.exit(1);
  });