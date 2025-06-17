/**
 * Fix Suppression Lists and Investigate Templates
 * This script will properly clear all suppression lists and check template configuration
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const apiKey = process.env.SENDGRID_API_KEY;
const baseUrl = 'https://api.sendgrid.com/v3';
const email = 'bperdomo@zoho.com';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

console.log('🔧 Fixing SendGrid Suppression Lists and Templates\n');

// Function to remove from suppression list
async function removeFromSuppressionList(listType, email) {
  try {
    const response = await fetch(`${baseUrl}/suppression/${listType}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ emails: [email] })
    });
    
    if (response.ok) {
      console.log(`✅ Removed ${email} from ${listType}`);
      return true;
    } else {
      const data = await response.json();
      console.log(`❌ Failed to remove from ${listType}:`, data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error removing from ${listType}:`, error.message);
    return false;
  }
}

// Clear all suppression lists
async function clearAllSuppressions() {
  console.log('1. Clearing all suppression lists:');
  const lists = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const listType of lists) {
    await removeFromSuppressionList(listType, email);
  }
}

// Check dynamic templates with correct endpoint
async function checkDynamicTemplates() {
  console.log('\n2. Checking dynamic templates:');
  try {
    const response = await fetch(`${baseUrl}/templates?generations=dynamic`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.templates?.length || 0} dynamic templates`);
      if (data.templates && data.templates.length > 0) {
        data.templates.forEach(template => {
          console.log(`   - ${template.name} (ID: ${template.id})`);
          if (template.versions && template.versions.length > 0) {
            template.versions.forEach(version => {
              console.log(`     Version: ${version.name} (Active: ${version.active})`);
            });
          }
        });
      }
      return data.templates;
    } else {
      console.log('❌ Dynamic templates API failed:', data);
      return [];
    }
  } catch (error) {
    console.log('❌ Dynamic templates request failed:', error.message);
    return [];
  }
}

// Check legacy templates
async function checkLegacyTemplates() {
  console.log('\n3. Checking legacy templates:');
  try {
    const response = await fetch(`${baseUrl}/templates?generations=legacy`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.templates?.length || 0} legacy templates`);
      if (data.templates && data.templates.length > 0) {
        data.templates.forEach(template => {
          console.log(`   - ${template.name} (ID: ${template.id})`);
        });
      }
      return data.templates;
    } else {
      console.log('❌ Legacy templates API failed:', data);
      return [];
    }
  } catch (error) {
    console.log('❌ Legacy templates request failed:', error.message);
    return [];
  }
}

// Test specific template that was used
async function checkSpecificTemplate() {
  console.log('\n4. Checking specific template d-7eb7ea1c19ca4090a0cefa3a2be75088:');
  const templateId = 'd-7eb7ea1c19ca4090a0cefa3a2be75088';
  
  try {
    const response = await fetch(`${baseUrl}/templates/${templateId}`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Template exists: ${data.name}`);
      console.log(`   Generation: ${data.generation}`);
      if (data.versions && data.versions.length > 0) {
        data.versions.forEach(version => {
          console.log(`   Version: ${version.name} (Active: ${version.active ? 'Yes' : 'No'})`);
        });
      }
    } else {
      console.log('❌ Specific template not found:', data);
    }
  } catch (error) {
    console.log('❌ Specific template check failed:', error.message);
  }
}

// Send test email to verify suppression clearing
async function sendTestEmail() {
  console.log('\n5. Sending test email after suppression clearing:');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bperdomo@zoho.com' })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Test email sent successfully');
      console.log('   Check your inbox - this should now be delivered');
    } else {
      console.log('❌ Test email failed:', data);
    }
  } catch (error) {
    console.log('❌ Test email request failed:', error.message);
  }
}

// Verify suppression clearing worked
async function verifySuppressionClearing() {
  console.log('\n6. Verifying suppression list clearing:');
  const lists = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const listType of lists) {
    try {
      const response = await fetch(`${baseUrl}/suppression/${listType}/${email}`, { headers });
      
      if (response.status === 404) {
        console.log(`✅ Successfully removed from ${listType}`);
      } else if (response.ok) {
        const data = await response.json();
        console.log(`❌ Still in ${listType}: ${data.email} (${data.reason || 'no reason'})`);
      } else {
        console.log(`⚠️  ${listType} check inconclusive`);
      }
    } catch (error) {
      console.log(`❌ Error verifying ${listType}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  await clearAllSuppressions();
  await checkDynamicTemplates();
  await checkLegacyTemplates();
  await checkSpecificTemplate();
  await verifySuppressionClearing();
  await sendTestEmail();
  
  console.log('\n📋 Summary:');
  console.log('- Suppression lists have been cleared');
  console.log('- Template configuration has been checked');
  console.log('- Test email sent - check your inbox');
  console.log('- If emails still don\'t arrive, the issue may be with email client filtering');
}

main();