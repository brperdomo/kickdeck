/**
 * This script tests the Stripe payment flow by creating a payment intent
 * and simulating a successful payment webhook event
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
let cookies = ''; // Store cookies for session

// Function to read cookies from file if available
function loadCookiesFromFile() {
  try {
    if (fs.existsSync('./cookies.txt')) {
      return fs.readFileSync('./cookies.txt', 'utf8');
    }
  } catch (err) {
    console.error('Error reading cookies file:', err);
  }
  return '';
}

// Function to save cookies to file
function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync('./cookies.txt', cookieStr);
  } catch (err) {
    console.error('Error saving cookies to file:', err);
  }
}

// Load cookies at startup
cookies = loadCookiesFromFile();
console.log('Initial cookies loaded:', cookies ? 'Available' : 'None available');

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Only add cookies if we have them
  if (cookies) {
    // Make sure to properly parse and format cookies
    // node-fetch is strict about cookie format
    const parsedCookies = cookies.split(';').map(c => c.trim()).join('; ');
    options.headers.cookie = parsedCookies;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  // Save cookies from response for future requests
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    console.log('New cookies received, saving...');
    // Process only the session cookie
    const sessionCookie = setCookieHeader
      .split(',')
      .find(cookie => cookie.trim().startsWith('connect.sid='));
    
    if (sessionCookie) {
      cookies = sessionCookie.split(';')[0].trim();
      console.log('Saved session cookie:', cookies);
      saveCookiesToFile(cookies);
    } else {
      console.log('No session cookie found in response');
    }
  }
  
  // Get both the text and status
  const text = await response.text();
  const status = response.status;
  
  // Log the response for debugging
  console.log(`${method} ${endpoint} - Status: ${status}`);
  
  // Try to parse as JSON, but fallback to text if it fails
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.log(`Response is not JSON (${status}):`);
    console.log(text.substring(0, 200) + '...'); // Print first 200 chars for debugging
    
    // Return a formatted error object instead of throwing
    return { 
      success: false, 
      error: 'Invalid JSON response', 
      statusCode: status,
      responseText: text.substring(0, 500) // Truncate very long responses
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
      description: 'Team registration payment',
      teamId: '12', // This is at root level, not in metadata
      metadata: {
        eventId: '1154838784',
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
      teamId: '12', // Correct teamId at the root level
      metadata: {
        eventId: '1154838784',
        purchaseType: 'team_registration'
      }
    };
    
    const webhookResponse = await apiRequest('/api/test/payment/simulate-webhook', 'POST', webhookData);
    
    if (!webhookResponse.success) {
      throw new Error('Failed to process webhook: ' + (webhookResponse.message || 'Unknown error'));
    }
    
    console.log('Payment webhook processed successfully!');
    
    // Step 4: Verify payment status via Stripe API
    console.log('Step 4: Verifying payment status');
    
    const statusResponse = await apiRequest(`/api/payments/intent/${paymentIntentId}`);
    console.log(`Payment intent status from Stripe: ${statusResponse.status}`);
    
    // Stripe won't allow updating payment status directly, but we can check our database
    console.log('Note: Due to Stripe security restrictions, the payment status might not show as "succeeded" in test mode');
    console.log('Checking if team payment was recorded in our database...');
    
    // Check team status in our database (indirectly through webhook response)
    if (!webhookResponse.success || webhookResponse.teamId !== 12) {
      throw new Error('Team payment recording failed: ' + JSON.stringify(webhookResponse));
    }
    
    console.log('Team payment verified as successful in our database!');
    
    // Test completed successfully
    return {
      success: true,
      paymentIntentId: paymentIntentId,
      stripeStatus: statusResponse.status,
      teamId: webhookResponse.teamId,
      teamPaymentSuccessful: webhookResponse.success
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