/**
 * Test Enhanced Error Messages for Team Approval
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testEnhancedErrorMessages() {
  console.log('🧪 TESTING ENHANCED ERROR MESSAGES');
  console.log('==================================');
  
  // Test Team 472 (has burned payment method)
  console.log('\n1. Testing Team 472 (burned payment method)...');
  try {
    const response = await fetch('http://localhost:5000/api/admin/teams/472/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Testing enhanced error messages for burned payment method'
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Error: ${result.error}`);
    console.log(`Message: ${result.message}`);
    console.log(`Action Required: ${result.actionRequired}`);
    
  } catch (error) {
    console.error('Error testing Team 472:', error.message);
  }
  
  // Test Team 474 (missing payment method)
  console.log('\n2. Testing Team 474 (missing payment method)...');
  try {
    const response = await fetch('http://localhost:5000/api/admin/teams/474/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Testing enhanced error messages for missing payment method'
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Error: ${result.error}`);
    console.log(`Message: ${result.message}`);
    console.log(`Action Required: ${result.actionRequired}`);
    
  } catch (error) {
    console.error('Error testing Team 474:', error.message);
  }
  
  console.log('\n✅ Enhanced error message testing complete!');
}

testEnhancedErrorMessages().catch(console.error);