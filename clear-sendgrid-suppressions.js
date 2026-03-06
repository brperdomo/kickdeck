/**
 * Clear SendGrid Suppression Lists
 * 
 * This script removes the email address from all SendGrid suppression lists
 * to restore email delivery functionality.
 */

import fetch from 'node-fetch';

async function clearSuppressions() {
  console.log('=== Clearing SendGrid Suppression Lists ===\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  const email = 'bperdomo@zoho.com';
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found');
    return;
  }
  
  const suppressionTypes = ['bounces', 'blocks', 'invalid_emails', 'spam_reports', 'unsubscribes'];
  
  for (const type of suppressionTypes) {
    try {
      console.log(`Removing ${email} from ${type} suppression list...`);
      
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${email}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 204) {
        console.log(`✅ Successfully removed from ${type} list`);
      } else if (response.status === 404) {
        console.log(`ℹ️ Email was not in ${type} list`);
      } else {
        console.log(`❌ Failed to remove from ${type} list (status: ${response.status})`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error removing from ${type} list:`, error.message);
    }
  }
  
  console.log('\n=== Suppression Cleanup Complete ===');
  console.log('\nTesting email delivery...');
  
  // Test email delivery after cleanup
  const { MailService } = await import('@sendgrid/mail');
  
  try {
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    const testMessage = {
      personalizations: [
        {
          to: [{ email }],
          dynamic_template_data: {
            reset_url: 'https://kickdeck.io/reset-password?token=cleanup-test',
            user_name: 'Test User'
          }
        }
      ],
      from: { 
        email: process.env.DEFAULT_FROM_EMAIL || 'support@kickdeck.io',
        name: 'KickDeck' 
      },
      template_id: 'd-7eb7ea1c19ca4090a0cefa3a2be75088'
    };
    
    console.log('Sending test email after suppression cleanup...');
    const response = await mailService.send(testMessage);
    console.log('✅ Test email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    
    console.log('\n🎉 Email delivery should now work properly!');
    console.log('Check your inbox and spam folder for the test email.');
    
  } catch (error) {
    console.log('❌ Test email failed:', error.message);
    if (error.response?.body) {
      console.log('SendGrid error details:', error.response.body);
    }
  }
}

clearSuppressions().catch(console.error);