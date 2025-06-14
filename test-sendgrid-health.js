/**
 * SendGrid Health Check Script
 * 
 * This script tests the current SendGrid configuration to identify
 * why emails might not be sending properly.
 */

import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
dotenv.config();

async function testSendGridHealth() {
  console.log('\n=== SendGrid Health Check ===\n');
  
  // Check API key
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY environment variable not found');
    return;
  }
  
  console.log(`✅ API Key found (length: ${apiKey.length} characters)`);
  console.log(`✅ API Key starts with: ${apiKey.substring(0, 10)}...`);
  
  // Initialize SendGrid
  sgMail.setApiKey(apiKey);
  
  // Test 1: Send a simple test email
  try {
    console.log('\n--- Test 1: Simple Email ---');
    
    const testMessage = {
      to: 'bperdomo@zoho.com', // Using your admin email
      from: 'support@matchpro.ai',
      subject: 'SendGrid Health Check - Simple Email',
      text: 'This is a test email to verify SendGrid is working.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>SendGrid Health Check</h2>
          <p>This is a test email to verify SendGrid is working properly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Test Type:</strong> Simple Email</p>
        </div>
      `
    };
    
    const response = await sgMail.send(testMessage);
    console.log(`✅ Simple email sent successfully`);
    console.log(`   Status: ${response[0].statusCode}`);
    console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.error('❌ Simple email test failed:');
    console.error('   Error:', error.message);
    if (error.response && error.response.body) {
      console.error('   SendGrid Response:', JSON.stringify(error.response.body, null, 2));
    }
  }
  
  // Test 2: Check sender verification
  try {
    console.log('\n--- Test 2: Sender Verification Check ---');
    
    // This will attempt to send and show if sender verification is the issue
    const verificationTest = {
      to: 'bperdomo@zoho.com',
      from: 'noreply@matchpro.ai', // Different sender to test verification
      subject: 'SendGrid Health Check - Sender Verification',
      text: 'Testing sender verification.',
      html: '<p>Testing sender verification with different from address.</p>'
    };
    
    const response = await sgMail.send(verificationTest);
    console.log(`✅ Sender verification test passed`);
    console.log(`   Status: ${response[0].statusCode}`);
    
  } catch (error) {
    console.error('❌ Sender verification test failed:');
    console.error('   Error:', error.message);
    if (error.response && error.response.body) {
      console.error('   SendGrid Response:', JSON.stringify(error.response.body, null, 2));
      
      // Check for specific sender verification errors
      const errorBody = error.response.body;
      if (errorBody.errors && errorBody.errors.some(e => e.message.includes('does not contain a valid address'))) {
        console.error('   ⚠️  ISSUE: Sender email address not verified with SendGrid');
        console.error('   ⚠️  SOLUTION: Verify sender addresses in SendGrid dashboard');
      }
    }
  }
  
  // Test 3: API Key validation
  try {
    console.log('\n--- Test 3: API Key Validation ---');
    
    // This will test if the API key itself is valid by making a simple API call
    const testValidation = {
      to: 'test@example.com', // Invalid email to test API response
      from: 'support@matchpro.ai',
      subject: 'API Key Test',
      text: 'Testing API key validity.'
    };
    
    await sgMail.send(testValidation);
    
  } catch (error) {
    if (error.response && error.response.body) {
      const errorBody = error.response.body;
      
      if (error.response.status === 401) {
        console.error('❌ API Key is invalid or expired');
      } else if (error.response.status === 403) {
        console.error('❌ API Key does not have sufficient permissions');
      } else if (errorBody.errors && errorBody.errors.some(e => e.field === 'to')) {
        console.log('✅ API Key is valid (caught expected email validation error)');
      } else {
        console.error('❌ Unexpected API error:', errorBody);
      }
    }
  }
  
  console.log('\n=== Health Check Complete ===\n');
}

// Run the health check
testSendGridHealth().catch(console.error);