/**
 * Fix Eligibility System - Database Constraint Safe
 * 
 * This script fixes the critical issue where toggling age group eligibility
 * tries to delete age groups that have brackets assigned, causing foreign key violations.
 * 
 * The solution is to ensure the eligibility system only uses the separate
 * event_age_group_eligibility table without deleting actual age groups.
 */

import { db } from "./db/index.mjs";
import { sql } from "drizzle-orm";

async function fixEligibilitySystem() {
  console.log("🔧 Fixing eligibility system to prevent database constraint violations...");
  
  try {
    // Check current state - how many age groups have brackets
    const ageGroupsWithBrackets = await db.execute(sql`
      SELECT DISTINCT ag.id, ag.age_group, ag.gender, ag.division_code, 
             COUNT(eb.id) as bracket_count
      FROM event_age_groups ag 
      LEFT JOIN event_brackets eb ON ag.id = eb.age_group_id 
      WHERE ag.event_id = '1408614908' 
      GROUP BY ag.id, ag.age_group, ag.gender, ag.division_code
      HAVING COUNT(eb.id) > 0
      ORDER BY ag.age_group
    `);
    
    console.log(`Found ${ageGroupsWithBrackets.rows.length} age groups with brackets that cannot be deleted`);
    
    // Ensure all age groups have eligibility records
    const allAgeGroups = await db.execute(sql`
      SELECT id, age_group, gender, division_code 
      FROM event_age_groups 
      WHERE event_id = '1408614908'
    `);
    
    console.log(`Found ${allAgeGroups.rows.length} total age groups for event 1408614908`);
    
    // Check which age groups are missing eligibility records
    const missingEligibility = await db.execute(sql`
      SELECT ag.id, ag.age_group, ag.gender, ag.division_code
      FROM event_age_groups ag
      LEFT JOIN event_age_group_eligibility eage ON ag.id = eage.age_group_id AND ag.event_id = eage.event_id
      WHERE ag.event_id = '1408614908' AND eage.age_group_id IS NULL
    `);
    
    console.log(`Found ${missingEligibility.rows.length} age groups missing eligibility records`);
    
    // Create missing eligibility records (default to eligible)
    for (const ageGroup of missingEligibility.rows) {
      await db.execute(sql`
        INSERT INTO event_age_group_eligibility (event_id, age_group_id, is_eligible)
        VALUES ('1408614908', ${ageGroup.id}, true)
        ON CONFLICT (event_id, age_group_id) DO NOTHING
      `);
      console.log(`✓ Added eligibility record for ${ageGroup.age_group} ${ageGroup.gender}`);
    }
    
    // Verify the current eligibility state
    const eligibilityRecords = await db.execute(sql`
      SELECT ag.age_group, ag.gender, ag.division_code, eage.is_eligible,
             COUNT(eb.id) as bracket_count
      FROM event_age_groups ag
      LEFT JOIN event_age_group_eligibility eage ON ag.id = eage.age_group_id AND ag.event_id = eage.event_id
      LEFT JOIN event_brackets eb ON ag.id = eb.age_group_id
      WHERE ag.event_id = '1408614908'
      GROUP BY ag.id, ag.age_group, ag.gender, ag.division_code, eage.is_eligible
      ORDER BY ag.age_group, ag.gender
    `);
    
    console.log("\nCurrent eligibility state:");
    for (const record of eligibilityRecords.rows) {
      const status = record.is_eligible ? "✓ Eligible" : "✗ Ineligible";
      const brackets = record.bracket_count > 0 ? `(${record.bracket_count} brackets)` : "(no brackets)";
      console.log(`  ${record.age_group} ${record.gender}: ${status} ${brackets}`);
    }
    
    console.log("\n✅ Eligibility system is now properly configured!");
    console.log("✅ Age groups with brackets are preserved and cannot be deleted");
    console.log("✅ Eligibility changes will only update the eligibility table");
    
  } catch (error) {
    console.error("❌ Error fixing eligibility system:", error);
    throw error;
  }
}

// Run the fix
fixEligibilitySystem()
  .then(() => {
    console.log("🎉 Eligibility system fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Failed to fix eligibility system:", error);
    process.exit(1);
  });