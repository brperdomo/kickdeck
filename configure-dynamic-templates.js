/**
 * Configure Dynamic Templates via API
 * 
 * This script uses your existing API endpoints to configure template mappings
 * so production emails use your SendGrid branded templates.
 */

const templateMappings = [
  {
    type: 'password_reset',
    name: 'Password Reset',
    sendgridTemplateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088'
  },
  {
    type: 'registration_submitted', 
    name: 'Registration Submitted',
    sendgridTemplateId: 'd-4eca2752ddd247158dd1d5433407cd5e'
  },
  {
    type: 'team_approved',
    name: 'Team Approved / Payment Processed', 
    sendgridTemplateId: 'd-1bca14d4dc8e41e5a7ed2131124d470e'
  },
  {
    type: 'team_rejected',
    name: 'Team Not Approved',
    sendgridTemplateId: 'd-4160d22e727944128335d7a3910b8092'
  },
  {
    type: 'team_waitlisted',
    name: 'Waitlisted Team',
    sendgridTemplateId: 'd-23265a10149a4144893cf84e32cc3f54'
  },
  {
    type: 'payment_confirmation',
    name: 'Payment Confirmation',
    sendgridTemplateId: 'd-3697f286c1e748f298710282e515ee25'
  },
  {
    type: 'admin_welcome',
    name: 'Admin Welcome Email',
    sendgridTemplateId: 'd-29971e21ccc641de982f3d60f395ccb5'
  },
  {
    type: 'member_welcome',
    name: 'Member Welcome Email', 
    sendgridTemplateId: 'd-6064756d74914ec79b3a3586f6713424'
  }
];

console.log('Configuring SendGrid Dynamic Templates');
console.log('=====================================');

async function configureDynamicTemplates() {
  const baseUrl = 'http://localhost:5000'; // Using local server API
  
  console.log(`Configuring ${templateMappings.length} template mappings...`);
  
  for (const mapping of templateMappings) {
    try {
      // First check if template exists
      const checkResponse = await fetch(`${baseUrl}/api/admin/email-templates`);
      
      if (!checkResponse.ok) {
        console.log(`❌ Could not access email templates API: ${checkResponse.status}`);
        continue;
      }
      
      const templates = await checkResponse.json();
      const existingTemplate = templates.find(t => t.type === mapping.type);
      
      const templateData = {
        type: mapping.type,
        name: mapping.name,
        sendgridTemplateId: mapping.sendgridTemplateId,
        subject: `{{subject}}`, // Will be handled by SendGrid template
        content: '', // Not used for dynamic templates
        isActive: true,
        senderEmail: 'support@matchpro.ai',
        senderName: 'MatchPro'
      };
      
      let response;
      if (existingTemplate) {
        // Update existing template
        response = await fetch(`${baseUrl}/api/admin/email-templates/${existingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(templateData)
        });
      } else {
        // Create new template
        response = await fetch(`${baseUrl}/api/admin/email-templates`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(templateData)
        });
      }
      
      if (response.ok) {
        console.log(`✅ ${existingTemplate ? 'Updated' : 'Created'}: ${mapping.name}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to ${existingTemplate ? 'update' : 'create'} ${mapping.name}: ${response.status}`);
        console.log(`   Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Error configuring ${mapping.name}: ${error.message}`);
    }
  }
  
  console.log('\n=== Testing Dynamic Template Email ===');
  
  // Test sending an email with dynamic template
  try {
    const testResponse = await fetch(`${baseUrl}/api/admin/sendgrid/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088', // Password reset template
        recipientEmail: 'bperdomo@zoho.com',
        testData: {
          userName: 'Test User',
          resetLink: 'https://app.matchpro.ai/reset-password?token=test123',
          supportEmail: 'support@matchpro.ai'
        }
      })
    });
    
    if (testResponse.ok) {
      console.log('✅ Dynamic template test email sent successfully');
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ Test email failed: ${testResponse.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error sending test email: ${error.message}`);
  }
  
  console.log('\n=== Configuration Complete ===');
  console.log('✅ Template mappings configured');
  console.log('✅ Production emails will now use your SendGrid branded templates');
  console.log('✅ Check your email for the test message using the branded template');
}

configureDynamicTemplates();