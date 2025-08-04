#!/usr/bin/env node

import axios from 'axios';

async function testAdminAuthentication() {
  try {
    console.log('Testing admin authentication and API access...');
    
    // Create axios instance with cookie jar support
    const client = axios.create({
      baseURL: 'http://localhost:5000',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await client.post('/api/auth/login', {
      username: 'agent_tester',  
      password: 'agent123'
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Step 2: Test protected endpoint
    console.log('Step 2: Testing generate-complete-schedule endpoint...');
    const scheduleResponse = await client.post('/api/admin/events/1844329078/generate-complete-schedule', {
      autoMode: true
    });
    
    console.log('Schedule generation response:', scheduleResponse.data);
    
  } catch (error) {
    console.error('Error details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testAdminAuthentication();