/**
 * Add Field Size Column Migration Script
 * 
 * This script adds the field_size column to the fields table
 * to support field size assignment for games.
 */

const { db } = require("../../db");
const { sql } = require("drizzle-orm");

async function addFieldSizeColumn() {
  try {
    console.log("Starting migration to add field_size column to fields table...");
    
    // Check if the column already exists
    const { rows: columns } = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fields' AND column_name = 'field_size'
    `);
    
    if (columns.length === 0) {
      // Add the field_size column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE fields
        ADD COLUMN field_size TEXT DEFAULT '11v11'
      `);
      console.log("Added field_size column to fields table");
    } else {
      console.log("field_size column already exists in fields table");
    }
    
    console.log("Migration complete: field_size column added successfully");
    return true;
  } catch (error) {
    console.error("Error adding field_size column:", error);
    return false;
  }
}

// Execute the migration
addFieldSizeColumn().then((success) => {
  if (success) {
    console.log("Field size migration completed successfully");
  } else {
    console.error("Field size migration failed");
    process.exit(1);
  }
});