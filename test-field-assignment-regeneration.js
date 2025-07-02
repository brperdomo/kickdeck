/**
 * Test Field Assignment by Regenerating Schedule
 * 
 * This script regenerates the schedule to verify that games
 * now get proper field IDs assigned in the database.
 */

async function testFieldAssignmentRegeneration() {
  console.log('🧪 Testing field assignment by regenerating schedule...');
  
  const eventId = "1656618593"; // The "SCHEDULING TEAMS" tournament
  
  // Import SimpleScheduler
  const { SimpleScheduler } = await import('./server/services/simple-scheduler.js');
  
  // Create test workflow data similar to what comes from the frontend
  const testWorkflowData = {
    workflowGames: [
      {
        bracketId: "flight_test_u17_boys",
        bracketName: "U17 Boys Flight A",
        format: "pool_play",
        games: [
          {
            id: "game_1",
            homeTeamId: 419,
            homeTeamName: "Team 419",
            awayTeamId: 420,
            awayTeamName: "Team 420",
            round: "Pool Play",
            gameType: "pool_play",
            duration: 90
          },
          {
            id: "game_2", 
            homeTeamId: 423,
            homeTeamName: "Team 423",
            awayTeamId: 424,
            awayTeamName: "Team 424",
            round: "Pool Play",
            gameType: "pool_play",
            duration: 90
          }
        ]
      }
    ]
  };
  
  console.log('🎯 Generating schedule with field assignment fix...');
  
  try {
    const scheduleResult = await SimpleScheduler.generateSchedule(eventId, testWorkflowData, {
      minRestPeriod: 90,
      minutesPerGame: 90,
      breakBetweenGames: 15
    });
    
    console.log(`✅ Successfully generated ${scheduleResult.games.length} games`);
    
    // Check if games have field IDs assigned
    console.log('\n🔍 Checking field assignments:');
    scheduleResult.games.forEach((game, index) => {
      console.log(`  Game ${index + 1}: ${game.homeTeamName} vs ${game.awayTeamName}`);
      console.log(`    → Field ID: ${game.fieldId}`);
      console.log(`    → Field Name: ${game.field}`);
      console.log(`    → Complex: ${game.complexName}`);
      
      if (game.fieldId) {
        console.log(`    ✅ Field ID assigned correctly`);
      } else {
        console.log(`    ❌ No field ID assigned`);
      }
    });
    
    console.log('\n📊 Summary:');
    const gamesWithFieldId = scheduleResult.games.filter(g => g.fieldId).length;
    const gamesWithFieldName = scheduleResult.games.filter(g => g.field && g.field !== 'Field 1').length;
    
    console.log(`- ${gamesWithFieldId}/${scheduleResult.games.length} games have field IDs`);
    console.log(`- ${gamesWithFieldName}/${scheduleResult.games.length} games have field names`);
    
    if (gamesWithFieldId === scheduleResult.games.length) {
      console.log('✅ FIELD ASSIGNMENT FIX WORKING: All games have field IDs');
      console.log('✅ Games should now appear as assigned in Step 7 interface');
    } else {
      console.log('❌ FIELD ASSIGNMENT ISSUE: Some games missing field IDs');
    }
    
  } catch (error) {
    console.error('❌ Error during schedule generation:', error.message);
  }
}

testFieldAssignmentRegeneration().catch(console.error);