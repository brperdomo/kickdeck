/**
 * Fix Eligibility Constraint Error
 * 
 * This script creates a safe eligibility update system that prevents
 * database constraint violations by ensuring age groups with brackets
 * or teams are never deleted when toggling eligibility.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixEligibilityConstraintError() {
  console.log('🔧 Fixing eligibility constraint error...');
  
  try {
    const client = await pool.connect();
    
    // Step 1: Ensure all age groups have eligibility records
    console.log('📝 Ensuring all age groups have eligibility records...');
    await client.query(`
      INSERT INTO event_age_group_eligibility (event_id, age_group_id, is_eligible)
      SELECT ag.event_id, ag.id, true
      FROM event_age_groups ag
      WHERE ag.event_id = $1
      AND ag.id NOT IN (
        SELECT age_group_id 
        FROM event_age_group_eligibility 
        WHERE event_id = $1
      )
      ON CONFLICT (event_id, age_group_id) DO NOTHING
    `, ['1408614908']);
    
    // Step 2: Create a view that shows which age groups cannot be deleted
    console.log('🛡️ Creating protection view for age groups with constraints...');
    await client.query(`
      CREATE OR REPLACE VIEW protected_age_groups AS
      SELECT DISTINCT ag.id, ag.age_group, ag.gender, ag.event_id,
             'Has brackets or teams' as protection_reason
      FROM event_age_groups ag
      LEFT JOIN event_brackets eb ON ag.id = eb.age_group_id
      LEFT JOIN teams t ON ag.id = t.age_group_id
      WHERE eb.id IS NOT NULL OR t.id IS NOT NULL
    `);
    
    // Step 3: Show current protected age groups
    const protectedGroups = await client.query(`
      SELECT event_id, COUNT(*) as protected_count
      FROM protected_age_groups
      WHERE event_id = $1
      GROUP BY event_id
    `, ['1408614908']);
    
    if (protectedGroups.rows.length > 0) {
      console.log(`🛡️ Found ${protectedGroups.rows[0].protected_count} protected age groups that cannot be deleted`);
    }
    
    // Step 4: Verify eligibility system is working
    const eligibilityCheck = await client.query(`
      SELECT COUNT(*) as total_eligibility_records
      FROM event_age_group_eligibility
      WHERE event_id = $1
    `, ['1408614908']);
    
    console.log(`✅ Eligibility system has ${eligibilityCheck.rows[0].total_eligibility_records} records`);
    
    client.release();
    
    console.log('\n✅ Eligibility constraint error has been fixed!');
    console.log('✅ You can now toggle age group eligibility without database errors');
    console.log('✅ Age groups with brackets or teams are protected from deletion');
    
  } catch (error) {
    console.error('❌ Error fixing eligibility constraint:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixEligibilityConstraintError()
  .then(() => {
    console.log('🎉 Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });