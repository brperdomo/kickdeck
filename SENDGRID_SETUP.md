# SendGrid Integration Guide

This guide explains how to properly set up and configure SendGrid for use with KickDeck's email functionality, particularly for welcome emails.

## Setup Process

### 1. Set up SendGrid API Key

1. Sign up for a SendGrid account at [sendgrid.com](https://sendgrid.com/)
2. Generate an API Key with full access to "Mail Send" and "Template Engine"
3. Set the API key in your environment:
   - For local development: Add `SENDGRID_API_KEY=your_api_key_here` to your `.env` file
   - For production: Set the environment variable in your deployment platform

### 2. Verify Sender Identity

1. In SendGrid dashboard, go to Settings > Sender Authentication
2. Set up either Single Sender Verification or Domain Authentication
   - Domain Authentication is recommended for production environments
   - For testing, Single Sender Verification is sufficient
3. Verify the sender email that will be used for welcome emails

### 3. Create Dynamic Templates in SendGrid

1. In SendGrid dashboard, go to Email API > Dynamic Templates
2. Click "Create a Dynamic Template"
3. Name your template (e.g., "Member Welcome Email" or "Admin Welcome Email")
4. Design the template using the template editor
   - Use the design editor for a visual experience
   - Or use the code editor for more control

### 4. Design Welcome Email Templates

Create two separate dynamic templates:

#### Member Welcome Email
This email should include:
- Personalized greeting (use `{{user.firstName}}`)
- Welcome message explaining what KickDeck is
- Clear call-to-action for logging in (`{{loginUrl}}`)
- Brief overview of dashboard features
- Support contact information

#### Admin Welcome Email
This email should include:
- Personalized greeting (use `{{user.firstName}}`)
- Welcome message mentioning admin privileges
- Instructions on accessing admin features
- Link to admin dashboard (`{{loginUrl}}`)
- Support contact information

### 5. Set Up Dynamic Template Variables

Both templates should support these variables:
- `{{firstName}}` - User's first name
- `{{lastName}}` - User's last name
- `{{email}}` - User's email address
- `{{loginUrl}}` - URL to the login page
- `{{appUrl}}` - Base URL of the application
- `{{organizationName}}` - Name of the organization (if available)

Admin template should also use:
- `{{role}}` - Role of the user (e.g., "Administrator")

## Configuration in KickDeck

### 1. Configure SendGrid Email Provider

1. Access the admin panel and navigate to Settings > Email
2. Add SendGrid as an email provider:
   - Provider Type: SendGrid
   - API Key: [Use environment variable, don't enter directly]
   - Sender Email: The verified email address from step 2
   - Sender Name: "KickDeck" or your organization name

### 2. Map SendGrid Templates to Email Types

1. Go to Settings > Email Templates > SendGrid Settings
2. For each email type, select the corresponding SendGrid template:
   - Map "welcome" to your Member Welcome template ID
   - Map "admin_welcome" to your Admin Welcome template ID

### 3. Test the Templates

1. Run the test scripts to verify both templates are working:
   ```
   # Test both welcome email templates
   node test-both-welcome-emails.js

   # Test admin welcome email only
   node test-sendgrid-admin-welcome-direct.js

   # Test member welcome email only
   node test-sendgrid-member-welcome-direct.js
   ```
2. Check the email delivery and formatting in your inbox
3. You can also create a test administrator to verify the welcome email flow:
   ```
   node test-admin-welcome-email.js
   ```

## Troubleshooting

### Common Issues

1. **Emails not sending:**
   - Verify your SendGrid API key is correctly set
   - Check if your sender identity is verified
   - Look for any API errors in the logs

2. **Template variables not working:**
   - Ensure variable names match exactly in both the template and code
   - Check for typos in the variable syntax (should be `{{variableName}}`)

3. **Email delivery issues:**
   - Check SendGrid's Activity feed for delivery status
   - Verify recipient email isn't bouncing or marked as spam

### Debugging Tools

1. Use the API testing endpoint to send test emails:
   ```
   POST /api/admin/sendgrid/test-template
   {
     "templateId": "your-template-id",
     "recipientEmail": "test@example.com",
     "testData": {
       "user": {
         "firstName": "Test",
         "lastName": "User",
         "email": "test@example.com"
       },
       "loginUrl": "https://example.com/login",
       "appUrl": "https://example.com",
       "organizationName": "Test Org"
     }
   }
   ```

2. Check SendGrid Event Logs for delivery status and issues.

## Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Dynamic Templates Guide](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates)
- [Sender Authentication Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)