import fetch from 'node-fetch';
import fs from 'fs';

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
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const url = `http://localhost:5000${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (cookies && typeof cookies === 'string' && cookies.trim() !== '') {
    // Make sure there are no invalid characters in the cookie
    options.headers['Cookie'] = cookies.replace(/[\r\n]/g, '');
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  // Save cookies if they were returned
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Clean the cookie before saving
    const cleanCookie = setCookieHeader.replace(/[\r\n]/g, '');
    saveCookiesToFile(cleanCookie);
  }
  
  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get the text but don't try to parse it
      const text = await response.text();
      if (text.includes('<!DOCTYPE html>')) {
        data = { message: 'HTML response received', success: response.ok };
      } else {
        data = { message: text, success: response.ok };
      }
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    data = { error: 'Failed to parse response', success: false };
  }
  
  return { 
    status: response.status, 
    data,
    cookies: setCookieHeader ? setCookieHeader.replace(/[\r\n]/g, '') : cookies,
    success: response.ok
  };
}

// Helper function to login
async function login() {
  console.log('Attempting to login as admin...');
  const loginResponse = await apiRequest(
    '/api/auth/login',
    'POST',
    {
      username: 'admin',
      password: 'password'
    }
  );
  
  if (loginResponse.status === 200) {
    console.log('Login successful!');
    // Even if the response is HTML, the cookies should be set
    // The Set-Cookie header is what matters
    if (loginResponse.cookies) {
      return loginResponse.cookies;
    } else {
      console.log('No cookies returned from login, using empty string');
      return loadCookiesFromFile() || ''; // Try to load from file as fallback
    }
  } else {
    console.error('Login failed:', loginResponse.status, loginResponse.data);
    return '';
  }
}

async function testPlayerInsertion() {
  console.log("Testing team registration with players...");
  
  // Login as admin to access the admin features
  const authCookies = await login();
  if (!authCookies) {
    console.error("Failed to authenticate. Cannot proceed with test.");
    return;
  }
  
  // First step: create a new test event that we can use
  console.log("Creating a test event first...");
  const createEventResponse = await apiRequest(
    '/api/admin/events', 
    'POST',
    {
      name: "Test Player Event",
      startDate: "2025-05-01",
      endDate: "2025-05-10",
      registrationDeadline: "2025-04-30",
      location: "Test Location",
      description: "Test event for player insertion",
      isPublic: true
    },
    authCookies
  );
  
  if (createEventResponse.status !== 201) {
    console.log("Couldn't create test event, using fallback values instead");
    // Let's fetch existing events to find a usable one
    console.log("Fetching existing events...");
    const eventsResponse = await apiRequest('/api/admin/events', 'GET', null, authCookies);
    
    if (eventsResponse.status === 200 && eventsResponse.data.length > 0) {
      // Get the first event that has a future registration deadline
      const currentDate = new Date();
      const futureEvent = eventsResponse.data.find(event => 
        new Date(event.registrationDeadline) > currentDate
      );
      
      if (futureEvent) {
        var eventId = futureEvent.id;
        console.log(`Using existing event: ${futureEvent.name} (ID: ${eventId})`);
        
        // Now get age groups for this event
        const ageGroupsResponse = await apiRequest(
          `/api/admin/events/${eventId}/age-groups`, 
          'GET', 
          null, 
          authCookies
        );
        
        if (ageGroupsResponse.status === 200 && ageGroupsResponse.data.length > 0) {
          const eligibleAgeGroup = ageGroupsResponse.data.find(ag => ag.isEligible);
          if (eligibleAgeGroup) {
            var ageGroupId = eligibleAgeGroup.id;
            console.log(`Using existing age group: ${eligibleAgeGroup.ageGroup} (ID: ${ageGroupId})`);
          } else {
            console.log("No eligible age groups found, creating one...");
            const createAgeGroupResponse = await apiRequest(
              `/api/admin/events/${eventId}/age-groups`,
              'POST',
              {
                ageGroup: "U10 Boys",
                gender: "Boys",
                birthYear: 2015,
                isEligible: true
              },
              authCookies
            );
            
            if (createAgeGroupResponse.status === 201) {
              var ageGroupId = createAgeGroupResponse.data.id;
              console.log(`Created new age group (ID: ${ageGroupId})`);
            } else {
              console.error("Failed to create age group", createAgeGroupResponse.data);
              return;
            }
          }
        } else {
          console.error("Failed to fetch age groups");
          return;
        }
      } else {
        console.error("No events with future registration deadlines found");
        return;
      }
    } else {
      console.error("Failed to fetch events or no events available");
      return;
    }
  } else {
    console.log("Created test event:", JSON.stringify(createEventResponse.data, null, 2));
    var eventId = createEventResponse.data.id;
    
    // Create a test age group for this event
    console.log("Creating a test age group...");
    const createAgeGroupResponse = await apiRequest(
      `/api/admin/events/${eventId}/age-groups`,
      'POST',
      {
        ageGroup: "U10 Boys",
        gender: "Boys",
        birthYear: 2015,
        isEligible: true
      },
      authCookies
    );
    
    if (createAgeGroupResponse.status === 201) {
      console.log("Age group creation response:", JSON.stringify(createAgeGroupResponse.data, null, 2));
      var ageGroupId = createAgeGroupResponse.data.id;
    } else {
      console.error("Failed to create age group:", createAgeGroupResponse.data);
      return;
    }
  }

  // Create team registration data with players
  const teamData = {
    name: "Test Team Players",
    ageGroupId,
    headCoachName: "Coach Smith",
    headCoachEmail: "coach@example.com",
    headCoachPhone: "123-456-7890",
    assistantCoachName: "Asst Coach Jones",
    managerName: "Manager Brown",
    managerEmail: "manager@example.com",
    managerPhone: "123-456-7891",
    termsAcknowledged: true,
    termsAcknowledgedAt: new Date().toISOString(),
    registrationFee: 15000, // $150.00
    players: [
      {
        firstName: "John",
        lastName: "Doe",
        jerseyNumber: "10",
        dateOfBirth: "2010-01-01",
        position: "Forward",
        medicalNotes: "No allergies",
        parentGuardianName: "Parent Doe",
        parentGuardianEmail: "parent@example.com",
        parentGuardianPhone: "123-456-7892",
        emergencyContactName: "Emergency Contact",
        emergencyContactPhone: "123-456-7893"
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        jerseyNumber: "7",
        dateOfBirth: "2010-02-15",
        position: "Midfielder",
        medicalNotes: "No allergies",
        parentGuardianName: "Parent Smith",
        parentGuardianEmail: "parent2@example.com",
        parentGuardianPhone: "123-456-7894",
        emergencyContactName: "Emergency Contact 2",
        emergencyContactPhone: "123-456-7895"
      }
    ]
  };

  try {
    // Register the team
    console.log("Registering team...");
    const registerResponse = await apiRequest(
      `/api/events/${eventId}/register-team`,
      'POST',
      teamData
    );
    
    console.log(`Team registration status: ${registerResponse.status}`);
    
    if (registerResponse.status !== 201) {
      console.error("Failed to register team:", registerResponse.data);
      return;
    }
    
    console.log("Registration response:", JSON.stringify(registerResponse.data, null, 2));
    
    const teamId = registerResponse.data.team.id;
    
    // Verify the team exists with players (must use admin auth for this endpoint)
    console.log(`\nVerifying team with ID ${teamId}...`);
    const teamResponse = await apiRequest(
      `/api/admin/teams/${teamId}`, 
      'GET', 
      null, 
      authCookies
    );
    
    console.log(`Team fetch status: ${teamResponse.status}`);
    
    if (teamResponse.status !== 200) {
      console.error("Failed to fetch team details:", teamResponse.data);
      return;
    }
    
    console.log("Team data:", JSON.stringify(teamResponse.data, null, 2));
    
    if (teamResponse.data.players && teamResponse.data.players.length > 0) {
      console.log(`\nPlayer count: ${teamResponse.data.players.length}`);
      console.log("Players:", JSON.stringify(teamResponse.data.players, null, 2));
      console.log("\nTEST SUCCESSFUL: Players were correctly created and associated with the team");
    } else {
      console.error("\nTEST FAILED: No players found in the team response");
    }
  } catch (error) {
    console.error("Error during test:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
testPlayerInsertion().catch(err => console.error('Test failed with error:', err));