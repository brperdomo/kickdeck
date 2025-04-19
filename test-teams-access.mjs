/**
 * Test Teams Access Script
 * This script tests that the teams API endpoint is working correctly
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Function to load cookies from file
function loadCookiesFromFile() {
  try {
    if (fs.existsSync('./cookies.txt')) {
      return fs.readFileSync('./cookies.txt', 'utf8');
    }
    return '';
  } catch (err) {
    console.error('Error loading cookies:', err);
    return '';
  }
}

// Function to save cookies to file
function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync('./cookies.txt', cookieStr);
  } catch (err) {
    console.error('Error saving cookies:', err);
  }
}

// Helper function for API requests with cookie support
async function apiRequest(endpoint, method = 'GET', body = null) {
  const cookies = loadCookiesFromFile();
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookies
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  const response = await fetch(`http://localhost:5000${endpoint}`, options);
  
  // Save cookies from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    saveCookiesToFile(setCookie);
  }
  
  const data = await response.json();
  
  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

// Login function
async function login() {
  console.log('Logging in as admin...');
  
  const response = await apiRequest('/api/login', 'POST', {
    email: 'admin@example.com',
    password: 'password'
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }
  
  console.log('Login successful');
  return response.data;
}

// Test teams access
async function testTeamsAccess() {
  try {
    // First, log in
    await login();
    
    // Get a list of events to pick an event ID
    const eventsResponse = await apiRequest('/api/admin/events');
    if (!eventsResponse.ok) {
      throw new Error(`Failed to fetch events: ${JSON.stringify(eventsResponse.data)}`);
    }
    
    const events = eventsResponse.data;
    if (!events || events.length === 0) {
      console.log('No events found. Create an event first.');
      return;
    }
    
    // Use the first event ID
    const eventId = events[0].id;
    console.log(`Using event ID: ${eventId}`);
    
    // Test teams endpoint with the event ID
    const teamsResponse = await apiRequest(`/api/admin/teams?eventId=${eventId}`);
    
    console.log(`Teams API Response Status: ${teamsResponse.status}`);
    console.log('Teams data:', JSON.stringify(teamsResponse.data, null, 2));
    
    if (teamsResponse.ok) {
      console.log(`Successfully retrieved ${teamsResponse.data.length} teams for event ${eventId}`);
    } else {
      console.error('Failed to retrieve teams:', teamsResponse.data);
    }
  } catch (error) {
    console.error('Error testing teams access:', error);
  }
}

// Run the test
testTeamsAccess();