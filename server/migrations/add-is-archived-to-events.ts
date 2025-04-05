import { db } from "../../db";
import { sql } from "drizzle-orm";

/**
 * Add isArchived column to events table
 * This migration adds the is_archived boolean column to the events table with a default value of false
 */
export async function addIsArchivedToEvents() {
  try {
    console.log('Starting migration to add isArchived to events table...');
    
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'is_archived';
    `);
    
    // If column doesn't exist, add it
    if (result.length === 0) {
      await db.execute(sql`
        ALTER TABLE events
        ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
      `);
      console.log('is_archived column added to events table');
    } else {
      console.log('is_archived column already exists in events table');
    }
    
    console.log('Migration complete: isArchived field added successfully');
  } catch (error) {
    console.error('Error adding isArchived field to events table:', error);
    throw error;
  }
}