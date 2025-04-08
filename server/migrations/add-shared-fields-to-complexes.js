/**
 * Add shared_id and is_shared fields to complexes table
 * This migration safely adds the new fields without affecting existing data
 */

/**
 * Check if a column exists in a table
 * @param {Object} db - Database connection
 * @param {string} table - Table name
 * @param {string} column - Column name to check
 * @returns {Promise<boolean>} - True if column exists
 */
async function checkIfColumnExists(db, table, column) {
  try {
    const result = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `, [table, column]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${column} exists in table ${table}:`, error);
    return false;
  }
}

/**
 * Add shared_id and is_shared fields to complexes table
 * @param {Object} db - Database connection
 * @returns {Promise<void>}
 */
export async function addSharedFieldsToComplexes(db) {
  console.log("Running migration: Add shared fields to complexes");
  
  try {
    // Check if shared_id column exists
    const sharedIdExists = await checkIfColumnExists(db, 'complexes', 'shared_id');
    
    if (!sharedIdExists) {
      console.log("Adding shared_id column to complexes table");
      await db.query(`
        ALTER TABLE complexes 
        ADD COLUMN shared_id TEXT DEFAULT NULL
      `);
    } else {
      console.log("shared_id column already exists in complexes table");
    }
    
    // Check if is_shared column exists
    const isSharedExists = await checkIfColumnExists(db, 'complexes', 'is_shared');
    
    if (!isSharedExists) {
      console.log("Adding is_shared column to complexes table");
      await db.query(`
        ALTER TABLE complexes 
        ADD COLUMN is_shared BOOLEAN DEFAULT FALSE
      `);
    } else {
      console.log("is_shared column already exists in complexes table");
    }
    
    console.log("Migration complete: Add shared fields to complexes");
  } catch (error) {
    console.error("Error running migration: Add shared fields to complexes", error);
    throw error;
  }
}