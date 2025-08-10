const { db } = require('./db');
const { games, teams, eventBrackets } = require('./db/schema');
const { eq, and } = require('drizzle-orm');

async function scheduleU19Boys2007Games() {
  console.log('🏆 Starting U19 Boys [2007] game scheduling...');

  const eventId = '1844329078';
  const ageGroupId = 9965;

  // Field prioritization: Galway Downs 1, 2, 3, 4, then 5, 6
  const priorityFields = [
    { id: 20, name: 'Galway Downs Field 1' },
    { id: 21, name: 'Galway Downs Field 2' }, 
    { id: 22, name: 'Galway Downs Field 3' },
    { id: 23, name: 'Galway Downs Field 4' },
    { id: 24, name: 'Galway Downs Field 5' },
    { id: 25, name: 'Galway Downs Field 6' }
  ];

  // Time slots: 8:00am to 6:00pm (90min games + 120min rest = 210min = 3.5hr gaps)
  // 8:00am, 11:30am, 3:00pm, 6:30pm (but 6:30pm exceeds 6:00pm latest start)
  // So: 8:00am, 11:30am, 3:00pm are our available time slots
  const timeSlots = [
    { start: '08:00', end: '09:30', day: 'Aug 15, 2025' },
    { start: '11:30', end: '13:00', day: 'Aug 15, 2025' },
    { start: '15:00', end: '16:30', day: 'Aug 15, 2025' },
    { start: '08:00', end: '09:30', day: 'Aug 16, 2025' },
    { start: '11:30', end: '13:00', day: 'Aug 16, 2025' },
    { start: '15:00', end: '16:30', day: 'Aug 16, 2025' }
  ];

  try {
    // Get U19 Boys [2007] brackets and teams
    const brackets = await db.query.eventBrackets.findMany({
      where: and(
        eq(eventBrackets.eventId, parseInt(eventId)),
        eq(eventBrackets.ageGroupId, ageGroupId)
      )
    });

    console.log(`📊 Found ${brackets.length} brackets for U19 Boys [2007]`);

    // Track games and field usage
    let gameNumber = 1;
    let fieldIndex = 0;
    let timeSlotIndex = 0;
    const createdGames = [];

    for (const bracket of brackets) {
      console.log(`\n🏁 Processing ${bracket.name} (${bracket.tournamentFormat})`);

      // Get teams for this bracket
      const bracketTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.bracketId, bracket.id),
          eq(teams.status, 'approved')
        )
      });

      console.log(`👥 Found ${bracketTeams.length} teams: ${bracketTeams.map(t => t.name).join(', ')}`);

      if (bracketTeams.length < 2) {
        console.log(`⚠️  Skipping ${bracket.name} - insufficient teams`);
        continue;
      }

      // Generate games based on format
      let gamesToCreate = [];

      if (bracket.name === 'Nike Premier' && bracketTeams.length === 6) {
        // CROSSPLAY FORMAT: Pool A vs Pool B only
        console.log('🎯 Creating crossplay format - Pool A vs Pool B games');
        
        // Split teams into Pool A (first 3) and Pool B (next 3) alphabetically
        const sortedTeams = [...bracketTeams].sort((a, b) => a.name.localeCompare(b.name));
        const poolA = sortedTeams.slice(0, 3);
        const poolB = sortedTeams.slice(3, 6);

        console.log(`Pool A: ${poolA.map(t => t.name).join(', ')}`);
        console.log(`Pool B: ${poolB.map(t => t.name).join(', ')}`);

        // Create 9 crossplay games (each Pool A team plays each Pool B team)
        let roundNum = 1;
        for (const teamA of poolA) {
          for (const teamB of poolB) {
            gamesToCreate.push({
              homeTeamId: teamA.id,
              awayTeamId: teamB.id,
              homeTeamName: teamA.name,
              awayTeamName: teamB.name,
              round: roundNum,
              gameType: 'Pool Play'
            });
            roundNum++;
          }
        }

        // Add championship game (TBD vs TBD)
        gamesToCreate.push({
          homeTeamId: null,
          awayTeamId: null,
          homeTeamName: 'Pool A Winner',
          awayTeamName: 'Pool B Winner',
          round: 10,
          gameType: 'Championship'
        });

      } else if (bracket.name === 'Nike Elite' && bracketTeams.length === 4) {
        // GROUP OF 4 FORMAT: Round robin
        console.log('🔄 Creating group of 4 format - round robin');
        
        let roundNum = 1;
        const teamArray = [...bracketTeams];
        
        // Generate all possible matchups (6 games for 4 teams)
        for (let i = 0; i < teamArray.length; i++) {
          for (let j = i + 1; j < teamArray.length; j++) {
            gamesToCreate.push({
              homeTeamId: teamArray[i].id,
              awayTeamId: teamArray[j].id,
              homeTeamName: teamArray[i].name,
              awayTeamName: teamArray[j].name,
              round: roundNum,
              gameType: 'Group Play'
            });
            roundNum++;
          }
        }
      }

      console.log(`🎮 Generated ${gamesToCreate.length} games for ${bracket.name}`);

      // Assign fields and time slots to games
      for (const gameData of gamesToCreate) {
        const currentField = priorityFields[fieldIndex];
        const currentTimeSlot = timeSlots[timeSlotIndex];

        if (!currentField || !currentTimeSlot) {
          console.log('⚠️  Ran out of fields or time slots');
          break;
        }

        // Create the game
        const gameRecord = {
          eventId: eventId,
          ageGroupId: ageGroupId,
          bracketId: bracket.id,
          homeTeamId: gameData.homeTeamId,
          awayTeamId: gameData.awayTeamId,
          homeTeamName: gameData.homeTeamName,
          awayTeamName: gameData.awayTeamName,
          fieldId: currentField.id,
          fieldName: currentField.name,
          startTime: `${currentTimeSlot.day} ${currentTimeSlot.start}`,
          endTime: `${currentTimeSlot.day} ${currentTimeSlot.end}`,
          round: gameData.round,
          gameType: gameData.gameType,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log(`⚽ Game ${gameNumber}: ${gameData.homeTeamName} vs ${gameData.awayTeamName} @ ${currentField.name} ${currentTimeSlot.start}`);

        createdGames.push(gameRecord);
        gameNumber++;

        // Advance to next time slot for field capacity optimization
        timeSlotIndex++;
        if (timeSlotIndex >= timeSlots.length) {
          // Move to next field and reset time slots
          fieldIndex++;
          timeSlotIndex = 0;
        }
      }
    }

    // Insert all games at once
    if (createdGames.length > 0) {
      console.log(`\n💾 Inserting ${createdGames.length} games into database...`);
      
      await db.insert(games).values(createdGames);
      
      console.log('✅ All games successfully scheduled!');
    } else {
      console.log('❌ No games were created');
    }

    // Summary
    console.log('\n📈 SCHEDULING SUMMARY:');
    console.log(`- Total games created: ${createdGames.length}`);
    console.log(`- Fields used: ${Math.min(fieldIndex + 1, priorityFields.length)}`);
    console.log(`- Nike Premier (crossplay): ${createdGames.filter(g => g.gameType.includes('Pool') || g.gameType === 'Championship').length} games`);
    console.log(`- Nike Elite (group): ${createdGames.filter(g => g.gameType === 'Group Play').length} games`);

    return {
      success: true,
      gamesCreated: createdGames.length,
      message: `Successfully scheduled ${createdGames.length} games for U19 Boys [2007]`
    };

  } catch (error) {
    console.error('❌ Error scheduling games:', error);
    throw error;
  }
}

// Run the scheduling
scheduleU19Boys2007Games()
  .then(result => {
    console.log('\n🎉 Scheduling completed successfully!', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Scheduling failed:', error);
    process.exit(1);
  });