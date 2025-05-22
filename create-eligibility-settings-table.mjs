/**
 * Create Age Group Eligibility Settings Table
 * 
 * This script creates a new table to store age group eligibility settings
 * separately from the age groups table. This avoids foreign key constraint issues
 * when updating eligibility status for age groups that are referenced in brackets.
 */

import pg from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function createEligibilitySettingsTable() {
  console.log('Creating event_age_group_eligibility table...');
  
  try {
    // Check if the table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_age_group_eligibility'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('event_age_group_eligibility table already exists');
      return;
    }
    
    // Create the table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_age_group_eligibility (
        event_id INTEGER NOT NULL REFERENCES events(id),
        age_group_id VARCHAR(255) NOT NULL,
        is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
        PRIMARY KEY (event_id, age_group_id)
      );
    `);
    
    console.log('event_age_group_eligibility table created successfully');
    
    // Initialize the table with data from existing age groups
    // Set all current age groups as eligible by default
    await db.execute(sql`
      INSERT INTO event_age_group_eligibility (event_id, age_group_id, is_eligible)
      SELECT 
        event_id, 
        CONCAT(gender, '-', birth_year, '-', age_group) AS age_group_id, 
        true AS is_eligible
      FROM 
        event_age_groups
      ON CONFLICT (event_id, age_group_id) DO NOTHING;
    `);
    
    console.log('Initialized eligibility settings from existing age groups');
    
  } catch (error) {
    console.error('Error creating eligibility settings table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute the function if this script is run directly
if (process.argv[1].includes('create-eligibility-settings-table.mjs')) {
  createEligibilitySettingsTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

// Export for use in other scripts
export { createEligibilitySettingsTable };