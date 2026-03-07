import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

export async function addOpenaiApiKeyToOrganizationSettings() {
  try {
    log("Adding openai_api_key column to organization_settings table...");

    // Check if the column already exists
    const columnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'organization_settings' AND column_name = 'openai_api_key'
    `);

    if (columnExists.length === 0) {
      await db.execute(sql`
        ALTER TABLE organization_settings
        ADD COLUMN openai_api_key TEXT
      `);
      log("openai_api_key column added successfully");
    } else {
      log("openai_api_key column already exists");
    }
  } catch (error) {
    console.error("Error adding openai_api_key column:", error);
    throw error;
  }
}
