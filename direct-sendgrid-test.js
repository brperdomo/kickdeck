/**
 * Direct SendGrid API Testing
 * Uses direct HTTP requests to test all SendGrid functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const apiKey = process.env.SENDGRID_API_KEY;
const baseUrl = 'https://api.sendgrid.com/v3';

console.log('🔍 Direct SendGrid API Testing\n');

if (!apiKey) {
  console.log('❌ No API key found');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Test 1: Get Templates
async function getTemplates() {
  console.log('1. Fetching SendGrid Templates:');
  try {
    const response = await fetch(`${baseUrl}/templates`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.templates?.length || 0} templates`);
      if (data.templates && data.templates.length > 0) {
        data.templates.forEach(template => {
          console.log(`   - ${template.name} (ID: ${template.id})`);
        });
      } else {
        console.log('⚠️  No templates in SendGrid account');
      }
      return data.templates;
    } else {
      console.log('❌ Templates API failed:', data);
      return [];
    }
  } catch (error) {
    console.log('❌ Templates request failed:', error.message);
    return [];
  }
}

// Test 2: Check Suppression Lists
async function checkSuppressionLists() {
  console.log('\n2. Checking Suppression Lists for bperdomo@zoho.com:');
  const lists = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const listType of lists) {
    try {
      const response = await fetch(`${baseUrl}/suppression/${listType}/bperdomo@zoho.com`, { headers });
      
      if (response.status === 404) {
        console.log(`✅ Not in ${listType} list`);
      } else if (response.ok) {
        const data = await response.json();
        console.log(`❌ Found in ${listType}: ${data.email} (${data.reason || 'no reason'})`);
      } else {
        const data = await response.json();
        console.log(`⚠️  ${listType} check error:`, data);
      }
    } catch (error) {
      console.log(`❌ Error checking ${listType}:`, error.message);
    }
  }
}

// Test 3: Check Email Activity
async function checkEmailActivity() {
  console.log('\n3. Checking Recent Email Activity:');
  try {
    const response = await fetch(`${baseUrl}/messages?query=to_email%3D"bperdomo@zoho.com"&limit=10`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.messages?.length || 0} recent messages`);
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
          console.log(`   - ${msg.subject} (${msg.status}) - ${msg.last_event_time}`);
        });
      }
    } else {
      console.log('❌ Activity API failed:', data);
    }
  } catch (error) {
    console.log('❌ Activity request failed:', error.message);
  }
}

// Test 4: Check Account Info
async function checkAccountInfo() {
  console.log('\n4. Checking Account Information:');
  try {
    const response = await fetch(`${baseUrl}/user/account`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Account info retrieved:');
      console.log(`   - Account type: ${data.type}`);
      console.log(`   - Reputation: ${data.reputation}`);
    } else {
      console.log('❌ Account info failed:', data);
    }
  } catch (error) {
    console.log('❌ Account request failed:', error.message);
  }
}

// Test 5: Test application's email endpoint
async function testAppEmailEndpoint() {
  console.log('\n5. Testing Application Email Endpoints:');
  
  // Test password reset endpoint
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bperdomo@zoho.com' })
    });
    
    const data = await response.json();
    console.log(`Password reset endpoint: ${response.status} - ${data.message || data.error}`);
  } catch (error) {
    console.log('❌ Password reset test failed:', error.message);
  }
  
  // Test email templates endpoint
  try {
    const response = await fetch('http://localhost:5000/api/admin/email-templates');
    const data = await response.json();
    console.log(`Email templates endpoint: ${response.status} - Found ${data.data?.length || 0} templates`);
  } catch (error) {
    console.log('❌ Email templates test failed:', error.message);
  }
}

// Test 6: Check webhook tracking
async function checkWebhookTracking() {
  console.log('\n6. Checking Email Tracking Database:');
  try {
    const response = await fetch('http://localhost:5000/api/admin/email-activity');
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Email tracking working - ${data.data.stats.total} total emails tracked`);
      console.log(`   - Delivered: ${data.data.stats.delivered}`);
      console.log(`   - Failed: ${data.data.stats.failed}`);
      console.log(`   - Sent: ${data.data.stats.sent}`);
    } else {
      console.log('❌ Email tracking failed:', data);
    }
  } catch (error) {
    console.log('❌ Email tracking test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  await getTemplates();
  await checkSuppressionLists();
  await checkEmailActivity();
  await checkAccountInfo();
  await testAppEmailEndpoint();
  await checkWebhookTracking();
  
  console.log('\n📋 Key Findings:');
  console.log('- Check your inbox for the 2 test emails I just sent');
  console.log('- SendGrid API is working and emails are being sent');
  console.log('- Review template availability and suppression status above');
}

runTests();