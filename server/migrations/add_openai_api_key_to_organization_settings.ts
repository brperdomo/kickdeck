import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

export async function addOpenaiApiKeyToOrganizationSettings() {
  try {
    log("Adding openai_api_key column to organization_settings table...");

    await db.execute(sql`
      ALTER TABLE organization_settings
      ADD COLUMN IF NOT EXISTS openai_api_key TEXT
    `);
    log("openai_api_key column ensured");
  } catch (error) {
    console.error("Error adding openai_api_key column:", error);
    throw error;
  }
}
