/**
 * Test CSV Team Import
 * This script tests the team CSV import functionality, specifically focusing on
 * the mapping of age groups to division codes and birth years based on the event's seasonal scope.
 */

import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for making API requests with cookie support
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      Cookie: cookies,
      ...(method !== 'GET' && method !== 'DELETE' && body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
    },
    ...(method !== 'GET' && method !== 'DELETE' && body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {})
  };

  const response = await fetch(url, options);
  
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  // Extract cookies in a safer way
  let resultCookies = cookies;
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader && setCookieHeader.includes('connect.sid')) {
    const matches = setCookieHeader.match(/connect\.sid=([^;]*)/);
    if (matches && matches[1]) {
      resultCookies = `connect.sid=${matches[1]}`;
    }
  }
  
  return {
    ok: response.ok,
    status: response.status,
    data,
    cookies: resultCookies
  };
}

// In-memory cookie store - no need for file operations
let sessionCookie = '';

// Login to get authenticated
async function login() {
  console.log('Logging in...');
  
  const response = await apiRequest('/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'password123'
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }
  
  console.log('Login successful');
  
  // Save cookie for future requests
  if (response.cookies) {
    sessionCookie = response.cookies;
  }
  
  return sessionCookie;
}

// Test CSV team import functionality
async function testCsvTeamImport() {
  try {
    // Always start with a fresh login for testing
    let cookies = await login();
    
    // Fetch import-eligible events to find a valid event ID
    console.log('Fetching import-eligible events...');
    const eventsResponse = await apiRequest('/api/admin/import-eligible-events', 'GET', null, cookies);
    
    if (!eventsResponse.ok) {
      throw new Error(`Failed to fetch events: ${JSON.stringify(eventsResponse.data)}`);
    }
    
    if (!Array.isArray(eventsResponse.data) || eventsResponse.data.length === 0) {
      throw new Error('No import-eligible events found. Please create an event first.');
    }
    
    // Use the first event as our test target
    const testEvent = eventsResponse.data[0];
    console.log(`Using event: ${testEvent.name} (ID: ${testEvent.id})`);
    
    // Fetch age groups for this event
    console.log('Fetching age groups for the event...');
    const ageGroupsResponse = await apiRequest(`/api/events/${testEvent.id}/age-groups`, 'GET', null, cookies);
    
    if (!ageGroupsResponse.ok) {
      throw new Error(`Failed to fetch age groups: ${JSON.stringify(ageGroupsResponse.data)}`);
    }
    
    if (!Array.isArray(ageGroupsResponse.data) || ageGroupsResponse.data.length === 0) {
      throw new Error('No age groups found for this event. Please add age groups first.');
    }
    
    console.log(`Found ${ageGroupsResponse.data.length} age groups for this event.`);
    
    // Create a simple CSV file for testing
    const ageGroup1 = ageGroupsResponse.data[0];
    const ageGroupName = `${ageGroup1.ageGroup} ${ageGroup1.gender}`;
    
    console.log(`Using age group: ${ageGroupName}`);
    
    const tempCsvPath = path.join(__dirname, 'temp_team_import.csv');
    const csvContent = `Team Name,Head Coach Name,Head Coach Email,Head Coach Phone,Manager Name,Manager Email,Manager Phone,Club Name,Age Group,Submitter Name,Submitter Email
Test Team CSV,John Doe,john@example.com,555-123-4567,Jane Smith,jane@example.com,555-987-6543,FC United,${ageGroupName},Admin User,admin@example.com`;
    
    fs.writeFileSync(tempCsvPath, csvContent);
    console.log('Created temporary CSV file for testing');
    
    // Upload the CSV file using FormData
    console.log('Uploading CSV file...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempCsvPath));
    formData.append('eventId', testEvent.id.toString());
    
    const uploadResponse = await apiRequest('/api/admin/import/teams', 'POST', formData, cookies);
    
    // Clean up the temporary file
    fs.unlinkSync(tempCsvPath);
    console.log('Deleted temporary CSV file');
    
    if (!uploadResponse.ok) {
      throw new Error(`CSV upload failed: ${JSON.stringify(uploadResponse.data)}`);
    }
    
    console.log('CSV upload successful!');
    console.log(`Imported ${uploadResponse.data.count} teams.`);
    
    // Print the details of the first team to verify division code and birth year
    if (uploadResponse.data.teams && uploadResponse.data.teams.length > 0) {
      const importedTeam = uploadResponse.data.teams[0];
      console.log('\nImported team details:');
      console.log(`Team Name: ${importedTeam.name}`);
      console.log(`Age Group ID: ${importedTeam.ageGroupId}`);
      console.log(`Division Code: ${importedTeam.divisionCode || 'Not set'}`);
      console.log(`Birth Year: ${importedTeam.birthYear || 'Not set'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the test
testCsvTeamImport()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });