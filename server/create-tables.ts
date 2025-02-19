import { db } from "@db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    await db.execute(sql`
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