# Stripe Connect Banking Setup Guide

This guide explains how to set up tournament-specific bank accounts using Stripe Connect, allowing each tournament to receive payments directly into their own bank account.

## Overview

The platform now supports **tournament-level banking** through Stripe Connect integration. This means:

- Each tournament can have its own dedicated bank account
- Registration fees go directly to the tournament organizer's account
- The platform takes a small processing fee (3%) for payment processing
- Tournament organizers have full control over their revenue

## Setting Up Banking for Your Tournament

### Step 1: Access Banking Settings

1. Go to your tournament's **Edit Event** page
2. Navigate to the **Banking** tab
3. Click **"Set Up Bank Account"**

### Step 2: Create Stripe Connect Account

The system will redirect you to Stripe's secure onboarding process where you'll provide:

- **Business Information**: Tournament name, description, website
- **Bank Account Details**: Routing number, account number
- **Identity Verification**: Business registration documents or personal ID
- **Tax Information**: EIN or SSN for tax reporting

### Step 3: Complete Verification

Stripe will verify your information, which typically takes:
- **Individual accounts**: 1-2 business days
- **Business accounts**: 2-7 business days

### Step 4: Activate Banking

Once verified:
1. Return to your tournament's Banking tab
2. Your account status will show as **"Active"**
3. All new registrations will route payments to your bank account

## Account Status Meanings

- **Not Connected**: No bank account set up yet
- **Pending**: Account created but verification incomplete
- **Active**: Ready to receive payments
- **Restricted**: Additional information needed

## Payment Flow

### For Teams Registering

1. Team submits registration with payment information
2. Payment method is saved securely (not charged yet)
3. Team receives confirmation email

### For Tournament Organizers

1. Review team registrations in admin dashboard
2. **Approve** teams to charge their payment methods
3. Funds transfer to your bank account within 2-7 business days
4. **Reject** teams to cancel without charging

## Revenue Distribution

When a team payment is processed:

- **Tournament receives**: 97% of registration fee
- **Platform fee**: 3% for payment processing and platform services
- **Stripe fees**: Standard Stripe processing fees (2.9% + 30¢)

### Example: $100 Registration Fee

- Team pays: $100.00
- Tournament receives: ~$93.80
- Platform fee: $3.00
- Stripe fees: $3.20

## Managing Your Banking

### View Payment Analytics

In your tournament's Banking tab, you can see:
- Total revenue received
- Number of successful payments
- Processing fees breakdown
- Individual transaction details

### Update Bank Account

To change your bank account:
1. Go to Banking tab
2. Click **"Manage Account"**
3. This opens your Stripe dashboard for account management

### Handle Failed Payments

If a team's payment fails:
- Team status shows as "Payment Failed"
- You can retry the payment manually
- Team receives notification to update payment method

## Security & Compliance

- All payment data is encrypted and handled by Stripe
- Tournament organizers never see or store credit card information
- Stripe handles PCI compliance requirements
- Bank account information is securely stored by Stripe

## Troubleshooting

### Account Verification Issues

**Problem**: Verification taking longer than expected
**Solution**: Check email for Stripe requests for additional information

**Problem**: Account restricted
**Solution**: Log into Stripe dashboard to see required actions

### Payment Issues

**Problem**: Payments not appearing in bank account
**Solution**: 
- Check Stripe dashboard for transfer schedule
- Verify bank account details are correct
- Contact Stripe support for transfer delays

**Problem**: Team payment failed
**Solution**:
- Check team's payment method status
- Retry payment from admin dashboard
- Contact team to update payment information

## Support

### For Tournament Organizers
- Platform support: Contact through admin dashboard
- Payment issues: Check Stripe dashboard first
- Account setup: Follow verification emails from Stripe

### For Teams
- Registration issues: Contact tournament organizer
- Payment problems: Update payment method in registration system

## Getting Started Checklist

- [ ] Access Banking tab in tournament settings
- [ ] Complete Stripe Connect onboarding
- [ ] Submit required verification documents
- [ ] Wait for account approval (1-7 days)
- [ ] Test with a sample registration
- [ ] Monitor payments in Stripe dashboard

## Important Notes

1. **Set up banking early** - Account verification can take several days
2. **Keep information current** - Update Stripe account if business details change
3. **Monitor regularly** - Check Stripe dashboard for any account issues
4. **Test thoroughly** - Process a test registration before opening registration

This banking system ensures tournament organizers have complete control over their revenue while providing a seamless payment experience for teams.