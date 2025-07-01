/**
 * Demo Complete Scheduling Workflow
 * 
 * This script demonstrates the complete 6-step scheduling workflow by:
 * 1. Creating a flight with U17 teams
 * 2. Creating brackets for the flight
 * 3. Seeding the teams
 * 4. Setting time blocks
 * 5. Generating games
 * 6. Showing how games appear in Schedule Management
 */

const eventId = '1656618593'; // SCHEDULING TEAMS tournament

async function demoCompleteWorkflow() {
  console.log('🚀 Starting complete scheduling workflow demo...');
  
  try {
    // Step 1: Get approved teams for U17 age group
    console.log('📊 Fetching approved teams...');
    const teamsResponse = await fetch(`http://localhost:5000/api/admin/teams/approved/${eventId}`);
    const teamsData = await teamsResponse.json();
    
    if (!teamsData.teams || teamsData.teams.length === 0) {
      console.log('❌ No teams found. Using alternative API...');
      
      // Try alternative teams API
      const altResponse = await fetch(`http://localhost:5000/api/admin/events/${eventId}/teams`);
      const altData = await altResponse.json();
      console.log('📋 Teams found:', altData.length);
      
      // Filter for U17 teams
      const u17Teams = altData.filter(teamObj => {
        const team = teamObj.team || teamObj;
        return team.ageGroup && team.ageGroup.ageGroup && team.ageGroup.ageGroup.includes('U17');
      }).slice(0, 4); // Take first 4 U17 teams
      
      if (u17Teams.length === 0) {
        console.log('❌ No U17 teams found for demo');
        return;
      }
      
      console.log(`✅ Found ${u17Teams.length} U17 teams for demo`);
      
      // Step 2: Create flight with these teams
      console.log('🛫 Step 1: Creating flight...');
      const flightData = {
        flights: [{
          id: 'demo_flight_' + Date.now(),
          name: 'U17 Boys Demo Flight',
          ageGroup: 'U17 Boys',
          teams: u17Teams.map(teamObj => {
            const team = teamObj.team || teamObj;
            return {
              id: team.id,
              name: team.name,
              clubName: team.clubName || '',
              ageGroupId: team.ageGroupId
            };
          })
        }]
      };
      
      // Step 3: Create brackets for the flight
      console.log('🏆 Step 2: Creating brackets...');
      const bracketData = {
        brackets: [{
          id: 'demo_bracket_' + Date.now(),
          flightId: flightData.flights[0].id,
          flightName: flightData.flights[0].name,
          format: 'round_robin_knockout',
          teamCount: u17Teams.length,
          poolCount: 1
        }]
      };
      
      // Step 4: Create seeding
      console.log('🎯 Step 3: Seeding teams...');
      const seedingData = {
        bracketSeedings: [{
          bracketId: bracketData.brackets[0].id,
          bracketName: bracketData.brackets[0].flightName,
          teams: u17Teams.map((teamObj, index) => {
            const team = teamObj.team || teamObj;
            return {
              teamId: team.id,
              name: team.name,
              seedRanking: index + 1,
              poolAssignment: 'Pool A'
            };
          }),
          pools: [{
            poolId: 'pool_a_' + Date.now(),
            poolName: 'Pool A',
            teamIds: u17Teams.map(teamObj => (teamObj.team || teamObj).id)
          }]
        }]
      };
      
      // Step 5: Create time blocks
      console.log('⏰ Step 4: Setting time blocks...');
      const timeBlockData = {
        timeBlocks: [{
          id: 'demo_timeblock_' + Date.now(),
          name: 'Demo Time Block',
          startTime: '09:00',
          endTime: '17:00',
          gameDuration: 90,
          breakBetweenGames: 15
        }]
      };
      
      // Step 6: Generate games
      console.log('🎮 Step 5: Generating games...');
      const gameData = {
        generatedGames: [
          // Pool A games
          {
            id: 'demo_game_1',
            gameNumber: 1,
            homeTeam: u17Teams[0].team?.name || u17Teams[0].name,
            awayTeam: u17Teams[1].team?.name || u17Teams[1].name,
            bracket: 'U17 Boys Demo Flight',
            poolName: 'Pool A',
            round: 'Pool Play',
            startTime: new Date('2025-07-05T09:00:00').toISOString()
          },
          {
            id: 'demo_game_2',
            gameNumber: 2,
            homeTeam: u17Teams[2].team?.name || u17Teams[2].name,
            awayTeam: u17Teams[3].team?.name || u17Teams[3].name,
            bracket: 'U17 Boys Demo Flight',
            poolName: 'Pool A',
            round: 'Pool Play',
            startTime: new Date('2025-07-05T10:45:00').toISOString()
          }
        ]
      };
      
      // Save workflow data
      console.log('💾 Step 6: Saving workflow data...');
      const workflowData = {
        flight: flightData,
        bracket: bracketData,
        seed: seedingData,
        timeblock: timeBlockData,
        game: gameData
      };
      
      const saveResponse = await fetch(`http://localhost:5000/api/admin/events/${eventId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowData })
      });
      
      if (saveResponse.ok) {
        console.log('✅ Workflow saved successfully!');
        console.log('🎯 Demo complete! You should now see:');
        console.log('   - 2 games in Schedule Management');
        console.log('   - Drag and drop functionality working');
        console.log('   - Games ready to be assigned to fields and times');
        console.log('');
        console.log('📍 Navigate to Schedule Management to see the games!');
      } else {
        console.log('❌ Failed to save workflow');
      }
      
    } else {
      console.log('❌ No teams data structure found');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
demoCompleteWorkflow();