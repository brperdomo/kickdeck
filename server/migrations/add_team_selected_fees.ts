import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Migration to add selected_fee_ids and total_amount columns to teams table
 * This allows tracking multiple selected fees for a team registration
 */
export async function addTeamSelectedFees() {
  console.log("Starting migration to add selected_fee_ids and total_amount columns to teams table...");

  try {
    // Check if columns already exist to avoid errors
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    
    const columns = tableInfo.rows.map((row: any) => row.column_name);
    
    // Add the selected_fee_ids column if it doesn't exist
    if (!columns.includes('selected_fee_ids')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN selected_fee_ids TEXT
      `);
      console.log("Added selected_fee_ids column to teams table");
    }
    
    // Add the total_amount column if it doesn't exist
    if (!columns.includes('total_amount')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN total_amount INTEGER
      `);
      console.log("Added total_amount column to teams table");
    }
    
    console.log("Migration complete: team selected fees columns added successfully");
    return true;
  } catch (error) {
    console.error("Error adding team selected fees columns:", error);
    return false;
  }
}

// If this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  addTeamSelectedFees()
    .then((success) => {
      console.log(`Team selected fees migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unexpected error during migration:", error);
      process.exit(1);
    });
}