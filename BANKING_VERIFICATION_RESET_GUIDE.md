# Banking Verification Reset Guide

This guide explains how to reset banking verification for events that were set up with incorrect information (wrong email, business name, etc.).

## When to Use Banking Reset

Reset banking verification when:
- Event was set up with wrong email address
- Incorrect business information was provided
- Connect account is in "restricted" status due to setup errors
- Need to start fresh with correct information

## Two Methods Available

### Method 1: Admin Interface (Recommended)

1. Go to your event's **Edit Event** page
2. Navigate to the **Banking** tab
3. Look for existing banking setup (will show current status)
4. Click **"Reset Banking Setup"** button (orange button)
5. Confirm the reset when prompted
6. Banking association will be removed from the event
7. Click **"Set Up Bank Account"** to start fresh with correct information

### Method 2: Command Line Script

If you need more detailed control or debugging:

```bash
node reset-banking-verification.js <eventId>
```

Example:
```bash
node reset-banking-verification.js 1825427780
```

## What Happens During Reset

1. **Backup Created**: Current account information is saved for reference
2. **Association Removed**: Event's connection to Stripe Connect account is severed
3. **Status Cleared**: All banking status flags are reset
4. **Fresh Start**: Event is ready for new banking setup with correct information

## Important Notes

- **Old Stripe account preserved**: The original Stripe Connect account remains in Stripe but is no longer associated with your event
- **No payment interruption**: Existing payments and registrations are unaffected
- **Teams remain intact**: All team registrations and payment methods stay in place
- **Backup created**: System creates backup record of old account information

## After Reset

1. Go to Banking tab in event settings
2. Click "Set Up Bank Account"
3. Enter **correct** email and business information
4. Complete Stripe Connect onboarding with accurate details
5. Verify new account is "Active" status

## Current Events Needing Reset

Based on database check, these events may need banking reset:
- **Rise Cup** (ID: 1825427780) - Status: restricted
- **Stripe API Connect** (ID: 1755746106) - Status: restricted

## Support

If you encounter issues during reset:
1. Check that you have admin privileges
2. Verify event ID is correct
3. Contact support if reset fails or shows errors

The reset functionality maintains complete audit trails and ensures no data loss during the process.