/**
 * Production Email Flow Test
 * Tests the complete email flow through the application's API endpoints
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const TEST_EMAIL = 'bperdomo@zoho.com';
const BASE_URL = process.env.PRODUCTION_URL || 'https://matchpro.ai';

async function testProductionEmailFlow() {
  console.log('\n🧪 PRODUCTION EMAIL FLOW TEST');
  console.log('==============================\n');

  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test email: ${TEST_EMAIL}`);
  console.log('');

  // Test 1: Password Reset Email
  console.log('1. Testing Password Reset Email Flow:');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });

    const data = await response.json();
    
    console.log(`   Response Status: ${response.status}`);
    console.log(`   Response Data:`, data);
    
    if (response.ok && data.success) {
      console.log('   ✅ Password reset endpoint responded successfully');
      console.log('   📧 Check your email for the password reset link');
    } else {
      console.log('   ❌ Password reset endpoint failed');
    }
  } catch (error) {
    console.log(`   ❌ Password reset test failed: ${error.message}`);
  }

  console.log('');

  // Test 2: Check if there are any recent email template errors in the database
  console.log('2. Testing Email Template Availability:');
  try {
    // We can't directly access the database from this script, but we can test
    // if the email endpoints are working by checking the API response patterns
    console.log('   Password reset flow completed - check server logs for template errors');
  } catch (error) {
    console.log(`   ❌ Template check failed: ${error.message}`);
  }

  console.log('\n🏁 Test Complete');
  console.log('=================');
  console.log('\nNext steps if emails still not received:');
  console.log('1. Check SendGrid Activity Feed for delivery status');
  console.log('2. Verify sender authentication (SPF/DKIM) in SendGrid');
  console.log('3. Check spam/junk folders');
  console.log('4. Verify recipient email is not on suppression lists');
  console.log('5. Review server logs for any PRODUCTION EMAIL ERROR DETAILS');
}

testProductionEmailFlow().catch(console.error);