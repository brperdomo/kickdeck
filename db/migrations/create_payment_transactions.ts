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
    
    // Create the payment_transactions table without foreign key constraints first
    await db.execute(sql`
      CREATE TABLE payment_transactions (
        id SERIAL PRIMARY KEY,
        team_id INTEGER,
        event_id BIGINT,
        user_id INTEGER,
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
    
    // Add foreign key constraints separately to handle any type conversion issues
    try {
      await db.execute(sql`
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id);
      `);
      console.log("Added team_id foreign key constraint");
    } catch (error) {
      console.warn("Could not add team_id foreign key constraint:", error);
    }
    
    try {
      await db.execute(sql`
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES events(id);
      `);
      console.log("Added event_id foreign key constraint");
    } catch (error) {
      console.warn("Could not add event_id foreign key constraint:", error);
    }
    
    try {
      await db.execute(sql`
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id);
      `);
      console.log("Added user_id foreign key constraint");
    } catch (error) {
      console.warn("Could not add user_id foreign key constraint:", error);
    }
    
    console.log("payment_transactions table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating payment_transactions table:", error);
    return false;
  }
}

// For ES modules, we don't need to check if this is the main module
// The file will be imported by the migration system