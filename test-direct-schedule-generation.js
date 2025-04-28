/**
 * Test Schedule Generation
 * This script tests the schedule generation functionality directly through the API
 */
const fetch = require('node-fetch');
const fs = require('fs');

// Helper function to load cookies from file
function loadCookiesFromFile() {
  try {
    if (fs.existsSync('./cookies.txt')) {
      return fs.readFileSync('./cookies.txt', 'utf8');
    }
  } catch (error) {
    console.error('Error loading cookies:', error);
  }
  return '';
}

// Helper function to save cookies to file
function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync('./cookies.txt', cookieStr);
    console.log('Cookies saved to file');
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  };

  try {
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, options);
    
    // Get cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      saveCookiesToFile(setCookieHeader);
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    
    // Get response text
    const responseText = await response.text();
    
    // If JSON, parse it
    let responseData;
    if (isJson && responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseData = { error: 'Invalid JSON response', text: responseText };
      }
    } else {
      responseData = { text: responseText };
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData,
      cookies: setCookieHeader
    };
  } catch (error) {
    console.error(`API request error: ${error}`);
    return { ok: false, error: error.message };
  }
}

// Login function
async function login() {
  const credentials = {
    email: 'admin@example.com',
    password: 'admin123'
  };
  
  const loginResponse = await apiRequest('/api/auth/login', 'POST', credentials);
  
  if (loginResponse.ok) {
    console.log('Login successful');
    return loginResponse.cookies;
  } else {
    console.error('Login failed:', loginResponse.data);
    return null;
  }
}

// Main function to test schedule generation
async function testScheduleGeneration() {
  try {
    console.log('Starting schedule generation test...');
    
    // First, login to get authentication cookies
    const cookies = await login();
    if (!cookies) {
      console.error('Login failed, cannot proceed with test');
      return;
    }
    
    // Fetch list of events
    const eventsResponse = await apiRequest('/api/admin/events', 'GET', null, cookies);
    
    if (!eventsResponse.ok) {
      console.error('Failed to fetch events:', eventsResponse.data);
      return;
    }
    
    console.log(`Fetched ${eventsResponse.data.length} events`);
    
    if (eventsResponse.data.length === 0) {
      console.error('No events found to test with');
      return;
    }
    
    // Select the first event for testing
    const testEvent = eventsResponse.data[0];
    console.log(`Selected event for testing: ${testEvent.name} (ID: ${testEvent.id})`);
    
    // Define schedule generation parameters
    const scheduleParams = {
      gamesPerDay: 3,
      minutesPerGame: 60,
      breakBetweenGames: 15,
      minRestPeriod: 2,
      resolveCoachConflicts: true,
      optimizeFieldUsage: true,
      tournamentFormat: 'round-robin-knockout',
      useAI: true
    };
    
    console.log('Generating schedule with params:', scheduleParams);
    
    // Call the schedule generation API
    const generateResponse = await apiRequest(
      `/api/admin/events/${testEvent.id}/generate-schedule`, 
      'POST',
      scheduleParams,
      cookies
    );
    
    if (!generateResponse.ok) {
      console.error('Schedule generation failed:', generateResponse.data);
      return;
    }
    
    console.log('Schedule generation response:', generateResponse.data);
    
    // Now fetch the games for this event to confirm they were created
    const gamesResponse = await apiRequest(
      `/api/admin/events/${testEvent.id}/games`,
      'GET',
      null,
      cookies
    );
    
    if (!gamesResponse.ok) {
      console.error('Failed to fetch games:', gamesResponse.data);
      return;
    }
    
    console.log(`Fetched ${gamesResponse.data.games?.length || 0} games for the event`);
    
    if (gamesResponse.data.games && gamesResponse.data.games.length > 0) {
      const sampleGame = gamesResponse.data.games[0];
      console.log('Sample game from database:', sampleGame);
    }
    
    console.log('Schedule generation test completed successfully!');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testScheduleGeneration();