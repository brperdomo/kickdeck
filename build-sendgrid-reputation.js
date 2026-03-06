/**
 * SendGrid Reputation Building Script
 * 
 * This script helps build sending reputation for new paid SendGrid accounts
 * by sending legitimate test emails to verified addresses.
 */

import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is required');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function buildReputation() {
  console.log('🚀 Building SendGrid Sending Reputation');
  console.log('=====================================\n');

  // Use verified sender addresses
  const verifiedSenders = [
    'support@kickdeck.io',
    'mailer@kickdeck.io', 
    'no-reply@kickdeck.io'
  ];

  // Send to verified recipient (your email)
  const testRecipient = 'bperdomo@zoho.com';

  for (let i = 0; i < 3; i++) {
    const sender = verifiedSenders[i % verifiedSenders.length];
    
    console.log(`📧 Sending reputation builder email ${i + 1}/3`);
    console.log(`   From: ${sender}`);
    console.log(`   To: ${testRecipient}`);

    const msg = {
      to: testRecipient,
      from: {
        email: sender,
        name: 'KickDeck Team'
      },
      subject: `SendGrid Reputation Test ${i + 1} - ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">SendGrid Reputation Building</h2>
          <p>This is test email #${i + 1} to build sending reputation.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${sender}</p>
          <p><strong>Purpose:</strong> Building legitimate sending history</p>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Why this helps:</h3>
            <ul>
              <li>Establishes legitimate sending patterns</li>
              <li>Builds domain reputation with ISPs</li>
              <li>Demonstrates real email usage</li>
              <li>Improves deliverability rates</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This email was sent as part of SendGrid reputation building for KickDeck
          </p>
        </div>
      `,
      text: `
        SendGrid Reputation Building - Test Email ${i + 1}
        
        This is test email #${i + 1} to build sending reputation.
        Sent at: ${new Date().toLocaleString()}
        From: ${sender}
        Purpose: Building legitimate sending history
        
        This email was sent as part of SendGrid reputation building for KickDeck
      `
    };

    try {
      const response = await sgMail.send(msg);
      console.log(`   ✅ Status: ${response[0].statusCode}`);
      
      if (response[0].headers['x-message-id']) {
        console.log(`   📨 Message ID: ${response[0].headers['x-message-id']}`);
      }
      
      // Wait 30 seconds between emails to avoid rate limiting
      if (i < 2) {
        console.log('   ⏳ Waiting 30 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      if (error.response && error.response.body) {
        console.error(`   Details: ${JSON.stringify(error.response.body)}`);
      }
    }
  }

  console.log('\n✨ Reputation building complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check your inbox for all 3 test emails');
  console.log('2. Mark emails as "Not Spam" if they land in spam folder');
  console.log('3. Wait 1-2 hours for reputation to build');
  console.log('4. Try sending production emails again');
  console.log('5. Monitor SendGrid Activity Feed for delivery confirmation');
}

buildReputation().catch(console.error);