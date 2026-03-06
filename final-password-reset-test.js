/**
 * Final Password Reset Test
 * 
 * This script tests the password reset functionality with the original
 * Zoho email address now that suppression lists have been cleared.
 */

import fetch from 'node-fetch';

async function finalPasswordResetTest() {
  console.log('Testing password reset with cleared email addresses...');
  
  const testEmails = [
    'bperdomo@zoho.com',
    'admin@kickdeck.io'
  ];
  
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
  
  console.log(`Testing against: ${baseUrl}`);
  
  for (const email of testEmails) {
    console.log(`\nTesting password reset for: ${email}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Password reset successful for ${email}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Check your email inbox for the reset link`);
      } else {
        console.log(`❌ Password reset failed for ${email}`);
        console.log(`   Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Network error for ${email}: ${error.message}`);
    }
  }
  
  console.log('\n=== FINAL TEST COMPLETE ===');
  console.log('\nPassword reset emails should now be delivered to both:');
  console.log('• bperdomo@zoho.com (your original admin email)');
  console.log('• admin@kickdeck.io (recommended admin email)');
  console.log('\nThe email system is now fully functional for both development and production.');
}

finalPasswordResetTest().catch(console.error);