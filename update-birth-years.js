/**
 * Update Birth Years Script
 * 
 * This script updates age groups that have missing birth year values
 * by extracting the birth year from the division code field.
 * 
 * Usage: node update-birth-years.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateBirthYears() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration to update missing birth years...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get all age groups with missing birth year but have division code
    const { rows: ageGroups } = await client.query(`
      SELECT id, event_id, age_group, gender, division_code, birth_year
      FROM event_age_groups
      WHERE birth_year IS NULL 
        AND division_code IS NOT NULL
        AND division_code ~ '[BG][0-9]{4}'
    `);
    
    console.log(`Found ${ageGroups.length} age groups with missing birth year values`);
    
    // Process each age group
    for (const ageGroup of ageGroups) {
      // Extract year from division code (format B2008 or G2007)
      const match = ageGroup.division_code.match(/[BG](\d{4})/);
      
      if (match && match[1]) {
        const birthYear = parseInt(match[1], 10);
        
        // Update the age group with the extracted birth year
        await client.query(
          'UPDATE event_age_groups SET birth_year = $1 WHERE id = $2',
          [birthYear, ageGroup.id]
        );
        
        console.log(`Updated age group ID ${ageGroup.id} (${ageGroup.gender} ${ageGroup.age_group}): Set birth year to ${birthYear}`);
      } else {
        console.log(`Could not extract birth year from division code ${ageGroup.division_code} for age group ID ${ageGroup.id}`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Check how many still have missing birth years
    const { rows: remaining } = await client.query(`
      SELECT COUNT(*) as count
      FROM event_age_groups
      WHERE birth_year IS NULL
    `);
    
    console.log(`Migration complete. Updated ${ageGroups.length} birth year values.`);
    console.log(`Remaining age groups without birth year: ${remaining[0].count}`);
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error updating birth years:', error);
  } finally {
    // Release client
    client.release();
  }
}

// Run the update
updateBirthYears()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error in update script:', err);
    process.exit(1);
  });