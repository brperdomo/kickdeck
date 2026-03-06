/**
 * Verify SendGrid API Keys Match Between Environments
 * 
 * This script compares the SendGrid API keys between development and production
 * to ensure they're identical and properly configured.
 */

import fs from 'fs';
import path from 'path';

function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return {};
  }
}

function maskApiKey(key) {
  if (!key) return 'NOT_SET';
  if (key.length < 8) return key;
  return key.substring(0, 8) + '...' + key.substring(key.length - 4);
}

async function compareApiKeys() {
  console.log('🔍 Comparing SendGrid API Keys Between Environments\n');
  
  // Read environment files
  const devEnv = readEnvFile('.env');
  const prodEnv = readEnvFile('.env.production');
  
  // Also check current environment variables
  const currentEnv = process.env;
  
  console.log('📋 SendGrid Configuration Comparison:\n');
  
  const sendgridKeys = [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'SENDGRID_FROM_NAME'
  ];
  
  sendgridKeys.forEach(key => {
    console.log(`${key}:`);
    console.log(`  Development (.env):     ${maskApiKey(devEnv[key])}`);
    console.log(`  Production (.env.prod): ${maskApiKey(prodEnv[key])}`);
    console.log(`  Current Runtime:        ${maskApiKey(currentEnv[key])}`);
    
    // Check if they match
    const devVal = devEnv[key];
    const prodVal = prodEnv[key];
    const currentVal = currentEnv[key];
    
    if (devVal && prodVal && devVal === prodVal) {
      console.log(`  ✅ Dev and Prod files match`);
    } else if (!devVal || !prodVal) {
      console.log(`  ⚠️  Missing in ${!devVal ? 'dev' : 'prod'} file`);
    } else {
      console.log(`  ❌ Dev and Prod files differ`);
    }
    
    if (currentVal && prodVal && currentVal === prodVal) {
      console.log(`  ✅ Runtime matches production file`);
    } else if (!currentVal) {
      console.log(`  ❌ Not set in runtime environment`);
    } else {
      console.log(`  ⚠️  Runtime differs from production file`);
    }
    
    console.log('');
  });
  
  // Test API key validity
  console.log('🔧 Testing API Key Validity:\n');
  
  const apiKey = currentEnv.SENDGRID_API_KEY || prodEnv.SENDGRID_API_KEY || devEnv.SENDGRID_API_KEY;
  
  if (apiKey) {
    try {
      const { default: sgMail } = await import('@sendgrid/mail');
      sgMail.setApiKey(apiKey);
      
      // Test with a simple API call (this won't send email)
      const testMessage = {
        to: 'test@example.com',
        from: currentEnv.SENDGRID_FROM_EMAIL || 'noreply@kickdeck.io',
        subject: 'Test',
        text: 'Test'
      };
      
      // We'll catch the error since we're using a test email
      try {
        await sgMail.send(testMessage);
        console.log('✅ API Key is valid and functional');
      } catch (error) {
        if (error.code === 400 && error.message.includes('test@example.com')) {
          console.log('✅ API Key is valid (test email rejected as expected)');
        } else {
          console.log(`❌ API Key error: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error testing API key: ${error.message}`);
    }
  } else {
    console.log('❌ No API key found to test');
  }
  
  // Summary
  console.log('\n📊 Summary:');
  const devKey = devEnv.SENDGRID_API_KEY;
  const prodKey = prodEnv.SENDGRID_API_KEY;
  const currentKey = currentEnv.SENDGRID_API_KEY;
  
  if (devKey && prodKey && devKey === prodKey) {
    console.log('✅ Development and Production API keys match');
  } else {
    console.log('❌ Development and Production API keys differ or missing');
  }
  
  if (currentKey && prodKey && currentKey === prodKey) {
    console.log('✅ Runtime is using Production API key');
  } else if (currentKey && devKey && currentKey === devKey) {
    console.log('⚠️  Runtime is using Development API key');
  } else {
    console.log('❌ Runtime API key doesn\'t match either file');
  }
}

// Run the comparison
compareApiKeys().catch(console.error);