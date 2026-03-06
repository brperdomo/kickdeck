/**
 * This script inserts the registration receipt email template
 * into the database directly.
 */

const { db } = require('./server/db/index');
const { emailTemplates } = require('./server/db/schema/emailTemplates');
const { eq } = require('drizzle-orm');

async function insertTemplate() {
  try {
    // Check if the template already exists
    const existingTemplates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'registration_receipt'));

    if (existingTemplates && existingTemplates.length > 0) {
      console.log("Registration receipt email template already exists");
      return;
    }

    // Template HTML content
    const templateContent = `
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
        {{#if clubName}}
        <div class="info-row">
          <span class="label">Club/Organization:</span>
          <span class="value">{{clubName}}</span>
        </div>
        {{/if}}
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
        {{#if paymentDate}}
        <div class="info-row">
          <span class="label">Payment Date:</span>
          <span class="value">{{paymentDate}}</span>
        </div>
        {{/if}}
        {{#if paymentId}}
        <div class="info-row">
          <span class="label">Transaction ID:</span>
          <span class="value">{{paymentId}}</span>
        </div>
        {{/if}}
        {{#if cardLastFour}}
        <div class="info-row">
          <span class="label">Payment Method:</span>
          <span class="value">{{cardBrand}} •••• {{cardLastFour}}</span>
        </div>
        {{/if}}
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
            {{#each selectedFees}}
            <tr>
              <td>{{name}}</td>
              <td class="amount">${{amount}}</td>
            </tr>
            {{/each}}
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
        <p>Thank you for registering with KickDeck!</p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email.</p>
      <p>&copy; {{currentYear}} KickDeck. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    // Insert the template
    await db.insert(emailTemplates).values({
      name: 'Registration Receipt',
      description: 'Email receipt sent to registration submitters with transaction details',
      type: 'registration_receipt',
      subject: 'Your Registration Receipt for {{eventName}}',
      senderName: 'KickDeck Registration',
      senderEmail: 'support@kickdeck.io',
      isActive: true,
      variables: [
        'teamName',
        'eventName',
        'submitterName',
        'submitterEmail',
        'registrationDate',
        'totalAmount',
        'paymentStatus',
        'paymentDate',
        'paymentMethod',
        'cardLastFour',
        'cardBrand',
        'paymentId',
        'selectedFees',
        'loginLink',
        'clubName'
      ],
      content: templateContent,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("Registration receipt email template created successfully!");
  } catch (error) {
    console.error("Error inserting registration receipt template:", error);
  } finally {
    // Close the database connection
    try {
      await db.end();
    } catch (err) {
      console.error("Error closing database connection:", err);
    }
  }
}

// Run the script if executed directly
insertTemplate()
  .then(() => {
    console.log("Script completed.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });