/**
 * Simple SendGrid Email Test
 * 
 * This script uses SendGrid's mail service directly without
 * relying on the application's email service layer.
 * 
 * Usage:
 *   node test-sendgrid-direct.js recipient@example.com sender@example.com
 * 
 * Note: The sender email must be verified in your SendGrid account.
 */

import { MailService } from '@sendgrid/mail';

// Get command line arguments
const recipient = process.argv[2];
const sender = process.argv[3] || 'support@matchpro.ai'; // Using verified sender

// Validate inputs
if (!recipient) {
  console.error('Error: Recipient email is required');
  console.log('Usage: node test-sendgrid-direct.js recipient@example.com [sender@example.com]');
  process.exit(1);
}

console.log(`
==============================================
      SENDGRID DIRECT EMAIL TEST
==============================================
`);

// Check for API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

// Initialize the SendGrid client
const sgMail = new MailService();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log(`Sending test email to: ${recipient}`);
console.log(`From: ${sender}`);

// Create a test email
const message = {
  to: recipient,
  from: sender, // Must be verified with SendGrid
  subject: 'SendGrid Test Email from Node.js',
  text: 'This is a test email to verify SendGrid is working correctly with Node.js.',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2;">SendGrid Test Successful!</h2>
      <p>This is a test email to verify that your SendGrid integration is working correctly.</p>
      <p>If you're reading this, the test was successful!</p>
      <hr />
      <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
      <p style="font-size: 12px; color: #666;">This is an automated test message sent directly using @sendgrid/mail.</p>
    </div>
  `
};

// Send the email
async function sendTestEmail() {
  try {
    const response = await sgMail.send(message);
    console.log('✅ Test email sent successfully!');
    console.log(`Response status code: ${response[0].statusCode}`);
    console.log(`Headers: ${JSON.stringify(response[0].headers, null, 2)}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error(error);
    if (error.response) {
      console.error('SendGrid API error response:');
      console.error(error.response.body);
    }
    process.exit(1);
  }
}

sendTestEmail().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});