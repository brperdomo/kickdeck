/**
 * Add Roster Later Column Migration
 * 
 * This script adds the add_roster_later column to the teams table to support
 * the feature allowing teams to register without players and add them later.
 */
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function addRosterLaterColumn() {
  // Connect to the database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in environment variables');
    process.exit(1);
  }

  // Create postgres connection
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient);

  console.log('Starting migration to add add_roster_later column to teams table...');

  try {
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams' AND column_name = 'add_roster_later';
    `;
    
    const columnExists = await queryClient.unsafe(checkColumnQuery);
    
    if (columnExists.length > 0) {
      console.log('add_roster_later column already exists in teams table');
    } else {
      // Add the column
      const addColumnQuery = `
        ALTER TABLE teams 
        ADD COLUMN add_roster_later BOOLEAN DEFAULT FALSE;
      `;
      
      await queryClient.unsafe(addColumnQuery);
      console.log('Added add_roster_later column to teams table');
    }
    
    console.log('Migration complete: add_roster_later column added successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await queryClient.end();
  }
}

// Run the migration
addRosterLaterColumn().catch(console.error);