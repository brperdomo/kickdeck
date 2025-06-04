
import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite-temp";

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
