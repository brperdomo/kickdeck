# Stripe Receipt Configuration Guide

## Overview
Your system now sends both **Stripe automatic receipts** and **custom tournament receipts** when teams are approved and payments are processed.

## What's Already Implemented

### ✅ Code Updates Complete
- **Standard payments**: `receipt_email` parameter added to payment intents
- **Connect payments**: Receipt emails enabled for tournament destination charges
- **Custom receipts**: Your existing SendGrid integration continues to work

### ✅ Dual Receipt System
When a team payment is processed, recipients receive:

1. **Stripe Receipt** (immediate)
   - Professional Stripe-branded email
   - Payment confirmation with transaction details
   - Card information and payment ID
   - Sent automatically by Stripe

2. **Custom Tournament Receipt** (via SendGrid)
   - Tournament-specific details
   - Team information and event name
   - Registration details and fees breakdown
   - Your organization branding

## Stripe Dashboard Configuration (Optional Enhancement)

To enable Stripe's dashboard-level receipt settings:

### Step 1: Access Stripe Dashboard
1. Log into your Stripe Dashboard
2. Go to **Settings** → **Emails**

### Step 2: Enable Receipt Emails
1. Under "Receipt emails" section
2. Toggle **ON** for "Successful payments"
3. Toggle **ON** for "Refunded payments" (recommended)

### Step 3: Customize Receipt Appearance
1. Click "Customize receipt emails"
2. Add your organization logo
3. Set business information
4. Choose email template style

## What Recipients See

### Stripe Receipt Example
```
Subject: Receipt for your $1,195.00 payment to [Tournament Name]

[Stripe Logo]

Receipt

Thank you for your payment.

Amount paid: $1,195.00
Payment method: •••• 4242
Date: Jun 18, 2025
Payment ID: pi_1234567890

Questions? Contact us at [your-email]
```

### Your Custom Receipt
- Event-specific branding
- Team details and roster information
- Fee breakdown with coupon discounts
- Login links for team management

## Testing the Setup

### Test Standard Payment
```bash
# Process an approved team payment
curl -X POST http://localhost:5000/api/payments/process-approved-payment \
  -H "Content-Type: application/json" \
  -d '{"teamId": 123, "amount": 1195.00}'
```

### Expected Results
- Immediate Stripe receipt to team submitter email
- Custom tournament receipt via SendGrid
- Payment recorded in database
- Team status updated to "paid"

## Benefits of Dual Receipt System

### For Teams
- Immediate payment confirmation (Stripe)
- Detailed tournament information (Custom)
- Professional payment documentation
- Backup receipt system

### For Tournaments
- Reduced support inquiries
- Professional payment experience
- Comprehensive transaction records
- Brand consistency maintained

## Troubleshooting

### If Stripe Receipts Don't Send
1. Check team has valid `submitterEmail`
2. Verify Stripe account email settings
3. Check spam/junk folders
4. Confirm payment intent succeeded

### If Custom Receipts Don't Send
1. Verify SendGrid configuration
2. Check email template exists
3. Review server logs for errors
4. Confirm recipient email is valid

## Next Steps

The system is now configured for comprehensive receipt delivery. Both receipt types will be sent automatically when teams are approved and payments are processed.

Monitor your email delivery rates and team feedback to ensure both systems are working effectively.