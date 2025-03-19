import { db } from "@db";
import { sql } from "drizzle-orm";
import { createEmailTemplatesTable } from "./migrations/create_email_templates";
import { createEmailTemplateRoutingTable } from "./migrations/create_email_template_routing";

export async function createTables() {
  try {
    console.log('Starting database migrations...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_form_templates (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_fields (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES event_form_templates(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        required BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL,
        placeholder TEXT,
        help_text TEXT,
        validation JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_field_options (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        value TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_responses (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES event_form_templates(id),
        team_id INTEGER NOT NULL,
        responses JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accounting_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_fees (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        begin_date TIMESTAMP,
        end_date TIMESTAMP,
        apply_to_all BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        expiration_date TIMESTAMP,
        description TEXT,
        event_id INTEGER,
        max_uses INTEGER CHECK (max_uses > 0),
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_settings (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        setting_key TEXT NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating email templates table...');
    await createEmailTemplatesTable();

    console.log('Creating email template routing table...');
    await createEmailTemplateRoutingTable();

    console.log("All tables created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating tables:", error);
    return { success: false, error };
  }
}

// Only run migrations directly if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables().then(result => {
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  });
}