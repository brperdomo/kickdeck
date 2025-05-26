/**
 * Age Group Protection Middleware
 * 
 * This middleware ensures that age groups with existing brackets or teams
 * are never deleted, preventing foreign key constraint violations.
 */

import { db } from "../../db/index.mjs";
import { sql } from "drizzle-orm";

/**
 * Get age groups that cannot be deleted due to foreign key constraints
 * @param {string|number} eventId - The event ID
 * @returns {Promise<number[]>} Array of age group IDs that cannot be deleted
 */
export async function getProtectedAgeGroups(eventId) {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT ag.id
      FROM event_age_groups ag
      LEFT JOIN event_brackets eb ON ag.id = eb.age_group_id
      LEFT JOIN teams t ON ag.id = t.age_group_id
      WHERE ag.event_id = ${eventId}
      AND (eb.id IS NOT NULL OR t.id IS NOT NULL)
    `);
    
    return result.rows.map(row => row.id);
  } catch (error) {
    console.error('Error getting protected age groups:', error);
    return [];
  }
}

/**
 * Check if an age group can be safely deleted
 * @param {number} ageGroupId - The age group ID
 * @returns {Promise<boolean>} True if the age group can be deleted
 */
export async function canDeleteAgeGroup(ageGroupId) {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as constraint_count
      FROM (
        SELECT 1 FROM event_brackets WHERE age_group_id = ${ageGroupId}
        UNION ALL
        SELECT 1 FROM teams WHERE age_group_id = ${ageGroupId}
      ) constraints
    `);
    
    return result.rows[0].constraint_count === 0;
  } catch (error) {
    console.error('Error checking if age group can be deleted:', error);
    return false; // Default to safe - don't delete
  }
}