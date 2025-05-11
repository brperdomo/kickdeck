/**
 * Direct SendGrid Email Test Script
 * 
 * This script sends a simple test email directly using the SendGrid API
 * without relying on the application's email service.
 * 
 * Usage: 
 *   node send-direct-test-email.js recipient@example.com sender@example.com
 */

import { MailService } from '@sendgrid/mail';

// Get the command line arguments
const recipient = process.argv[2];
const sender = process.argv[3] || 'noreply@matchpro.ai';

// Validate arguments
if (!recipient) {
  console.error('Error: No recipient email specified');
  console.log('Usage: node send-direct-test-email.js recipient@example.com [sender@example.com]');
  process.exit(1);
}

console.log(`
==============================================
      SENDGRID DIRECT EMAIL TEST
==============================================
`);

console.log(`Attempting to send test email from ${sender} to ${recipient}...`);

// Check for SendGrid API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

// Initialize the SendGrid client
const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

// Create a simple test email
const msg = {
  to: recipient,
  from: sender,
  subject: 'SendGrid Direct Test Email',
  text: 'This is a plain text test email sent directly through the SendGrid API.',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2;">SendGrid Direct Integration Test</h2>
      <p>This is a test email to verify that the SendGrid API key has been updated and is working correctly.</p>
      <p>If you're receiving this, it means that your SendGrid configuration is properly set up and functioning.</p>
      <hr />
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p style="font-size: 12px; color: #666;">This is an automated test message.</p>
    </div>
  `
};

// Send the test email
async function sendTestEmail() {
  try {
    const response = await mailService.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log(`Response status code: ${response[0].statusCode}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error(error);
    if (error.response) {
      console.error('SendGrid API error response:');
      console.error(error.response.body);
    }
    process.exit(1);
  }
}

sendTestEmail().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});