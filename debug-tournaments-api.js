import { db } from './db/index.js';
import { events, workflowProgress } from './db/schema.js';
import { sql, desc, and } from 'drizzle-orm';

async function testTournamentsQuery() {
  try {
    console.log('Testing tournaments query...');
    
    const tournaments = await db
      .select({
        id: events.id,
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        teamsCount: sql`COALESCE((
          SELECT COUNT(*) 
          FROM teams 
          WHERE teams.event_id = ${events.id} 
          AND teams.status = 'approved'
        ), 0)`,
        hasProgress: sql`EXISTS(
          SELECT 1 
          FROM workflow_progress 
          WHERE workflow_progress.event_id = ${events.id} 
          AND workflow_progress.workflow_type = 'scheduling'
        )`,
        lastModified: sql`(
          SELECT workflow_progress.last_saved
          FROM workflow_progress 
          WHERE workflow_progress.event_id = ${events.id} 
          AND workflow_progress.workflow_type = 'scheduling'
          ORDER BY workflow_progress.last_saved DESC
          LIMIT 1
        )`,
        adminSession: sql`(
          SELECT workflow_progress.session_id
          FROM workflow_progress 
          WHERE workflow_progress.event_id = ${events.id} 
          AND workflow_progress.workflow_type = 'scheduling'
          ORDER BY workflow_progress.last_saved DESC
          LIMIT 1
        )`
      })
      .from(events)
      .orderBy(desc(events.startDate))
      .limit(5);

    console.log('Query successful! Found tournaments:', tournaments.length);
    console.log('Sample tournament:', JSON.stringify(tournaments[0], null, 2));
    
    return tournaments;
  } catch (error) {
    console.error('Query failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Test basic events query
    try {
      console.log('\nTesting basic events query...');
      const basicEvents = await db.select().from(events).limit(3);
      console.log('Basic events query successful:', basicEvents.length, 'events found');
    } catch (basicError) {
      console.error('Basic events query also failed:', basicError.message);
    }
  }
}

testTournamentsQuery().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});