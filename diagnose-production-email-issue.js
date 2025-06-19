/**
 * Diagnose Production Email Issue
 * 
 * This script comprehensively tests the production email configuration
 * to identify why emails show 200 responses but don't deliver.
 */

import { MailService } from '@sendgrid/mail';
import { db } from './db/index.js';
import { emailProviderSettings, emailTemplates } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'support@matchpro.ai';

console.log('🔍 Production Email Diagnosis Starting...\n');

async function diagnosePlaceholderEmailIssue() {
  try {
    // Step 1: Check environment configuration
    console.log('=== STEP 1: Environment Configuration ===');
    console.log(`API Key Present: ${apiKey ? 'YES' : 'NO'}`);
    console.log(`API Key Length: ${apiKey ? apiKey.length : 'N/A'}`);
    console.log(`From Email: ${fromEmail}`);
    console.log(`Node Environment: ${process.env.NODE_ENV || 'undefined'}`);
    
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY is missing from environment variables');
      return;
    }

    // Step 2: Test SendGrid API connection
    console.log('\n=== STEP 2: SendGrid API Connection ===');
    const sgMail = new MailService();
    sgMail.setApiKey(apiKey);
    
    try {
      // Test API key validity
      const testRequest = await fetch('https://api.sendgrid.com/v3/user/account', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (testRequest.ok) {
        const accountInfo = await testRequest.json();
        console.log('✅ SendGrid API connection successful');
        console.log(`Account Type: ${accountInfo.type || 'Unknown'}`);
        console.log(`Account Status: ${accountInfo.reputation?.reputation || 'Unknown'}`);
      } else {
        console.error(`❌ SendGrid API connection failed: ${testRequest.status}`);
        const errorText = await testRequest.text();
        console.error(`Error: ${errorText}`);
        return;
      }
    } catch (error) {
      console.error('❌ SendGrid API connection error:', error.message);
      return;
    }

    // Step 3: Check database configuration
    console.log('\n=== STEP 3: Database Email Configuration ===');
    try {
      const providers = await db
        .select()
        .from(emailProviderSettings)
        .where(eq(emailProviderSettings.providerType, 'sendgrid'));
      
      console.log(`SendGrid providers in database: ${providers.length}`);
      
      if (providers.length > 0) {
        const activeProvider = providers.find(p => p.isActive);
        console.log(`Active provider: ${activeProvider ? 'YES' : 'NO'}`);
        if (activeProvider) {
          console.log(`Provider settings: ${JSON.stringify(activeProvider.settings, null, 2)}`);
        }
      } else {
        console.log('⚠️ No SendGrid providers found in database');
      }
      
      // Check email templates
      const templates = await db
        .select()
        .from(emailTemplates)
        .limit(5);
      
      console.log(`Email templates in database: ${templates.length}`);
      
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError.message);
      return;
    }

    // Step 4: Test actual email sending
    console.log('\n=== STEP 4: Test Email Sending ===');
    
    const testEmail = {
      to: 'bperdomo@zoho.com', // Your verified email
      from: fromEmail,
      subject: `Production Email Test - ${new Date().toISOString()}`,
      text: 'This is a test email to diagnose production delivery issues.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Production Email Test</h2>
          <p>This email was sent from the production environment to test delivery.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'undefined'}</p>
          <p><strong>From Email:</strong> ${fromEmail}</p>
          
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0;">Diagnostic Information:</h4>
            <ul style="margin: 0;">
              <li>API Key Length: ${apiKey.length} characters</li>
              <li>Database Connection: Working</li>
              <li>SendGrid API: Connected</li>
            </ul>
          </div>
        </div>
      `
    };

    try {
      const response = await sgMail.send(testEmail);
      console.log('✅ Email sent successfully');
      console.log(`Response Status: ${response[0].statusCode}`);
      console.log(`Message ID: ${response[0].headers['x-message-id'] || 'Not provided'}`);
      
      // Log the response details for debugging
      console.log('\nResponse Details:');
      console.log(`Status Code: ${response[0].statusCode}`);
      console.log(`Body: ${JSON.stringify(response[0].body)}`);
      console.log(`Headers: ${JSON.stringify(response[0].headers, null, 2)}`);
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      if (emailError.response) {
        console.error(`Status: ${emailError.response.status}`);
        console.error(`Body: ${JSON.stringify(emailError.response.body, null, 2)}`);
      }
      return;
    }

    // Step 5: Check suppression lists
    console.log('\n=== STEP 5: Checking Suppression Lists ===');
    try {
      const suppressionCheck = await fetch('https://api.sendgrid.com/v3/suppression/bounces', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const suppressions = await suppressionCheck.json();
      console.log(`Bounced emails: ${suppressions.length || 0}`);
      
      // Check for your email specifically
      const yourEmailSuppressed = suppressions.find(s => s.email === 'bperdomo@zoho.com');
      if (yourEmailSuppressed) {
        console.log(`⚠️ Your email is in suppression list: ${JSON.stringify(yourEmailSuppressed)}`);
      }
      
    } catch (error) {
      console.log('⚠️ Could not check suppression lists:', error.message);
    }

    // Step 6: Check sender verification
    console.log('\n=== STEP 6: Sender Verification ===');
    try {
      const senderCheck = await fetch('https://api.sendgrid.com/v3/verified_senders', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const senders = await senderCheck.json();
      console.log(`Verified senders: ${senders.results?.length || 0}`);
      
      const fromEmailVerified = senders.results?.find(s => s.from_email === fromEmail);
      console.log(`From email (${fromEmail}) verified: ${fromEmailVerified ? 'YES' : 'NO'}`);
      
      if (!fromEmailVerified) {
        console.log('⚠️ From email is not verified in SendGrid');
        console.log('Available verified senders:', senders.results?.map(s => s.from_email) || []);
      }
      
    } catch (error) {
      console.log('⚠️ Could not check sender verification:', error.message);
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('Check your email inbox for the test message.');
    console.log('If no email arrives within 5 minutes, the issue is likely:');
    console.log('1. Sender verification missing');
    console.log('2. Domain authentication not configured');
    console.log('3. Account reputation issues');
    console.log('4. Email in suppression lists');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

diagnosePlaceholderEmailIssue();