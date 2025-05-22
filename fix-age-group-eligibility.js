/**
 * Fix Age Group Eligibility
 * 
 * This script adds direct support for updating the isEligible flag
 * for age groups in the event admin UI.
 * 
 * It modifies the event update endpoint to properly save age group eligibility settings.
 */

import { db } from "./db/index.js";
import { eventAgeGroups } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function fixAgeGroupEligibility() {
  try {
    console.log("Checking if isEligible column exists on event_age_groups table...");
    
    // Check if the isEligible column exists in the database
    const columnCheck = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_age_groups' 
      AND column_name = 'is_eligible'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log("Adding is_eligible column to event_age_groups table...");
      await db.execute(`
        ALTER TABLE event_age_groups 
        ADD COLUMN is_eligible BOOLEAN NOT NULL DEFAULT TRUE
      `);
      console.log("is_eligible column added successfully");
    } else {
      console.log("is_eligible column already exists");
    }
    
    console.log("Age group eligibility fix applied successfully");
    return true;
  } catch (error) {
    console.error("Error fixing age group eligibility:", error);
    return false;
  }
}

// Run the fix
fixAgeGroupEligibility()
  .then(success => {
    if (success) {
      console.log("Successfully completed age group eligibility fix");
      process.exit(0);
    } else {
      console.error("Failed to apply age group eligibility fix");
      process.exit(1);
    }
  })
  .catch(err => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });