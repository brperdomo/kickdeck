/**
 * Simple Production Email Diagnosis
 * Tests SendGrid configuration without database dependencies
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'support@kickdeck.io';

console.log('Production Email Diagnosis');
console.log('========================');

async function diagnoseEmailIssue() {
  // Test 1: Environment Variables
  console.log('\n1. Environment Configuration:');
  console.log(`   API Key: ${apiKey ? 'Present' : 'Missing'}`);
  console.log(`   From Email: ${fromEmail}`);
  
  if (!apiKey) {
    console.log('❌ SENDGRID_API_KEY missing');
    return;
  }

  // Test 2: API Key Validation
  console.log('\n2. API Key Validation:');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const account = await response.json();
      console.log('✅ API Key Valid');
      console.log(`   Account Type: ${account.type || 'Unknown'}`);
    } else {
      console.log(`❌ API Key Invalid: ${response.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ API Connection Failed: ${error.message}`);
    return;
  }

  // Test 3: Sender Verification
  console.log('\n3. Sender Verification:');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const verifiedSenders = data.results || [];
      console.log(`   Total verified senders: ${verifiedSenders.length}`);
      
      const fromVerified = verifiedSenders.find(s => s.from_email === fromEmail);
      console.log(`   ${fromEmail} verified: ${fromVerified ? 'Yes' : 'No'}`);
      
      if (!fromVerified && verifiedSenders.length > 0) {
        console.log('   Available verified senders:');
        verifiedSenders.forEach(s => console.log(`     - ${s.from_email}`));
      }
    }
  } catch (error) {
    console.log(`   Could not check: ${error.message}`);
  }

  // Test 4: Suppression Lists
  console.log('\n4. Suppression Lists Check:');
  const testEmail = 'bperdomo@zoho.com';
  
  try {
    const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'invalid_emails'];
    
    for (const type of suppressionTypes) {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${testEmail}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`   ⚠️ ${testEmail} found in ${type} suppression list`);
      } else if (response.status === 404) {
        console.log(`   ✅ ${testEmail} not in ${type} suppression list`);
      }
    }
  } catch (error) {
    console.log(`   Could not check suppression lists: ${error.message}`);
  }

  // Test 5: Send Test Email
  console.log('\n5. Sending Test Email:');
  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);
  
  const testMessage = {
    to: testEmail,
    from: fromEmail,
    subject: `Production Email Test - ${new Date().toISOString()}`,
    text: 'This is a test email from production to diagnose delivery issues.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Production Email Test</h2>
        <p>This email was sent from production at ${new Date().toISOString()}</p>
        <p>If you receive this, email delivery is working correctly.</p>
      </div>
    `
  };

  try {
    const result = await sgMail.send(testMessage);
    console.log('✅ Email sent successfully');
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id'] || 'Not provided'}`);
    
    console.log('\n6. Next Steps:');
    console.log('   - Check your email inbox in 1-2 minutes');
    console.log('   - If no email arrives, check spam folder');
    console.log('   - Mark any spam emails as "Not Spam" to improve reputation');
    
  } catch (error) {
    console.log('❌ Email sending failed');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Body: ${JSON.stringify(error.response.body, null, 2)}`);
    }
  }
}

diagnoseEmailIssue();