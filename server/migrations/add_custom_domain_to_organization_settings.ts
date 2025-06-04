import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite-temp";

export async function addCustomDomainToOrganizationSettings() {
  try {
    log("Adding custom_domain column to organization_settings table...");
    
    // Check if the column already exists
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organization_settings' AND column_name = 'custom_domain'
    `);
    
    if (columnExists.length === 0) {
      await db.execute(sql`
        ALTER TABLE organization_settings 
        ADD COLUMN custom_domain TEXT UNIQUE
      `);
      log("custom_domain column added successfully");
    } else {
      log("custom_domain column already exists");
    }
  } catch (error) {
    console.error("Error adding custom_domain column:", error);
    throw error;
  }
}