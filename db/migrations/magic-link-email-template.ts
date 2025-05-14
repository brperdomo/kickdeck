import { db } from '@db';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq } from 'drizzle-orm';

/**
 * Create Email Template for Magic Link Authentication
 */
async function createMagicLinkEmailTemplate() {
  console.log('Setting up magic link email template...');

  // Check if the template already exists
  const existingTemplates = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.templateType, 'magic_link'));

  if (existingTemplates.length > 0) {
    console.log('Magic link email template already exists');
    return;
  }

  // Create the email template for magic links
  const [template] = await db
    .insert(emailTemplates)
    .values({
      templateType: 'magic_link',
      subject: 'Your MatchPro Login Link',
      fromName: 'MatchPro',
      fromEmail: 'support@matchpro.ai',
      template: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MatchPro Login Link</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 5px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .note {
      font-size: 14px;
      color: #666;
      font-style: italic;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://matchpro.ai/logo.png" alt="MatchPro Logo" class="logo">
    <h1>One-Click Login Link</h1>
  </div>
  
  <div class="container">
    <p>Hello {{firstName}},</p>
    
    <p>You requested a secure, one-click login link for your MatchPro {{userType}} account. Click the button below to log in securely without entering a password:</p>
    
    <p style="text-align: center;">
      <a href="{{magicLinkUrl}}" class="button">Log In Securely</a>
    </p>
    
    <p class="note">This link will expire in {{expiryMinutes}} minutes and can only be used once.</p>
    
    <p>If you didn't request this link, you can safely ignore this email. No changes will be made to your account.</p>
  </div>
  
  <div class="footer">
    <p>MatchPro &copy; 2025. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
      `,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  console.log('Created magic link email template:', template.id);
  return template;
}

// Execute the function if this script is run directly
if (require.main === module) {
  createMagicLinkEmailTemplate()
    .then(() => {
      console.log('Magic link email template setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error setting up magic link email template:', error);
      process.exit(1);
    });
}

export { createMagicLinkEmailTemplate };