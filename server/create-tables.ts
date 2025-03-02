import { db } from "@db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
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

      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        trigger TEXT NOT NULL, 
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        sender_name TEXT,
        sender_email TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS email_config (
        id SERIAL PRIMARY KEY,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        secure BOOLEAN DEFAULT true,
        auth JSONB NOT NULL,
        sender_email TEXT NOT NULL,
        sender_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
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
    `);
    console.log("Coupons table created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
  process.exit(0);
}

createTables();