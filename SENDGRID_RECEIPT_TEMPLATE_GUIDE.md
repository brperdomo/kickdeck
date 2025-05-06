# SendGrid Dynamic Template for Registration Receipts

This guide provides instructions for setting up a SendGrid dynamic template for registration receipts in MatchPro.

## Setup Process

1. **Create a Dynamic Template in SendGrid**
   - Log in to your SendGrid account
   - Navigate to Email API > Dynamic Templates
   - Click "Create Template" and provide a name (e.g., "MatchPro Registration Receipt")
   - Note the template ID (starts with "d-") - you'll need this for the next step

2. **Register the Template in MatchPro**
   - Run the setup script with your template ID:
     ```
     node setup-sendgrid-receipt-template.js d-your-template-id
     ```
   - This creates an entry in the database that maps our `registration_receipt` email type to your SendGrid template

3. **Design the Template in SendGrid**
   - In SendGrid, edit your dynamic template's design
   - You can use the HTML template below as a starting point, or create your own design
   - Make sure to use the correct variable names (listed below)

4. **Test the Template**
   - Run the test script with your email address:
     ```
     node test-sendgrid-receipt.js your-email@example.com
     ```
   - Check your inbox to verify the receipt looks correct

## Available Variables

The following variables are available in the registration receipt template:

| Variable | Description |
|----------|-------------|
| `{{teamName}}` | The name of the registered team |
| `{{eventName}}` | The name of the event |
| `{{submitterName}}` | Name of the person who submitted the registration |
| `{{submitterEmail}}` | Email of the person who submitted the registration |
| `{{registrationDate}}` | Date when the registration was submitted |
| `{{totalAmount}}` | Total amount paid (formatted as currency) |
| `{{paymentStatus}}` | Status of the payment (paid, pending) |
| `{{paymentDate}}` | Date when the payment was processed |
| `{{paymentMethod}}` | Method of payment (usually card) |
| `{{cardLastFour}}` | Last four digits of the credit card |
| `{{cardBrand}}` | Brand of the credit card (Visa, Mastercard, etc.) |
| `{{paymentId}}` | Payment transaction ID |
| `{{loginLink}}` | Link to the dashboard to view registration details |
| `{{clubName}}` | Name of the club/organization if applicable |
| `{{currentYear}}` | Current year for copyright notices |

## Sample HTML Template

Here's a sample HTML template you can use in SendGrid:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration Receipt</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #2C5282;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .receipt-number {
      font-size: 14px;
      color: #f0f0f0;
      margin-top: 5px;
    }
    .content {
      padding: 20px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #2C5282;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      text-align: right;
    }
    .fees-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 14px;
    }
    .fees-table th {
      background-color: #f0f5ff;
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #ddd;
      color: #2C5282;
    }
    .fees-table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .fees-table .amount {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      border-top: 2px solid #ddd;
    }
    .status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .footer {
      text-align: center;
      padding: 15px 20px;
      background-color: #f5f5f5;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #2C5282;
      color: white !important;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
    .support-info {
      margin-top: 25px;
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registration Receipt</h1>
      <div class="receipt-number">Receipt #: {{paymentId}}</div>
    </div>
    <div class="content">
      <p>Dear {{submitterName}},</p>
      
      <p>Thank you for your registration. This email serves as your receipt for your recent team registration.</p>
      
      <div class="section">
        <div class="section-title">Registration Details</div>
        <div class="info-row">
          <span class="label">Event:</span>
          <span class="value">{{eventName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Team Name:</span>
          <span class="value">{{teamName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Club/Organization:</span>
          <span class="value">{{clubName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Registration Date:</span>
          <span class="value">{{registrationDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Submitted By:</span>
          <span class="value">{{submitterName}} ({{submitterEmail}})</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value">
            {{#if paymentStatus == 'paid'}}
            <span class="status status-paid">Paid</span>
            {{else}}
            <span class="status status-pending">Pending</span>
            {{/if}}
          </span>
        </div>
        <div class="info-row">
          <span class="label">Payment Date:</span>
          <span class="value">{{paymentDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Transaction ID:</span>
          <span class="value">{{paymentId}}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Method:</span>
          <span class="value">{{cardBrand}} •••• {{cardLastFour}}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Fee Breakdown</div>
        <table class="fees-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Registration Fee</td>
              <td class="amount">${{totalAmount}}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td class="amount">${{totalAmount}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{loginLink}}" class="button">View Registration Details</a>
      </div>
      
      <div class="support-info">
        <p>If you have any questions regarding your registration or payment, please contact our support team.</p>
        <p>Thank you for registering with MatchPro!</p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email.</p>
      <p>&copy; {{currentYear}} MatchPro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

## Integration in Registration Flow

The registration receipt email is automatically sent to the submitter when:

1. A team registration is completed
2. A payment is processed for a registration

This happens through the `sendRegistrationReceiptEmail` function in the email service, which is called at the appropriate points in the registration and payment flows.

## Troubleshooting

If the receipt emails are not being sent:

1. Verify that the SendGrid API key is correctly set in your environment
2. Check that the SendGrid template ID is correctly registered in the database
3. Make sure that the SendGrid dynamic template is active and approved
4. Check the email service logs for any errors
5. Run the test script to see if a test email can be sent successfully