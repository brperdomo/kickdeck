/**
 * Test Password Reset Email with SendGrid
 * 
 * This script tests sending a password reset email using SendGrid.
 * It bypasses the normal password reset flow and directly uses the email service.
 */

import { sendPasswordResetEmail } from './server/services/emailService.js';

const TEST_EMAIL = process.argv[2];
const TEST_USERNAME = 'testuser';
const TEST_TOKEN = 'test-reset-token-123456789';

if (!TEST_EMAIL) {
  console.error('Please provide a test email address:');
  console.error('node test-password-reset-sendgrid.js your-email@example.com');
  process.exit(1);
}

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set!');
  process.exit(1);
}

console.log(`Sending test password reset email to: ${TEST_EMAIL}`);
console.log('Using SendGrid API key from environment variables');

async function testPasswordResetEmail() {
  try {
    // Call the actual password reset email function from the email service
    await sendPasswordResetEmail(TEST_EMAIL, TEST_TOKEN, TEST_USERNAME);
    console.log('✅ Password reset email sent successfully!');
    console.log('Please check your inbox (and spam folder) for the test email');
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
  }
}

testPasswordResetEmail()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });