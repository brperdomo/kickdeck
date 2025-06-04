/**
 * Create Registration Cart Table Migration
 * 
 * This script creates the registration_carts table to store incomplete
 * registration progress for users, allowing them to resume where they left off.
 */

import { db } from "@db";
import { sql } from "drizzle-orm";

async function createRegistrationCartTable() {
  console.log("Creating registration_carts table...");
  
  try {
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'registration_carts'
      );
    `);
    
    if (tableExists.rows[0]?.exists) {
      console.log("registration_carts table already exists");
      return true;
    }
    
    // Create the registration_carts table
    await db.execute(sql`
      CREATE TABLE registration_carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        form_data JSONB NOT NULL,
        current_step TEXT NOT NULL DEFAULT 'age-group',
        selected_age_group_id INTEGER REFERENCES event_age_groups(id),
        selected_bracket_id INTEGER REFERENCES event_brackets(id),
        selected_club_id INTEGER REFERENCES clubs(id),
        selected_fee_ids TEXT,
        total_amount INTEGER,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        UNIQUE(user_id, event_id)
      );
    `);
    
    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX idx_registration_carts_user_event ON registration_carts(user_id, event_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX idx_registration_carts_expires_at ON registration_carts(expires_at);
    `);
    
    console.log("registration_carts table created successfully");
    return true;
    
  } catch (error) {
    console.error("Error creating registration_carts table:", error);
    return false;
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRegistrationCartTable()
    .then((success) => {
      console.log(`Registration cart table migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unexpected error during migration:", error);
      process.exit(1);
    });
}

export { createRegistrationCartTable };