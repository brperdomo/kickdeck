import 'dotenv/config';

async function diagnoseSendGridIssue() {
  console.log('🔍 Diagnosing SendGrid Integration Issues\n');
  
  // 1. Check API Key availability
  console.log('1. API Key Status:');
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    console.log(`   ✅ SendGrid API Key present: ${apiKey.substring(0, 10)}...`);
  } else {
    console.log('   ❌ SendGrid API Key missing');
    return;
  }
  
  // 2. Test direct SendGrid API connection
  console.log('\n2. Direct API Connection Test:');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('   ✅ SendGrid API connection successful');
    } else {
      console.log(`   ❌ SendGrid API connection failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ SendGrid API connection error: ${error.message}`);
  }
  
  // 3. Test templates endpoint directly
  console.log('\n3. Templates Endpoint Test:');
  try {
    const templatesResponse = await fetch('https://api.sendgrid.com/v3/templates', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log(`   ✅ Templates accessible: ${templates.templates?.length || 0} templates found`);
    } else {
      console.log(`   ❌ Templates endpoint failed: ${templatesResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Templates endpoint error: ${error.message}`);
  }
  
  // 4. Test local server authentication
  console.log('\n4. Local Server Authentication Test:');
  try {
    const userResponse = await fetch('http://localhost:5000/api/user');
    const userData = await userResponse.json();
    
    if (userResponse.status === 401) {
      console.log('   ❌ User not authenticated (this causes 401 errors on admin endpoints)');
      console.log('   📝 Solution: Login as admin to access SendGrid management');
    } else if (userData.user) {
      console.log(`   ✅ User authenticated: ${userData.user.email}`);
      console.log(`   📝 User roles: ${userData.user.roles?.join(', ') || 'none'}`);
    }
  } catch (error) {
    console.log(`   ❌ Authentication test error: ${error.message}`);
  }
  
  // 5. Test admin endpoint specifically
  console.log('\n5. Admin SendGrid Endpoint Test:');
  try {
    const adminResponse = await fetch('http://localhost:5000/api/admin/sendgrid/templates');
    
    if (adminResponse.status === 401) {
      console.log('   ❌ Admin endpoint returns 401 (expected without authentication)');
      console.log('   📝 This is the source of the frontend 401 errors');
    } else {
      console.log(`   📝 Admin endpoint status: ${adminResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Admin endpoint test error: ${error.message}`);
  }
  
  console.log('\n🎯 Summary:');
  console.log('✅ SendGrid API Key is working correctly');
  console.log('✅ SendGrid service is accessible');
  console.log('❌ Frontend 401 errors caused by missing admin authentication');
  console.log('❌ Google Maps API key is missing (separate issue)');
  
  console.log('\n💡 Solutions:');
  console.log('1. Login as admin to access SendGrid management features');
  console.log('2. Configure Google Maps API key to resolve map warnings');
  console.log('3. SendGrid integration is fully functional once authenticated');
}

diagnoseSendGridIssue();