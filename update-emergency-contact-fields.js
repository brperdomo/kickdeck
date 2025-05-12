/**
 * Update Emergency Contact Fields Migration
 * 
 * This script updates the player schema to use separate first and last name fields
 * for emergency contacts instead of a single name field.
 */

const { Pool } = require('pg');
require('dotenv').config();

async function updateEmergencyContactFields() {
  console.log('Starting migration to update emergency contact fields...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if the columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      AND column_name IN ('emergency_contact_first_name', 'emergency_contact_last_name');
    `);

    if (checkResult.rows.length === 2) {
      console.log('Emergency contact first name and last name columns already exist');
      return;
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Add the new columns if they don't exist
    if (!checkResult.rows.some(row => row.column_name === 'emergency_contact_first_name')) {
      await pool.query(`
        ALTER TABLE players 
        ADD COLUMN emergency_contact_first_name TEXT;
      `);
      console.log('Added emergency_contact_first_name column');
    }

    if (!checkResult.rows.some(row => row.column_name === 'emergency_contact_last_name')) {
      await pool.query(`
        ALTER TABLE players 
        ADD COLUMN emergency_contact_last_name TEXT;
      `);
      console.log('Added emergency_contact_last_name column');
    }

    // Split existing emergency_contact_name into first and last name
    await pool.query(`
      UPDATE players 
      SET 
        emergency_contact_first_name = COALESCE(SPLIT_PART(emergency_contact_name, ' ', 1), ''),
        emergency_contact_last_name = COALESCE(
          CASE 
            WHEN POSITION(' ' IN emergency_contact_name) > 0 
            THEN SUBSTRING(emergency_contact_name FROM POSITION(' ' IN emergency_contact_name) + 1)
            ELSE ''
          END,
          ''
        )
      WHERE emergency_contact_name IS NOT NULL AND emergency_contact_name != '';
    `);
    console.log('Split existing emergency contact names into first and last name');

    // Commit transaction
    await pool.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
updateEmergencyContactFields()
  .then(() => console.log('Emergency contact fields migration completed'))
  .catch(err => console.error('Migration failed:', err));