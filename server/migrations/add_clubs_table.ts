import { sql } from 'drizzle-orm';
import { db } from '@db';

/**
 * Migration to create clubs table
 */
export async function createClubsTable() {
  console.log('Starting migration to create clubs table...');
  
  try {
    // Check if table already exists to avoid errors
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clubs'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log("clubs table already exists");
      return true;
    }
    
    // Create the clubs table
    await db.execute(sql`
      CREATE TABLE clubs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("clubs table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating clubs table:", error);
    return false;
  }
}

// Execute migration if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createClubsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}