import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Migration to add payment_intent_id column to teams table
 * This allows tracking the Stripe payment intent ID for refunds
 */
export async function addPaymentIntentId() {
  console.log("Starting migration to add payment_intent_id column to teams table...");

  try {
    // Check if column already exists to avoid errors
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    
    const columns = tableInfo.rows.map((row: any) => row.column_name);
    
    // Add the payment_intent_id column if it doesn't exist
    if (!columns.includes('payment_intent_id')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN payment_intent_id TEXT
      `);
      console.log("Added payment_intent_id column to teams table");
    }
    
    // Add the refund_date column if it doesn't exist
    if (!columns.includes('refund_date')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN refund_date TEXT
      `);
      console.log("Added refund_date column to teams table");
    }
    
    console.log("Migration complete: payment_intent_id and refund_date columns added successfully");
    return true;
  } catch (error) {
    console.error("Error adding payment_intent_id column:", error);
    return false;
  }
}

// If this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  addPaymentIntentId()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}