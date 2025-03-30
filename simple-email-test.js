/**
 * Simple Email Test Script
 * This script tests sending emails using the configured SMTP settings
 */

import nodemailer from 'nodemailer';

// Get SMTP settings from environment variables
const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const username = process.env.SMTP_USER;
const password = process.env.SMTP_PASSWORD;
const secure = process.env.SMTP_SECURE === 'true';

// Test email recipient - will send to self by default
const TEST_RECIPIENT = process.argv[2] || process.env.SMTP_USER;

console.log(`
==============================================
      SIMPLE EMAIL TEST
==============================================
`);

// Check if all required environment variables are set
const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_SECURE'];
const missing = requiredVars.filter(name => !process.env[name]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please ensure all required environment variables are set');
  process.exit(1);
}

console.log(`Email configuration:
  Host: ${host}
  Port: ${port}
  User: ${username}
  Secure: ${secure}
  Recipient: ${TEST_RECIPIENT}
`);

// Create transporter
const transporter = nodemailer.createTransport({
  host,
  port: parseInt(port),
  secure,
  auth: {
    user: username,
    pass: password
  }
});

// Test SMTP connection
console.log('Testing SMTP connection...');
transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection successful!');
    return sendTestEmail();
  })
  .catch(error => {
    console.error('❌ SMTP connection failed:', error);
    process.exit(1);
  });

// Send test email
function sendTestEmail() {
  console.log(`Sending test email to ${TEST_RECIPIENT}...`);
  
  return transporter.sendMail({
    from: username,
    to: TEST_RECIPIENT,
    subject: 'Test Email from MatchPro Application',
    text: 'This is a test email to verify that the email service is working correctly.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a90e2;">MatchPro Email Test</h2>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr/>
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `
  })
  .then(info => {
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nEmail service is properly configured and working!');
  })
  .catch(error => {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  });
}