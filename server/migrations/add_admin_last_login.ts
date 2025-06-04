import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Add last_login and last_viewed_registrations columns to the users table
 * 
 * This migration adds the columns needed to track when an admin last logged in
 * and when they last viewed team registrations notifications.
 */
export async function addAdminLastLoginFields() {
  try {
    console.log('Starting migration to add admin last login fields...');
    
    // Check if columns already exist to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = checkResult && checkResult.length > 0 ? checkResult.map((row: any) => row.column_name) : [];
    
    // Add the last_login column if it doesn't exist
    if (!columns.includes('last_login')) {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log("Added last_login column to users table");
    } else {
      console.log("last_login column already exists");
    }
    
    // Add the last_viewed_registrations column if it doesn't exist
    if (!columns.includes('last_viewed_registrations')) {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN last_viewed_registrations TIMESTAMP
      `);
      console.log("Added last_viewed_registrations column to users table");
    } else {
      console.log("last_viewed_registrations column already exists");
    }
    
    console.log("Migration complete: admin last login fields added successfully");
    return true;
  } catch (error) {
    console.error("Error adding admin last login fields:", error);
    throw error;
  }
}