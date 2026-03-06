# Email Template Guide

This guide explains the email templates used in KickDeck and how they're implemented.

## Welcome Email Templates

KickDeck has two distinct welcome email templates:

1. **Member Welcome Email** - Sent to regular users who register via the `/register` endpoint
2. **Admin Welcome Email** - Sent to administrators when they are created by a super admin

### Implementation Details

Both email templates are implemented using SendGrid's dynamic templates, which allow for visual editing and version control of email content.

#### Template Variables

Both templates support the following variables:

- `{{firstName}}` - User's first name
- `{{lastName}}` - User's last name
- `{{email}}` - User's email address
- `{{loginUrl}}` - URL to the login page (includes the base URL)
- `{{role}}` - The user's role (e.g., "Team Manager", "Administrator")

#### Template Content Guidelines

**Member Welcome Email**
- Personalized greeting using `{{firstName}}` and `{{lastName}}`
- Brief explanation of KickDeck's features
- Information about the dashboard and what users can do there
- Clear login button/link using `{{loginUrl}}`
- Support information

**Admin Welcome Email**
- Personalized greeting using `{{firstName}}` and `{{lastName}}`
- Notification that they've been given admin privileges
- Explanation of admin capabilities
- Clear login button/link using `{{loginUrl}}`
- Support information

### Technical Implementation

The email sending functionality is implemented in multiple components:

#### 1. Email Service (`server/services/emailService.js`)

This service provides a unified interface for sending emails regardless of the email provider (SendGrid, SMTP, etc.). The key function is:

```javascript
async function sendTemplatedEmail(to, templateType, variables) {
  // Get email provider (SendGrid)
  const provider = await getEmailProvider();
  
  // Get email template by type
  const template = await getEmailTemplate(templateType);
  
  // Send email using provider-specific method
  return sendEmail(provider, {
    to,
    template,
    variables
  });
}
```

#### 2. SendGrid Integration (`server/services/sendgridService.js`)

This service handles the direct integration with SendGrid's API:

```javascript
async function sendEmailWithSendGrid(provider, params) {
  const mailService = new MailService();
  mailService.setApiKey(provider.settings.apiKey);
  
  // Prepare SendGrid message with template
  const msg = {
    to: params.to,
    from: params.template.senderEmail,
    templateId: params.template.sendgridTemplateId,
    dynamicTemplateData: params.variables
  };
  
  // Send email using SendGrid
  return mailService.send(msg);
}
```

#### 3. Welcome Email Sending in User Creation

**Member Registration** (`server/routes.ts` `/api/register` endpoint):

```javascript
await sendTemplatedEmail(
  req.body.email,
  'welcome',
  {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    loginUrl: `${getAppUrl(req)}/login`,
    role: 'Team Manager'
  }
);
```

**Admin Creation** (`server/routes.ts` `/api/admin/administrators` endpoint):

```javascript
await sendTemplatedEmail(
  req.body.email,
  'admin_welcome',
  {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    loginUrl: `${getAppUrl(req)}/login`,
    role: 'Administrator'
  }
);
```

### Testing the Email Templates

Several test scripts are available to verify the email templates:

1. **Test Both Templates:**
   ```
   node test-both-welcome-emails.js
   ```

2. **Test Admin Welcome Email:**
   ```
   node test-sendgrid-admin-welcome-direct.js
   ```

3. **Test Member Welcome Email:**
   ```
   node test-sendgrid-member-welcome-direct.js
   ```

4. **Test Admin Creation Flow:**
   ```
   node test-admin-welcome-email.js
   ```

### SendGrid Template Management

The SendGrid template IDs are stored in the database in the `email_templates` table. Each template record includes:

- `id` - Database record ID
- `type` - Template type (e.g., 'welcome', 'admin_welcome')
- `name` - Display name
- `subject` - Email subject line
- `body` - HTML template content (for SMTP fallback)
- `sendgridTemplateId` - ID of the SendGrid dynamic template
- `senderEmail` - Email address to use as sender

### Mapping Templates in the UI

The SendGrid Settings page (`/admin/email/sendgrid-settings`) allows administrators to map email types to SendGrid dynamic templates. This mapping is stored in the database.