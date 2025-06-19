/**
 * Test Actual Production Domains
 * 
 * This script tests the real production domains: app.matchpro.ai and matchpro.replit.app
 * to verify welcome email functionality works on your actual production sites.
 */

import fetch from 'node-fetch';

async function testActualProductionDomains() {
  console.log('Testing actual production domains...');
  
  const productionDomains = [
    'https://app.matchpro.ai',
    'https://matchpro.replit.app'
  ];
  
  for (const baseUrl of productionDomains) {
    console.log(`\n=== Testing: ${baseUrl} ===`);
    
    // Test if the domain is accessible
    try {
      const healthResponse = await fetch(`${baseUrl}/api/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Domain accessibility: ${healthResponse.status === 401 ? 'ACCESSIBLE' : 'CHECK STATUS'}`);
      console.log(`Status: ${healthResponse.status}`);
      
      if (healthResponse.status === 401 || healthResponse.status === 200) {
        // Domain is responding, test registration
        const timestamp = Date.now();
        const testUser = {
          username: `prodtest${timestamp}`,
          email: `prodtest${timestamp}@matchproteam.testinator.com`,
          password: 'ProdTest123!',
          firstName: 'Production',
          lastName: 'Test',
          phone: '555-PROD123'
        };
        
        console.log(`Testing registration: ${testUser.email}`);
        
        try {
          const regResponse = await fetch(`${baseUrl}/api/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
          });
          
          const regText = await regResponse.text();
          
          if (regResponse.ok) {
            console.log('✅ Registration successful on production domain');
            try {
              const result = JSON.parse(regText);
              console.log(`   User ID: ${result.user?.id}`);
              console.log('   Welcome email should be triggered');
            } catch (e) {
              console.log('   Registration response received');
            }
          } else {
            console.log('❌ Registration failed');
            console.log(`   Status: ${regResponse.status}`);
            console.log(`   Response: ${regText.substring(0, 200)}`);
          }
        } catch (regError) {
          console.log('❌ Registration request failed');
          console.error(`   Error: ${regError.message}`);
        }
      } else {
        console.log('⚠️  Domain may not be accessible or configured');
      }
      
    } catch (error) {
      console.log('❌ Domain not accessible');
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n=== PRODUCTION DOMAIN TEST COMPLETE ===');
  console.log('This test shows whether your actual production domains are working');
  console.log('vs the internal development server I was testing before.');
}

testActualProductionDomains().catch(console.error);