/**
 * This script tests the Stripe payment flow by creating a payment intent
 * and simulating a successful payment webhook event
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let cookies = ''; // Store cookies for session

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  // Save cookies from response for future requests
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    cookies = setCookieHeader;
  }
  
  // Get both the text and status
  const text = await response.text();
  const status = response.status;
  
  // Try to parse as JSON, but fallback to text if it fails
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.log(`Response is not JSON: ${text}`);
    // Return a formatted error object instead of throwing
    return { 
      success: false, 
      error: 'Invalid JSON response', 
      statusCode: status,
      responseText: text 
    };
  }
  
  return data;
}

async function testPaymentFlow() {
  console.log('Starting payment flow test');
  
  try {
    // Step 0: Login with admin credentials
    console.log('Step 0: Logging in as admin');
    const loginResponse = await apiRequest('/api/auth/login', 'POST', {
      email: 'bperdomo@zoho.com',
      password: 'password123'
    });
    
    if (!loginResponse.user) {
      throw new Error('Failed to login: ' + JSON.stringify(loginResponse));
    }
    
    console.log('Login successful as:', loginResponse.user.email);
    
    // Step 1: Verify that the Stripe config is available
    console.log('Step 1: Verifying Stripe configuration');
    const configResponse = await apiRequest('/api/payments/config');
    
    if (!configResponse.publishableKey) {
      throw new Error('Failed to get Stripe publishable key');
    }
    
    console.log('Stripe configuration verified');
    
    // Step 2: Create a test payment intent
    console.log('Step 2: Creating payment intent');
    
    const paymentData = {
      amount: 10000, // $100.00
      currency: 'usd',
      description: 'Test payment intent',
      metadata: {
        teamId: '12345',
        eventId: '67890',
        purchaseType: 'team_registration'
      }
    };
    
    const intentResponse = await apiRequest('/api/payments/create-intent', 'POST', paymentData);
    
    if (!intentResponse.clientSecret) {
      throw new Error('Failed to create payment intent');
    }
    
    const paymentIntentId = intentResponse.clientSecret.split('_secret_')[0];
    console.log(`Payment intent created successfully! ID: ${paymentIntentId}`);
    
    // Step 3: Simulate a successful payment webhook
    console.log('Step 3: Simulating successful webhook event');
    
    const webhookData = {
      paymentIntentId: paymentIntentId,
      metadata: {
        teamId: '12345',
        eventId: '67890',
        purchaseType: 'team_registration'
      }
    };
    
    const webhookResponse = await apiRequest('/api/test/payment/simulate-webhook', 'POST', webhookData);
    
    if (!webhookResponse.success) {
      throw new Error('Failed to process webhook: ' + (webhookResponse.message || 'Unknown error'));
    }
    
    console.log('Payment webhook processed successfully!');
    
    // Step 4: Verify payment status
    console.log('Step 4: Verifying payment status');
    
    const statusResponse = await apiRequest(`/api/payments/intent/${paymentIntentId}`);
    
    if (!statusResponse.status || statusResponse.status !== 'succeeded') {
      throw new Error('Payment status verification failed: ' + 
        JSON.stringify(statusResponse));
    }
    
    console.log('Payment status verified as succeeded!');
    
    // Test completed successfully
    return {
      success: true,
      paymentIntentId: paymentIntentId,
      status: statusResponse.status
    };
    
  } catch (error) {
    console.error('Error in payment test:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test and log results
testPaymentFlow()
  .then(result => {
    console.log('\nTest result:', result);
    if (result.success) {
      console.log('\nPayment flow is working correctly!');
    } else {
      console.log('\nPayment flow test failed!');
    }
  })
  .catch(err => {
    console.error('Test execution error:', err);
  });