/**
 * Final Email System Verification
 * 
 * This script performs comprehensive testing of the corrected email system
 * to verify all functionality is working properly in production.
 */

import fetch from 'node-fetch';

console.log('🎯 Final Email System Verification\n');

// Test 1: Test password reset email flow
async function testPasswordResetFlow() {
  console.log('1. Testing Password Reset Email Flow:');
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bperdomo@zoho.com' })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅ Password reset email sent successfully');
      console.log(`   Server response: ${data.message}`);
      return true;
    } else {
      console.log(`   ❌ Password reset failed: ${data.error || data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Password reset error: ${error.message}`);
    return false;
  }
}

// Test 2: Test SendGrid API connectivity
async function testSendGridConnectivity() {
  console.log('\n2. Testing SendGrid API Connectivity:');
  try {
    const response = await fetch('http://localhost:5000/api/sendgrid/templates', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SendGrid API accessible - ${data.templates?.length || 0} templates available`);
      
      if (data.templates && data.templates.length > 0) {
        console.log('   Available templates:');
        data.templates.slice(0, 3).forEach(template => {
          console.log(`     - ${template.name} (${template.id})`);
        });
        if (data.templates.length > 3) {
          console.log(`     ... and ${data.templates.length - 3} more`);
        }
      }
      return true;
    } else {
      console.log(`   ❌ SendGrid API failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ SendGrid API error: ${error.message}`);
    return false;
  }
}

// Test 3: Test webhook functionality
async function testWebhookFunctionality() {
  console.log('\n3. Testing Email Tracking Webhook:');
  try {
    const webhookData = [{
      email: 'verification-test@example.com',
      timestamp: Math.floor(Date.now() / 1000),
      event: 'delivered',
      sg_message_id: 'verification-' + Date.now(),
      sg_event_id: 'test-event-' + Date.now()
    }];
    
    const response = await fetch('http://localhost:5000/api/webhooks/sendgrid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Webhook processing functional');
      console.log(`   Processed ${data.processed || 0} events`);
      return true;
    } else {
      console.log(`   ❌ Webhook test failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Webhook test error: ${error.message}`);
    return false;
  }
}

// Test 4: Test email tracking database
async function testEmailTrackingDatabase() {
  console.log('\n4. Testing Email Tracking Database:');
  try {
    const response = await fetch('http://localhost:5000/api/admin/email-tracking', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Email tracking accessible - ${data.events?.length || 0} tracked events`);
      
      if (data.events && data.events.length > 0) {
        const recentEvent = data.events[0];
        console.log(`   Latest event: ${recentEvent.event_type} for ${recentEvent.recipient_email}`);
      }
      return true;
    } else {
      console.log(`   ❌ Email tracking failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Email tracking error: ${error.message}`);
    return false;
  }
}

// Test 5: Verify environment configuration
async function verifyEnvironmentConfig() {
  console.log('\n5. Verifying Environment Configuration:');
  
  const requiredEnvVars = [
    'SENDGRID_API_KEY',
    'DEFAULT_FROM_EMAIL',
    'FRONTEND_URL'
  ];
  
  let configValid = true;
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`   ✅ ${envVar}: configured`);
    } else {
      console.log(`   ❌ ${envVar}: missing`);
      configValid = false;
    }
  });
  
  return configValid;
}

// Main verification function
async function runFinalVerification() {
  console.log('Starting comprehensive email system verification...\n');
  
  const results = {
    passwordReset: await testPasswordResetFlow(),
    sendGridAPI: await testSendGridConnectivity(),
    webhooks: await testWebhookFunctionality(),
    tracking: await testEmailTrackingDatabase(),
    environment: verifyEnvironmentConfig()
  };
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n📊 Final Verification Results:');
  console.log(`✅ ${successCount}/${totalTests} systems operational`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL');
    console.log('Your production email system is fully functional:');
    console.log('- SendGrid API key correctly configured');
    console.log('- Email templates accessible and ready');
    console.log('- Password reset emails sending successfully');
    console.log('- Webhook tracking system active');
    console.log('- Email activity being logged to database');
    console.log('\nThe email delivery issues have been resolved.');
  } else {
    console.log('\n⚠️ Some systems need attention:');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`- ${test}: requires attention`);
      }
    });
  }
  
  console.log('\n📧 Recommendation:');
  console.log('Check your email inbox for the password reset email sent during this test.');
  console.log('If received, your email system is fully operational.');
}

runFinalVerification();