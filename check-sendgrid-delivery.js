/**
 * Check SendGrid Delivery Status
 * 
 * This script checks SendGrid delivery statistics and domain authentication
 * to diagnose email delivery issues.
 */

import { MailService } from '@sendgrid/mail';

async function checkSendGridDelivery() {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('SENDGRID_API_KEY environment variable is not set.');
      return;
    }

    console.log('=== SendGrid Delivery Diagnostics ===\n');
    
    // Test basic API connectivity
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    // Send a simple test email to verify delivery
    const testEmail = {
      to: 'bperdomo@zoho.com',
      from: 'support@kickdeck.io',
      subject: 'SendGrid Delivery Test',
      text: 'This is a test email to verify SendGrid delivery is working.',
      html: '<p>This is a test email to verify SendGrid delivery is working.</p><p>If you receive this, the email system is functioning correctly.</p>'
    };
    
    console.log('Sending test email...');
    const response = await mailService.send(testEmail);
    console.log('Test email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Response headers:', response[0].headers);
    
  } catch (error) {
    console.error('Error during SendGrid delivery check:');
    console.error(error);
    if (error.response) {
      console.error('SendGrid API response:', error.response.body);
    }
  }
}

checkSendGridDelivery();