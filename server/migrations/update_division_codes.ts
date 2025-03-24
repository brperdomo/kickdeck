import { db } from "@db";
import { eventAgeGroups } from "@db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

/**
 * Migration to update all division codes to the new format (B2017, G2017, etc.)
 */
export async function updateDivisionCodes() {
  console.log("Starting migration to update division codes...");

  try {
    // Get age groups that need updating (don't have division code or division code doesn't match pattern)
    const ageGroupsWithoutCorrectDivisionCode = await db
      .select()
      .from(eventAgeGroups)
      .where(
        sql`division_code IS NULL OR division_code NOT SIMILAR TO '[BG][0-9]{4}'`
      );

    console.log(`Found ${ageGroupsWithoutCorrectDivisionCode.length} age groups to process`);

    // Age group batches using a mapping for standard birth years
    const birthYearMap: Record<string, number> = {
      'U4': 2021,
      'U5': 2020,
      'U6': 2019,
      'U7': 2018,
      'U8': 2017,
      'U9': 2016,
      'U10': 2015,
      'U11': 2014,
      'U12': 2013,
      'U13': 2012,
      'U14': 2011,
      'U15': 2010,
      'U16': 2009,
      'U17': 2008,
      'U18': 2007,
      'U19': 2006,
    };

    // Update groups by age group in batch
    let totalUpdated = 0;
    const batchSize = 50;
    
    // Process in batches to avoid timeouts
    for (let i = 0; i < ageGroupsWithoutCorrectDivisionCode.length; i += batchSize) {
      const batch = ageGroupsWithoutCorrectDivisionCode.slice(i, i + batchSize);
      
      // Process each group
      const updatePromises = batch.map(async (group) => {
        // Extract gender and birth year
        const genderPrefix = group.gender === 'Boys' ? 'B' : 'G';
        let birthYear: number | null = group.birthYear;

        // If birthYear is not available, try to extract it from ageGroup
        if (!birthYear && group.ageGroup && group.ageGroup.startsWith('U')) {
          const ageNum = parseInt(group.ageGroup.substring(1));
          if (!isNaN(ageNum)) {
            birthYear = birthYearMap[group.ageGroup] || (new Date().getFullYear() - ageNum);
          }
        }

        // If birthYear is still not available, use a default for test data
        if (!birthYear) {
          birthYear = birthYearMap[group.ageGroup];
          
          if (!birthYear) {
            console.log(`Could not determine birth year for age group ${group.ageGroup}, skipping id=${group.id}`);
            return null; // Skip this group
          }
        }

        // Create new division code
        const newDivisionCode = `${genderPrefix}${birthYear}`;

        // Update the age group
        return db
          .update(eventAgeGroups)
          .set({
            divisionCode: newDivisionCode,
            birthYear: birthYear
          })
          .where(eq(eventAgeGroups.id, group.id))
          .then(() => {
            console.log(`Updated: id=${group.id}, ${group.ageGroup}, ${group.gender}: ${group.divisionCode || 'null'} -> ${newDivisionCode}`);
            return true;
          });
      });

      // Wait for all updates in this batch to complete
      const results = await Promise.all(updatePromises);
      const batchUpdated = results.filter(Boolean).length;
      totalUpdated += batchUpdated;
      
      console.log(`Batch ${Math.floor(i/batchSize) + 1} complete. Updated ${batchUpdated} records.`);
    }

    console.log(`Migration complete. Updated ${totalUpdated} division codes.`);
    
    // Now query how many age groups still don't have proper division codes
    const remaining = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventAgeGroups)
      .where(
        sql`division_code IS NULL OR division_code NOT SIMILAR TO '[BG][0-9]{4}'`
      );
    
    console.log(`Remaining age groups without proper division codes: ${remaining[0]?.count || 0}`);
    
    return true;
  } catch (error) {
    console.error("Error updating division codes:", error);
    return false;
  }
}

// If this file is run directly (not imported)
// Using ESM check rather than CommonJS require.main === module check
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDivisionCodes()
    .then((success) => {
      console.log(`Division code migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unexpected error during migration:", error);
      process.exit(1);
    });
}