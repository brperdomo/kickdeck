/**
 * Test SendGrid Admin API Access
 * 
 * This script tests the exact API calls that the admin interface makes
 * to diagnose why SendGrid templates aren't appearing.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'bperdomo@zoho.com',
      password: 'admin123'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  // Get cookies from response
  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function testSendGridAPI(cookies) {
  console.log('Testing SendGrid templates API...');
  
  const response = await fetch(`${BASE_URL}/api/admin/sendgrid/templates`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log(`Status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response:', errorText);
    return;
  }
  
  const data = await response.json();
  console.log(`Found ${data.length} templates:`);
  
  data.slice(0, 3).forEach(template => {
    console.log(`- ${template.name} (${template.id})`);
  });
}

async function testTemplateMappings(cookies) {
  console.log('\nTesting template mappings API...');
  
  const response = await fetch(`${BASE_URL}/api/admin/sendgrid/template-mappings`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log(`Status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response:', errorText);
    return;
  }
  
  const data = await response.json();
  console.log(`Found ${data.length} email templates in database`);
}

async function main() {
  try {
    const cookies = await login();
    console.log('Login successful');
    
    await testSendGridAPI(cookies);
    await testTemplateMappings(cookies);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

main();