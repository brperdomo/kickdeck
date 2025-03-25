import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Creates the players table in the database
 */
export async function createPlayersTable() {
  console.log("Creating players table...");

  try {
    // Check if the table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'players'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log("Players table already exists");
      return true;
    }
    
    // Create the players table
    await db.execute(sql`
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        jersey_number INTEGER,
        date_of_birth TEXT,
        position TEXT,
        medical_notes TEXT,
        parent_guardian_name TEXT,
        parent_guardian_email TEXT,
        parent_guardian_phone TEXT,
        emergency_contact_name TEXT NOT NULL,
        emergency_contact_phone TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Players table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating players table:", error);
    return false;
  }
}

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createPlayersTable()
    .then(success => {
      console.log(`Players table creation ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("Unexpected error during players table creation:", error);
      process.exit(1);
    });
}