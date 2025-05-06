/**
 * Test Welcome Email Templates
 * 
 * This script tests the member and admin welcome email templates by sending
 * test emails to verify they are correctly configured and contain the expected content.
 */

import { sendTemplatedEmail } from './server/services/emailService.js';

async function testWelcomeEmailTemplates() {
  try {
    console.log('Testing welcome email templates...');
    
    // Replace with a valid test email address
    const testEmailAddress = process.argv[2];
    
    if (!testEmailAddress) {
      console.error('Error: Test email address is required');
      console.log('Usage: node test-welcome-email-templates.js your-email@example.com');
      process.exit(1);
    }
    
    console.log(`Using test email address: ${testEmailAddress}`);
    
    // Test member welcome email
    console.log(`Sending member welcome email to ${testEmailAddress}...`);
    
    await sendTemplatedEmail(
      testEmailAddress,
      'welcome',
      {
        firstName: 'Test',
        lastName: 'Member',
        email: testEmailAddress
      }
    );
    
    console.log('Member welcome email sent successfully!');
    
    // Test admin welcome email
    console.log(`Sending admin welcome email to ${testEmailAddress}...`);
    
    await sendTemplatedEmail(
      testEmailAddress,
      'admin_welcome',
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: testEmailAddress,
        role: 'Tournament Administrator'
      }
    );
    
    console.log('Admin welcome email sent successfully!');
    console.log('Check your inbox for both welcome emails.');
    console.log('Note: It may take a few minutes for the emails to arrive.');
  } catch (error) {
    console.error('Error sending test welcome emails:', error);
  }
}

testWelcomeEmailTemplates();