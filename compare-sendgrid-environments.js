/**
 * Compare SendGrid Configuration Between Environments
 * 
 * This script compares SendGrid API keys and configurations between
 * development and production to identify why activity doesn't appear in SendGrid.
 */

import fetch from 'node-fetch';

async function compareSendGridEnvironments() {
  console.log('=== SendGrid Environment Comparison ===\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found in current environment');
    return;
  }
  
  console.log('Current Environment Analysis:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('API Key present:', !!apiKey);
  console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) + '...' : 'N/A');
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  
  // Test 1: Verify API key ownership and account details
  console.log('\n1. Testing API Key Account Details...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const account = await response.json();
      console.log('✅ API Key valid for account:', account.company || account.username);
      console.log('Account ID:', account.id);
      console.log('Account type:', account.type);
      console.log('Email:', account.email);
    } else {
      console.log('❌ API Key invalid or restricted');
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Account verification failed:', error.message);
  }
  
  // Test 2: Check API usage stats to see if requests are hitting this account
  console.log('\n2. Checking Recent API Usage Stats...');
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(`https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const stats = await response.json();
      console.log('✅ API usage stats retrieved');
      
      if (stats.length > 0) {
        const totalRequests = stats.reduce((sum, day) => sum + (day.stats?.[0]?.metrics?.requests || 0), 0);
        const totalDelivered = stats.reduce((sum, day) => sum + (day.stats?.[0]?.metrics?.delivered || 0), 0);
        
        console.log(`Total requests (last 7 days): ${totalRequests}`);
        console.log(`Total delivered (last 7 days): ${totalDelivered}`);
        
        // Show recent activity
        const recentStats = stats.slice(-3);
        console.log('\nRecent daily activity:');
        recentStats.forEach(day => {
          const metrics = day.stats?.[0]?.metrics || {};
          console.log(`${day.date}: ${metrics.requests || 0} requests, ${metrics.delivered || 0} delivered`);
        });
      } else {
        console.log('No usage stats found for this time period');
      }
    } else {
      console.log('❌ Could not fetch usage stats');
    }
  } catch (error) {
    console.log('❌ Usage stats check failed:', error.message);
  }
  
  // Test 3: Check recent email activity
  console.log('\n3. Checking Recent Email Activity...');
  try {
    const response = await fetch(`https://api.sendgrid.com/v3/messages?limit=10`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const messages = await response.json();
      console.log('✅ Recent messages retrieved');
      console.log(`Found ${messages.messages?.length || 0} recent messages`);
      
      if (messages.messages && messages.messages.length > 0) {
        console.log('\nRecent email activity:');
        messages.messages.slice(0, 5).forEach((msg, index) => {
          console.log(`${index + 1}. To: ${msg.to_email}, Status: ${msg.status}, Time: ${msg.last_event_time}`);
          console.log(`   Subject: ${msg.subject || 'Template email'}`);
          console.log(`   Template ID: ${msg.template_id || 'N/A'}`);
        });
      } else {
        console.log('No recent email activity found');
      }
    } else {
      const status = response.status;
      if (status === 403) {
        console.log('❌ Access denied - API key may not have activity read permissions');
      } else {
        console.log(`❌ Could not fetch recent activity (status: ${status})`);
      }
    }
  } catch (error) {
    console.log('❌ Activity check failed:', error.message);
  }
  
  // Test 4: Send a tagged test email to track in activity feed
  console.log('\n4. Sending Tagged Test Email...');
  try {
    const { MailService } = await import('@sendgrid/mail');
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    const uniqueTag = `env-test-${Date.now()}`;
    const currentEnv = process.env.NODE_ENV || 'unknown';
    
    const testMessage = {
      personalizations: [
        {
          to: [{ email: 'bperdomo@zoho.com' }],
          dynamic_template_data: {
            reset_url: `https://kickdeck.io/reset-password?token=${uniqueTag}`,
            user_name: 'Environment Test User'
          }
        }
      ],
      from: { 
        email: 'support@kickdeck.io',
        name: `KickDeck [${currentEnv.toUpperCase()}]`
      },
      template_id: 'd-7eb7ea1c19ca4090a0cefa3a2be75088',
      categories: [`environment-${currentEnv}`, uniqueTag],
      custom_args: {
        environment: currentEnv,
        test_tag: uniqueTag,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`Sending tagged email from ${currentEnv} environment...`);
    console.log(`Unique tag: ${uniqueTag}`);
    console.log(`Categories: ${testMessage.categories.join(', ')}`);
    
    const response = await mailService.send(testMessage);
    console.log('✅ Tagged test email sent!');
    console.log('Response status:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    
    console.log('\nTo verify in SendGrid Activity Feed:');
    console.log(`1. Go to: https://app.sendgrid.com/email_activity`);
    console.log(`2. Search for tag: ${uniqueTag}`);
    console.log(`3. Or search for category: environment-${currentEnv}`);
    console.log(`4. Message ID: ${response[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log('❌ Tagged test email failed:', error.message);
    if (error.response?.body) {
      console.log('SendGrid error details:', error.response.body);
    }
  }
  
  console.log('\n=== Environment Analysis Complete ===');
  console.log('\nNext Steps:');
  console.log('1. Check SendGrid Activity Feed for the tagged test email');
  console.log('2. Compare API key prefixes between dev and prod environments');
  console.log('3. Verify that both environments use the same SendGrid account');
  console.log('4. Check if production has different API key or account');
}

compareSendGridEnvironments().catch(console.error);