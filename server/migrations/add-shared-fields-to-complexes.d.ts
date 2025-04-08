/**
 * TypeScript declaration file for add-shared-fields-to-complexes.js
 */

/**
 * Add shared_id and is_shared fields to complexes table.
 * This migration safely adds new fields without affecting existing data.
 * @param db The database connection instance
 */
export function addSharedFieldsToComplexes(db: any): Promise<void>;