/**
 * Complete Registration Flow Test Script
 * 
 * This script simulates a complete user registration flow:
 * 1. Create a new user account
 * 2. Login with the created credentials
 * 3. Find an available event
 * 4. Register a team for the event
 * 5. Process payment for the registration
 * 
 * Usage:
 *   node test-registration-flow.js
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Constants
const BASE_URL = 'http://localhost:5000';
const COOKIE_FILE = path.join(__dirname, 'auth-cookies.txt');

// Test user details
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  email: `testuser_${Date.now()}@example.com`,
  phone: '1234567890',
  isParent: true
};

// Team registration details
const TEAM_DATA = {
  name: `Test Team ${Date.now()}`,
  headCoachName: 'Coach Smith',
  headCoachEmail: 'coach@example.com',
  headCoachPhone: '5551234567',
  assistantCoachName: 'Assistant Coach',
  managerName: 'Team Manager',
  managerEmail: 'manager@example.com',
  managerPhone: '5559876543',
  players: [
    {
      firstName: 'Player',
      lastName: 'One',
      jerseyNumber: '9',
      dateOfBirth: '2010-01-15',
      position: 'Forward',
      emergencyContactName: 'Parent One',
      emergencyContactPhone: '5551112222'
    },
    {
      firstName: 'Player',
      lastName: 'Two',
      jerseyNumber: '10',
      dateOfBirth: '2010-03-20',
      position: 'Midfielder',
      emergencyContactName: 'Parent Two',
      emergencyContactPhone: '5553334444'
    }
  ],
  termsAcknowledged: true,
  termsAcknowledgedAt: new Date().toISOString(),
  paymentMethod: 'card' // 'card' or 'pay_later'
};

// Helper function to save cookies to file
async function saveCookies(cookieString) {
  if (!cookieString) return;
  
  await fs.writeFile(COOKIE_FILE, cookieString, 'utf8');
  console.log('🍪 Cookies saved to file');
}

// Helper function to load cookies from file
async function loadCookies() {
  try {
    const cookies = await fs.readFile(COOKIE_FILE, 'utf8');
    return cookies;
  } catch (error) {
    console.log('No cookies found, continuing without authentication');
    return '';
  }
}

// Helper function for API requests
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
  console.log(`🌐 Making ${method} request to ${url}`);
  
  const response = await fetch(url, options);
  
  // Save cookies from response if they exist
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    await saveCookies(setCookieHeader);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return { 
      status: response.status,
      headers: response.headers,
      data: await response.json()
    };
  } else {
    return { 
      status: response.status,
      headers: response.headers,
      data: await response.text()
    };
  }
}

// Step 1: Register a new user
async function registerUser() {
  console.log('\n📝 STEP 1: Registering new user...');
  
  const response = await apiRequest('/api/register', 'POST', TEST_USER);
  
  if (response.status === 200 || response.status === 201) {
    console.log('✅ User registration successful:', TEST_USER.username);
    return response.data.user;
  } else {
    console.error('❌ User registration failed:', response.data);
    throw new Error('Registration failed');
  }
}

// Step 2: Login with the created user
async function loginUser() {
  console.log('\n🔑 STEP 2: Logging in...');
  
  const loginData = {
    username: TEST_USER.username,
    password: TEST_USER.password
  };
  
  const response = await apiRequest('/api/login', 'POST', loginData);
  
  if (response.status === 200) {
    console.log('✅ Login successful');
    return response.data;
  } else {
    console.error('❌ Login failed:', response.data);
    throw new Error('Login failed');
  }
}

// Step 3: Fetch available events
async function fetchEvents() {
  console.log('\n🏆 STEP 3: Fetching available events...');
  
  const response = await apiRequest('/api/events', 'GET');
  
  if (response.status === 200) {
    console.log(`✅ Found ${response.data.length} events`);
    
    if (response.data.length === 0) {
      throw new Error('No events found to register for');
    }
    
    return response.data;
  } else {
    console.error('❌ Failed to fetch events:', response.data);
    throw new Error('Failed to fetch events');
  }
}

// Step 4: Get event details and age groups
async function getEventDetails(eventId) {
  console.log(`\n📋 STEP 4: Getting details for event ${eventId}...`);
  
  const response = await apiRequest(`/api/events/${eventId}`, 'GET');
  
  if (response.status === 200) {
    console.log('✅ Event details retrieved');
    return response.data;
  } else {
    console.error('❌ Failed to get event details:', response.data);
    throw new Error('Failed to get event details');
  }
}

// Step 5: Register a team for the event
async function registerTeam(eventId, ageGroupId, bracketId = null) {
  console.log(`\n⚽ STEP 5: Registering team for event ${eventId}...`);
  
  // Complete team data with age group and bracket
  const teamData = {
    ...TEAM_DATA,
    ageGroupId,
    bracketId
  };
  
  const response = await apiRequest(
    `/api/events/${eventId}/register-team`,
    'POST',
    teamData
  );
  
  if (response.status === 200 || response.status === 201) {
    console.log('✅ Team registration successful');
    return response.data;
  } else {
    console.error('❌ Team registration failed:', response.data);
    throw new Error('Team registration failed');
  }
}

// Step 6: Process payment for registration
async function processPayment(teamId, eventId, amount) {
  console.log(`\n💳 STEP 6: Processing payment for team ${teamId}...`);
  
  // Create payment intent
  const paymentIntentResponse = await apiRequest(
    '/api/payments/create-intent',
    'POST',
    {
      teamId,
      eventId,
      amount: amount || 10000 // $100.00 in cents
    }
  );
  
  if (paymentIntentResponse.status !== 200) {
    console.error('❌ Failed to create payment intent:', paymentIntentResponse.data);
    throw new Error('Payment processing failed');
  }
  
  const { clientSecret, paymentIntentId } = paymentIntentResponse.data;
  
  console.log('✅ Payment intent created:', paymentIntentId);
  
  // Simulate successful payment webhook
  console.log('🔄 Simulating successful payment webhook...');
  const webhookResponse = await apiRequest(
    '/api/payments/test-webhook',
    'POST',
    {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          status: 'succeeded',
          amount: amount || 10000
        }
      }
    }
  );
  
  if (webhookResponse.status === 200) {
    console.log('✅ Payment simulation successful');
    return { paymentIntentId };
  } else {
    console.error('❌ Payment simulation failed:', webhookResponse.data);
    throw new Error('Payment simulation failed');
  }
}

// Step 7: Verify team registration status
async function verifyRegistration(teamId) {
  console.log(`\n🔍 STEP 7: Verifying registration status for team ${teamId}...`);
  
  const response = await apiRequest(`/api/teams/${teamId}`, 'GET');
  
  if (response.status === 200) {
    console.log('✅ Team registration verified:', response.data.name);
    return response.data;
  } else {
    console.error('❌ Failed to verify team registration:', response.data);
    throw new Error('Failed to verify registration');
  }
}

// Main function to run the full registration flow
async function runRegistrationFlow() {
  console.log('🚀 Starting complete registration flow simulation');
  console.log('------------------------------------------------');
  
  try {
    // Step 1: Register user
    const user = await registerUser();
    
    // Step 2: Login
    const loggedInUser = await loginUser();
    
    // Step 3: Fetch events
    const events = await fetchEvents();
    const selectedEvent = events[0]; // Choose the first event
    
    // Step 4: Get event details
    const eventDetails = await getEventDetails(selectedEvent.id);
    
    // Choose an age group from the event
    if (!eventDetails.ageGroups || eventDetails.ageGroups.length === 0) {
      throw new Error('No age groups found for this event');
    }
    
    const selectedAgeGroup = eventDetails.ageGroups[0];
    console.log(`Selected age group: ${selectedAgeGroup.name}`);
    
    // Choose a bracket if available
    let selectedBracket = null;
    if (eventDetails.brackets && eventDetails.brackets.length > 0) {
      selectedBracket = eventDetails.brackets[0];
      console.log(`Selected bracket: ${selectedBracket.name}`);
    }
    
    // Step 5: Register team
    const teamRegistration = await registerTeam(
      selectedEvent.id,
      selectedAgeGroup.id,
      selectedBracket?.id
    );
    
    const teamId = teamRegistration.team?.id || teamRegistration.teamId;
    
    // Step 6: Process payment
    let registrationFee = eventDetails.registrationFee || 10000; // Default to $100 if not specified
    await processPayment(teamId, selectedEvent.id, registrationFee);
    
    // Step 7: Verify registration
    await verifyRegistration(teamId);
    
    console.log('\n🎉 Complete registration flow completed successfully!');
    console.log('------------------------------------------------');
    
  } catch (error) {
    console.error('\n❌ Registration flow failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the registration flow
runRegistrationFlow();