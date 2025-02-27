
import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      ALTER TABLE event_age_groups 
      ALTER COLUMN birth_date_start DROP NOT NULL;
    `);
    
    console.log('Made birth_date_start column nullable in event_age_groups table');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
