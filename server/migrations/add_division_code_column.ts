
import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      ALTER TABLE event_age_groups 
      ADD COLUMN IF NOT EXISTS division_code TEXT;
    `);
    
    console.log('Added division_code column to event_age_groups table');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
