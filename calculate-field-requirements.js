/**
 * Calculate Field Requirements for Empire Super Cup
 * Determines exact field types and quantities needed for successful scheduling
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const EVENT_ID = '1844329078'; // Empire Super Cup

async function calculateFieldRequirements() {
  console.log('📊 FIELD REQUIREMENTS ANALYSIS');
  console.log('===============================');
  console.log(`📅 Event: ${EVENT_ID} "Empire Super Cup"`);
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    return false;
  }
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Step 1: Analyze teams by age groups and field size requirements
    console.log('\n🏟️ STEP 1: FIELD SIZE REQUIREMENTS BY AGE GROUP');
    
    const ageGroupAnalysis = await sql`
      SELECT 
        eag.age_group,
        eag.gender,
        COUNT(t.id) as team_count,
        CASE 
          WHEN eag.age_group IN ('U7', 'U8') THEN '4v4'
          WHEN eag.age_group IN ('U9', 'U10') THEN '7v7'
          WHEN eag.age_group IN ('U11', 'U12') THEN '9v9'
          ELSE '11v11'
        END as required_field_size
      FROM teams t
      JOIN event_age_groups eag ON t.age_group_id = eag.id
      WHERE t.event_id = ${EVENT_ID} 
        AND t.status = 'approved'
      GROUP BY eag.age_group, eag.gender
      ORDER BY eag.age_group, eag.gender
    `;
    
    console.log('Age Group Breakdown:');
    let fieldSizeRequirements = {
      '4v4': { groups: 0, teams: 0 },
      '7v7': { groups: 0, teams: 0 },
      '9v9': { groups: 0, teams: 0 },
      '11v11': { groups: 0, teams: 0 }
    };
    
    ageGroupAnalysis.forEach(group => {
      console.log(`  ${group.age_group} ${group.gender}: ${group.team_count} teams → ${group.required_field_size} fields`);
      fieldSizeRequirements[group.required_field_size].groups++;
      fieldSizeRequirements[group.required_field_size].teams += parseInt(group.team_count);
    });
    
    // Step 2: Calculate games per age group (simplified round-robin)
    console.log('\n⚽ STEP 2: GAMES CALCULATION');
    
    let totalGamesByFieldSize = {
      '4v4': 0,
      '7v7': 0,
      '9v9': 0,
      '11v11': 0
    };
    
    console.log('Games per Age Group:');
    ageGroupAnalysis.forEach(group => {
      const teams = parseInt(group.team_count);
      // For small groups: round-robin, for large groups: sample games
      const games = teams <= 4 ? Math.floor(teams * (teams - 1) / 2) : Math.min(teams, 6);
      
      console.log(`  ${group.age_group} ${group.gender}: ${teams} teams → ${games} games (${group.required_field_size})`);
      totalGamesByFieldSize[group.required_field_size] += games;
    });
    
    console.log('\nTotal Games by Field Size:');
    Object.entries(totalGamesByFieldSize).forEach(([size, games]) => {
      console.log(`  ${size} fields: ${games} games`);
    });
    
    // Step 3: Calculate field capacity requirements
    console.log('\n📅 STEP 3: FIELD CAPACITY ANALYSIS');
    
    // Tournament parameters
    const tournamentDays = 2;
    const operatingHoursPerDay = 12; // 8 AM to 8 PM
    const gameLength = 90; // minutes
    const bufferTime = 30; // minutes between games
    const timePerGame = gameLength + bufferTime; // 120 minutes total
    
    const gamesPerFieldPerDay = Math.floor((operatingHoursPerDay * 60) / timePerGame);
    const totalTimeSlotsAvailable = gamesPerFieldPerDay * tournamentDays;
    
    console.log(`⏰ Operating Parameters:`);
    console.log(`  Tournament Days: ${tournamentDays}`);
    console.log(`  Operating Hours/Day: ${operatingHoursPerDay} hours`);
    console.log(`  Game Length: ${gameLength} minutes`);
    console.log(`  Buffer Time: ${bufferTime} minutes`);
    console.log(`  Games per Field per Day: ${gamesPerFieldPerDay}`);
    console.log(`  Total Time Slots per Field: ${totalTimeSlotsAvailable}`);
    
    // Step 4: Calculate required fields by size
    console.log('\n🏟️ STEP 4: REQUIRED FIELDS CALCULATION');
    
    const requiredFields = {};
    let totalFieldsNeeded = 0;
    
    Object.entries(totalGamesByFieldSize).forEach(([size, games]) => {
      if (games > 0) {
        const fieldsNeeded = Math.ceil(games / totalTimeSlotsAvailable);
        requiredFields[size] = fieldsNeeded;
        totalFieldsNeeded += fieldsNeeded;
        
        console.log(`${size} Fields Required: ${fieldsNeeded} fields (${games} games ÷ ${totalTimeSlotsAvailable} slots)`);
      }
    });
    
    console.log(`\nTOTAL FIELDS NEEDED: ${totalFieldsNeeded} fields`);
    
    // Step 5: Check current field availability
    console.log('\n🏟️ STEP 5: CURRENT FIELD AVAILABILITY');
    
    const [eventData] = await sql`
      SELECT name, start_date, end_date FROM events WHERE id = ${EVENT_ID}
    `;
    
    const currentFields = await sql`
      SELECT 
        f.id,
        f.name,
        f.field_size,
        c.name as complex_name
      FROM fields f
      JOIN complexes c ON f.complex_id = c.id
      JOIN event_complexes ec ON c.id = ec.complex_id
      WHERE ec.event_id = ${EVENT_ID}
      ORDER BY f.field_size, f.name
    `;
    
    console.log(`Current Fields Available (${currentFields.length} total):`);
    
    let currentFieldsBySize = {
      '4v4': 0,
      '7v7': 0,
      '9v9': 0,
      '11v11': 0
    };
    
    currentFields.forEach(field => {
      console.log(`  ${field.name} (${field.field_size}) at ${field.complex_name}`);
      if (field.field_size in currentFieldsBySize) {
        currentFieldsBySize[field.field_size]++;
      }
    });
    
    console.log('\nCurrent Fields by Size:');
    Object.entries(currentFieldsBySize).forEach(([size, count]) => {
      console.log(`  ${size}: ${count} fields available`);
    });
    
    // Step 6: Gap analysis and recommendations
    console.log('\n📊 STEP 6: GAP ANALYSIS & RECOMMENDATIONS');
    
    let canSchedule = true;
    let recommendations = [];
    
    Object.entries(requiredFields).forEach(([size, needed]) => {
      const available = currentFieldsBySize[size] || 0;
      const gap = needed - available;
      
      if (gap > 0) {
        canSchedule = false;
        console.log(`❌ ${size}: Need ${needed}, Have ${available}, GAP: ${gap} fields`);
        recommendations.push(`Add ${gap} additional ${size} field(s)`);
      } else {
        console.log(`✅ ${size}: Need ${needed}, Have ${available}, SURPLUS: ${available - needed} fields`);
      }
    });
    
    if (canSchedule) {
      console.log('\n🎉 SUCCESS: Current fields are sufficient for tournament!');
    } else {
      console.log('\n⚠️  INSUFFICIENT FIELDS: Additional fields needed');
      console.log('\n🛠️  RECOMMENDATIONS:');
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    // Step 7: Additional setup requirements
    console.log('\n🔧 STEP 7: ADDITIONAL SETUP REQUIREMENTS');
    
    // Check for game metadata setup
    const gameMetadata = await sql`
      SELECT COUNT(*) as count FROM event_game_formats WHERE event_id = ${EVENT_ID}
    `;
    
    // Check for schedule constraints
    const scheduleConstraints = await sql`
      SELECT COUNT(*) as count FROM event_schedule_constraints WHERE event_id = ${EVENT_ID}
    `;
    
    console.log('Setup Checklist:');
    console.log(`  ✅ Teams: ${ageGroupAnalysis.reduce((sum, g) => sum + parseInt(g.team_count), 0)} approved teams`);
    console.log(`  ${gameMetadata[0].count > 0 ? '✅' : '❌'} Game Metadata: ${gameMetadata[0].count} formats configured`);
    console.log(`  ${scheduleConstraints[0].count > 0 ? '✅' : '❌'} Schedule Constraints: ${scheduleConstraints[0].count} constraints configured`);
    console.log(`  ${canSchedule ? '✅' : '❌'} Field Capacity: ${canSchedule ? 'Sufficient' : 'Insufficient'}`);
    
    return {
      canSchedule,
      requiredFields,
      currentFields: currentFieldsBySize,
      recommendations,
      totalGames: Object.values(totalGamesByFieldSize).reduce((sum, games) => sum + games, 0),
      setupComplete: gameMetadata[0].count > 0 && scheduleConstraints[0].count > 0
    };
    
  } catch (error) {
    console.error('\n💥 ERROR:', error);
    return false;
  }
}

// Execute the field requirements analysis
calculateFieldRequirements().then(result => {
  if (result && result.canSchedule && result.setupComplete) {
    console.log('\n🚀 READY FOR SCHEDULE GENERATION!');
    console.log('All requirements met - tournament can be scheduled successfully');
  } else if (result) {
    console.log('\n⚠️  SETUP INCOMPLETE - Additional configuration needed');
    if (!result.canSchedule) {
      console.log('- Additional fields required (see recommendations above)');
    }
    if (!result.setupComplete) {
      console.log('- Game metadata and schedule constraints need configuration');
    }
  } else {
    console.log('\n❌ ANALYSIS FAILED - Unable to determine requirements');
  }
  process.exit(result && result.canSchedule && result.setupComplete ? 0 : 1);
}).catch(console.error);