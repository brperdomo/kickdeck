/**
 * Test script for testing event filtering
 * 
 * This script validates that non-super-admin users only see events they're assigned to
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Cookie management functions
function loadCookiesFromFile() {
  try {
    return fs.readFileSync('cookies.txt', 'utf8');
  } catch (error) {
    return '';
  }
}

function saveCookiesToFile(cookieStr) {
  fs.writeFileSync('cookies.txt', cookieStr);
  console.log('Saved cookies to file');
}

// Helper for API requests
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    credentials: 'include'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`Making ${method} request to ${url}`);
  const response = await fetch(url, options);
  
  // Extract and save the cookies
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    saveCookiesToFile(setCookieHeader);
  }

  const responseData = await response.json().catch(() => null);
  
  return {
    ok: response.ok,
    status: response.status,
    data: responseData,
    cookies: setCookieHeader || cookies
  };
}

// Test login as Finance Guy
async function loginAsFinanceGuy() {
  const loginData = {
    email: 'finance@example.com',
    password: 'password123'
  };

  const response = await apiRequest('/api/login', 'POST', loginData);
  
  if (!response.ok) {
    console.error('Failed to login:', response.status, response.data);
    throw new Error('Login failed');
  }
  
  console.log('Successfully logged in as Finance Guy');
  return response.cookies;
}

// Test event filtering
async function testEventFiltering(cookies) {
  // Get events as Finance Guy
  const eventsResponse = await apiRequest('/api/admin/events', 'GET', null, cookies);
  
  if (!eventsResponse.ok) {
    console.error('Failed to fetch events:', eventsResponse.status, eventsResponse.data);
    throw new Error('Failed to fetch events');
  }
  
  console.log('Events accessible to Finance Guy:', eventsResponse.data.length);
  console.log('Events data:', JSON.stringify(eventsResponse.data, null, 2));
  
  // Verify Finance Guy only sees the one event they're assigned to
  if (eventsResponse.data.length === 1 && eventsResponse.data[0].id === 1251362271) {
    console.log('✅ SUCCESS: Finance Guy only sees the one event they are assigned to!');
  } else {
    console.log('❌ FAILURE: Finance Guy sees more events than expected or wrong event!');
    console.log(`Expected 1 event with ID 1251362271, got ${eventsResponse.data.length} events`);
  }
}

// Main test function
async function main() {
  try {
    console.log('Testing event filtering for Finance Guy...');
    
    // Login first
    const cookies = await loginAsFinanceGuy();
    
    // Test event filtering
    await testEventFiltering(cookies);
    
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the tests
main();