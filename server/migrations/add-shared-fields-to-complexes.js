/**
 * Migration: Add shared fields to complexes
 * 
 * This migration adds the shared_id and shared fields to the complexes table
 * to support cross-instance complex sharing and geolocation functionality.
 * 
 * It safely handles adding these columns to existing complexes.
 */

/**
 * Adds shared fields to complexes table
 * @param {Object} db - Drizzle database instance
 * @returns {Promise<void>}
 */
export async function addSharedFieldsToComplexes(db) {
  console.log('Running migration: addSharedFieldsToComplexes');
  
  try {
    // Get the database schema
    const result = await db.execute(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'complexes'`
    );
    
    const existingColumns = result.rows.map(row => row.column_name);
    
    // Check if shared_id column exists
    if (!existingColumns.includes('shared_id')) {
      console.log('Adding shared_id column to complexes table');
      await db.execute(
        `ALTER TABLE complexes 
         ADD COLUMN shared_id text UNIQUE`
      );
    } else {
      console.log('shared_id column already exists in complexes table');
    }
    
    // Check if shared column exists
    if (!existingColumns.includes('shared')) {
      console.log('Adding shared column to complexes table');
      await db.execute(
        `ALTER TABLE complexes 
         ADD COLUMN shared boolean DEFAULT false`
      );
    } else {
      console.log('shared column already exists in complexes table');
    }
    
    // Update existing complexes to generate shared_id values
    if (!existingColumns.includes('shared_id') || !existingColumns.includes('shared')) {
      console.log('Updating existing complexes with shared_id values');
      await db.execute(
        `UPDATE complexes 
         SET shared_id = 'complex_' || id || '_' || FLOOR(RANDOM() * 1000000000)::text
         WHERE shared_id IS NULL`
      );
    }
    
    console.log('Migration completed successfully: addSharedFieldsToComplexes');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}