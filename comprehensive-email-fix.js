/**
 * Comprehensive Email Fix for Production
 * 
 * This script uses batch operations and additional methods to fully clear
 * suppression lists and ensure email delivery works in production.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const targetEmail = 'bperdomo@zoho.com';

console.log('Comprehensive Production Email Fix');
console.log('==================================');

async function comprehensiveEmailFix() {
  if (!apiKey) {
    console.log('Missing SENDGRID_API_KEY');
    return;
  }

  // Method 1: Try batch deletion for global suppressions
  console.log('\n=== Method 1: Batch Global Suppression Removal ===');
  
  try {
    const globalResponse = await fetch('https://api.sendgrid.com/v3/suppression/unsubscribes', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emails: [targetEmail]
      })
    });
    
    console.log(`Global unsubscribe removal: ${globalResponse.status}`);
  } catch (error) {
    console.log(`Global suppression removal error: ${error.message}`);
  }

  // Method 2: Try individual list clearing with different approach
  console.log('\n=== Method 2: Individual List Clearing ===');
  
  const suppressionEndpoints = [
    'bounces',
    'blocks', 
    'spam_reports',
    'invalid_emails'
  ];

  for (const endpoint of suppressionEndpoints) {
    try {
      // First try to get the specific record
      const getResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${endpoint}/${targetEmail}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (getResponse.status === 200) {
        // Record exists, try to delete it
        const deleteResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            emails: [targetEmail]
          })
        });
        
        console.log(`${endpoint} batch deletion: ${deleteResponse.status}`);
      } else {
        console.log(`${endpoint}: not found (${getResponse.status})`);
      }
    } catch (error) {
      console.log(`${endpoint} error: ${error.message}`);
    }
  }

  // Method 3: Check account-level suppression settings
  console.log('\n=== Method 3: Account Settings Check ===');
  
  try {
    const settingsResponse = await fetch('https://api.sendgrid.com/v3/mail_settings', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('Account mail settings retrieved');
      
      // Check if bounce management is too aggressive
      const bounceSettings = settings.result?.find(s => s.name === 'bounce_management');
      if (bounceSettings) {
        console.log(`Bounce management enabled: ${bounceSettings.enabled}`);
      }
    }
  } catch (error) {
    console.log(`Settings check error: ${error.message}`);
  }

  // Method 4: Try sending with tracking disabled to bypass some filters
  console.log('\n=== Method 4: Test Email with Tracking Disabled ===');
  
  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);
  
  const directTestEmail = {
    to: targetEmail,
    from: 'support@matchpro.ai',
    subject: `Direct Production Test - ${new Date().toISOString()}`,
    text: 'Direct test email bypassing tracking systems.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Direct Production Email Test</h2>
        <p>This email bypasses tracking systems to test direct delivery.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>If you receive this, the core email system is working.</p>
      </div>
    `,
    tracking_settings: {
      click_tracking: { enable: false },
      open_tracking: { enable: false },
      subscription_tracking: { enable: false },
      ganalytics: { enable: false }
    },
    mail_settings: {
      bypass_list_management: { enable: true }
    }
  };

  try {
    const result = await sgMail.send(directTestEmail);
    console.log('Direct test email sent');
    console.log(`Status: ${result[0].statusCode}`);
    console.log(`Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('Direct test email failed');
    console.log(`Error: ${error.message}`);
    if (error.response?.body) {
      console.log(`Details: ${JSON.stringify(error.response.body)}`);
    }
  }

  // Method 5: Final verification
  console.log('\n=== Method 5: Final Verification ===');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  for (const type of suppressionEndpoints) {
    try {
      const checkResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${targetEmail}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkResponse.status === 404) {
        console.log(`${type}: Email cleared`);
      } else if (checkResponse.status === 200) {
        const data = await checkResponse.json();
        console.log(`${type}: Still suppressed - ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`${type} check error: ${error.message}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log('Multiple suppression clearing methods attempted');
  console.log('Direct email test sent with tracking disabled');
  console.log('Check your email inbox for the test message');
  console.log('If still no delivery, the issue may be at the ISP level');
}

comprehensiveEmailFix();