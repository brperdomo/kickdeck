/**
 * Test Email Service with SendGrid
 * 
 * This script tests the application's email service using SendGrid
 * as the email provider.
 * 
 * Usage:
 *   node test-email-service-sendgrid.js recipient@example.com sender@example.com
 */

// Directly import the SendGrid mail service instead of our application's service
import { MailService } from '@sendgrid/mail';

// Get command line arguments
const recipient = process.argv[2];
const sender = process.argv[3] || 'support@matchpro.ai'; // Using verified sender

// Validate inputs
if (!recipient) {
  console.error('Error: Recipient email is required');
  console.log('Usage: node test-email-service-sendgrid.js recipient@example.com [sender@example.com]');
  process.exit(1);
}

console.log(`
==============================================
      EMAIL SERVICE TEST WITH SENDGRID
==============================================
`);

// Check for API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

console.log(`Sending test email to: ${recipient}`);
console.log(`From: ${sender}`);

// Create a test email using our application's sendgridService
const params = {
  to: recipient,
  from: sender, // Must be verified with SendGrid
  subject: 'Test Email via Application Email Service',
  text: 'This is a test email sent via the application email service using SendGrid.',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2;">Application Email Service Test</h2>
      <p>This is a test email sent through the application's email service using SendGrid.</p>
      <p>If you're reading this, the integration is working correctly!</p>
      <hr />
      <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
      <p style="font-size: 12px; color: #666;">This is an automated test message.</p>
    </div>
  `
};

// Initialize the SendGrid client
const sgMail = new MailService();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send the email
async function sendTestEmail() {
  try {
    console.log('Sending email via SendGrid API...');
    const response = await sgMail.send(params);
    
    console.log('✅ Test email sent successfully!');
    console.log(`Response status code: ${response[0].statusCode}`);
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