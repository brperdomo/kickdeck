/**
 * Test Welcome Email Fix
 * 
 * This script tests the fixed welcome email template to ensure
 * new user registration emails are being delivered properly.
 */

import { sendTemplatedEmail } from './server/services/emailService.js';

const testEmail = 'bperdomo@zoho.com';
const testContext = {
  firstName: 'Bryan',
  lastName: 'Perdomo',
  email: testEmail,
  dashboardUrl: 'https://matchpro.ai/dashboard'
};

async function testWelcomeEmail() {
  try {
    console.log('Testing Welcome Email Fix');
    console.log('='.repeat(40));
    
    console.log(`Sending welcome email to: ${testEmail}`);
    console.log('Template context:', JSON.stringify(testContext, null, 2));
    
    // Test the welcome email template directly
    await sendTemplatedEmail(testEmail, 'welcome', testContext);
    
    console.log('\nWelcome email sent successfully!');
    console.log('Email should now be delivered to recipient inbox.');
    
  } catch (error) {
    console.error('\nWelcome email test failed:', error);
    throw error;
  }
}

testWelcomeEmail().catch(console.error);