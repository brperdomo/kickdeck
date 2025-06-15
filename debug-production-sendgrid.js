/**
 * Debug Production SendGrid Issue
 * 
 * This script tests the exact SendGrid routes causing 500 errors in production
 * and provides detailed error information to identify the root cause.
 */

const { config } = require('dotenv');
const express = require('express');

// Load environment variables
config();

console.log('🔍 Debugging Production SendGrid Issue...');
console.log('Environment:', process.env.NODE_ENV);
console.log('SendGrid API Key present:', !!process.env.SENDGRID_API_KEY);

// Test 1: Check if SendGrid module can be imported
console.log('\n📦 Testing SendGrid module import...');
try {
  const sgMail = require('@sendgrid/mail');
  console.log('✅ SendGrid module imported successfully');
  
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid API key set');
  } else {
    console.log('❌ SendGrid API key missing');
  }
} catch (error) {
  console.log('❌ SendGrid module import failed:', error.message);
}

// Test 2: Test direct SendGrid API call
async function testSendGridAPI() {
  console.log('\n🌐 Testing direct SendGrid API call...');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.log('❌ Cannot test API - SENDGRID_API_KEY not found');
    return;
  }

  try {
    const https = require('https');
    
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/templates',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log('SendGrid API Response Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ SendGrid API call successful');
            console.log('Templates found:', parsed.templates?.length || 0);
          } else {
            console.log('❌ SendGrid API error:', parsed);
          }
        } catch (e) {
          console.log('❌ Failed to parse SendGrid response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ SendGrid API request failed:', error.message);
    });

    req.end();
  } catch (error) {
    console.log('❌ SendGrid API test failed:', error.message);
  }
}

// Test 3: Check route registration
console.log('\n🛣️ Testing route registration...');
try {
  const app = express();
  
  // Try to register the SendGrid routes
  app.get('/test-sendgrid-templates', async (req, res) => {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const response = await sgMail.request({
        url: '/v3/templates',
        method: 'GET'
      });
      
      res.json({ success: true, templates: response[1].templates });
    } catch (error) {
      console.log('Route handler error:', error);
      res.status(500).json({ 
        error: error.message,
        stack: error.stack,
        code: error.code
      });
    }
  });
  
  console.log('✅ Test route registered successfully');
  
  // Start test server briefly
  const server = app.listen(3001, () => {
    console.log('✅ Test server started on port 3001');
    
    // Test the route
    setTimeout(async () => {
      try {
        const http = require('http');
        const req = http.request({
          hostname: 'localhost',
          port: 3001,
          path: '/test-sendgrid-templates',
          method: 'GET'
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('\n📋 Test route response:');
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
            server.close();
          });
        });
        
        req.on('error', (error) => {
          console.log('❌ Test route request failed:', error.message);
          server.close();
        });
        
        req.end();
      } catch (error) {
        console.log('❌ Test route call failed:', error.message);
        server.close();
      }
    }, 1000);
  });
  
} catch (error) {
  console.log('❌ Route registration failed:', error.message);
}

// Run the API test
testSendGridAPI();

console.log('\n🔍 Debug script completed. Check the output above for issues.');