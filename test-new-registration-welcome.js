/**
 * Test New Registration Welcome Email
 * 
 * This script tests registration with a new email to trigger the welcome email flow.
 */

import fetch from 'node-fetch';

async function testNewRegistrationWelcome() {
  console.log('Testing new registration welcome email...');
  
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
  
  console.log(`Testing against: ${baseUrl}`);
  
  // Test registration with new email
  const timestamp = Date.now();
  const testUser = {
    username: `newuser${timestamp}`,
    email: `newuser${timestamp}@matchproteam.testinator.com`,
    password: 'TestPass123!',
    firstName: 'New',
    lastName: 'User',
    phone: '555-9876543'
  };
  
  console.log(`\nRegistering new user: ${testUser.email}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Registration successful');
      console.log(`   Status: ${response.status}`);
      
      try {
        const result = JSON.parse(responseText);
        console.log(`   User created with ID: ${result.user?.id}`);
        console.log(`   Authentication status: ${result.authenticated}`);
      } catch (parseError) {
        console.log('   Response not JSON format');
      }
      
      console.log('\n📧 Watch server logs for welcome email activity:');
      console.log('   - Look for "📧 TRIGGERING welcome email" message');
      console.log('   - Look for SendGrid template email sending');
      console.log('   - Check for any error messages');
      
    } else {
      console.log('❌ Registration failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Registration error');
    console.error(error.message);
  }
  
  // Wait for email processing
  console.log('\nWaiting 5 seconds for email processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n=== TEST COMPLETE ===');
  console.log(`Check ${testUser.email} inbox for welcome email`);
}

testNewRegistrationWelcome().catch(console.error);