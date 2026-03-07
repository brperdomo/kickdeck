import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * One-time migration to remove duplicate age group records.
 * Duplicates were created by a bug where the GET endpoint was auto-inserting
 * age groups from seasonal scope on every read.
 *
 * This keeps the record with the lowest ID for each unique
 * (event_id, age_group, gender, birth_year) combination.
 */
export async function deduplicateAgeGroups() {
  try {
    console.log('Checking for duplicate age group records...');

    // First, count duplicates
    const duplicateCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM event_age_groups
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM event_age_groups
        GROUP BY event_id, age_group, gender, birth_year
      )
    `);

    const count = Number(duplicateCount.rows?.[0]?.count || duplicateCount[0]?.count || 0);

    if (count === 0) {
      console.log('No duplicate age group records found.');
      return;
    }

    console.log(`Found ${count} duplicate age group records. Cleaning up...`);

    // Check if any of the duplicates have teams referencing them
    const duplicatesWithTeams = await db.execute(sql`
      SELECT eag.id, eag.event_id, eag.age_group, eag.gender, eag.birth_year, COUNT(t.id) as team_count
      FROM event_age_groups eag
      LEFT JOIN teams t ON t.age_group_id = eag.id
      WHERE eag.id NOT IN (
        SELECT MIN(id)
        FROM event_age_groups
        GROUP BY event_id, age_group, gender, birth_year
      )
      GROUP BY eag.id, eag.event_id, eag.age_group, eag.gender, eag.birth_year
      HAVING COUNT(t.id) > 0
    `);

    const teamsOnDuplicates = duplicatesWithTeams.rows?.length || duplicatesWithTeams.length || 0;

    if (teamsOnDuplicates > 0) {
      console.log(`Warning: ${teamsOnDuplicates} duplicate age groups have teams referencing them.`);
      console.log('Reassigning teams to the original (lowest-ID) records before deleting duplicates...');

      // Reassign teams from duplicate records to the original (lowest-ID) records
      await db.execute(sql`
        UPDATE teams t
        SET age_group_id = keeper.min_id
        FROM event_age_groups eag
        INNER JOIN (
          SELECT event_id, age_group, gender, birth_year, MIN(id) as min_id
          FROM event_age_groups
          GROUP BY event_id, age_group, gender, birth_year
        ) keeper ON eag.event_id = keeper.event_id
          AND eag.age_group = keeper.age_group
          AND eag.gender = keeper.gender
          AND eag.birth_year = keeper.birth_year
        WHERE t.age_group_id = eag.id
          AND eag.id != keeper.min_id
      `);

      console.log('Teams reassigned successfully.');
    }

    // Also check event_brackets
    const duplicatesWithBrackets = await db.execute(sql`
      SELECT eag.id, COUNT(eb.id) as bracket_count
      FROM event_age_groups eag
      LEFT JOIN event_brackets eb ON eb.age_group_id = eag.id
      WHERE eag.id NOT IN (
        SELECT MIN(id)
        FROM event_age_groups
        GROUP BY event_id, age_group, gender, birth_year
      )
      GROUP BY eag.id
      HAVING COUNT(eb.id) > 0
    `);

    const bracketsOnDuplicates = duplicatesWithBrackets.rows?.length || duplicatesWithBrackets.length || 0;

    if (bracketsOnDuplicates > 0) {
      console.log(`Warning: ${bracketsOnDuplicates} duplicate age groups have brackets referencing them.`);
      console.log('Reassigning brackets to the original records...');

      await db.execute(sql`
        UPDATE event_brackets eb
        SET age_group_id = keeper.min_id
        FROM event_age_groups eag
        INNER JOIN (
          SELECT event_id, age_group, gender, birth_year, MIN(id) as min_id
          FROM event_age_groups
          GROUP BY event_id, age_group, gender, birth_year
        ) keeper ON eag.event_id = keeper.event_id
          AND eag.age_group = keeper.age_group
          AND eag.gender = keeper.gender
          AND eag.birth_year = keeper.birth_year
        WHERE eb.age_group_id = eag.id
          AND eag.id != keeper.min_id
      `);

      console.log('Brackets reassigned successfully.');
    }

    // Now safe to delete duplicates
    const result = await db.execute(sql`
      DELETE FROM event_age_groups
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM event_age_groups
        GROUP BY event_id, age_group, gender, birth_year
      )
    `);

    console.log(`Deleted ${count} duplicate age group records.`);

    // Also clean up any records with NULL or empty age_group
    const nullCleanup = await db.execute(sql`
      DELETE FROM event_age_groups
      WHERE age_group IS NULL OR age_group = ''
    `);

    const nullCount = Number(nullCleanup.rowCount || 0);
    if (nullCount > 0) {
      console.log(`Also removed ${nullCount} age group records with NULL/empty age_group values.`);
    }

    console.log('Age group deduplication complete.');
  } catch (error) {
    console.error('Error during age group deduplication:', error);
    // Don't throw - this is a cleanup migration, shouldn't prevent server startup
  }
}
