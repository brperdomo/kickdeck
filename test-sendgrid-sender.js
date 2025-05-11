/**
 * Test SendGrid Sender Identities API Access
 * 
 * This script tests if we can fetch verified sender identities
 * from the SendGrid API using the new API key.
 */

import fetch from 'node-fetch';

async function getSenderIdentities() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not set');
      process.exit(1);
    }
    
    console.log('Fetching verified sender identities from SendGrid...');
    
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully fetched sender identities!');
    console.log(`Found ${data.results ? data.results.length : 0} verified sender identities.`);
    
    // Print details of sender identities if any exist
    if (data.results && data.results.length > 0) {
      console.log('\nVerified Sender Details:');
      data.results.forEach((sender, index) => {
        console.log(`\nSender ${index + 1}:`);
        console.log(`- Email: ${sender.from_email || 'Not specified'}`);
        console.log(`- Name: ${sender.from_name || 'Not specified'}`);
        console.log(`- Verified: ${sender.verified ? 'Yes' : 'No'}`);
        console.log(`- Status: ${sender.status || 'Unknown'}`);
      });
    } else {
      console.log('\nNo verified senders found. You may need to verify a sender identity in your SendGrid account.');
    }
    
  } catch (error) {
    console.error('❌ Error testing SendGrid sender identities:', error);
    process.exit(1);
  }
}

getSenderIdentities().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});