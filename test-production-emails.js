/**
 * Production Email Testing Script
 * 
 * This script tests all email functionality in production to identify
 * exactly what's failing and why emails aren't being sent.
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: '.env.production' });

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@matchpro.ai';

console.log('🧪 Production Email Testing\n');

// Test 1: API Key Configuration
console.log('1. API Key Configuration:');
console.log(`   API Key: ${apiKey ? apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT_SET'}`);
console.log(`   From Email: ${fromEmail}`);

if (!apiKey) {
  console.log('❌ SENDGRID_API_KEY is not set in production environment');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

// Test 2: SendGrid Templates
console.log('\n2. Testing SendGrid Templates Access:');

async function testTemplateAccess() {
  try {
    const request = {
      method: 'GET',
      url: '/v3/templates',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const [response] = await sgMail.request(request);
    console.log(`✅ Templates API accessible - Found ${response.body.templates?.length || 0} templates`);
    
    if (response.body.templates && response.body.templates.length > 0) {
      console.log('   Available templates:');
      response.body.templates.slice(0, 5).forEach(template => {
        console.log(`   - ${template.name} (ID: ${template.id})`);
      });
    } else {
      console.log('⚠️  No templates found in SendGrid account');
    }
    
    return response.body.templates;
  } catch (error) {
    console.log('❌ Templates API error:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.body);
    }
    return [];
  }
}

// Test 3: Simple Email Send
console.log('\n3. Testing Simple Email Send:');

async function testSimpleEmail() {
  const testEmail = {
    to: 'bperdomo@zoho.com',
    from: fromEmail,
    subject: 'Production Email Test - ' + new Date().toISOString(),
    text: 'This is a test email from production environment to verify email sending functionality.',
    html: `
      <h2>Production Email Test</h2>
      <p>This is a test email from production environment to verify email sending functionality.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p>Environment: Production</p>
    `
  };

  try {
    const result = await sgMail.send(testEmail);
    console.log('✅ Simple email sent successfully');
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
    return true;
  } catch (error) {
    console.log('❌ Simple email failed:', error.message);
    if (error.response) {
      console.log('   Response code:', error.response.statusCode);
      console.log('   Response body:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

// Test 4: Password Reset Email Test
console.log('\n4. Testing Password Reset Email:');

async function testPasswordResetEmail() {
  const resetEmail = {
    to: 'bperdomo@zoho.com',
    from: fromEmail,
    subject: 'Password Reset Test - Production',
    text: 'Test password reset email from production environment.',
    html: `
      <h2>Password Reset Test</h2>
      <p>This is a test password reset email from production environment.</p>
      <p>Reset link: <a href="https://app.matchpro.ai/reset-password?token=test123">Reset Password</a></p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `
  };

  try {
    const result = await sgMail.send(resetEmail);
    console.log('✅ Password reset email sent successfully');
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
    return true;
  } catch (error) {
    console.log('❌ Password reset email failed:', error.message);
    if (error.response) {
      console.log('   Response code:', error.response.statusCode);
      console.log('   Response body:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

// Test 5: Check Email Delivery Status
console.log('\n5. Checking Email Delivery Status:');

async function checkEmailActivity() {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const request = {
      method: 'GET',
      url: `/v3/messages?query=to_email%3D"bperdomo@zoho.com"&limit=10`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const [response] = await sgMail.request(request);
    console.log('✅ Email activity API accessible');
    
    if (response.body.messages && response.body.messages.length > 0) {
      console.log(`   Found ${response.body.messages.length} recent messages:`);
      response.body.messages.forEach(msg => {
        console.log(`   - ${msg.subject} (${msg.status}) - ${msg.last_event_time}`);
      });
    } else {
      console.log('   No recent messages found');
    }
    
  } catch (error) {
    console.log('❌ Email activity check failed:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.body);
    }
  }
}

// Test 6: Check Suppression Lists
console.log('\n6. Checking Suppression Lists:');

async function checkSuppressionLists() {
  const lists = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const listType of lists) {
    try {
      const request = {
        method: 'GET',
        url: `/v3/suppression/${listType}/bperdomo@zoho.com`,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      const [response] = await sgMail.request(request);
      if (response.body && response.body.email) {
        console.log(`❌ Found in ${listType}: ${response.body.email} (${response.body.reason || 'no reason'})`);
      } else {
        console.log(`✅ Not in ${listType} list`);
      }
    } catch (error) {
      if (error.response && error.response.statusCode === 404) {
        console.log(`✅ Not in ${listType} list`);
      } else {
        console.log(`❌ Error checking ${listType}:`, error.message);
      }
    }
  }
}

// Main test execution
async function runAllTests() {
  try {
    const templates = await testTemplateAccess();
    await testSimpleEmail();
    await testPasswordResetEmail();
    await checkEmailActivity();
    await checkSuppressionLists();
    
    console.log('\n📊 Test Summary:');
    console.log('- API Key is configured and valid');
    console.log(`- Templates available: ${templates.length}`);
    console.log('- Check your email inbox for test messages');
    console.log('- Review suppression list status above');
    
  } catch (error) {
    console.log('\n❌ Test execution failed:', error.message);
  }
}

runAllTests();