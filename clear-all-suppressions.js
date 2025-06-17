/**
 * Clear All SendGrid Suppressions for Email Address
 * 
 * This script removes your email from all SendGrid suppression lists
 * to restore full email delivery functionality.
 */

import fetch from 'node-fetch';

const apiKey = process.env.SENDGRID_API_KEY;
const baseUrl = 'https://api.sendgrid.com/v3';
const email = 'bperdomo@zoho.com';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

console.log(`Clearing all suppressions for: ${email}\n`);

// Suppression lists to clear
const suppressionLists = [
  'bounces',
  'blocks', 
  'spam_reports',
  'unsubscribes',
  'invalid_emails'
];

async function clearSuppressionList(listType) {
  try {
    console.log(`Clearing ${listType}...`);
    
    // First check if email exists in this list
    const checkResponse = await fetch(`${baseUrl}/suppression/${listType}/${email}`, {
      headers
    });
    
    if (checkResponse.status === 404) {
      console.log(`  ✅ Not found in ${listType} - already clean`);
      return true;
    }
    
    if (!checkResponse.ok) {
      console.log(`  ⚠️ Could not check ${listType}: ${checkResponse.status}`);
      return false;
    }
    
    // Email exists, now remove it
    const deleteResponse = await fetch(`${baseUrl}/suppression/${listType}/${email}`, {
      method: 'DELETE',
      headers
    });
    
    if (deleteResponse.ok) {
      console.log(`  ✅ Removed from ${listType}`);
      return true;
    } else {
      console.log(`  ❌ Failed to remove from ${listType}: ${deleteResponse.status}`);
      const errorText = await deleteResponse.text();
      console.log(`     Error: ${errorText}`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Error with ${listType}: ${error.message}`);
    return false;
  }
}

async function clearAllSuppressions() {
  let successCount = 0;
  
  for (const listType of suppressionLists) {
    const success = await clearSuppressionList(listType);
    if (success) successCount++;
    
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Results: ${successCount}/${suppressionLists.length} lists processed`);
  
  if (successCount === suppressionLists.length) {
    console.log('✅ All suppressions cleared successfully!');
    console.log('Your email address should now receive all emails normally.');
  } else {
    console.log('⚠️ Some suppressions could not be cleared. Check the logs above for details.');
  }
}

// Verify clearance by checking all lists again
async function verifyCleanup() {
  console.log('\nVerifying suppression cleanup...\n');
  
  for (const listType of suppressionLists) {
    try {
      const response = await fetch(`${baseUrl}/suppression/${listType}/${email}`, {
        headers
      });
      
      if (response.status === 404) {
        console.log(`✅ ${listType}: Clean`);
      } else if (response.ok) {
        console.log(`❌ ${listType}: Still suppressed`);
      } else {
        console.log(`⚠️ ${listType}: Check inconclusive`);
      }
    } catch (error) {
      console.log(`❌ ${listType}: Error checking - ${error.message}`);
    }
  }
}

async function main() {
  await clearAllSuppressions();
  await verifyCleanup();
  
  console.log('\n🎯 Next steps:');
  console.log('1. Try sending a test email');
  console.log('2. Check your inbox (including spam folder)');
  console.log('3. Email delivery should now work normally');
}

main();