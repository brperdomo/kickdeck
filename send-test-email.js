/**
 * SendGrid Email Test Script
 * 
 * This script sends a simple test email using the SendGrid
 * configuration integrated with our email service.
 * 
 * Usage: 
 *   node send-test-email.js recipient@example.com sender@example.com
 */

import { sendEmail } from './server/services/emailService.js';

// Get the command line arguments
const recipient = process.argv[2];
const sender = process.argv[3] || 'noreply@example.com';

// Validate arguments
if (!recipient) {
  console.error('Error: No recipient email specified');
  console.log('Usage: node send-test-email.js recipient@example.com [sender@example.com]');
  process.exit(1);
}

console.log(`
==============================================
      SENDGRID EMAIL TEST
==============================================
`);

console.log(`Attempting to send test email from ${sender} to ${recipient}...`);

// Force production mode to actually send emails
process.env.NODE_ENV = 'production';

// Create a simple test email
const options = {
  to: recipient,
  from: `Test SendGrid <${sender}>`,
  subject: 'SendGrid Test Email',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2;">SendGrid Integration Test</h2>
      <p>This is a test email to verify that SendGrid integration is working correctly.</p>
      <p>If you're receiving this, it means that your SendGrid configuration is properly set up and functioning.</p>
      <hr />
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      <p style="font-size: 12px; color: #666;">This is an automated test message.</p>
    </div>
  `
};

// Send the test email
async function sendTestEmail() {
  try {
    await sendEmail(options);
    console.log('✅ Test email sent successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

sendTestEmail().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});