/**
 * Simple test script to directly check database filtering for the finance admin user
 */

import pg from 'pg';
const { Pool } = pg;

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    // Get the user info for our finance admin
    const userResult = await pool.query(`
      SELECT u.id, u.email, r.name as role_name 
      FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      JOIN roles r ON ar.role_id = r.id
      WHERE u.id = 73
    `);
    
    if (!userResult.rows.length) {
      throw new Error('Finance admin user not found');
    }
    
    console.log('Finance admin user:', userResult.rows[0]);
    
    // Get the event assignments for this user
    const eventAssignmentsResult = await pool.query(`
      SELECT ea.event_id, e.name as event_name
      FROM event_administrators ea 
      JOIN events e ON ea.event_id = e.id
      WHERE ea.user_id = 73
    `);
    
    console.log('Event assignments:', eventAssignmentsResult.rows);
    
    // Simulate the API endpoint logic
    // For non-super-admin users, restrict events to those they are administrators for
    const eventsResult = await pool.query(`
      SELECT e.id, e.name, e.start_date, e.end_date, count(t.id) as team_count
      FROM events e
      LEFT JOIN teams t ON e.id = t.event_id
      WHERE e.id IN (
        SELECT event_id FROM event_administrators 
        WHERE user_id = 73
      )
      GROUP BY e.id
      ORDER BY e.start_date
    `);
    
    console.log('Events visible to finance admin (simulating API logic):');
    console.table(eventsResult.rows);
    
    // Compare with all events in the system
    const allEventsResult = await pool.query(`
      SELECT COUNT(*) as total_events FROM events
    `);
    
    console.log('Total events in system:', allEventsResult.rows[0].total_events);
    console.log('Events visible to finance admin:', eventsResult.rows.length);
    
    if (eventsResult.rows.length === eventAssignmentsResult.rows.length) {
      console.log('✅ SUCCESS: Finance admin can see exactly the events they are assigned to!');
    } else {
      console.log('❌ FAILURE: Finance admin sees more or fewer events than expected!');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();