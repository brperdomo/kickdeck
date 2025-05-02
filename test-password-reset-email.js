/**
 * Password Reset Email Test Script
 * 
 * This script tests sending password reset emails via the application's
 * email service, which now uses SendGrid as the primary provider.
 */

import { initiatePasswordReset } from './server/services/passwordResetService.js';

// Get command line arguments for the email to test with
const testEmail = process.argv[2];

if (!testEmail) {
  console.error('Error: Test email address is required');
  console.log('Usage: node test-password-reset-email.js your-email@example.com');
  process.exit(1);
}

console.log(`
==============================================
   PASSWORD RESET EMAIL TEST WITH SENDGRID
==============================================
`);

// Check if SendGrid API key is configured
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

console.log(`Testing password reset email to: ${testEmail}`);

// Simulate initiating a password reset
async function testPasswordResetEmail() {
  try {
    // Force development mode to see the reset URL in the logs
    process.env.NODE_ENV = 'development';
    
    console.log('Initiating password reset...');
    const result = await initiatePasswordReset(testEmail);
    
    if (result) {
      console.log('✅ Password reset initiated successfully!');
      console.log('Check the console logs above for the reset URL (in development mode)');
      process.exit(0);
    } else {
      console.error('❌ Failed to initiate password reset.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error initiating password reset:', error);
    process.exit(1);
  }
}

testPasswordResetEmail().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});