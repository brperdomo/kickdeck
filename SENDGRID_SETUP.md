# SendGrid Dynamic Templates Setup Guide

This guide explains how to set up and use SendGrid Dynamic Templates with your MatchPro application for sending welcome emails and other notifications.

## Prerequisites

1. A SendGrid account with API access
2. Your SendGrid API key (should be set as an environment variable `SENDGRID_API_KEY`)
3. Access to the MatchPro Admin Dashboard

## Setting Up SendGrid as Your Email Provider

1. Run the setup script to configure SendGrid as your email provider:
   ```
   node setup-sendgrid-provider.js
   ```

2. Verify the SendGrid provider is active:
   ```
   node setup-welcome-email-template.js
   ```
   This will ensure your welcome email templates are configured to use SendGrid.

## Creating Dynamic Templates in SendGrid

1. Log in to your SendGrid account
2. Navigate to "Email API" > "Dynamic Templates"
3. Click "Create a Dynamic Template"
4. Name your template (e.g., "Member Welcome Email", "Admin Welcome Email")
5. Design your template using the SendGrid template editor
6. Use Handlebars syntax for variable substitution:
   - `{{firstName}}` - The user's first name
   - `{{lastName}}` - The user's last name
   - `{{email}}` - The user's email address
   - `{{loginLink}}` - Link to the login page
   - `{{role}}` - For admin emails, the user's role

## Assigning SendGrid Templates to Your Application

1. View your available SendGrid templates:
   ```
   node assign-sendgrid-templates.js list
   ```

2. Assign templates to specific email types:
   ```
   node assign-sendgrid-templates.js assign
   ```
   Follow the interactive prompts to map your SendGrid templates to application email types (welcome, admin_welcome, etc.)

## Testing Your Templates

1. After assigning templates, test both welcome emails:
   ```
   node test-both-welcome-emails.js your-email@example.com
   ```

2. Check your inbox for the test emails and verify they appear as expected

## Troubleshooting

If emails aren't sending properly:

1. Check that your SendGrid API key is correct in your environment variables
2. Verify the template assignments using `node assign-sendgrid-templates.js list`
3. Check the SendGrid Activity Feed in your SendGrid dashboard for errors
4. Make sure your sender email is verified in SendGrid

## SendGrid API Reference

For more details on SendGrid's API capabilities, see:
- [SendGrid Dynamic Templates Documentation](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates)
- [SendGrid Node.js API Library](https://github.com/sendgrid/sendgrid-nodejs)