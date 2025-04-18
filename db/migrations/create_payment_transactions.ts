import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Migration to create payment_transactions table
 * This table tracks all payment-related transactions with complete history
 */
export async function createPaymentTransactionsTable() {
  console.log("Starting migration to create payment_transactions table...");

  try {
    // Check if table already exists to avoid errors
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_transactions'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log("payment_transactions table already exists");
      return true;
    }
    
    // Create the payment_transactions table
    await db.execute(sql`
      CREATE TABLE payment_transactions (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        event_id TEXT REFERENCES events(id),
        user_id INTEGER REFERENCES users(id),
        payment_intent_id TEXT,
        transaction_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        card_brand TEXT,
        card_last_four TEXT,
        payment_method_type TEXT,
        error_code TEXT,
        error_message TEXT,
        metadata JSONB,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("payment_transactions table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating payment_transactions table:", error);
    return false;
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  createPaymentTransactionsTable()
    .then(() => process.exit(0))
    .catch(error => {
      console.error("Error:", error);
      process.exit(1);
    });
}