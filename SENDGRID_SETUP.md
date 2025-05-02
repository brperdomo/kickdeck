# SendGrid Email Integration

This document explains how to set up and use SendGrid for sending emails in this application.

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

## Testing the Integration

The repository includes several test scripts to verify your SendGrid integration:

```bash
# Basic SendGrid test
node test-sendgrid-direct.js recipient@example.com verified-sender@yourdomain.com

# Test with verified domain
node test-sendgrid-verified-domain.js recipient@example.com noreply@yourdomain.com

# Test the application's email service with SendGrid
node test-email-service-sendgrid.js recipient@example.com verified-sender@yourdomain.com
```

Replace `recipient@example.com` with your email and `verified-sender@yourdomain.com` with a verified sender email from your SendGrid account.

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

## Using SendGrid in the Application

The application is set up to use SendGrid as an email provider with the following capabilities:

1. Regular email sending
2. Templated emails
3. HTML and plain text content

Example usage within the code:

```javascript
// Direct usage of SendGrid service
import * as sendgridService from './server/services/sendgridService';

await sendgridService.sendEmail({
  to: 'recipient@example.com',
  from: 'verified-sender@yourdomain.com',
  subject: 'Hello from the application',
  html: '<h1>Hello world!</h1>'
});

// Or using the application's email service (automatically selects provider)
import { sendEmail } from './server/services/emailService';

await sendEmail({
  to: 'recipient@example.com',
  from: 'verified-sender@yourdomain.com',
  subject: 'Hello from the application',
  html: '<h1>Hello world!</h1>'
});
```