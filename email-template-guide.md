# Email Template Configuration Guide

## Accessing Email Templates

You can configure and customize all email templates in the MatchPro admin dashboard:

1. Log in to your MatchPro account as an admin
2. Navigate to **Admin Dashboard**
3. Go to **Settings** → **Email Templates**

## Available Email Templates

The system supports the following email template types:

- **Welcome** - Sent when a new user creates an account
- **Password Reset** - Sent when a user requests to reset their password
- **Event Registration** - Sent to confirm event registrations
- **Payment Confirmation** - Sent after successful payments
- **Notification** - General notifications sent by the system

## Customizing Templates

Each template can be fully customized with the following options:

### Basic Information
- **Template Name** - Identifier for the template
- **Subject Line** - Email subject that recipients will see
- **Sender Name** - Name that appears in the "From" field
- **Sender Email** - Email address that appears in the "From" field (must be verified in SendGrid)

### Content
- **HTML Content** - The rich HTML content of the email
- **Text Content** - Plain text version for email clients that don't support HTML

### Variables
You can use these variables in your templates, which will be automatically replaced with actual values:

- `{{firstName}}` - Recipient's first name
- `{{lastName}}` - Recipient's last name
- `{{email}}` - Recipient's email address
- `{{username}}` - Recipient's username
- `{{resetLink}}` - Password reset link (for password reset emails)
- `{{eventName}}` - Name of the event (for event-related emails)
- `{{teamName}}` - Name of the team (for team-related emails)
- `{{bracketName}}` - Name of the bracket (for bracket-related emails)
- `{{paymentAmount}}` - Payment amount (for payment-related emails)

## SendGrid Compatibility

Our email system is fully integrated with SendGrid. To ensure your templates work correctly with SendGrid:

1. **Use Mobile-Responsive Design** - SendGrid delivers emails to various devices, so ensure your templates are responsive
2. **Keep HTML Simple** - Avoid complex CSS or JavaScript that might not be supported by email clients
3. **Test Before Sending** - Use the preview function to test how your email looks before saving it
4. **Verify Sender Domains** - Make sure your sender email domain is verified in SendGrid
5. **Use Proper HTML Structure** - Include proper HTML tags and structure for best compatibility

## Template Testing

You can test your templates before using them in production:

1. Click the **Preview** button on any template
2. Enter test data for variables
3. View how the email will appear to recipients

## Email Provider Settings

To configure SendGrid as your email provider:

1. Go to **Admin Dashboard** → **Settings** → **Email Providers**
2. Select **SendGrid** as your provider
3. Enter your SendGrid API key
4. Set a default sender email address (must be verified in SendGrid)
5. Test the configuration to ensure it works properly

## Troubleshooting

If emails are not being delivered:

1. Check that your SendGrid API key is valid and has proper permissions
2. Verify that the sender email domain is verified in SendGrid
3. Check SendGrid's activity log for possible delivery issues
4. Ensure your template has valid HTML structure
5. Check that your email templates are using the SendGrid provider configuration