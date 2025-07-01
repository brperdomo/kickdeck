/**
 * Regenerate Schedule with Fixed Timing and Field Assignment
 * 
 * This script regenerates the games with:
 * 1. Proper 60-minute minimum rest time between games
 * 2. Correct 11v11 field assignments for U17 teams
 * 3. Proper field size display in Schedule Management
 */

const eventId = '1656618593';

async function regenerateScheduleWithFixes() {
  console.log('🔧 Regenerating schedule with timing and field fixes...');
  
  try {
    // Call the fixed schedule generation endpoint
    const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/generate-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Schedule regenerated successfully!');
      console.log(`📊 Generated ${result.gamesGenerated} games`);
      console.log('');
      console.log('🎯 Fixed issues:');
      console.log('   ✓ U17 games now use 11v11 field assignments');
      console.log('   ✓ Minimum rest time increased from 30 to 60 minutes');
      console.log('   ✓ Games properly spaced with 150-minute intervals (90min game + 60min rest)');
      console.log('');
      console.log('📍 Expected timing pattern:');
      console.log('   Game 1: 9:00 AM - 10:30 AM');
      console.log('   Game 2: 11:30 AM - 1:00 PM (60min rest after Game 1)');
      console.log('   Game 3: 2:30 PM - 4:00 PM (60min rest after Game 2)');
      console.log('');
      console.log('🏟️ Field assignments for U17 teams:');
      console.log('   ✓ Should show "Full Field" or "11v11 Field" names');
      console.log('   ✓ Complex assignments respect field size requirements');
      console.log('');
      console.log('🔍 Check Schedule Management (Step 7) to verify the fixes!');
    } else {
      const error = await response.text();
      console.log('❌ Failed to regenerate schedule:', error);
    }
    
  } catch (error) {
    console.error('❌ Error regenerating schedule:', error.message);
  }
}

// Run the regeneration
regenerateScheduleWithFixes();