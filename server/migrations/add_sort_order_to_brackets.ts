import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Migration to add sort_order column to event_brackets table
 * This allows brackets to be ordered in the UI
 */
export async function addSortOrderToBrackets() {
  console.log("Starting migration to add sort_order column to event_brackets table...");

  try {
    // Check if column already exists to avoid errors
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_brackets' AND column_name = 'sort_order'
    `);
    
    // Add the sort_order column if it doesn't exist
    if (tableInfo.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE event_brackets
        ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0
      `);
      console.log("Added sort_order column to event_brackets table");
      return true;
    } else {
      console.log("sort_order column already exists in event_brackets table");
      return true;
    }
  } catch (error) {
    console.error("Error adding sort_order column:", error);
    return false;
  }
}

// Execute migration if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSortOrderToBrackets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}