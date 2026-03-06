/**
 * Setup SendGrid Webhook for Email Activity Tracking
 * 
 * This script sets up a SendGrid webhook to capture email events
 * and provides an alternative to the Activity Feed API.
 */

import fetch from 'node-fetch';

async function setupSendGridWebhook() {
  console.log('=== Setting up SendGrid Webhook for Email Tracking ===\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found');
    return;
  }
  
  // 1. Create webhook endpoint URL (will be your production domain)
  const webhookUrl = 'https://app.kickdeck.io/api/webhooks/sendgrid';
  
  console.log('1. Configuring SendGrid Event Webhook...');
  
  // Configure the webhook settings
  const webhookSettings = {
    enabled: true,
    url: webhookUrl,
    group_resubscribe: true,
    delivered: true,
    group_unsubscribe: true,
    spam_report: true,
    bounce: true,
    deferred: true,
    unsubscribe: true,
    processed: true,
    open: true,
    click: true,
    dropped: true
  };
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/webhooks/event/settings', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookSettings)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SendGrid webhook configured successfully');
      console.log(`Webhook URL: ${result.url}`);
      console.log(`Enabled events: ${Object.keys(result).filter(key => result[key] === true).join(', ')}`);
    } else {
      const error = await response.text();
      console.log('❌ Failed to configure webhook:', error);
    }
  } catch (error) {
    console.log('❌ Error configuring webhook:', error.message);
  }
  
  // 2. Test webhook configuration
  console.log('\n2. Testing webhook configuration...');
  try {
    const testResponse = await fetch('https://api.sendgrid.com/v3/user/webhooks/event/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: webhookUrl })
    });
    
    if (testResponse.ok) {
      console.log('✅ Webhook test initiated');
      console.log('Check your webhook endpoint for test events');
    } else {
      console.log('❌ Webhook test failed');
    }
  } catch (error) {
    console.log('❌ Error testing webhook:', error.message);
  }
  
  // 3. Send a tagged test email to generate trackable events
  console.log('\n3. Sending trackable test email...');
  try {
    const { MailService } = await import('@sendgrid/mail');
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    const uniqueTag = `webhook-test-${Date.now()}`;
    
    const testMessage = {
      personalizations: [
        {
          to: [{ email: 'bperdomo@zoho.com' }],
          dynamic_template_data: {
            reset_url: `https://kickdeck.io/reset-password?token=${uniqueTag}`,
            user_name: 'Webhook Test User'
          },
          custom_args: {
            test_type: 'webhook_tracking',
            unique_id: uniqueTag,
            environment: 'production'
          }
        }
      ],
      from: { 
        email: 'support@kickdeck.io',
        name: 'KickDeck [WEBHOOK TEST]'
      },
      template_id: 'd-7eb7ea1c19ca4090a0cefa3a2be75088',
      categories: ['webhook-test', 'production-tracking'],
      custom_args: {
        test_identifier: uniqueTag,
        tracking_enabled: 'true'
      }
    };
    
    console.log(`Sending webhook-trackable email...`);
    console.log(`Test ID: ${uniqueTag}`);
    
    const response = await mailService.send(testMessage);
    console.log('✅ Trackable test email sent!');
    console.log('Response status:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    
    console.log('\nThis email will generate events that should appear in your webhook endpoint:');
    console.log(`- processed: Email accepted by SendGrid`);
    console.log(`- delivered: Email delivered to recipient`);
    console.log(`- open: If recipient opens the email`);
    console.log(`- click: If recipient clicks any links`);
    
  } catch (error) {
    console.log('❌ Failed to send trackable test email:', error.message);
  }
  
  console.log('\n=== Webhook Setup Summary ===');
  console.log(`Webhook URL configured: ${webhookUrl}`);
  console.log('Events being tracked: delivered, bounced, opened, clicked, etc.');
  console.log('Custom arguments included for better tracking');
  console.log('\nNext steps:');
  console.log('1. Implement the webhook endpoint at /api/webhooks/sendgrid');
  console.log('2. Process incoming webhook events to track email activity');
  console.log('3. Store events in database for activity dashboard');
  console.log('4. This will provide the email activity visibility you need');
}

setupSendGridWebhook().catch(console.error);