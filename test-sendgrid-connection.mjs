import sgMail from '@sendgrid/mail';
import 'dotenv/config';

async function testSendGridConnection() {
  console.log('🧪 Testing SendGrid Connection\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found in environment');
    return;
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
  
  try {
    // Set the API key
    sgMail.setApiKey(apiKey);
    
    // Test API key validity by making a simple API call
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const accountData = await response.json();
      console.log('✅ SendGrid API connection successful');
      console.log(`   Account Type: ${accountData.type || 'N/A'}`);
      console.log(`   Account Name: ${accountData.name || 'N/A'}`);
    } else {
      console.error('❌ SendGrid API connection failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   Status Text: ${response.statusText}`);
      
      const errorText = await response.text();
      console.error(`   Error Details: ${errorText}`);
    }
    
    // Test templates endpoint specifically
    console.log('\n🔍 Testing Templates Endpoint...');
    const templatesResponse = await fetch('https://api.sendgrid.com/v3/templates', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log('✅ Templates endpoint accessible');
      console.log(`   Templates found: ${templates.templates?.length || 0}`);
    } else {
      console.error('❌ Templates endpoint failed');
      console.error(`   Status: ${templatesResponse.status}`);
      console.error(`   Status Text: ${templatesResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ SendGrid connection test failed:', error.message);
  }
}

testSendGridConnection();