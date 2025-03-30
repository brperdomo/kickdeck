/**
 * Test script for the email service
 * This script will test both the DB provider and environment variable fallback methods
 */

import nodemailer from 'nodemailer';
import { db } from './db/index.js';
import { emailProviderSettings } from './db/schema.js';
import { eq, and } from 'drizzle-orm';

// Test email recipient - CHANGE THIS TO YOUR EMAIL FOR TESTING
const TEST_RECIPIENT = 'your-email@example.com';

async function getEmailProvider() {
  try {
    // Get the default email provider from DB
    const [provider] = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.isDefault, true),
        eq(emailProviderSettings.isActive, true)
      ));

    if (provider) {
      console.log('Found provider in database:', provider.providerName);
      return { source: 'database', provider };
    }

    // No provider found in database, check for environment variables as fallback
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      console.log('Using SMTP settings from environment variables');
      
      // Create a fallback provider from environment variables
      return { 
        source: 'environment',
        provider: {
          providerType: 'smtp',
          providerName: 'Fallback SMTP Provider',
          settings: {
            host: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPassword,
            secure: smtpSecure.toString()
          }
        }
      };
    }

    throw new Error('No email provider configured in database and no valid SMTP settings in environment variables');
  } catch (error) {
    console.error('Error getting email provider:', error);
    throw error;
  }
}

async function createEmailTransporter(provider) {
  if (provider.providerType === 'smtp') {
    const { host, port, username, password, secure } = provider.settings;
    
    console.log(`Creating transporter with:
      Host: ${host}
      Port: ${port}
      User: ${username}
      Secure: ${secure}
      Password: ${password ? '******' : 'not provided'}`);
    
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: secure === 'true',
      auth: {
        user: username,
        pass: password
      }
    });
  } else {
    throw new Error(`Unsupported email provider type: ${provider.providerType}`);
  }
}

async function testSMTPConnection(transporter) {
  console.log('Testing SMTP connection...');
  try {
    const result = await transporter.verify();
    console.log('✅ SMTP connection successful!');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}

async function sendTestEmail(transporter) {
  console.log(`Sending test email to ${TEST_RECIPIENT}...`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
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
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return false;
  }
}

async function main() {
  console.log(`
==============================================
      EMAIL SERVICE TEST
==============================================
NODE_ENV: ${process.env.NODE_ENV || 'development'}
  `);

  try {
    // 1. Get email provider
    console.log('Step 1: Getting email provider...');
    const { source, provider } = await getEmailProvider();
    console.log(`Provider source: ${source}`);
    
    // 2. Create transporter
    console.log('\nStep 2: Creating email transporter...');
    const transporter = await createEmailTransporter(provider);
    
    // 3. Test SMTP connection
    console.log('\nStep 3: Testing SMTP connection...');
    const connectionSuccessful = await testSMTPConnection(transporter);
    
    if (!connectionSuccessful) {
      console.error('Cannot proceed with sending test email due to connection failure');
      process.exit(1);
    }
    
    // 4. Send test email
    console.log('\nStep 4: Sending test email...');
    const emailSent = await sendTestEmail(transporter);
    
    if (emailSent) {
      console.log('\n✅ Email service test completed successfully!');
    } else {
      console.error('\n❌ Email service test failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);