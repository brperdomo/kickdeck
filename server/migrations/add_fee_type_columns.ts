import { db } from "@db";
import { eventFees } from '@db/schema';
import { sql } from "drizzle-orm";
import { log } from "../vite-temp";

/**
 * Migration to add feeType and isRequired columns to event_fees table
 * This allows tracking multiple fee types and whether they are required
 */
export async function addFeeTypeColumns() {
  log("Starting migration to add feeType and isRequired columns to event_fees table...");
  
  try {
    // Check if columns already exist
    const hasColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_fees' 
      AND column_name IN ('fee_type', 'is_required')
    `);
    
    const existingColumns = hasColumns && hasColumns.length > 0 ? hasColumns.map((row: any) => row.column_name) : [];
    
    if (!existingColumns.includes('fee_type')) {
      // Add fee_type column
      await db.execute(sql`
        ALTER TABLE "event_fees" 
        ADD COLUMN "fee_type" text
      `);
      log("Added fee_type column to event_fees table");
      
      // Set default fee type for existing fees to 'registration'
      await db.execute(sql`
        UPDATE "event_fees" 
        SET "fee_type" = 'registration'
      `);
      log("Set default fee type to 'registration' for existing fees");
    } else {
      log("fee_type column already exists in event_fees table");
    }
    
    if (!existingColumns.includes('is_required')) {
      // Add is_required column
      await db.execute(sql`
        ALTER TABLE "event_fees" 
        ADD COLUMN "is_required" boolean DEFAULT false
      `);
      log("Added is_required column to event_fees table");
      
      // Set default value to true for existing fees (since they're likely registration fees)
      await db.execute(sql`
        UPDATE "event_fees" 
        SET "is_required" = true
      `);
      log("Set is_required to true for existing fees");
    } else {
      log("is_required column already exists in event_fees table");
    }
    
    log("Migration complete: feeType and isRequired columns added successfully");
  } catch (error) {
    log(`Error in migration: ${error}`, "error");
    throw error;
  }
}