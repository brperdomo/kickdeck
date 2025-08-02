import { neon } from '@neondatabase/serverless';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

async function clearTournamentConfigurations() {
  console.log('🧹 Starting tournament configuration cleanup...');
  
  try {
    // Get all events to show what we're working with
    const events = await sql`SELECT id, name FROM events ORDER BY created_at DESC LIMIT 10`;
    console.log('\n📋 Available Events:');
    events.forEach(event => {
      console.log(`  • Event ${event.id}: ${event.name}`);
    });
    
    if (events.length === 0) {
      console.log('❌ No events found in database');
      return;
    }
    
    // Clear all tournament configuration data
    console.log('\n🗑️  Clearing tournament configurations...');
    
    // 1. First, clear foreign key references from teams table
    const teamsUpdated = await sql`
      UPDATE teams 
      SET bracket_id = NULL, group_id = NULL 
      WHERE bracket_id IS NOT NULL OR group_id IS NOT NULL
    `;
    console.log(`✅ Cleared bracket/group assignments from ${teamsUpdated.length} teams`);
    
    // 2. Clear games (has foreign key dependencies)
    const gamesDeleted = await sql`DELETE FROM games`;
    console.log(`✅ Deleted ${gamesDeleted.length} games`);
    
    // 3. Clear game time slots
    const timeSlotsDeleted = await sql`DELETE FROM game_time_slots`;
    console.log(`✅ Deleted ${timeSlotsDeleted.length} time slots`);
    
    // 4. Clear game formats (bracket-specific) - must be before brackets
    const gameFormatsDeleted = await sql`DELETE FROM game_formats`;
    console.log(`✅ Deleted ${gameFormatsDeleted.length} bracket game formats`);
    
    // 5. Clear brackets (now safe since teams and game_formats are cleared)
    const bracketsDeleted = await sql`DELETE FROM event_brackets`;
    console.log(`✅ Deleted ${bracketsDeleted.length} brackets`);
    
    // 6. Clear event game formats (event-level)
    const eventGameFormatsDeleted = await sql`DELETE FROM event_game_formats`;
    console.log(`✅ Deleted ${eventGameFormatsDeleted.length} event game formats`);
    
    // 7. Clear tournament groups (flights)
    const groupsDeleted = await sql`DELETE FROM tournament_groups`;
    console.log(`✅ Deleted ${groupsDeleted.length} tournament groups/flights`);
    
    // 8. Clear event schedule constraints
    const constraintsDeleted = await sql`DELETE FROM event_schedule_constraints`;
    console.log(`✅ Deleted ${constraintsDeleted.length} schedule constraints`);
    
    console.log('\n🎯 Tournament configuration cleanup complete!');
    console.log('\n📊 Summary of cleared data:');
    console.log(`  • Games: ${gamesDeleted.length}`);
    console.log(`  • Time Slots: ${timeSlotsDeleted.length}`);
    console.log(`  • Game Formats (Bracket): ${gameFormatsDeleted.length}`);
    console.log(`  • Game Formats (Event): ${eventGameFormatsDeleted.length}`);
    console.log(`  • Brackets: ${bracketsDeleted.length}`);
    console.log(`  • Tournament Groups/Flights: ${groupsDeleted.length}`);
    console.log(`  • Schedule Constraints: ${constraintsDeleted.length}`);
    console.log(`  • Teams Updated: ${teamsUpdated.length}`);
    
    console.log('\n✨ You can now configure tournaments from scratch:');
    console.log('  1. Set up Game Formats');
    console.log('  2. Create Flights/Brackets');
    console.log('  3. Configure Schedule Constraints');
    console.log('  4. Run Tournament Auto-Schedule');
    
    // Show remaining data that was preserved
    const remainingTeams = await sql`SELECT COUNT(*) as count FROM teams`;
    const remainingAgeGroups = await sql`SELECT COUNT(*) as count FROM event_age_groups`;
    const remainingEvents = await sql`SELECT COUNT(*) as count FROM events`;
    
    console.log('\n🔒 Preserved data (not cleared):');
    console.log(`  • Events: ${remainingEvents[0].count}`);
    console.log(`  • Age Groups: ${remainingAgeGroups[0].count}`);
    console.log(`  • Teams: ${remainingTeams[0].count}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
clearTournamentConfigurations()
  .then(() => {
    console.log('\n🎉 Tournament configuration cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });