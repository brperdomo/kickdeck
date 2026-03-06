/**
 * Investigate SendGrid Delivery Issue
 * 
 * This script focuses on the core issue: emails return success but aren't delivered.
 * We'll check account status, sender authentication, and test with verified addresses.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function investigateSendGridDelivery() {
  console.log('Investigating SendGrid delivery issue...');
  
  // Step 1: Check account status and capabilities
  console.log('\n1. Checking SendGrid account status...');
  try {
    const accountResponse = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (accountResponse.ok) {
      const account = await accountResponse.json();
      console.log(`Account type: ${account.type}`);
      console.log(`Reputation: ${account.reputation}`);
      console.log(`Company: ${account.company || 'Not set'}`);
      console.log(`Website: ${account.website || 'Not set'}`);
      
      if (account.reputation < 95) {
        console.log('⚠️  Low reputation may affect delivery');
      }
    } else {
      console.log(`Account check failed: ${accountResponse.status}`);
    }
  } catch (error) {
    console.log(`Account check error: ${error.message}`);
  }
  
  // Step 2: Check sender authentication
  console.log('\n2. Checking sender authentication...');
  try {
    const sendersResponse = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (sendersResponse.ok) {
      const senders = await sendersResponse.json();
      console.log(`Verified senders: ${senders.results?.length || 0}`);
      
      const supportSender = senders.results?.find(s => s.from_email === 'support@kickdeck.io');
      if (supportSender) {
        console.log(`support@kickdeck.io: ${supportSender.verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
      } else {
        console.log('❌ support@kickdeck.io not found in verified senders');
      }
    }
  } catch (error) {
    console.log(`Sender check error: ${error.message}`);
  }
  
  // Step 3: Test with a known working email service (Gmail)
  console.log('\n3. Testing with Gmail address...');
  const gmailTest = 'test.sendgrid@gmail.com';
  
  try {
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const gmailMessage = {
      to: gmailTest,
      from: 'support@kickdeck.io',
      subject: 'SendGrid Production Test - Gmail',
      text: 'This tests if SendGrid can deliver to Gmail addresses.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>SendGrid Production Test</h2>
          <p>This email tests SendGrid delivery to a Gmail address.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>If you receive this, SendGrid delivery is working.</p>
        </div>
      `
    };
    
    const gmailResult = await mailService.send(gmailMessage);
    console.log(`Gmail test sent: ${gmailResult[0].statusCode}`);
    console.log(`Message ID: ${gmailResult[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log('Gmail test failed:', error.message);
  }
  
  // Step 4: Test the exact welcome template
  console.log('\n4. Testing exact welcome template...');
  try {
    const welcomeMessage = {
      to: 'welcome.test@gmail.com',
      from: 'support@kickdeck.io',
      templateId: 'd-6064756d74914ec79b3a3586f6713424',
      dynamicTemplateData: {
        firstName: 'Welcome',
        lastName: 'Test',
        email: 'welcome.test@gmail.com',
        username: 'welcometest'
      }
    };
    
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const welcomeResult = await mailService.send(welcomeMessage);
    console.log(`Welcome template sent: ${welcomeResult[0].statusCode}`);
    console.log(`Message ID: ${welcomeResult[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log('Welcome template test failed:', error.message);
    if (error.response) {
      console.log('SendGrid error:', JSON.stringify(error.response.body, null, 2));
    }
  }
  
  // Step 5: Check domain reputation
  console.log('\n5. Checking domain reputation...');
  try {
    const domainResponse = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (domainResponse.ok) {
      const domains = await domainResponse.json();
      console.log(`Authenticated domains: ${domains.length}`);
      
      domains.forEach(domain => {
        console.log(`  ${domain.domain}: ${domain.valid ? 'VALID' : 'INVALID'}`);
      });
      
      if (domains.length === 0) {
        console.log('⚠️  No domain authentication found - this may affect delivery');
      }
    }
  } catch (error) {
    console.log(`Domain check error: ${error.message}`);
  }
  
  console.log('\n=== INVESTIGATION COMPLETE ===');
  console.log('\nKey Issues to Check:');
  console.log('1. Verify emails appear in your SendGrid Activity Feed dashboard');
  console.log('2. Check if domain authentication is properly configured');
  console.log('3. Test with Gmail addresses to rule out recipient issues');
  console.log('4. Monitor SendGrid delivery statistics');
  
  console.log('\nNext Steps:');
  console.log('- Log into SendGrid dashboard and check Activity Feed');
  console.log('- Verify domain authentication settings');
  console.log('- Consider testing with different email providers');
}

investigateSendGridDelivery().catch(console.error);