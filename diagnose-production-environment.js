/**
 * Production Environment Diagnosis Script
 * 
 * This script identifies missing environment variables and configuration
 * differences between development and production environments.
 */

import dotenv from 'dotenv';
import fs from 'fs';

// Load both environment files
dotenv.config({ path: '.env' });
const devEnv = process.env;

// Reset and load production
for (const key in process.env) {
  if (!['PATH', 'HOME', 'USER', 'NODE_VERSION', 'NPM_VERSION'].includes(key)) {
    delete process.env[key];
  }
}
dotenv.config({ path: '.env.production' });
const prodEnv = process.env;

console.log('\n🔍 PRODUCTION vs DEVELOPMENT ENVIRONMENT ANALYSIS');
console.log('=================================================\n');

// Critical environment variables for email functionality
const criticalVars = [
  'SENDGRID_API_KEY',
  'DEFAULT_FROM_EMAIL',
  'DATABASE_URL',
  'NODE_ENV',
  'PORT',
  'SESSION_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_CONNECT_CLIENT_ID',
  'FRONTEND_URL',
  'BACKEND_URL'
];

console.log('1. CRITICAL ENVIRONMENT VARIABLES STATUS:');
console.log('==========================================');

const missingInProd = [];
const presentInBoth = [];

criticalVars.forEach(varName => {
  const inDev = !!devEnv[varName];
  const inProd = !!prodEnv[varName];
  
  if (inDev && !inProd) {
    missingInProd.push(varName);
    console.log(`❌ ${varName}: Present in DEV, MISSING in PROD`);
  } else if (inDev && inProd) {
    presentInBoth.push(varName);
    console.log(`✅ ${varName}: Present in both environments`);
  } else if (!inDev && !inProd) {
    console.log(`⚠️  ${varName}: Missing in both environments`);
  } else {
    console.log(`🔄 ${varName}: Only in PROD`);
  }
});

console.log('\n2. MISSING VARIABLES IN PRODUCTION:');
console.log('===================================');
if (missingInProd.length === 0) {
  console.log('✅ No critical variables missing in production');
} else {
  console.log('❌ The following variables are missing in production:');
  missingInProd.forEach(varName => {
    console.log(`   • ${varName}`);
  });
}

console.log('\n3. EMAIL SERVICE DIAGNOSIS:');
console.log('===========================');

// Check if SendGrid is configured
if (!prodEnv.SENDGRID_API_KEY) {
  console.log('❌ SENDGRID_API_KEY missing in production');
  console.log('   This is why password reset emails fail in production');
} else {
  console.log('✅ SENDGRID_API_KEY present in production');
}

if (!prodEnv.DEFAULT_FROM_EMAIL) {
  console.log('❌ DEFAULT_FROM_EMAIL missing in production');
  console.log('   This may cause email sender issues');
} else {
  console.log('✅ DEFAULT_FROM_EMAIL present in production');
}

console.log('\n4. PRODUCTION ENVIRONMENT FILE CONTENTS:');
console.log('========================================');

try {
  const prodFileContent = fs.readFileSync('.env.production', 'utf8');
  console.log('Current .env.production content:');
  console.log(prodFileContent);
} catch (error) {
  console.log('❌ Cannot read .env.production file:', error.message);
}

console.log('\n5. RECOMMENDED ACTIONS:');
console.log('======================');

if (missingInProd.length > 0) {
  console.log('To fix production email issues:');
  console.log('');
  console.log('1. Add the missing environment variables to .env.production:');
  missingInProd.forEach(varName => {
    console.log(`   ${varName}=<your_${varName.toLowerCase()}_value>`);
  });
  console.log('');
  console.log('2. Ensure the production deployment process loads .env.production');
  console.log('3. Restart the production server after adding the variables');
  console.log('');
  console.log('Critical for email functionality:');
  console.log('• SENDGRID_API_KEY - Your SendGrid API key');
  console.log('• DEFAULT_FROM_EMAIL - Default sender email (e.g., support@kickdeck.io)');
} else {
  console.log('✅ All critical variables are present');
  console.log('The issue may be in how the production environment loads these variables');
}

console.log('\n6. NEXT STEPS:');
console.log('=============');
console.log('Run this script to automatically fix the production environment:');
console.log('node fix-production-environment.js');