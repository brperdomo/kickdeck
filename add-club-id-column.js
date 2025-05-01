/**
 * Add Club ID Column Migration
 * 
 * This script adds the club_id column to the teams table to support
 * the association between teams and clubs in the registration process.
 */
const { Pool } = require('pg');
require('dotenv').config();

async function addClubIdColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting migration to add club_id column to teams table...');

    // First check if the column already exists
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams' AND column_name = 'club_id';
    `;

    const checkResult = await pool.query(checkQuery);

    if (checkResult.rowCount > 0) {
      console.log('club_id column already exists in teams table');
      return;
    }

    // Add the club_id column with a foreign key reference to clubs table
    const alterTableQuery = `
      ALTER TABLE teams
      ADD COLUMN club_id INTEGER REFERENCES clubs(id);
    `;

    await pool.query(alterTableQuery);
    console.log('Successfully added club_id column to teams table');

    // Add index for better query performance
    const indexQuery = `
      CREATE INDEX idx_teams_club_id ON teams(club_id);
    `;

    await pool.query(indexQuery);
    console.log('Successfully created index on club_id column');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addClubIdColumn()
    .then(() => console.log('Migration process completed'))
    .catch(err => console.error('Migration failed:', err));
}

module.exports = { addClubIdColumn };