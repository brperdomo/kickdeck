/**
 * Test Welcome Email with goodbye@matchproteam.testinator.com
 * 
 * This script tests registration and welcome email functionality on actual
 * production domains using the specified email address.
 */

import fetch from 'node-fetch';

async function testGoodbyeEmailProduction() {
  console.log('Testing welcome email with goodbye@matchproteam.testinator.com...');
  
  const productionDomains = [
    'https://app.matchpro.ai',
    'https://matchpro.replit.app'
  ];
  
  for (const baseUrl of productionDomains) {
    console.log(`\n=== Testing: ${baseUrl} ===`);
    
    const testUser = {
      username: `goodbye${Date.now()}`,
      email: 'goodbye@matchproteam.testinator.com',
      password: 'Goodbye123!',
      firstName: 'Good',
      lastName: 'Bye',
      phone: '555-GOODBYE'
    };
    
    console.log(`Registering: ${testUser.email}`);
    
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
        try {
          const result = JSON.parse(responseText);
          console.log(`   User ID: ${result.user?.id}`);
          console.log(`   Authentication: ${result.authenticated}`);
          console.log('   Welcome email triggered automatically');
        } catch (e) {
          console.log('   Registration completed successfully');
        }
      } else {
        console.log(`Registration status: ${response.status}`);
        console.log(`Response: ${responseText.substring(0, 300)}`);
        
        if (responseText.includes('already exists')) {
          console.log('ℹ️  User already exists - welcome email only sends for new registrations');
        }
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('Check goodbye@matchproteam.testinator.com inbox for welcome email');
  console.log('Welcome emails are sent via SendGrid dynamic template d-6064756d74914ec79b3a3586f6713424');
}

testGoodbyeEmailProduction().catch(console.error);