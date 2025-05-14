import { sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

/**
 * Create the magic link tokens table for passwordless authentication
 */
export async function createMagicLinkTokensTable(db: PostgresJsDatabase<typeof schema>) {
  console.log("Starting migration to create magic_link_tokens table...");

  // Check if the table already exists
  const tableExists = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'magic_link_tokens'
    );
  `);

  if (tableExists[0].exists) {
    console.log("magic_link_tokens table already exists");
    return;
  }

  // Create the table
  await db.execute(sql`
    CREATE TABLE magic_link_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      user_agent TEXT,
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Index for faster token lookups
    CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token);
    
    -- Index for querying by user ID
    CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens(user_id);
  `);

  console.log("Created magic_link_tokens table successfully");
}