/**
 * Test Admin Authentication for SendGrid Settings
 * 
 * This script tests the authentication flow for accessing SendGrid settings
 * to verify that admin users can properly access the endpoints.
 */

import fetch from 'node-fetch';

console.log('Testing Admin Authentication for SendGrid Settings\n');

async function testAuthenticationFlow() {
  try {
    // Test 1: Check user endpoint (should show current user info)
    console.log('1. Testing current user endpoint:');
    const userResponse = await fetch('http://localhost:5000/api/user', {
      credentials: 'include'
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log(`   ✅ User endpoint accessible`);
      console.log(`   User: ${userData.username || userData.email || 'N/A'}`);
      console.log(`   Is Admin: ${userData.isAdmin}`);
      console.log(`   Roles: ${userData.roles || 'none'}`);
    } else {
      console.log(`   ❌ User endpoint failed: ${userResponse.status}`);
      console.log('   User may not be logged in or session expired');
    }

    // Test 2: Test SendGrid settings endpoint
    console.log('\n2. Testing SendGrid settings endpoint:');
    const sendgridResponse = await fetch('http://localhost:5000/api/admin/sendgrid/settings', {
      credentials: 'include'
    });
    
    if (sendgridResponse.ok) {
      const sendgridData = await sendgridResponse.json();
      console.log(`   ✅ SendGrid settings accessible`);
      console.log(`   API Key configured: ${sendgridData.apiKeySet}`);
      console.log(`   Templates with mappings: ${sendgridData.templatesWithSendGrid?.length || 0}`);
    } else {
      const errorData = await sendgridResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.log(`   ❌ SendGrid settings failed: ${sendgridResponse.status}`);
      console.log(`   Error: ${errorData.error}`);
    }

    // Test 3: Test SendGrid templates endpoint
    console.log('\n3. Testing SendGrid templates endpoint:');
    const templatesResponse = await fetch('http://localhost:5000/api/admin/sendgrid/templates', {
      credentials: 'include'
    });
    
    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log(`   ✅ SendGrid templates accessible`);
      console.log(`   Templates found: ${templatesData.templates?.length || 0}`);
    } else {
      const errorData = await templatesResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.log(`   ❌ SendGrid templates failed: ${templatesResponse.status}`);
      console.log(`   Error: ${errorData.error}`);
    }

  } catch (error) {
    console.log(`❌ Authentication test error: ${error.message}`);
  }
}

async function main() {
  console.log('Note: This test requires you to be logged in to the web application');
  console.log('Please ensure you are logged in as an admin user before running this test\n');
  
  await testAuthenticationFlow();
  
  console.log('\n📋 Instructions:');
  console.log('1. Open your browser and log in to the admin panel');
  console.log('2. Navigate to the SendGrid settings page');
  console.log('3. The authentication middleware should now properly validate your admin access');
  console.log('4. Check the browser developer console for detailed authentication logs');
}

main();