/**
 * SendGrid Email Test Script
 * 
 * This script tests sending emails using the SendGrid API
 * It's meant to verify that the payment confirmation emails
 * and account creation emails can be sent properly
 */

import { MailService } from '@sendgrid/mail';

// Initialize the SendGrid client
const sgMail = new MailService();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Test email recipient - replace with your email to receive the test message
const TEST_RECIPIENT = process.argv[2] || "your-email@example.com";
// Sender email - must be verified in your SendGrid account
const SENDER_EMAIL = process.argv[3] || "your-verified-email@example.com";

console.log(`
==============================================
      SENDGRID EMAIL TEST
==============================================
`);

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ Missing SENDGRID_API_KEY environment variable');
  process.exit(1);
}

console.log(`Sending test email to: ${TEST_RECIPIENT}`);

// Simulate a payment confirmation email
async function sendTestPaymentEmail() {
  const msg = {
    to: TEST_RECIPIENT,
    from: SENDER_EMAIL, // Must be your verified sender email in SendGrid
    subject: 'Test Payment Confirmation - MatchPro',
    text: 'This is a test payment confirmation email to verify that SendGrid is working correctly.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a90e2;">MatchPro Payment Confirmation</h2>
        <p>This is a test email to verify that payment confirmation emails will be sent correctly.</p>
        
        <div style="background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Payment Details (TEST)</h3>
          <p><strong>Team:</strong> Test Team</p>
          <p><strong>Event:</strong> Test Tournament</p>
          <p><strong>Amount:</strong> $100.00</p>
          <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Transaction ID:</strong> TEST-TRANS-${Date.now().toString().slice(-6)}</p>
        </div>
        
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr/>
        <p style="color: #666; font-size: 12px;">This is an automated test message, please do not reply.</p>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Test payment email sent successfully!');
    console.log(`Response: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending test payment email:');
    console.error(error.response ? error.response.body : error);
    return false;
  }
}

// Simulate a welcome/account creation email
async function sendTestWelcomeEmail() {
  const msg = {
    to: TEST_RECIPIENT,
    from: 'noreply@matchpro.ai', // Use the verified sender from your SendGrid account
    subject: 'Welcome to MatchPro - Test Account Created',
    text: 'This is a test welcome email to verify that account creation notifications are working correctly.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Welcome to MatchPro!</h2>
        <p>This is a test email to verify that welcome emails will be sent correctly when new accounts are created.</p>
        
        <div style="background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Account Details (TEST)</h3>
          <p><strong>Username:</strong> testuser</p>
          <p><strong>Email:</strong> ${TEST_RECIPIENT}</p>
          <p><strong>Account Type:</strong> Team Manager</p>
          <p><strong>Created On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>With your MatchPro account, you can:</p>
        <ul>
          <li>Register teams for tournaments</li>
          <li>Manage player information</li>
          <li>Process payments</li>
          <li>Track your tournament schedules</li>
        </ul>
        
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr/>
        <p style="color: #666; font-size: 12px;">This is an automated test message, please do not reply.</p>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Test welcome email sent successfully!');
    console.log(`Response: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending test welcome email:');
    console.error(error.response ? error.response.body : error);
    return false;
  }
}

// Run both email tests
async function runTests() {
  console.log('Testing payment confirmation email...');
  const paymentEmailSuccess = await sendTestPaymentEmail();
  
  console.log('\nTesting welcome/account creation email...');
  const welcomeEmailSuccess = await sendTestWelcomeEmail();
  
  if (paymentEmailSuccess && welcomeEmailSuccess) {
    console.log('\n✅ All email tests passed successfully!');
    console.log('Your SendGrid email system is properly configured and working!');
    process.exit(0);
  } else {
    console.error('\n❌ Some email tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
});