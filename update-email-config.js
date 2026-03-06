/**
 * Update Email Config Script
 * 
 * This script updates all email configurations to use SendGrid as the provider
 * and sets support@kickdeck.io as the sender email for all templates.
 * 
 * What it does:
 * 1. Sets up SendGrid as the primary email provider
 * 2. Updates all email templates to use support@kickdeck.io as the sender
 * 3. Deactivates any SMTP providers
 */

import fetch from 'node-fetch';

async function updateEmailConfig() {
  try {
    console.log('Starting email configuration update...');
    
    // Make API request to update email config
    const url = 'http://localhost:5000/api/admin/email-config';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        console.error('API Error:', errorData);
      } catch (e) {
        console.error('Status:', response.status);
        console.error('Response:', await response.text());
      }
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success) {
      console.log('✅ Email configuration updated successfully!');
      console.log(`SendGrid provider configured: ${data.details.sendGridProviderConfigured ? 'Yes' : 'No'}`);
      console.log(`Email templates updated: ${data.details.templatesUpdated}`);
    } else {
      console.error('❌ Failed to update email configuration:', data.message);
    }
  } catch (error) {
    console.error('Error updating email configuration:', error);
    process.exit(1);
  }
}

// Run the update
updateEmailConfig();