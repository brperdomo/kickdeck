/**
 * SendGrid Email Configuration Test Script
 * 
 * This script tests the new email configuration endpoint 
 * that updates all email templates to use SendGrid and 
 * sets support@matchpro.ai as the sender.
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const cookies = loadCookiesFromFile();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    // Get cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      saveCookiesToFile(setCookieHeader);
    }
    
    const responseData = await response.json().catch(() => null);
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData,
      cookies: setCookieHeader
    };
  } catch (error) {
    console.error(`API Request Error: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

// Helper to load cookies from file
function loadCookiesFromFile() {
  try {
    return fs.readFileSync('./cookies.txt', 'utf8');
  } catch (error) {
    return '';
  }
}

// Helper to save cookies to file
function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync('./cookies.txt', cookieStr);
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

// Login to get authentication cookies
async function login() {
  const credentials = {
    email: 'admin@example.com',
    password: 'password123'
  };
  
  console.log('Logging in...');
  const loginResponse = await apiRequest('/api/login', 'POST', credentials);
  
  if (!loginResponse.ok) {
    console.error('Login failed:', loginResponse.data);
    process.exit(1);
  }
  
  console.log('Login successful!');
  return loginResponse;
}

// Test the email configuration endpoint
async function testEmailConfig() {
  try {
    // First login to get authenticated
    await login();
    
    // Check SendGrid settings endpoint
    console.log('\nChecking SendGrid settings...');
    const settingsResponse = await apiRequest('/api/admin/sendgrid/settings');
    
    if (!settingsResponse.ok) {
      console.error('Failed to fetch SendGrid settings:', settingsResponse.data);
      return;
    }
    
    console.log('SendGrid Configuration:');
    console.log(JSON.stringify(settingsResponse.data, null, 2));
    
    // Check if SendGrid API key is configured
    if (!settingsResponse.data.apiKeySet) {
      console.error('\nERROR: SendGrid API key is not set in environment variables');
      console.log('Please set the SENDGRID_API_KEY environment variable and try again');
      return;
    }
    
    // Check if API key is valid
    if (!settingsResponse.data.apiKeyValid) {
      console.error('\nERROR: SendGrid API key is invalid');
      console.log('Please check your SendGrid API key and try again');
      return;
    }
    
    // Get template mappings
    console.log('\nChecking template mappings...');
    const mappingsResponse = await apiRequest('/api/admin/sendgrid/template-mappings');
    
    if (!mappingsResponse.ok) {
      console.error('Failed to fetch template mappings:', mappingsResponse.data);
      return;
    }
    
    console.log('Template Mappings:');
    
    const templates = mappingsResponse.data;
    const welcomeTemplate = templates.find(t => t.type === 'welcome');
    const adminWelcomeTemplate = templates.find(t => t.type === 'admin_welcome');
    
    console.log(`\nMember Welcome Template: ${welcomeTemplate?.name}`);
    console.log(`  SendGrid Template ID: ${welcomeTemplate?.sendgridTemplateId || 'Not assigned'}`);
    
    console.log(`\nAdmin Welcome Template: ${adminWelcomeTemplate?.name}`);
    console.log(`  SendGrid Template ID: ${adminWelcomeTemplate?.sendgridTemplateId || 'Not assigned'}`);
    
    // Check if templates are assigned
    const templatesNeedAssignment = [];
    if (!welcomeTemplate?.sendgridTemplateId) {
      templatesNeedAssignment.push('welcome');
    }
    if (!adminWelcomeTemplate?.sendgridTemplateId) {
      templatesNeedAssignment.push('admin_welcome');
    }
    
    if (templatesNeedAssignment.length > 0) {
      console.log('\nSome templates need SendGrid template assignment:');
      templatesNeedAssignment.forEach(type => {
        console.log(`  - ${type}`);
      });
      console.log('\nUse the assign-sendgrid-templates.js script to assign SendGrid templates');
    } else {
      console.log('\nAll required templates are mapped to SendGrid templates!');
      console.log('You can now test sending emails with test-both-welcome-emails.js');
    }
    
  } catch (error) {
    console.error('Error testing email configuration:', error);
  }
}

testEmailConfig();