import { db } from "../../db";
import { teams } from "../../db/schema";
import { sql } from "drizzle-orm";
import { log } from "../vite";

/**
 * Migration to add submitterName column to teams table
 * This allows us to track who actually submitted the registration (vs the team manager)
 */
export async function addSubmitterNameToTeams() {
  try {
    log("Starting migration to add submitterName to teams table...");
    
    // Check if the column already exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'submitter_name'
    `);

    if (checkColumn.rows.length === 0) {
      // Add the submitterName column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN submitter_name TEXT
      `);
      
      // Initialize the submitterName with managerName for existing teams
      await db.execute(sql`
        UPDATE teams 
        SET submitter_name = manager_name 
        WHERE submitter_name IS NULL
      `);
      
      log("Migration complete: submitterName column added to teams table");
    } else {
      log("submitter_name column already exists in teams table");
    }
  } catch (error) {
    log(`Error in migration: ${error}`, "error");
    throw error;
  }
}