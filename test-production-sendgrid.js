/**
 * Test Production SendGrid Issue
 * 
 * This script tests the exact production scenario to identify the 500 error
 */

import fetch from 'node-fetch';

async function testProductionSendGrid() {
  console.log('=== Production SendGrid Diagnostics ===');
  
  // Check environment
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SENDGRID_API_KEY present:', !!process.env.SENDGRID_API_KEY);
  console.log('- API key length:', process.env.SENDGRID_API_KEY?.length || 0);
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is missing');
    return;
  }
  
  try {
    console.log('\nTesting SendGrid API directly...');
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SendGrid API error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ SendGrid API success');
    console.log('Templates found:', data.templates?.length || 0);
    
    // Test node-fetch import (common production issue)
    console.log('\nTesting node-fetch import...');
    const dynamicFetch = (await import('node-fetch')).default;
    console.log('✅ node-fetch import successful');
    
    return data.templates;
  } catch (error) {
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
  }
}

testProductionSendGrid();