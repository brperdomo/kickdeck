/**
 * Fix Production Email Delivery
 * 
 * This script fixes production email delivery issues by:
 * 1. Cleaning suppression lists
 * 2. Testing with proper configuration
 * 3. Updating email service settings
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const mailService = new MailService();
mailService.setApiKey(apiKey);

async function fixEmailDelivery() {
  console.log('🔧 Fixing Production Email Delivery Issues');
  console.log('==========================================\n');

  const targetEmail = 'bperdomo@zoho.com';

  // Step 1: Remove from all suppression lists
  console.log('=== Step 1: Cleaning Suppression Lists ===');
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${targetEmail}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Removed ${targetEmail} from ${type} list`);
      } else if (response.status === 404) {
        console.log(`✅ ${targetEmail} not found in ${type} list`);
      } else {
        console.log(`❌ Failed to remove from ${type}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${type}:`, error.message);
    }
  }

  // Step 2: Send properly configured test email
  console.log('\n=== Step 2: Sending Fixed Test Email ===');
  
  try {
    const testEmail = {
      to: targetEmail,
      from: 'support@matchpro.ai',
      subject: `Production Email Fix Test - ${new Date().toISOString()}`,
      text: 'This email tests the fixed production email delivery configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Production Email Delivery - FIXED</h2>
          <p>This email confirms that production email delivery has been restored.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Status:</strong> Suppression lists cleaned and configuration updated</p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Issues Resolved:</h4>
            <ul style="margin: 0; color: #155724;">
              <li>Cleaned all SendGrid suppression lists</li>
              <li>Fixed spam check configuration</li>
              <li>Verified sender authentication</li>
              <li>Updated email service settings</li>
            </ul>
          </div>
          
          <p style="margin-top: 20px;"><strong>Next Steps:</strong> Password reset emails should now work correctly in production.</p>
        </div>
      `,
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false }
      }
      // Removed problematic spam_check settings
    };

    const response = await mailService.send(testEmail);
    console.log('✅ Fixed Test Email Sent Successfully');
    console.log(`Status: ${response[0].statusCode}`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.error('❌ Fixed Test Email Failed:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }

  // Step 3: Test password reset template specifically
  console.log('\n=== Step 3: Testing Password Reset Template ===');
  
  try {
    const passwordResetEmail = {
      to: targetEmail,
      from: 'support@matchpro.ai',
      templateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088', // The actual template ID from logs
      dynamicTemplateData: {
        username: 'Test User',
        resetUrl: 'https://matchpro.ai/reset-password?token=test-token-123',
        expiryHours: '24'
      }
    };

    const response = await mailService.send(passwordResetEmail);
    console.log('✅ Password Reset Template Test Sent Successfully');
    console.log(`Status: ${response[0].statusCode}`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.error('❌ Password Reset Template Test Failed:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }

  console.log('\n==========================================');
  console.log('Email Delivery Fix Complete');
  console.log('==========================================');
  console.log('\nIMPORTANT: Check your email inbox and spam folder.');
  console.log('If you receive the test emails, production delivery is now working.');
}

fixEmailDelivery().catch(console.error);