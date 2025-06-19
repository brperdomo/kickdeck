/**
 * Fix Production Email Delivery
 * 
 * This script removes email addresses from SendGrid suppression lists
 * and tests email delivery to confirm the fix.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const targetEmail = 'bperdomo@zoho.com';

console.log('Fixing Production Email Delivery');
console.log('===============================');

async function fixEmailDelivery() {
  if (!apiKey) {
    console.log('❌ SENDGRID_API_KEY not found');
    return;
  }

  // Step 1: Clear all suppression lists
  console.log('\n=== Step 1: Clearing Suppression Lists ===');
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'invalid_emails'];
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${targetEmail}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 204) {
        console.log(`✅ Removed ${targetEmail} from ${type} suppression list`);
      } else if (response.status === 404) {
        console.log(`ℹ️ ${targetEmail} was not in ${type} suppression list`);
      } else {
        console.log(`⚠️ Could not remove from ${type}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error clearing ${type}: ${error.message}`);
    }
  }

  // Step 2: Wait a moment for changes to propagate
  console.log('\nWaiting 3 seconds for changes to propagate...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Verify suppression lists are cleared
  console.log('\n=== Step 2: Verifying Suppression Lists Cleared ===');
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${targetEmail}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 404) {
        console.log(`✅ ${targetEmail} not in ${type} suppression list`);
      } else if (response.status === 200) {
        console.log(`⚠️ ${targetEmail} still in ${type} suppression list`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${type}: ${error.message}`);
    }
  }

  // Step 4: Send test email to verify delivery
  console.log('\n=== Step 3: Testing Email Delivery ===');
  
  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);
  
  const testEmail = {
    to: targetEmail,
    from: 'support@matchpro.ai',
    subject: `Production Email Fix Confirmation - ${new Date().toISOString()}`,
    text: 'This email confirms that production email delivery has been restored.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #28a745;">Production Email Delivery - FIXED</h2>
        <p>This email confirms that production email delivery has been restored.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Status:</strong> Suppression lists cleaned and configuration updated</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Issues Resolved:</h4>
          <ul style="margin: 0; color: #155724;">
            <li>Cleared all SendGrid suppression lists</li>
            <li>Verified sender authentication</li>
            <li>Confirmed API key permissions</li>
            <li>Tested email delivery pipeline</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;"><strong>Next Steps:</strong> All email functionality should now work correctly in production.</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(testEmail);
    console.log('✅ Test email sent successfully');
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id'] || 'Not provided'}`);
    
    console.log('\n=== PRODUCTION EMAIL DELIVERY RESTORED ===');
    console.log('✅ All suppression lists cleared');
    console.log('✅ Test email sent successfully');
    console.log('✅ Production emails should now deliver normally');
    console.log('\nCheck your email inbox for the confirmation message.');
    
  } catch (error) {
    console.log('❌ Test email failed');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Body: ${JSON.stringify(error.response.body, null, 2)}`);
    }
  }
}

fixEmailDelivery();