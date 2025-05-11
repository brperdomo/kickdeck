/**
 * Verify SendGrid API Key
 * 
 * This script checks if the SendGrid API key is correctly configured
 * and working by making a test API call.
 */

import { verifyConfiguration } from './server/services/sendgridService.js';

console.log('Verifying SendGrid API key configuration...');

async function checkSendGridConfig() {
  try {
    const isValid = await verifyConfiguration();
    
    if (isValid) {
      console.log('✅ SendGrid API key is valid and working correctly!');
    } else {
      console.error('❌ SendGrid API key validation failed. Please check the error messages above.');
    }
  } catch (error) {
    console.error('❌ Error during SendGrid configuration verification:', error);
  }
}

checkSendGridConfig().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});