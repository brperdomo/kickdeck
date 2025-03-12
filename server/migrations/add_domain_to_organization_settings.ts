import { db } from "@db";

export async function migrateAddDomainToOrganizationSettings() {
  try {
    // Check if the domain column already exists in the organization_settings table
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organization_settings' 
        AND column_name = 'domain'
      );
    `);

    const columnExists = result.rows[0]?.exists === true;

    if (!columnExists) {
      console.log("Running migration: Add domain column to organization_settings table");

      // Add the domain column to the organization_settings table
      await db.execute(`
        ALTER TABLE organization_settings 
        ADD COLUMN IF NOT EXISTS domain TEXT UNIQUE;
      `);

      console.log("Migration successful: Added domain column to organization_settings table");
    } else {
      console.log("Migration skipped: domain column already exists in organization_settings table");
    }

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// For direct execution (not used in ESM)
if (import.meta.url === import.meta.resolve('./add_domain_to_organization_settings.ts')) {
  try {
    await migrateAddDomainToOrganizationSettings();
    console.log("Migration completed");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}