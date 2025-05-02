# SendGrid Email Integration for MatchPro

This document explains how to set up and use SendGrid for sending emails in MatchPro.

## Setup Requirements

1. A SendGrid account ([Sign up here](https://signup.sendgrid.com/))
2. SendGrid API Key with mail sending permissions
3. A verified sender identity (email or domain) in your SendGrid account

## Getting Started

### 1. Create a SendGrid Account

If you don't already have a SendGrid account, sign up at [sendgrid.com](https://signup.sendgrid.com/).

### 2. Create an API Key

1. Log into your SendGrid account
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Name your key (e.g., "MatchPro API Key")
5. Select "Restricted Access" and ensure "Mail Send" permissions are enabled
6. Create the key and copy it (you'll only see it once)

### 3. Verify a Sender Identity

SendGrid requires that all emails are sent from verified identities to prevent email spoofing:

1. In your SendGrid dashboard, go to Settings > Sender Authentication
2. Choose either:
   - Single Sender Verification (for one email address)
   - Domain Authentication (recommended for production)
3. Follow the verification steps

### 4. Configure the Application

Set your SendGrid API key as an environment variable:

```bash
# For development
export SENDGRID_API_KEY='your_api_key_here'

# For the application
# Add it to your environment variables or .env file
```

## Overview

MatchPro now uses SendGrid as the primary and only email provider for all system emails, including:

1. Password reset emails
2. Team registration confirmations
3. Administrative notifications
4. User welcome emails

The integration is configured to use either:
- A SendGrid provider configured in the database, or
- The SENDGRID_API_KEY environment variable as a fallback

## Email Templates

All email templates are stored in the database and retrieved when needed. The system includes:

- Password reset template
- Welcome email template 
- Other team/event related templates

If a template is not found, a fallback template is automatically generated.

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**: Ensure you're using a verified sender identity.
2. **API Key Issues**: Make sure your API key has Mail Send permissions and is correctly set in the environment.
3. **Email Not Received**: Check your spam folder and verify SendGrid isn't being blocked by your email provider.

### Sender Identity Requirements

From SendGrid documentation:
> The from address does not match a verified Sender Identity. Mail cannot be sent until this error is resolved.

You must send from an email address that matches one of:
- A verified Single Sender
- An address from a verified domain
- A sender that matches a verified domain alias

Currently configured to use: `support@matchpro.ai` (must be verified in your SendGrid account)

## Usage Examples

### Direct usage of SendGrid service

```javascript
import * as sendgridService from './server/services/sendgridService';

await sendgridService.sendEmail({
  to: 'recipient@example.com',
  from: 'support@matchpro.ai', // Must be verified in SendGrid
  subject: 'Hello from MatchPro',
  html: '<h1>Hello world!</h1>'
});
```

### Using the application's email service

```javascript
import { sendEmail } from './server/services/emailService';

await sendEmail({
  to: 'recipient@example.com',
  from: 'MatchPro Support <support@matchpro.ai>', // Uses the verified sender
  subject: 'Hello from MatchPro',
  html: '<h1>Hello world!</h1>'
});
```

### Sending templated emails (recommended approach)

```javascript
import { sendTemplatedEmail } from './server/services/emailService';

await sendTemplatedEmail(
  'recipient@example.com',
  'password_reset', // Template type
  {
    // Context variables for the template
    username: 'John Doe',
    resetUrl: 'https://example.com/reset?token=abc123',
    expiryHours: 24
  }
);
```

## Testing

You can test the SendGrid integration with:

```
node test-sendgrid.js your-email@example.com
```

To test password reset emails specifically:

```
node test-password-reset-email.js your-email@example.com
```