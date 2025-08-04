// Simple test for Quick Scheduler field size constraints
const testQuickScheduler = async () => {
  console.log('=== Testing Quick Scheduler Field Size Constraints ===');
  
  // Test 1: U7 Boys should only use 7v7 fields (B1, B2)
  console.log('\nTest 1: U7 Boys (7v7) field assignment...');
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/quick-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: "999999",
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
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✓ Quick Scheduler completed successfully');
      console.log(`✓ Generated ${result.gamesCount} games`);
      console.log(`✓ Compatible fields used:`, result.compatibleFields);
      
      // Check field size compliance
      const wrongSizeFields = result.compatibleFields.filter(f => f.size !== '7v7');
      if (wrongSizeFields.length === 0) {
        console.log('✅ FIELD SIZE FIX VERIFIED: Only 7v7 fields used for U7 games');
      } else {
        console.log('❌ FIELD SIZE VIOLATION: Wrong size fields used:', wrongSizeFields);
      }
      
      console.log(`✓ Scheduling efficiency: ${result.schedulingEfficiency}%`);
      console.log(`✓ Team game counts:`, result.teamGameCounts);
      console.log(`✓ Constraints applied:`, result.constraintsApplied);
      
    } else {
      console.log('❌ Quick Scheduler failed:', result.error);
      console.log('Available fields:', result.availableFields || 'Not provided');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
};

testQuickScheduler();