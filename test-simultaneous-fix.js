// Test the critical simultaneous scheduling fix
const testSimultaneousSchedulingFix = async () => {
  console.log('=== Testing Simultaneous Scheduling Fix ===\n');
  
  // Test with ALBION SC teams that were causing conflicts
  const testData = {
    eventId: "999999",
    ageGroup: "U7 Boys", 
    gameFormat: "7v7",
    teams: [
      "ALBION SC Riverside B19 Academy",
      "Empire Surf B2019 A-1",
      "El7E select B2019", 
      "City sc southwest B2019"
    ],
    startDate: "2025-08-17",
    endDate: "2025-08-17", 
    operatingHours: {"start": "08:00", "end": "12:00"},
    gameDuration: 60
  };
  
  console.log('Sending request to Quick Scheduler...');
  console.log('Teams:', testData.teams);
  console.log('Expected: ALBION SC should NOT play multiple games simultaneously\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/quick-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Quick Scheduler completed successfully');
      console.log(`Generated ${result.gamesCount} games`);
      
      // Analyze the schedule for conflicts
      if (result.schedule && result.schedule.length > 0) {
        console.log('\n📋 Generated Schedule:');
        result.schedule.forEach((game, index) => {
          const time = new Date(game.scheduledTime).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          console.log(`${index + 1}. ${game.homeTeam} vs ${game.awayTeam} at ${time} (Field ${game.fieldId})`);
        });
        
        // Check for simultaneous conflicts
        console.log('\n🔍 Conflict Analysis:');
        const timeSlots = {};
        result.schedule.forEach(game => {
          const timeKey = game.scheduledTime;
          if (!timeSlots[timeKey]) timeSlots[timeKey] = [];
          timeSlots[timeKey].push({
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            fieldId: game.fieldId
          });
        });
        
        let conflictsFound = 0;
        Object.entries(timeSlots).forEach(([time, gamesAtTime]) => {
          if (gamesAtTime.length > 1) {
            console.log(`\n⏰ Games at ${new Date(time).toLocaleTimeString()}:`);
            
            const allTeams = [];
            gamesAtTime.forEach(game => {
              console.log(`   ${game.homeTeam} vs ${game.awayTeam} (Field ${game.fieldId})`);
              allTeams.push(game.homeTeam, game.awayTeam);
            });
            
            // Check for duplicate teams
            const uniqueTeams = [...new Set(allTeams)];
            if (allTeams.length !== uniqueTeams.length) {
              const duplicates = allTeams.filter((team, index) => allTeams.indexOf(team) !== index);
              console.log(`   ❌ CONFLICT: ${duplicates[0]} playing multiple games simultaneously!`);
              conflictsFound++;
            } else {
              console.log(`   ✅ No team conflicts at this time`);
            }
          }
        });
        
        if (conflictsFound === 0) {
          console.log('\n🎉 SUCCESS: No simultaneous scheduling conflicts found!');
          console.log('✅ ALBION SC teams are properly spaced');
          console.log('✅ All teams play one game at a time');
        } else {
          console.log(`\n❌ FAILURE: ${conflictsFound} simultaneous scheduling conflicts detected`);
          console.log('🔧 The fix needs more work');
        }
        
      } else {
        console.log('⚠️  No schedule details returned');
      }
      
      console.log(`\n📊 Scheduling Stats:`);
      console.log(`- Efficiency: ${result.schedulingEfficiency}%`);
      console.log(`- Fields used: ${result.fieldsUsed} (7v7 only)`);
      console.log(`- Compatible fields: ${result.compatibleFields.map(f => f.name).join(', ')}`);
      
    } else {
      console.log('❌ Quick Scheduler failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
};

testSimultaneousSchedulingFix();