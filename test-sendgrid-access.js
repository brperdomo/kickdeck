/**
 * Direct SendGrid Template Access Test
 * 
 * This script tests SendGrid template access and displays all available templates
 * with their IDs and names for easy access and verification.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function testSendGridAccess() {
  console.log('=== SendGrid Template Access Test ===\n');
  
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ SendGrid API Key found');
  console.log(`   Key length: ${SENDGRID_API_KEY.length} characters`);
  console.log(`   Key prefix: ${SENDGRID_API_KEY.substring(0, 10)}...`);
  
  try {
    // Test SendGrid API access
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ SendGrid API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('   Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    const templates = data.templates || [];
    
    console.log(`\n✅ SendGrid API Access Successful!`);
    console.log(`   Found ${templates.length} dynamic templates:`);
    
    if (templates.length === 0) {
      console.log('   No templates found in your SendGrid account');
    } else {
      console.log('\n📋 Available Templates:');
      templates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name}`);
        console.log(`      ID: ${template.id}`);
        console.log(`      Created: ${new Date(template.created_at).toLocaleDateString()}`);
        console.log(`      Updated: ${new Date(template.updated_at).toLocaleDateString()}`);
        console.log('');
      });
    }
    
    // Test individual template access
    if (templates.length > 0) {
      console.log('🔍 Testing individual template access...');
      const firstTemplate = templates[0];
      
      const templateResponse = await fetch(`https://api.sendgrid.com/v3/templates/${firstTemplate.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        console.log(`✅ Individual template access successful for "${templateData.name}"`);
        console.log(`   Versions: ${templateData.versions?.length || 0}`);
      } else {
        console.log(`❌ Individual template access failed: ${templateResponse.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing SendGrid access:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testSendGridAccess().catch(console.error);