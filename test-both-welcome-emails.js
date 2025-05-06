/**
 * Test Both Welcome Email Templates
 * 
 * This script tests sending both member and admin welcome emails
 * to verify they are correctly configured with SendGrid.
 */

import { sendTemplatedEmail } from './server/services/emailService.js';

async function testWelcomeEmails() {
  try {
    // Get recipient email from command line arguments
    const testEmail = process.argv[2];
    
    if (!testEmail) {
      console.error('Error: Test email address is required');
      console.log('Usage: node test-both-welcome-emails.js your-email@example.com');
      process.exit(1);
    }
    
    console.log(`\n==== Testing Welcome Email Templates ====\n`);
    console.log(`Sending emails to: ${testEmail}\n`);
    
    // Test member welcome email
    console.log('1. Sending Member Welcome Email...');
    
    await sendTemplatedEmail(
      testEmail,
      'welcome',
      {
        firstName: 'Test',
        lastName: 'Member',
        email: testEmail
      }
    );
    
    console.log('Member welcome email sent successfully!\n');
    
    // Test admin welcome email
    console.log('2. Sending Admin Welcome Email...');
    
    await sendTemplatedEmail(
      testEmail,
      'admin_welcome',
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: testEmail,
        role: 'Tournament Administrator'
      }
    );
    
    console.log('Admin welcome email sent successfully!\n');
    
    console.log('========================================');
    console.log('Both welcome emails sent successfully!');
    console.log('Check your inbox for the welcome emails.');
    console.log('It may take a few minutes for the emails to arrive.');
    console.log('========================================\n');
  } catch (error) {
    console.error('Error sending test welcome emails:', error);
  }
}

testWelcomeEmails();