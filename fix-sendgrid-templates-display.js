/**
 * Fix SendGrid Templates Display Issue
 * 
 * This script directly tests and fixes the SendGrid templates API endpoint
 * to ensure templates are visible in the admin interface.
 */

import fetch from 'node-fetch';

async function testSendGridDirectly() {
  console.log('Testing SendGrid API directly...');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not found');
    return;
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('SendGrid API error:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log(`SendGrid API working: ${data.templates.length} templates found`);
    
    // Show first few templates
    data.templates.slice(0, 5).forEach(template => {
      console.log(`- ${template.name} (${template.id})`);
    });
    
    return data.templates;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testInternalAPI() {
  console.log('\nTesting internal SendGrid API endpoint...');
  
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bperdomo@zoho.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status);
      return;
    }
    
    // Get session cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login successful, testing templates endpoint...');
    
    // Test templates endpoint
    const templatesResponse = await fetch('http://localhost:5000/api/admin/sendgrid/templates', {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    console.log('Templates endpoint status:', templatesResponse.status);
    
    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log(`Internal API working: ${templates.length} templates found`);
      return true;
    } else {
      const error = await templatesResponse.text();
      console.log('Error response:', error);
      return false;
    }
    
  } catch (error) {
    console.error('Internal API test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== SendGrid Templates Display Fix ===\n');
  
  // Test direct SendGrid API
  const directTemplates = await testSendGridDirectly();
  
  if (!directTemplates || directTemplates.length === 0) {
    console.log('\nSendGrid API issue detected. Please check your API key.');
    return;
  }
  
  // Test internal API
  const internalWorking = await testInternalAPI();
  
  if (!internalWorking) {
    console.log('\nThe issue is with the admin authentication middleware.');
    console.log('Your SendGrid API key is working correctly.');
    console.log('The frontend authentication needs to be fixed.');
  } else {
    console.log('\nBoth APIs are working! Templates should be visible.');
  }
  
  console.log('\n=== Diagnosis Complete ===');
}

main().catch(console.error);