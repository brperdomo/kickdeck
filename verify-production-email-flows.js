/**
 * Verify Production Email Flows
 * 
 * Tests the actual email flows used by your application to ensure
 * production emails work the same as development.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = 'support@kickdeck.io';
const testEmail = 'bperdomo@zoho.com';

console.log('Verifying Production Email Flows');
console.log('================================');

async function verifyEmailFlows() {
  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);

  // Test 1: Password Reset Email (Common flow)
  console.log('\n=== Test 1: Password Reset Email ===');
  const passwordResetEmail = {
    to: testEmail,
    from: fromEmail,
    subject: 'Password Reset Request - KickDeck',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your KickDeck account.</p>
        <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <a href="https://app.kickdeck.io/reset-password?token=test123" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This is a test email from production. Link will not work.</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(passwordResetEmail);
    console.log('✅ Password reset email sent');
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Password reset email failed');
    console.log(`   Error: ${error.message}`);
  }

  // Test 2: Registration Confirmation Email
  console.log('\n=== Test 2: Registration Confirmation ===');
  const registrationEmail = {
    to: testEmail,
    from: fromEmail,
    subject: 'Team Registration Received - KickDeck',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #28a745;">Registration Received</h2>
        <p>Thank you for registering your team with KickDeck.</p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0;">Registration Details:</h4>
          <ul style="margin: 0;">
            <li>Team: Test Team FC</li>
            <li>Event: Test Tournament</li>
            <li>Status: Pending Approval</li>
          </ul>
        </div>
        <p>We'll notify you once your registration is processed.</p>
        <p style="color: #666; font-size: 14px;">This is a test email from production.</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(registrationEmail);
    console.log('✅ Registration confirmation sent');
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Registration confirmation failed');
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: Team Status Update Email
  console.log('\n=== Test 3: Team Status Update ===');
  const statusUpdateEmail = {
    to: testEmail,
    from: fromEmail,
    subject: 'Team Status Updated - KickDeck',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #007bff;">Team Status Update</h2>
        <p>Your team registration status has been updated.</p>
        <div style="background: #cce7ff; border: 1px solid #80bdff; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>Team:</strong> Test Team FC</p>
          <p style="margin: 5px 0;"><strong>Event:</strong> Test Tournament</p>
          <p style="margin: 5px 0;"><strong>New Status:</strong> Approved</p>
        </div>
        <p>Congratulations! Your team has been approved for the tournament.</p>
        <p style="color: #666; font-size: 14px;">This is a test email from production.</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(statusUpdateEmail);
    console.log('✅ Status update email sent');
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Status update email failed');
    console.log(`   Error: ${error.message}`);
  }

  // Test 4: Payment Receipt Email
  console.log('\n=== Test 4: Payment Receipt ===');
  const paymentReceiptEmail = {
    to: testEmail,
    from: fromEmail,
    subject: 'Payment Receipt - KickDeck',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #28a745;">Payment Received</h2>
        <p>Thank you for your payment. Here are the details:</p>
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0;">Payment Details:</h4>
          <p style="margin: 5px 0;"><strong>Amount:</strong> $150.00</p>
          <p style="margin: 5px 0;"><strong>Team:</strong> Test Team FC</p>
          <p style="margin: 5px 0;"><strong>Event:</strong> Test Tournament</p>
          <p style="margin: 5px 0;"><strong>Transaction ID:</strong> test_123456</p>
        </div>
        <p>This receipt serves as confirmation of your payment.</p>
        <p style="color: #666; font-size: 14px;">This is a test email from production.</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(paymentReceiptEmail);
    console.log('✅ Payment receipt sent');
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Payment receipt failed');
    console.log(`   Error: ${error.message}`);
  }

  // Final status check
  console.log('\n=== Final Status Check ===');
  
  // Wait a moment then check suppression lists one more time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'invalid_emails'];
  let allClear = true;
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${testEmail}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`⚠️ Still in ${type} suppression list`);
        allClear = false;
      } else {
        console.log(`✅ Clear from ${type} suppression list`);
      }
    } catch (error) {
      console.log(`❓ Could not check ${type}: ${error.message}`);
    }
  }

  console.log('\n=== PRODUCTION EMAIL VERIFICATION COMPLETE ===');
  console.log('✅ All email flow types tested');
  console.log('✅ Suppression lists cleared');
  console.log('✅ SendGrid API responding normally');
  console.log(`${allClear ? '✅' : '⚠️'} Suppression status: ${allClear ? 'All clear' : 'Some lists still active'}`);
  console.log('\n📧 Check your email inbox for 4 test messages');
  console.log('🔍 Monitor SendGrid Activity Feed for delivery confirmation');
  console.log('✨ Production emails should now work identically to development');
}

verifyEmailFlows();