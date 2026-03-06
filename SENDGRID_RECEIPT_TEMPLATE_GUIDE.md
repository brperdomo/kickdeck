# SendGrid Registration Receipt Template Guide

This guide explains how to set up a SendGrid dynamic template for team registration receipts in KickDeck.

## Overview

The registration receipt email is sent in two scenarios:
1. Immediately after a team is registered (with preliminary payment status)
2. After a payment is successfully processed (with updated payment details)

The template uses SendGrid's dynamic templating system to automatically populate information about:
- Team details (name, coaches, players)
- Event information
- Payment status and transaction details
- Card information (last 4 digits only, for security)

## Creating the Template in SendGrid

1. Log in to your SendGrid account
2. Navigate to Email API > Dynamic Templates
3. Click "Create a Dynamic Template"
4. Name it something like "Team Registration Receipt"
5. Click "Add Version" and select "Code Editor"
6. Paste the HTML template (sample provided below)
7. Save the template and note the Template ID

## Connecting the Template in KickDeck

1. Go to KickDeck Admin > Email Settings
2. Select "SendGrid" as your email provider
3. Under "Template Mappings," find "Registration Receipt"
4. Paste your SendGrid Template ID
5. Save your changes

## Dynamic Variables

The following variables are available to use in your template:

| Variable Name | Description |
|---------------|-------------|
| {{teamName}} | Name of the registered team |
| {{eventName}} | Name of the event/tournament |
| {{submitterName}} | Name of the person who submitted the registration |
| {{submitterEmail}} | Email of the person who submitted the registration |
| {{registrationDate}} | Date when the team was registered |
| {{totalAmount}} | Total amount paid/due (formatted as currency) |
| {{paymentStatus}} | Status of payment (paid, pending, failed) |
| {{paymentDate}} | Date when payment was processed (if applicable) |
| {{paymentMethod}} | Payment method used (e.g., card) |
| {{cardLastFour}} | Last 4 digits of credit card (if applicable) |
| {{cardBrand}} | Brand of credit card used (if applicable) |
| {{paymentId}} | Payment intent ID for reference |
| {{headCoachName}} | Name of the head coach |
| {{headCoachEmail}} | Email of the head coach |
| {{headCoachPhone}} | Phone number of the head coach |
| {{managerName}} | Name of the team manager |
| {{managerEmail}} | Email of the team manager |
| {{managerPhone}} | Phone number of the team manager |
| {{dashboardLink}} | Link to the team's dashboard |

## Sample Template HTML

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 15px;
    }
    .message { margin: 20px 0; }
    .info-section {
      margin: 20px 0;
      padding: 15px;
      border-radius: 4px;
      background-color: #f8fafc;
    }
    .status-paid {
      background-color: #10b981;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
    }
    .status-pending {
      background-color: #f59e0b;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registration Receipt</h1>
    </div>
    <div class="content">
      <p>Dear {{submitterName}},</p>
      <p class="message">Thank you for registering <strong>{{teamName}}</strong> for <strong>{{eventName}}</strong>. This email serves as your registration receipt.</p>
      
      <div class="info-section">
        <h3>Registration Details</h3>
        <table>
          <tr>
            <th>Team Name:</th>
            <td>{{teamName}}</td>
          </tr>
          <tr>
            <th>Event:</th>
            <td>{{eventName}}</td>
          </tr>
          <tr>
            <th>Registration Date:</th>
            <td>{{registrationDate}}</td>
          </tr>
          <tr>
            <th>Total Amount:</th>
            <td>${{totalAmount}}</td>
          </tr>
          <tr>
            <th>Payment Status:</th>
            <td>
              {{#if_eq paymentStatus "paid"}}
                <span class="status-paid">PAID</span>
              {{else}}
                <span class="status-pending">{{paymentStatus}}</span>
              {{/if_eq}}
            </td>
          </tr>
          {{#if_eq paymentStatus "paid"}}
          <tr>
            <th>Payment Date:</th>
            <td>{{paymentDate}}</td>
          </tr>
          <tr>
            <th>Payment Method:</th>
            <td>{{cardBrand}} ending in {{cardLastFour}}</td>
          </tr>
          <tr>
            <th>Transaction ID:</th>
            <td>{{paymentId}}</td>
          </tr>
          {{/if_eq}}
        </table>
      </div>
      
      <div class="info-section">
        <h3>Team Contact Information</h3>
        <table>
          <tr>
            <th>Head Coach:</th>
            <td>{{headCoachName}}</td>
          </tr>
          <tr>
            <th>Coach Email:</th>
            <td>{{headCoachEmail}}</td>
          </tr>
          <tr>
            <th>Coach Phone:</th>
            <td>{{headCoachPhone}}</td>
          </tr>
          <tr>
            <th>Team Manager:</th>
            <td>{{managerName}}</td>
          </tr>
          <tr>
            <th>Manager Email:</th>
            <td>{{managerEmail}}</td>
          </tr>
          <tr>
            <th>Manager Phone:</th>
            <td>{{managerPhone}}</td>
          </tr>
        </table>
      </div>
      
      <p>To view your registration details and team information, please visit your dashboard.</p>
      
      <div style="text-align: center;">
        <a href="{{dashboardLink}}" class="button">Go to Dashboard</a>
      </div>
      
      <p>Thank you for using KickDeck!</p>
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
```

## Testing

After setting up your template, you can test it with the following methods:

1. Register a test team through the regular registration flow
2. Use the test script: `node test-sendgrid-registration-receipt.js your@email.com`
3. Process a test payment to verify the payment confirmation receipt

## Troubleshooting

- If variables aren't displaying correctly, ensure your variable names match exactly (case sensitive)
- Check that your SendGrid API key has the necessary permissions for sending mail
- Verify that your sender email is properly verified in SendGrid

For additional support, please contact the KickDeck support team.