/**
 * Test the reset URL generation for different environments
 * 
 * This script simulates both development and production environments
 * to verify that the reset URLs are generated correctly.
 */

import { sendPasswordResetEmail } from './server/services/emailService.js';

async function testResetEmailUrls() {
  console.log('Starting reset email URL test...');
  
  // Test 1: Development Environment
  console.log('\n=== TEST 1: DEVELOPMENT ENVIRONMENT ===');
  process.env.NODE_ENV = 'development';
  process.env.APP_URL = 'https://dev.matchpro.ai';
  process.env.PRODUCTION_URL = 'https://matchpro.ai';
  
  try {
    // This will log the URL but not actually send the email
    await sendPasswordResetEmail(
      'test@example.com', 
      'dev-test-token-123', 
      'TestUser'
    );
    console.log('Development test completed');
  } catch (error) {
    console.error('Development test failed:', error);
  }
  
  // Test 2: Production Environment
  console.log('\n=== TEST 2: PRODUCTION ENVIRONMENT ===');
  process.env.NODE_ENV = 'production';
  process.env.APP_URL = 'https://dev.matchpro.ai';  // This should be ignored in production
  process.env.PRODUCTION_URL = 'https://matchpro.ai';
  
  try {
    // This will log the URL but not actually send the email
    await sendPasswordResetEmail(
      'test@example.com', 
      'prod-test-token-456', 
      'TestUser'
    );
    console.log('Production test completed');
  } catch (error) {
    console.error('Production test failed:', error);
  }
  
  console.log('\nReset email URL test completed');
}

testResetEmailUrls();