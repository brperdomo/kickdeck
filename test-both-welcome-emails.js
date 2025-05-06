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
    const recipientEmail = process.argv[2];
    
    if (!recipientEmail) {
      console.error('Error: Recipient email is required');
      console.log('Usage: node test-both-welcome-emails.js your-email@example.com');
      process.exit(1);
    }

    console.log('\n=== Testing Both Welcome Email Templates ===\n');

    // Test member welcome email
    console.log('Sending member welcome email...');
    
    await sendTemplatedEmail(
      recipientEmail,
      'welcome',
      {
        firstName: 'Test',
        lastName: 'Member',
        email: recipientEmail,
        loginLink: 'https://matchpro.ai/login'
      }
    );
    
    console.log('✅ Member welcome email sent successfully!');
    
    // Test admin welcome email
    console.log('\nSending admin welcome email...');
    
    await sendTemplatedEmail(
      recipientEmail,
      'admin_welcome',
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: recipientEmail,
        role: 'Tournament Manager',
        loginLink: 'https://matchpro.ai/login'
      }
    );
    
    console.log('✅ Admin welcome email sent successfully!');
    
    console.log('\nCheck your inbox at', recipientEmail, 'for both welcome emails.');
    console.log('Note: It might take a few minutes for the emails to arrive.');
    
  } catch (error) {
    console.error('Error sending test welcome emails:', error);
    process.exit(1);
  }
}

// Run the test function
testWelcomeEmails();