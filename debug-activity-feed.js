/**
 * Debug SendGrid Activity Feed Access
 * 
 * This script investigates why production emails aren't appearing
 * in the SendGrid Activity Feed interface.
 */

import fetch from 'node-fetch';

async function debugActivityFeed() {
  console.log('=== Debugging SendGrid Activity Feed ===\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found');
    return;
  }
  
  // Test 1: Try different activity endpoints
  console.log('1. Testing Email Activity API endpoints...');
  
  const endpoints = [
    { name: 'messages', url: 'https://api.sendgrid.com/v3/messages' },
    { name: 'email_activity', url: 'https://api.sendgrid.com/v3/messages' },
    { name: 'events', url: 'https://api.sendgrid.com/v3/user/webhooks/event/settings' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.name} endpoint...`);
      const response = await fetch(`${endpoint.url}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name} accessible`);
        console.log(`Response keys:`, Object.keys(data));
      } else {
        const errorText = await response.text();
        console.log(`❌ ${endpoint.name} failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} error:`, error.message);
    }
  }
  
  // Test 2: Check account permissions
  console.log('\n2. Checking API Key Permissions...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const scopes = await response.json();
      console.log('✅ API Key scopes:');
      scopes.scopes.forEach(scope => {
        console.log(`  - ${scope}`);
      });
      
      // Check for activity-related permissions
      const activityScopes = scopes.scopes.filter(scope => 
        scope.includes('activity') || scope.includes('message') || scope.includes('email')
      );
      
      if (activityScopes.length > 0) {
        console.log('\n✅ Activity-related permissions found:');
        activityScopes.forEach(scope => console.log(`  - ${scope}`));
      } else {
        console.log('\n❌ No activity-related permissions found');
      }
    } else {
      console.log('❌ Could not fetch API key scopes');
    }
  } catch (error) {
    console.log('❌ Permissions check failed:', error.message);
  }
  
  // Test 3: Check webhook settings (alternative to activity feed)
  console.log('\n3. Checking Webhook Configuration...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/webhooks/event/settings', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const webhooks = await response.json();
      console.log('✅ Webhook settings accessible');
      console.log('Enabled:', webhooks.enabled);
      console.log('URL:', webhooks.url || 'Not set');
      
      if (!webhooks.enabled) {
        console.log('ℹ️ Webhooks are disabled - this might affect activity tracking');
      }
    } else {
      console.log('❌ Could not fetch webhook settings');
    }
  } catch (error) {
    console.log('❌ Webhook check failed:', error.message);
  }
  
  // Test 4: Try to get specific message by ID
  console.log('\n4. Searching for Recent Messages by Date...');
  try {
    // Try the email activity search with query parameters
    const today = new Date().toISOString().split('T')[0];
    const queryParams = new URLSearchParams({
      query: `to_email="bperdomo@zoho.com"`,
      limit: '10'
    });
    
    const response = await fetch(`https://api.sendgrid.com/v3/messages?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Search response status: ${response.status}`);
    
    if (response.ok) {
      const results = await response.json();
      console.log('✅ Search successful');
      console.log(`Found ${results.messages?.length || 0} messages`);
      
      if (results.messages && results.messages.length > 0) {
        console.log('\nRecent messages to your email:');
        results.messages.slice(0, 3).forEach((msg, index) => {
          console.log(`${index + 1}. ${msg.last_event_time}: ${msg.status}`);
          console.log(`   Subject: ${msg.subject || 'Template email'}`);
          console.log(`   Template: ${msg.template_id || 'N/A'}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Search failed: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Message search failed:', error.message);
  }
  
  // Test 5: Check if this is a subuser account
  console.log('\n5. Checking Account Type and Subuser Status...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/subusers', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const subusers = await response.json();
      console.log('✅ This is a parent account');
      console.log(`Subusers: ${subusers.length || 0}`);
      
      if (subusers.length > 0) {
        console.log('Subuser accounts found - activity might be distributed');
      }
    } else if (response.status === 401) {
      console.log('ℹ️ This appears to be a subuser account or has restricted permissions');
    } else {
      console.log(`❌ Subuser check failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Account type check failed:', error.message);
  }
  
  console.log('\n=== Activity Feed Diagnosis Complete ===');
  console.log('\nPossible Causes:');
  console.log('1. Production might be using a different SendGrid account');
  console.log('2. API key might have restricted permissions for activity access');
  console.log('3. Activity Feed might have a delay in updating');
  console.log('4. Account might be a subuser with limited visibility');
  console.log('\nRecommendations:');
  console.log('1. Check if you have multiple SendGrid accounts');
  console.log('2. Verify the API key has full permissions');
  console.log('3. Check if there are any webhook configurations affecting tracking');
}

debugActivityFeed().catch(console.error);