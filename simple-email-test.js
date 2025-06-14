/**
 * Simple Email Test
 * Tests if emails are working by directly calling the SendGrid service
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('Testing SendGrid email delivery...');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not found');
    return;
  }
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: 'bperdomo@zoho.com',
    from: 'support@matchpro.ai',
    subject: 'Email System Test - Registration Flow',
    text: 'This is a test to verify the email system is working for registration notifications.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email System Test</h2>
        <p>This confirms that your SendGrid email system is working correctly.</p>
        <p><strong>Test Purpose:</strong> Registration email troubleshooting</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      </div>
    `
  };
  
  try {
    const result = await sgMail.send(msg);
    console.log('Email sent successfully!');
    console.log('Status:', result[0].statusCode);
    console.log('Message ID:', result[0].headers['x-message-id']);
    return true;
  } catch (error) {
    console.error('Email failed:', error.message);
    if (error.response && error.response.body) {
      console.error('SendGrid response:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

testEmail();