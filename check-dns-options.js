/**
 * Check DNS Options for SendGrid Domain Authentication
 * 
 * This script provides alternative solutions for DNS providers that don't support
 * CNAME records or have limitations with subdomain CNAME records.
 */

import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function checkDNSOptions() {
  console.log('Checking DNS options for SendGrid domain authentication...');
  
  // Get the current domain configuration from SendGrid
  try {
    const domainResponse = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (domainResponse.ok) {
      const domains = await domainResponse.json();
      const appKickdeckDomain = domains.find(d => d.domain === 'app.kickdeck.io');
      
      if (appKickdeckDomain) {
        console.log('Current app.kickdeck.io domain status:', appKickdeckDomain.valid ? 'VALID' : 'INVALID');
        console.log('Domain ID:', appKickdeckDomain.id);
        
        // Get detailed DNS requirements
        const detailResponse = await fetch(`https://api.sendgrid.com/v3/whitelabel/domains/${appKickdeckDomain.id}`, {
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (detailResponse.ok) {
          const details = await detailResponse.json();
          
          console.log('\nRequired DNS records for app.kickdeck.io:');
          if (details.dns) {
            Object.entries(details.dns).forEach(([recordType, recordData]) => {
              console.log(`${recordType.toUpperCase()}:`);
              console.log(`  Host: ${recordData.host}`);
              console.log(`  Value: ${recordData.data}`);
              console.log(`  Type: ${recordData.type || 'CNAME'}`);
              console.log('');
            });
          }
          
          console.log('Alternative DNS Solutions:');
          console.log('1. SUBDOMAIN CNAME - Most DNS providers support CNAME for subdomains');
          console.log('2. ALIAS RECORDS - Some providers offer ALIAS as CNAME alternative');
          console.log('3. DIFFERENT DOMAIN - Use kickdeck.io (which is already working)');
          console.log('4. EMAIL SUBDOMAIN - Create mail.kickdeck.io for email authentication');
          
          // Check if we can use the working domain instead
          const workingDomain = domains.find(d => d.domain === 'kickdeck.io' && d.valid);
          if (workingDomain) {
            console.log('\nAlternative: Use kickdeck.io domain (already working)');
            console.log('This domain is properly authenticated and ready for email sending');
          }
        }
      }
    }
  } catch (error) {
    console.log('Error checking DNS options:', error.message);
  }
  
  console.log('\nRecommendations:');
  console.log('1. Check with your DNS provider if they support CNAME records for subdomains');
  console.log('2. Consider using the already-working kickdeck.io domain for emails');
  console.log('3. Set up a dedicated email subdomain (like mail.app.kickdeck.io)');
  console.log('4. Contact your DNS provider for specific CNAME support options');
}

checkDNSOptions().catch(console.error);