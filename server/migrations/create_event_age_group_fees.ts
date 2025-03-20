import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_age_group_fees (
        id SERIAL PRIMARY KEY,
        age_group_id INTEGER NOT NULL REFERENCES event_age_groups(id) ON DELETE CASCADE,
        fee_id INTEGER NOT NULL REFERENCES event_fees(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Created event_age_group_fees table');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
