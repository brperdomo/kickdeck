/**
 * Test OpenAI Schedule Generation
 * This script tests the OpenAI schedule generation functionality directly
 */

// Import the OpenAI service (dynamic import since it's ESM)
async function runTest() {
  try {
    // Dynamically import the OpenAI service
    const openaiServiceModule = await import('./server/services/openai-service.js');
    const { SoccerSchedulerAI } = openaiServiceModule;
    
    // Mock event data for testing
    const testEventId = '1234567890'; // A dummy event ID
    
    // Mock schedule constraints
    const constraints = {
      maxGamesPerDay: 3,
      minutesPerGame: 60,
      breakBetweenGames: 15,
      minRestPeriod: 2,
      resolveCoachConflicts: true,
      optimizeFieldUsage: true,
      tournamentFormat: 'round_robin_knockout'
    };
    
    console.log('Testing OpenAI schedule generation...');
    console.log('Using constraints:', JSON.stringify(constraints, null, 2));
    
    // Check if we have a valid API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.');
      return;
    }
    
    console.log('OpenAI API key is set. Attempting to generate schedule...');
    
    // Mock the getEventData and getTeamsData methods to return test data
    SoccerSchedulerAI.getEventData = async () => ({
      id: testEventId,
      name: 'Test Tournament',
      startDate: '2025-05-01',
      endDate: '2025-05-05',
      fields: [
        { id: 1, name: 'Field 1' },
        { id: 2, name: 'Field 2' }
      ]
    });
    
    SoccerSchedulerAI.getTeamsData = async () => ([
      { id: 101, name: 'Team A', coach: 'Coach A', bracket: 'U10 Boys' },
      { id: 102, name: 'Team B', coach: 'Coach B', bracket: 'U10 Boys' },
      { id: 103, name: 'Team C', coach: 'Coach A', bracket: 'U10 Boys' }, // Same coach as Team A
      { id: 104, name: 'Team D', coach: 'Coach D', bracket: 'U10 Boys' }
    ]);
    
    // Mock the conflict detection method
    SoccerSchedulerAI.detectScheduleConflicts = (games) => {
      return [{
        type: 'rest_period',
        description: 'Team A has insufficient rest time between games',
        severity: 'medium',
        affectedGames: [1, 2]
      }];
    };
    
    // Call the method we're testing
    const result = await SoccerSchedulerAI.generateSchedule(testEventId, constraints);
    
    // Log the results
    console.log('\nSchedule generation succeeded!');
    console.log(`Generated ${result.schedule.length} games`);
    console.log(`Quality score: ${result.qualityScore}`);
    console.log(`Conflicts detected: ${result.conflicts.length}`);
    
    // Display a sample game
    if (result.schedule.length > 0) {
      console.log('\nSample game:');
      console.log(JSON.stringify(result.schedule[0], null, 2));
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Error testing OpenAI schedule generation:', error);
    
    // More detailed error reporting
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
    }
  }
}

// Run the test
runTest();