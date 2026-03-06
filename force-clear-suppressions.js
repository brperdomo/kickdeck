/**
 * Force Clear SendGrid Suppressions
 * 
 * This script uses batch operations and alternative methods to forcefully
 * remove email addresses from SendGrid suppression lists.
 */

import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_TO_CLEAR = 'bperdomo@zoho.com';

async function forceClearSuppressions() {
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is not set');
    return false;
  }

  console.log(`Force clearing ${EMAIL_TO_CLEAR} from all SendGrid suppression lists...`);
  
  // Method 1: Try batch deletion for each suppression type
  const suppressionTypes = [
    'bounces',
    'blocks', 
    'spam_reports',
    'unsubscribes',
    'invalid_emails'
  ];
  
  for (const type of suppressionTypes) {
    console.log(`\nForce clearing from ${type}...`);
    
    // Try batch deletion
    try {
      const batchResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emails: [EMAIL_TO_CLEAR]
        })
      });
      
      if (batchResponse.status === 204) {
        console.log(`✅ Batch deletion from ${type}: SUCCESS`);
      } else {
        console.log(`⚠️  Batch deletion from ${type}: ${batchResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Batch deletion from ${type}: ${error.message}`);
    }
    
    // Try individual deletion with different approach
    try {
      const individualResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delete_all: false,
          emails: [EMAIL_TO_CLEAR]
        })
      });
      
      if (individualResponse.status === 204) {
        console.log(`✅ Individual deletion from ${type}: SUCCESS`);
      } else {
        console.log(`⚠️  Individual deletion from ${type}: ${individualResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Individual deletion from ${type}: ${error.message}`);
    }
  }
  
  // Method 2: Try global suppression removal
  console.log(`\nTrying global suppression removal...`);
  try {
    const globalResponse = await fetch(`https://api.sendgrid.com/v3/suppression/unsubscribes`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emails: [EMAIL_TO_CLEAR]
      })
    });
    
    console.log(`Global suppression removal status: ${globalResponse.status}`);
  } catch (error) {
    console.log(`❌ Global suppression removal: ${error.message}`);
  }
  
  // Wait a moment for changes to propagate
  console.log(`\nWaiting 3 seconds for changes to propagate...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verify cleanup again
  console.log(`\nVerifying final cleanup...`);
  let stillSuppressed = 0;
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${EMAIL_TO_CLEAR}`, {
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`❌ Still in ${type} suppression list`);
        stillSuppressed++;
        
        // Get details about why it's still suppressed
        const details = await response.json();
        console.log(`   Reason: ${details.reason || 'Unknown'}`);
        console.log(`   Created: ${details.created || 'Unknown'}`);
      } else if (response.status === 404) {
        console.log(`✅ Confirmed clear from ${type}`);
      }
    } catch (error) {
      console.log(`⚠️  Error verifying ${type}: ${error.message}`);
    }
  }
  
  if (stillSuppressed === 0) {
    console.log(`\n🎉 SUCCESS: ${EMAIL_TO_CLEAR} is now clear from all suppression lists!`);
    
    // Test sending an email immediately
    console.log(`\nTesting email delivery...`);
    await testEmailDelivery();
    return true;
  } else {
    console.log(`\n❌ Still suppressed in ${stillSuppressed} lists.`);
    console.log(`\nThis suggests your email provider (Zoho) may have issues with SendGrid.`);
    console.log(`Recommendation: Use a different email address for testing, such as Gmail.`);
    return false;
  }
}

async function testEmailDelivery() {
  try {
    const { MailService } = await import('@sendgrid/mail');
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const testMessage = {
      to: EMAIL_TO_CLEAR,
      from: 'support@kickdeck.io',
      subject: `Email Delivery Test - ${new Date().toISOString()}`,
      text: 'This email confirms that suppression lists have been cleared and delivery is working.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid green;">
          <h2 style="color: green;">✅ Email Delivery Restored!</h2>
          <p>This email confirms that suppression lists have been cleared and delivery is working.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>You should now receive all KickDeck emails including password resets.</p>
        </div>
      `
    };
    
    const result = await mailService.send(testMessage);
    console.log(`✅ Test email sent successfully`);
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log(`❌ Test email failed: ${error.message}`);
  }
}

forceClearSuppressions().catch(console.error);