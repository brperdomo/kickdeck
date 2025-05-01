/**
 * Test Direct Team Creation with Club ID
 * 
 * This script tests inserting a team with a club ID directly into the database
 * to verify the fix for the team registration process.
 */
import pg from 'pg';
import { config } from 'dotenv';

// Initialize environment variables
config();

const { Pool } = pg;

async function testTeamWithClub() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Insert a test team directly with club_id
    const insertQuery = `
      INSERT INTO teams (
        name, 
        event_id, 
        age_group_id, 
        club_id,
        club_name,
        coach, 
        manager_name, 
        manager_email, 
        manager_phone,
        status,
        created_at
      ) VALUES (
        'Test Team With Club',
        '1251362271',
        1,
        1,
        'Test Club Name',
        '{"headCoachName":"Test Coach", "headCoachEmail":"test@example.com", "headCoachPhone":"123-456-7890"}',
        'Test Manager',
        'manager@example.com',
        '987-654-3210',
        'registered',
        CURRENT_TIMESTAMP
      ) RETURNING id, club_id, club_name`;

    console.log('Executing SQL query to insert team with club_id...');
    const result = await pool.query(insertQuery);
    
    if (result.rows && result.rows.length > 0) {
      console.log('Team created successfully with club info!');
      console.log('Team data:', result.rows[0]);
      
      // Verify by querying the team
      const teamId = result.rows[0].id;
      const verifyQuery = `
        SELECT id, name, club_id, club_name 
        FROM teams 
        WHERE id = $1
      `;
      
      const verifyResult = await pool.query(verifyQuery, [teamId]);
      console.log('\nVerified team data:', verifyResult.rows[0]);
      
      console.log('\nSUCCESS: Club ID was properly saved in the team record.');
      return true;
    } else {
      console.log('Team was not created. No rows returned.');
      return false;
    }
  } catch (error) {
    console.error('Error creating team:', error);
    return false;
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the test
testTeamWithClub()
  .then(success => {
    if (success) {
      console.log('Test completed successfully!');
      process.exit(0);
    } else {
      console.log('Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });