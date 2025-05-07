/**
 * Team Registration Process Test Script
 * 
 * This script focuses specifically on testing the team registration process
 * with proper validation, error handling, and detailed logging.
 * 
 * It simulates:
 * 1. Authentication (login or register if needed)
 * 2. Fetching event details
 * 3. Validation of team data
 * 4. Submitting team registration with player data
 * 5. Processing payment
 * 6. Verifying registration completion
 * 
 * Usage:
 *   node test-team-registration.js [eventId]
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// ===== Configuration =====
const BASE_URL = 'http://localhost:5000';
const COOKIE_FILE = path.join(__dirname, 'team-reg-cookies.txt');

// User credentials - use existing user or create new one
const CREDENTIALS = {
  username: 'testcoach',
  password: 'TestPass123!',
  // For new user registration
  firstName: 'Test',
  lastName: 'Coach',
  email: 'testcoach@example.com',
  phone: '5551234567',
  isParent: true
};

// Team data template with required fields
const createTeamData = (ageGroupId, bracketId = null) => ({
  name: `Test Soccer Club ${Date.now().toString().slice(-4)}`,
  ageGroupId,
  bracketId,
  headCoachName: 'John Smith',
  headCoachEmail: 'coach@example.com',
  headCoachPhone: '5551234567',
  assistantCoachName: 'Jane Doe',
  managerName: 'Team Manager',
  managerEmail: 'manager@example.com',
  managerPhone: '5559876543',
  players: [
    {
      firstName: 'Alex',
      lastName: 'Johnson',
      jerseyNumber: '7',
      dateOfBirth: '2010-05-15',
      position: 'Forward',
      medicalNotes: 'No allergies',
      emergencyContactName: 'Parent Johnson',
      emergencyContactPhone: '5551112222'
    },
    {
      firstName: 'Sam',
      lastName: 'Williams',
      jerseyNumber: '10',
      dateOfBirth: '2010-03-20',
      position: 'Midfielder',
      medicalNotes: '',
      emergencyContactName: 'Parent Williams',
      emergencyContactPhone: '5553334444'
    },
    {
      firstName: 'Jordan',
      lastName: 'Smith',
      jerseyNumber: '15',
      dateOfBirth: '2010-07-12',
      position: 'Defender',
      medicalNotes: 'Asthma',
      emergencyContactName: 'Parent Smith',
      emergencyContactPhone: '5555556666'
    }
  ],
  termsAcknowledged: true,
  termsAcknowledgedAt: new Date().toISOString(),
  paymentMethod: 'card' // 'card' or 'pay_later'
});

// ===== Helper Functions =====

// Save cookies from response
async function saveCookies(cookieString) {
  if (!cookieString) return;
  
  await fs.writeFile(COOKIE_FILE, cookieString, 'utf8');
  console.log('Cookies saved to file');
}

// Load cookies for authentication
async function loadCookies() {
  try {
    return await fs.readFile(COOKIE_FILE, 'utf8');
  } catch (error) {
    return '';
  }
}

// API request helper with cookie handling
async function apiRequest(endpoint, method = 'GET', body = null) {
  const cookies = await loadCookies();
  
  const headers = {
    'Cookie': cookies,
    'Content-Type': 'application/json'
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[API] ${method} ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    // Save cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      await saveCookies(setCookieHeader);
    }
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return { 
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      data: responseData
    };
  } catch (error) {
    console.error(`[API ERROR] ${method} ${url}: ${error.message}`);
    throw error;
  }
}

// Check if user is authenticated
async function checkAuth() {
  console.log('\n[AUTH] Checking authentication status...');
  
  const response = await apiRequest('/api/user', 'GET');
  
  if (response.status === 200 && response.data && response.data.id) {
    console.log(`[AUTH] Authenticated as: ${response.data.username} (${response.data.email})`);
    return response.data;
  } else {
    console.log('[AUTH] Not authenticated');
    return null;
  }
}

// Register a new user
async function registerUser() {
  console.log('\n[AUTH] Registering new user...');
  
  const response = await apiRequest('/api/register', 'POST', CREDENTIALS);
  
  if (response.ok) {
    console.log(`[AUTH] Registration successful: ${CREDENTIALS.username}`);
    return response.data.user;
  } else {
    console.error('[AUTH ERROR] Registration failed:', response.data);
    throw new Error(`Registration failed: ${JSON.stringify(response.data)}`);
  }
}

// Login with credentials
async function login() {
  console.log('\n[AUTH] Logging in...');
  
  const loginData = {
    username: CREDENTIALS.username,
    password: CREDENTIALS.password
  };
  
  const response = await apiRequest('/api/login', 'POST', loginData);
  
  if (response.ok) {
    console.log(`[AUTH] Login successful: ${CREDENTIALS.username}`);
    return response.data;
  } else {
    console.error('[AUTH ERROR] Login failed:', response.data);
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }
}

// Ensure user is authenticated (login or register if needed)
async function ensureAuthenticated() {
  const user = await checkAuth();
  
  if (user) {
    return user;
  }
  
  // Try to login first
  try {
    return await login();
  } catch (loginError) {
    console.log('[AUTH] Login failed, attempting registration');
    
    // If login fails, try to register
    try {
      return await registerUser();
    } catch (registrationError) {
      console.error('[AUTH ERROR] Both login and registration failed');
      throw new Error('Authentication failed: Unable to login or register');
    }
  }
}

// Get event details with age groups and brackets
async function getEventDetails(eventId) {
  console.log(`\n[EVENT] Fetching details for event ${eventId}...`);
  
  const response = await apiRequest(`/api/events/${eventId}`, 'GET');
  
  if (response.ok) {
    console.log(`[EVENT] Successfully retrieved details for "${response.data.name}"`);
    
    // Log available age groups
    if (response.data.ageGroups && response.data.ageGroups.length > 0) {
      console.log('[EVENT] Available age groups:');
      response.data.ageGroups.forEach(group => {
        console.log(`  - ${group.name} (ID: ${group.id})`);
      });
    } else {
      console.warn('[EVENT WARNING] No age groups available for this event');
    }
    
    // Log available brackets
    if (response.data.brackets && response.data.brackets.length > 0) {
      console.log('[EVENT] Available brackets:');
      response.data.brackets.forEach(bracket => {
        console.log(`  - ${bracket.name} (ID: ${bracket.id})`);
      });
    }
    
    return response.data;
  } else {
    console.error('[EVENT ERROR] Failed to get event details:', response.data);
    throw new Error(`Failed to get event details: ${JSON.stringify(response.data)}`);
  }
}

// Get clubs for the event
async function getEventClubs(eventId) {
  console.log(`\n[CLUBS] Fetching clubs for event ${eventId}...`);
  
  const response = await apiRequest(`/api/clubs/event/${eventId}`, 'GET');
  
  if (response.ok) {
    console.log(`[CLUBS] Found ${response.data.length} clubs for this event`);
    return response.data;
  } else {
    console.warn('[CLUBS WARNING] Failed to fetch clubs, continuing without club data');
    return [];
  }
}

// Register a team for the event
async function registerTeam(eventId, teamData) {
  console.log('\n[TEAM] Submitting team registration...');
  
  // Log team data summary
  console.log(`[TEAM] Team name: ${teamData.name}`);
  console.log(`[TEAM] Age group ID: ${teamData.ageGroupId}`);
  console.log(`[TEAM] Players: ${teamData.players.length}`);
  
  const response = await apiRequest(
    `/api/events/${eventId}/register-team`,
    'POST',
    teamData
  );
  
  if (response.ok) {
    console.log('[TEAM] Registration submitted successfully');
    
    const teamId = response.data.team?.id || response.data.teamId;
    console.log(`[TEAM] Registered team ID: ${teamId}`);
    
    return {
      teamId,
      registrationData: response.data
    };
  } else {
    console.error('[TEAM ERROR] Registration failed:', response.data);
    throw new Error(`Team registration failed: ${JSON.stringify(response.data)}`);
  }
}

// Process payment for team registration
async function processPayment(teamId, eventId, amount) {
  console.log(`\n[PAYMENT] Processing payment for team ${teamId}...`);
  
  // Create payment intent
  console.log(`[PAYMENT] Creating payment intent for $${(amount/100).toFixed(2)}...`);
  const paymentIntentResponse = await apiRequest(
    '/api/payments/create-intent',
    'POST',
    {
      teamId,
      eventId,
      amount
    }
  );
  
  if (!paymentIntentResponse.ok) {
    console.error('[PAYMENT ERROR] Failed to create payment intent:', paymentIntentResponse.data);
    throw new Error(`Payment processing failed: ${JSON.stringify(paymentIntentResponse.data)}`);
  }
  
  const { clientSecret, paymentIntentId } = paymentIntentResponse.data;
  console.log(`[PAYMENT] Payment intent created: ${paymentIntentId}`);
  
  // Simulate successful payment webhook
  console.log('[PAYMENT] Simulating successful payment webhook...');
  const webhookResponse = await apiRequest(
    '/api/payments/test-webhook',
    'POST',
    {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          status: 'succeeded',
          amount: amount
        }
      }
    }
  );
  
  if (webhookResponse.ok) {
    console.log('[PAYMENT] Payment simulation successful');
    return { paymentIntentId };
  } else {
    console.error('[PAYMENT ERROR] Payment simulation failed:', webhookResponse.data);
    throw new Error(`Payment simulation failed: ${JSON.stringify(webhookResponse.data)}`);
  }
}

// Verify team registration status
async function verifyRegistration(teamId) {
  console.log(`\n[VERIFY] Checking registration status for team ${teamId}...`);
  
  const response = await apiRequest(`/api/teams/${teamId}`, 'GET');
  
  if (response.ok) {
    console.log(`[VERIFY] Team verified: "${response.data.name}"`);
    console.log(`[VERIFY] Status: ${response.data.registrationStatus || 'Unknown'}`);
    
    if (response.data.paymentStatus) {
      console.log(`[VERIFY] Payment status: ${response.data.paymentStatus}`);
    }
    
    return response.data;
  } else {
    console.error('[VERIFY ERROR] Failed to verify team registration:', response.data);
    throw new Error(`Failed to verify registration: ${JSON.stringify(response.data)}`);
  }
}

// Main function to run the team registration flow
async function runTeamRegistrationFlow(eventId) {
  console.log('===============================================');
  console.log('🚀 TEAM REGISTRATION PROCESS TEST');
  console.log('===============================================');
  
  try {
    // Step 1: Ensure user is authenticated
    const user = await ensureAuthenticated();
    console.log(`\n✅ Authentication complete: ${user.username}`);
    
    // Step 2: Get event details
    const eventDetails = await getEventDetails(eventId);
    console.log(`\n✅ Event details retrieved: "${eventDetails.name}"`);
    
    if (!eventDetails.ageGroups || eventDetails.ageGroups.length === 0) {
      throw new Error('No age groups found for this event. Cannot continue with registration.');
    }
    
    // Step 3: Get clubs for this event (optional)
    const eventClubs = await getEventClubs(eventId);
    
    // Step 4: Select age group and create team data
    const selectedAgeGroup = eventDetails.ageGroups[0];
    console.log(`\n📋 Using age group: ${selectedAgeGroup.name} (ID: ${selectedAgeGroup.id})`);
    
    // Select bracket if available
    let selectedBracket = null;
    if (eventDetails.brackets && eventDetails.brackets.length > 0) {
      selectedBracket = eventDetails.brackets[0];
      console.log(`📋 Using bracket: ${selectedBracket.name} (ID: ${selectedBracket.id})`);
    }
    
    // Create team data
    const teamData = createTeamData(
      selectedAgeGroup.id,
      selectedBracket?.id
    );
    
    // Add club ID if clubs are available
    if (eventClubs.length > 0) {
      teamData.clubId = eventClubs[0].id;
      console.log(`📋 Using club: ${eventClubs[0].name} (ID: ${eventClubs[0].id})`);
    }
    
    // Step 5: Register team
    const { teamId, registrationData } = await registerTeam(eventId, teamData);
    console.log(`\n✅ Team registered successfully with ID: ${teamId}`);
    
    // Step 6: Process payment
    let registrationFee = eventDetails.registrationFee || 10000; // Default to $100 if not specified
    await processPayment(teamId, eventId, registrationFee);
    console.log(`\n✅ Payment processed successfully: $${(registrationFee/100).toFixed(2)}`);
    
    // Step 7: Verify registration
    const verifiedTeam = await verifyRegistration(teamId);
    console.log('\n✅ Registration verification complete');
    
    console.log('\n===============================================');
    console.log('🎉 TEAM REGISTRATION PROCESS COMPLETED SUCCESSFULLY');
    console.log('===============================================');
    
    // Return the registered team data for potential future use
    return {
      teamId,
      teamName: teamData.name,
      ageGroup: selectedAgeGroup.name,
      bracket: selectedBracket?.name,
      verifiedTeam
    };
    
  } catch (error) {
    console.error('\n❌ TEAM REGISTRATION PROCESS FAILED:');
    console.error(error.message);
    
    console.log('\n===============================================');
    console.log('❌ TEAM REGISTRATION PROCESS FAILED');
    console.log('===============================================');
    
    throw error;
  }
}

// Get event ID from command line or use default
const eventId = process.argv[2] || '1251362271'; // Use the first event ID from logs

// Run the registration flow
runTeamRegistrationFlow(eventId)
  .then(result => {
    console.log('\nScript completed successfully.');
  })
  .catch(error => {
    console.error('\nScript failed with error:', error);
    process.exit(1);
  });