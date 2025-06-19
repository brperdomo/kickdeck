/**
 * Test Welcome Email Registration Flow
 * 
 * This script tests the complete registration flow with proper validation
 * and monitors for welcome email triggering.
 */

import fetch from 'node-fetch';

async function testWelcomeEmailRegistration() {
  console.log('Testing welcome email registration flow...');
  
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
  
  console.log(`Testing against: ${baseUrl}`);
  
  // Test registration with proper validation
  const testUser = {
    username: `testuser${Date.now()}`,
    email: 'hello@matchproteam.testinator.com',
    password: 'TestPass123!', // Meets special character requirement
    firstName: 'Hello',
    lastName: 'Testinator',
    phone: '555-1234567' // Required field
  };
  
  console.log('\nTesting registration with proper validation...');
  console.log(`Email: ${testUser.email}`);
  console.log(`Username: ${testUser.username}`);
  
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
      console.log('   Check server logs for welcome email trigger');
      
      try {
        const result = JSON.parse(responseText);
        console.log(`   User created with ID: ${result.user?.id}`);
        console.log(`   Authentication status: ${result.authenticated}`);
      } catch (parseError) {
        console.log('   Response not JSON format');
      }
    } else {
      console.log('❌ Registration failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Registration error');
    console.error(error.message);
  }
  
  // Wait a moment to let email processing complete
  console.log('\nWaiting 3 seconds for email processing...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n=== REGISTRATION TEST COMPLETE ===');
  console.log('Check the server console logs above for:');
  console.log('• "📧 TRIGGERING welcome email" message');
  console.log('• "✅ Welcome email sent" or error messages');
  console.log('• SendGrid API response details');
}

testWelcomeEmailRegistration().catch(console.error);