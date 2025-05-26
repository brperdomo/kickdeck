/**
 * Fix All Duplicate Age Groups System-Wide
 * 
 * This script identifies and consolidates duplicate age groups across all events
 * while preserving team registrations. It safely moves teams from duplicate
 * age groups to the original ones before removing the duplicates.
 */

const { db } = require('./db');
const { eventAgeGroups, teams } = require('./db/schema');
const { eq, sql } = require('drizzle-orm');

async function consolidateDuplicateAgeGroups() {
  console.log('🔍 Starting system-wide age group duplicate cleanup...\n');

  try {
    // Get all duplicate age groups with their team counts
    const duplicatesQuery = await db.execute(sql`
      SELECT 
        event_id,
        age_group, 
        gender,
        division_code,
        array_agg(id ORDER BY created_at ASC) as age_group_ids,
        array_agg((
          SELECT COUNT(*) 
          FROM teams t 
          WHERE t.age_group_id = eag.id
        ) ORDER BY created_at ASC) as team_counts
      FROM event_age_groups eag
      GROUP BY event_id, age_group, gender, division_code
      HAVING COUNT(*) > 1
      ORDER BY event_id, age_group, gender
    `);

    if (duplicatesQuery.length === 0) {
      console.log('✅ No duplicate age groups found!');
      return;
    }

    console.log(`Found ${duplicatesQuery.length} sets of duplicate age groups to consolidate\n`);

    let totalTeamsMoved = 0;
    let totalDuplicatesRemoved = 0;

    for (const duplicate of duplicatesQuery) {
      const { event_id, age_group, gender, division_code, age_group_ids, team_counts } = duplicate;
      
      console.log(`📋 Processing ${age_group} ${gender} (${division_code}) in event ${event_id}`);
      console.log(`   Found ${age_group_ids.length} duplicates with teams: [${team_counts.join(', ')}]`);

      // The first age group (oldest) becomes the target to keep
      const targetAgeGroupId = age_group_ids[0];
      const duplicateIds = age_group_ids.slice(1);

      console.log(`   🎯 Keeping age group ID ${targetAgeGroupId} as primary`);

      // Move all teams from duplicate age groups to the target
      for (let i = 0; i < duplicateIds.length; i++) {
        const duplicateId = duplicateIds[i];
        const teamCount = team_counts[i + 1]; // +1 because team_counts includes the target

        if (teamCount > 0) {
          console.log(`   📦 Moving ${teamCount} teams from duplicate ID ${duplicateId} to primary ID ${targetAgeGroupId}`);
          
          const result = await db
            .update(teams)
            .set({ ageGroupId: targetAgeGroupId })
            .where(eq(teams.ageGroupId, duplicateId));

          totalTeamsMoved += teamCount;
        }
      }

      // Delete the empty duplicate age groups
      console.log(`   🗑️  Removing ${duplicateIds.length} duplicate age groups`);
      
      for (const duplicateId of duplicateIds) {
        await db
          .delete(eventAgeGroups)
          .where(eq(eventAgeGroups.id, duplicateId));
      }

      totalDuplicatesRemoved += duplicateIds.length;
      console.log(`   ✅ Completed ${age_group} ${gender} cleanup\n`);
    }

    console.log('🎉 System-wide cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   • Teams moved: ${totalTeamsMoved}`);
    console.log(`   • Duplicate age groups removed: ${totalDuplicatesRemoved}`);
    console.log(`   • Events affected: ${new Set(duplicatesQuery.map(d => d.event_id)).size}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup results...');
  
  const remainingDuplicates = await db.execute(sql`
    SELECT 
      event_id,
      age_group, 
      gender,
      division_code,
      COUNT(*) as duplicate_count
    FROM event_age_groups 
    GROUP BY event_id, age_group, gender, division_code
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
  `);

  if (remainingDuplicates.length === 0) {
    console.log('✅ No duplicate age groups remain - cleanup successful!');
  } else {
    console.log(`⚠️  ${remainingDuplicates.length} duplicate sets still exist:`);
    for (const dup of remainingDuplicates) {
      console.log(`   • Event ${dup.event_id}: ${dup.age_group} ${dup.gender} (${dup.duplicate_count} copies)`);
    }
  }
}

async function main() {
  try {
    await consolidateDuplicateAgeGroups();
    await verifyCleanup();
    console.log('\n🎯 Age group consolidation complete!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { consolidateDuplicateAgeGroups, verifyCleanup };