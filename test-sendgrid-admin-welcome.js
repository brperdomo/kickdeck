/**
 * Test SendGrid Admin Welcome Email
 * 
 * This script tests sending an admin welcome email using SendGrid's dynamic templates
 * and verifies the merge fields are working correctly.
 * 
 * Usage:
 *   node test-sendgrid-admin-welcome.js test@example.com
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid mail service
if (!process.env.SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testAdminWelcomeEmail() {
  const recipientEmail = process.argv[2];
  
  if (!recipientEmail) {
    console.error('Error: Recipient email is required');
    console.log('Usage: node test-sendgrid-admin-welcome.js test@example.com');
    process.exit(1);
  }

  // Use the template ID from our database
  const templateId = process.argv[3] || 'd-29971e21ccc641de982f3d60f395ccb5';
  
  console.log(`Using template ID: ${templateId}`)

  try {
    console.log(`Testing SendGrid admin welcome email to ${recipientEmail} using template ${templateId}`);
    
    // Create the test data with all possible merge fields
    const testData = {
      firstName: 'Test',
      lastName: 'Admin',
      email: recipientEmail,
      loginUrl: 'https://matchpro.ai/login',
      organizationName: 'MatchPro',
      appUrl: 'https://matchpro.ai',
      role: 'Administrator',
      isAdmin: true,
      user: {
        firstName: 'Test',
        lastName: 'Admin',
        email: recipientEmail
      }
    };
    
    // Log the merge fields being sent
    console.log('Sending with the following merge fields:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Create the email message
    const msg = {
      to: recipientEmail,
      from: 'support@matchpro.ai', // use a verified sender
      templateId: templateId,
      dynamicTemplateData: testData
    };
    
    // Send the email
    const response = await sgMail.send(msg);
    
    console.log(`Email sent successfully!`);
    console.log(`Status code: ${response[0].statusCode}`);
    
    return true;
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    
    if (error.response) {
      console.error('SendGrid API error:');
      console.error(error.response.body);
    }
    
    return false;
  }
}

testAdminWelcomeEmail().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});