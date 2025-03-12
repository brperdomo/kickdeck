
import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

export async function addDomainToOrganizationSettings() {
  try {
    log("Adding domain column to organization_settings table...");
    
    // Check if the column already exists
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organization_settings' AND column_name = 'domain'
    `);
    
    if (columnExists.length === 0) {
      await db.execute(sql`
        ALTER TABLE organization_settings 
        ADD COLUMN domain TEXT UNIQUE
      `);
      log("Domain column added successfully");
    } else {
      log("Domain column already exists");
    }
  } catch (error) {
    console.error("Error adding domain column:", error);
    throw error;
  }
}
import { db } from "@db";
import { sql } from "drizzle-orm";

export async function migrateAddDomainToOrganizationSettings() {
  try {
    console.log("Running migration: Add domain column to organization_settings table");
    
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organization_settings' AND column_name = 'domain'
    `);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      await db.execute(sql`
        ALTER TABLE organization_settings 
        ADD COLUMN domain TEXT UNIQUE
      `);
      console.log("Migration successful: Added domain column to organization_settings table");
    } else {
      console.log("Migration skipped: domain column already exists");
    }
    
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateAddDomainToOrganizationSettings()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
