/**
 * Clear Production Email Suppressions
 * 
 * This script removes your email from all SendGrid suppression lists
 * to restore email delivery functionality in production.
 */

import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_TO_CLEAR = 'bperdomo@zoho.com';

async function clearAllSuppressions() {
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is not set');
    return false;
  }

  console.log(`Clearing ${EMAIL_TO_CLEAR} from all SendGrid suppression lists...`);
  
  const suppressionTypes = [
    'bounces',
    'blocks', 
    'spam_reports',
    'unsubscribes',
    'invalid_emails'
  ];
  
  let cleared = 0;
  
  for (const type of suppressionTypes) {
    try {
      console.log(`\nClearing from ${type}...`);
      
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${EMAIL_TO_CLEAR}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 204) {
        console.log(`✅ Successfully removed from ${type}`);
        cleared++;
      } else if (response.status === 404) {
        console.log(`ℹ️  Not found in ${type} (already clear)`);
      } else {
        console.log(`⚠️  ${type} removal returned status: ${response.status}`);
        const responseText = await response.text();
        console.log(`   Response: ${responseText}`);
      }
    } catch (error) {
      console.log(`❌ Error clearing ${type}: ${error.message}`);
    }
  }
  
  console.log(`\n=== CLEANUP COMPLETE ===`);
  console.log(`Cleared from ${cleared} suppression lists`);
  
  // Verify cleanup
  console.log(`\nVerifying cleanup...`);
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
      } else if (response.status === 404) {
        console.log(`✅ Confirmed clear from ${type}`);
      }
    } catch (error) {
      console.log(`⚠️  Error verifying ${type}: ${error.message}`);
    }
  }
  
  if (stillSuppressed === 0) {
    console.log(`\n🎉 SUCCESS: ${EMAIL_TO_CLEAR} is now clear from all suppression lists!`);
    console.log(`You should now receive emails from KickDeck.`);
    return true;
  } else {
    console.log(`\n⚠️  Still suppressed in ${stillSuppressed} lists. You may need to contact SendGrid support.`);
    return false;
  }
}

clearAllSuppressions().catch(console.error);