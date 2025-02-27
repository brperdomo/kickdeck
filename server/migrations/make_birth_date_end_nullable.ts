
import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      ALTER TABLE event_age_groups 
      ALTER COLUMN birth_date_end DROP NOT NULL;
    `);
    
    console.log('Made birth_date_end column nullable in event_age_groups table');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
