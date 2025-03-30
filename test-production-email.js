/**
 * Production Email Test Script
 * This script tests email sending using the production environment variables (.env.production)
 * without needing to access the database.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables from .env.production
dotenv.config({ path: path.resolve(__dirname, '.env.production') });

// Override with actual secrets (which will be provided through environment variables)
console.log('Using environment variables for SMTP configuration');

// Test email recipient - will be overridden by command line argument if provided
let TEST_RECIPIENT = process.env.SMTP_USER; // Default to the sender email

async function createEmailTransporter() {
  // Get SMTP settings from environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true';
  
  console.log(`Creating transporter with:
    Host: ${host}
    Port: ${port}
    User: ${username}
    Secure: ${secure}
    Password: ${password ? '******' : 'not provided'}`);
  
  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure,
    auth: {
      user: username,
      pass: password
    }
  });
}

async function testSMTPConnection(transporter) {
  console.log('Testing SMTP connection...');
  try {
    const result = await transporter.verify();
    console.log('✅ SMTP connection successful!');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    console.error(error);
    return false;
  }
}

async function sendTestEmail(transporter) {
  console.log(`Sending test email to ${TEST_RECIPIENT}...`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: TEST_RECIPIENT,
      subject: 'Test Email from MatchPro Production Environment',
      text: 'This is a test email to verify that the email service is working correctly in production.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a90e2;">MatchPro Production Email Test</h2>
          <p>This is a test email to verify that the email service is working correctly in the production environment.</p>
          <p><strong>Environment:</strong> production</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    if (info.testMessageUrl) {
      console.log('Preview URL:', info.testMessageUrl);
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    console.error(error);
    return false;
  }
}

async function main() {
  // Set NODE_ENV to production
  process.env.NODE_ENV = 'production';
  
  console.log(`
==============================================
      PRODUCTION EMAIL SERVICE TEST
==============================================
NODE_ENV: ${process.env.NODE_ENV}
  `);

  try {
    // Validate required environment variables
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_SECURE'];
    const missing = requiredVars.filter(name => !process.env[name]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      console.error('Please ensure all required environment variables are set in .env.production or as environment secrets');
      process.exit(1);
    }
    
    // Update the recipient email if provided as command line argument
    const recipient = process.argv[2];
    if (recipient && recipient.includes('@')) {
      // Use command line argument if provided
      TEST_RECIPIENT = recipient;
      console.log(`Using provided email address: ${TEST_RECIPIENT}`);
    } else {
      console.log(`Using default email address: ${TEST_RECIPIENT}`);
    }
    
    // 1. Create transporter
    console.log('Step 1: Creating email transporter...');
    const transporter = await createEmailTransporter();
    
    // 2. Test SMTP connection
    console.log('\nStep 2: Testing SMTP connection...');
    const connectionSuccessful = await testSMTPConnection(transporter);
    
    if (!connectionSuccessful) {
      console.error('Cannot proceed with sending test email due to connection failure');
      process.exit(1);
    }
    
    // 3. Send test email
    console.log('\nStep 3: Sending test email...');
    const emailSent = await sendTestEmail(transporter);
    
    if (emailSent) {
      console.log('\n✅ Production email service test completed successfully!');
    } else {
      console.error('\n❌ Production email service test failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);