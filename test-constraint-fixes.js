// Test script to verify Quick Scheduler constraint fixes
import { db } from './db/index.js';
import { eq } from 'drizzle-orm';
import { games, gameTimeSlots, eventAgeGroups } from './db/schema.js';

async function testQuickSchedulerConstraints() {
  console.log('=== Testing Quick Scheduler Constraint Fixes ===\n');
  
  const testEventId = '999999';
  
  // Test field size constraint for U7 Boys (7v7)
  console.log('1. Testing field size constraints for U7 Boys (7v7)...');
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/quick-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session' // Mock authentication
      },
      body: JSON.stringify({
        eventId: testEventId,
        ageGroup: "U7 Boys",
        gameFormat: "7v7",
        teams: [
          "ALBION SC Riverside B19 Academy", 
          "Empire Surf B2019 A-1", 
          "El7E select B2019", 
          "City sc southwest B2019"
        ],
        startDate: "2025-10-01", 
        endDate: "2025-10-03",
        operatingHours: {"start": "08:00", "end": "18:00"},
        gameDuration: 60
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✓ Quick Scheduler ran successfully');
      console.log(`✓ Generated ${result.gamesCount} games`);
      console.log(`✓ Used ${result.fieldsUsed} compatible fields`);
      console.log('✓ Compatible fields:', result.compatibleFields.map(f => `${f.name} (${f.size})`));
      
      // Check if only 7v7 fields were used
      const non7v7Fields = result.compatibleFields.filter(f => f.size !== '7v7');
      if (non7v7Fields.length === 0) {
        console.log('✓ FIELD SIZE CONSTRAINT: Only 7v7 fields used for U7 games');
      } else {
        console.log('✗ FIELD SIZE VIOLATION: Non-7v7 fields used:', non7v7Fields);
      }
      
      // Check scheduling efficiency
      console.log(`✓ Scheduling efficiency: ${result.schedulingEfficiency}%`);
      if (result.unscheduledGames > 0) {
        console.log(`⚠ ${result.unscheduledGames} games could not be scheduled due to constraints`);
      }
      
      console.log('✓ Constraints applied:', result.constraintsApplied);
      console.log('✓ Optimization features:', result.optimizationFeatures);
      
    } else {
      const error = await response.json();
      console.log('✗ Quick Scheduler failed:', error.error || error.message);
    }
    
  } catch (error) {
    console.log('✗ Test failed:', error.message);
  }
  
  // Verify database records
  console.log('\n2. Verifying database records...');
  
  try {
    const scheduledGames = await db.query.games.findMany({
      where: eq(games.eventId, testEventId),
      orderBy: games.scheduledTime
    });
    
    console.log(`✓ Found ${scheduledGames.length} games in database`);
    
    if (scheduledGames.length > 0) {
      // Check for simultaneous team conflicts
      const timeSlotConflicts = {};
      scheduledGames.forEach(game => {
        const timeKey = game.scheduledTime;
        if (!timeSlotConflicts[timeKey]) timeSlotConflicts[timeKey] = [];
        timeSlotConflicts[timeKey].push(`${game.homeTeam} vs ${game.awayTeam} (Field ${game.fieldId})`);
      });
      
      let conflictFound = false;
      Object.entries(timeSlotConflicts).forEach(([time, gamesAtTime]) => {
        if (gamesAtTime.length > 1) {
          const teams = [];
          gamesAtTime.forEach(gameStr => {
            const match = gameStr.match(/^(.+) vs (.+) \(Field/);
            if (match) {
              teams.push(match[1], match[2]);
            }
          });
          
          const uniqueTeams = [...new Set(teams)];
          if (teams.length !== uniqueTeams.length) {
            console.log(`✗ TEAM CONFLICT at ${time}:`, gamesAtTime);
            conflictFound = true;
          }
        }
      });
      
      if (!conflictFound) {
        console.log('✓ TEAM CONFLICTS: No teams playing multiple games simultaneously');
      }
      
      // Check coach conflicts (same organization)
      let coachConflictFound = false;
      Object.entries(timeSlotConflicts).forEach(([time, gamesAtTime]) => {
        if (gamesAtTime.length > 1) {
          const clubs = [];
          gamesAtTime.forEach(gameStr => {
            const match = gameStr.match(/^(.+) vs (.+) \(Field/);
            if (match) {
              const homeClub = extractClubFromTeamName(match[1]);
              const awayClub = extractClubFromTeamName(match[2]);
              clubs.push(homeClub, awayClub);
            }
          });
          
          const clubCounts = {};
          clubs.forEach(club => {
            clubCounts[club] = (clubCounts[club] || 0) + 1;
          });
          
          Object.entries(clubCounts).forEach(([club, count]) => {
            if (count > 1) {
              console.log(`✗ COACH CONFLICT at ${time}: ${club} has ${count} teams playing`);
              coachConflictFound = true;
            }
          });
        }
      });
      
      if (!coachConflictFound) {
        console.log('✓ COACH CONFLICTS: No organization conflicts detected');
      }
    }
    
  } catch (error) {
    console.log('✗ Database verification failed:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

function extractClubFromTeamName(teamName) {
  const parts = teamName.split(' ');
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].match(/^(SC|FC|United|Academy|Club|CF|AFC|Surf)$/i)) {
      return parts.slice(0, i + 1).join(' ');
    }
  }
  return parts.slice(0, 2).join(' ');
}

// Run the test
testQuickSchedulerConstraints().catch(console.error);