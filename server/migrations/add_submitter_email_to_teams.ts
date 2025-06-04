import { db } from "../../db";
import { teams } from "../../db/schema";
import { sql } from "drizzle-orm";
import { log } from "../vite-temp";

/**
 * Migration to add submitterEmail column to teams table
 * This allows us to track who actually submitted the registration (vs the team manager)
 */
export async function addSubmitterEmailToTeams() {
  try {
    log("Starting migration to add submitterEmail to teams table...");
    
    // Check if the column already exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'submitter_email'
    `);

    if (!checkColumn || checkColumn.length === 0) {
      // Add the submitterEmail column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN submitter_email TEXT
      `);
      
      // Initialize the submitterEmail with managerEmail for existing teams
      await db.execute(sql`
        UPDATE teams 
        SET submitter_email = manager_email 
        WHERE submitter_email IS NULL
      `);
      
      log("Migration complete: submitterEmail column added to teams table");
    } else {
      log("submitter_email column already exists in teams table");
    }
  } catch (error) {
    log(`Error in migration: ${error}`, "error");
    throw error;
  }
}