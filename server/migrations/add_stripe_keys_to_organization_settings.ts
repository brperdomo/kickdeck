import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

export async function addStripeKeysToOrganizationSettings() {
  try {
    log("Adding Stripe key columns to organization_settings table...");

    await db.execute(sql`
      ALTER TABLE organization_settings
      ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT
    `);
    await db.execute(sql`
      ALTER TABLE organization_settings
      ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT
    `);
    await db.execute(sql`
      ALTER TABLE organization_settings
      ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT
    `);
    await db.execute(sql`
      ALTER TABLE organization_settings
      ADD COLUMN IF NOT EXISTS stripe_test_mode BOOLEAN DEFAULT true
    `);
    log("Stripe key columns ensured");
  } catch (error) {
    console.error("Error adding Stripe key columns:", error);
    throw error;
  }
}
