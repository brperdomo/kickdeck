
import { db } from "@db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        expiration_date TIMESTAMP,
        description TEXT,
        event_id TEXT REFERENCES events(id),
        max_uses INTEGER,
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Created coupons table");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        expiration_date TIMESTAMP NOT NULL,
        description TEXT,
        event_id TEXT REFERENCES events(id),
        max_uses INTEGER,
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
