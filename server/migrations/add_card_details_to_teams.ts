import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

/**
 * Migration to add card details columns to teams table
 * This allows tracking payment method details like card brand and last 4 digits
 */
export async function addCardDetailsToTeams() {
  console.log("Starting migration to add card details columns to teams table...");

  try {
    // Check if columns already exist to avoid errors
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    
    const columns = tableInfo.rows.map((row: any) => row.column_name);
    
    // Add the card_last_four column if it doesn't exist
    if (!columns.includes('card_last_four')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN card_last_four TEXT
      `);
      console.log("Added card_last_four column to teams table");
    }
    
    // Add the card_brand column if it doesn't exist
    if (!columns.includes('card_brand')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN card_brand TEXT
      `);
      console.log("Added card_brand column to teams table");
    }
    
    // Add the payment_method_type column if it doesn't exist
    if (!columns.includes('payment_method_type')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN payment_method_type TEXT
      `);
      console.log("Added payment_method_type column to teams table");
    }
    
    // Add the payment_error_code column if it doesn't exist
    if (!columns.includes('payment_error_code')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN payment_error_code TEXT
      `);
      console.log("Added payment_error_code column to teams table");
    }
    
    // Add the payment_error_message column if it doesn't exist
    if (!columns.includes('payment_error_message')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN payment_error_message TEXT
      `);
      console.log("Added payment_error_message column to teams table");
    }
    
    // Add the payment_date column if it doesn't exist
    if (!columns.includes('payment_date')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN payment_date TIMESTAMP
      `);
      console.log("Added payment_date column to teams table");
    }
    
    console.log("Migration complete: card details columns added successfully");
    return true;
  } catch (error) {
    console.error("Error adding card details columns:", error);
    return false;
  }
}

// If this file is run directly (not imported)
// Using import.meta.url check for ES modules
if (import.meta.url === `file://${process.argv[1]}`) {
  addCardDetailsToTeams()
    .then(() => {
      console.log('Card details columns migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}