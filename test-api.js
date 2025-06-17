/**
 * Test API Endpoint for Event Financial Report
 */

const { db } = require('./db/index.js');
const { sql } = require('drizzle-orm');

async function testEventFinancialAPI() {
  try {
    console.log('Testing event financial API...');
    
    // Test database connection
    const testQuery = sql`SELECT 1 as test`;
    const testResult = await db.execute(testQuery);
    console.log('Database connection:', testResult ? 'OK' : 'Failed');
    
    // Test event query
    const eventId = '1825427780';
    const eventQuery = sql`
      SELECT id, name, start_date, end_date, application_deadline, is_archived
      FROM events
      WHERE id = ${eventId}
    `;
    
    const eventResult = await db.execute(eventQuery);
    console.log('Event query result:', eventResult);
    
    if (eventResult && eventResult.length > 0) {
      console.log('Event found:', eventResult[0]);
    } else {
      console.log('No event found with ID:', eventId);
    }
    
    // Test teams query
    const teamsQuery = sql`
      SELECT COUNT(*) as team_count
      FROM teams
      WHERE event_id = ${eventId}
    `;
    
    const teamsResult = await db.execute(teamsQuery);
    console.log('Teams count:', teamsResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEventFinancialAPI();