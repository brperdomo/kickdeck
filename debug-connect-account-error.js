/**
 * Debug Connect Account Creation Error
 * 
 * This script tests the exact API call failing in production
 * to identify the root cause of the 500 error.
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_EVENT_ID = '1825427780';

async function debugConnectAccountError() {
  console.log('🔍 Debugging Connect Account Creation Error...\n');
  
  try {
    // First, check if we can authenticate
    console.log('1. Testing authentication...');
    const authResponse = await axios.get(`${BASE_URL}/api/user`);
    console.log('Auth status:', authResponse.status);
  } catch (authError) {
    console.log('Authentication failed:', authError.response?.status || authError.message);
    console.log('This is expected in development - continuing with direct API test...\n');
  }

  // Test the exact failing endpoint
  console.log('2. Testing Connect Account Creation...');
  try {
    const response = await axios.post(`${BASE_URL}/api/events/${TEST_EVENT_ID}/connect-account`, {
      email: 'test@example.com',
      businessName: 'Test Tournament',
      country: 'US',
      type: 'standard'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error);
    console.log('Error details:', error.response?.data?.details);
    console.log('Error type:', error.response?.data?.type);
    console.log('Error code:', error.response?.data?.code);
    
    if (error.response?.data?.details) {
      console.log('\n🔍 Detailed error analysis:');
      const details = error.response.data.details;
      
      if (details.includes('authentication') || details.includes('Authentication')) {
        console.log('- This appears to be an authentication error');
      }
      
      if (details.includes('stripe') || details.includes('Stripe')) {
        console.log('- This appears to be a Stripe API error');
      }
      
      if (details.includes('database') || details.includes('Database')) {
        console.log('- This appears to be a database error');
      }
      
      if (details.includes('permission') || details.includes('Permission')) {
        console.log('- This appears to be a permission error');
      }
    }
  }
  
  // Test event existence
  console.log('\n3. Testing event existence...');
  try {
    const eventResponse = await axios.get(`${BASE_URL}/api/events/${TEST_EVENT_ID}`);
    console.log('✅ Event exists:', eventResponse.data.name);
  } catch (eventError) {
    console.log('❌ Event lookup failed:', eventError.response?.status || eventError.message);
  }
}

// Run the debug script
debugConnectAccountError().catch(console.error);