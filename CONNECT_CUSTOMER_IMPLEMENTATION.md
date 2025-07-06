# Stripe Connect Customer Implementation

## Overview

This implementation moves customer creation from the main MatchPro Stripe account to individual tournament Connect accounts. This provides tournament directors with complete customer visibility, refund management capabilities, and chargeback handling within their own Stripe dashboard.

## Benefits for Tournament Directors

### ✅ **Full Customer Access**
- Tournament directors can view all customer data in their Stripe dashboard
- Complete payment history and customer interactions visible
- Customer metadata includes team and event information

### ✅ **Direct Refund Management**
- Directors can issue full or partial refunds directly from their dashboard
- No need to contact MatchPro for refund processing
- Automated refund notifications to customers

### ✅ **Chargeback Handling**
- Disputes and chargebacks are handled within the Connect account
- Directors receive direct notifications and can respond to disputes
- Complete transaction evidence available in their dashboard

### ✅ **Branded Payment Receipts**
- Payment receipts come from the tournament organization, not MatchPro
- Professional appearance with tournament branding
- Enhanced customer experience

### ✅ **Revenue Tracking**
- All payment data resides in the tournament's Stripe account
- Complete financial reporting and analytics
- Independent revenue management

## Technical Implementation

### Database Changes

Added tracking fields to `teams` table:
- `connect_customer_account_id`: Tracks which Connect account owns the customer
- `connect_setup_intent_account_id`: Tracks Setup Intent ownership

### New Service: `connectCustomerService.ts`

Key functions:
- `getOrCreateConnectCustomer()`: Main function for customer management
- `createConnectCustomer()`: Creates customer in Connect account
- `createConnectSetupIntent()`: Creates Setup Intent in Connect account
- `migrateToConnectCustomer()`: Migrates existing teams

### Updated Payment Flow

1. **Customer Creation**: Customers created directly in tournament Connect account
2. **Payment Method Attachment**: Payment methods attached to Connect customer
3. **Payment Processing**: Destination charges processed with Connect customer context
4. **Receipt Delivery**: Receipts sent from tournament organization

## Migration Example: Boys 2017 Blue

Successfully migrated team to Connect customer approach:

- **Connect Customer**: `cus_Scx8wG1XjpoMoB` in account `acct_1RgE7l03M9BKrrZV`
- **Setup Intent**: `seti_1RhhDk03M9BKrrZVPGhM4JLE` (Connect account)
- **Payment Link**: Includes proper platform fees ($974.05 total)
- **Database**: Updated with Connect account tracking

## Implementation Guidelines

### For New Teams
```javascript
// Get or create Connect customer
const connectCustomer = await getOrCreateConnectCustomer(teamId);

// Create Setup Intent in Connect account
const setupIntent = await createConnectSetupIntent(
  teamId, 
  connectAccountId, 
  connectCustomer.customerId
);
```

### For Existing Teams
```javascript
// Migrate to Connect customer
const connectCustomer = await migrateToConnectCustomer(teamId);
```

### Error Handling
- Graceful fallback to platform customers if Connect account unavailable
- Comprehensive logging for troubleshooting
- Link payment method special handling (cannot be attached to customers)

## Fee Structure Integration

Platform fees (4% + $0.30) properly calculated and applied:
- Tournament receives base registration fee
- MatchPro receives platform fee via `application_fee_amount`
- Stripe receives processing fees
- All fees transparent in Connect account

## Verification

Tournament directors can verify implementation by:
1. Logging into their Stripe Connect dashboard
2. Navigating to Customers section
3. Finding team customers with complete metadata
4. Accessing payment history and refund capabilities

## Future Enhancements

- Automated customer migration for all existing teams
- Enhanced customer metadata with more team details
- Integration with tournament management workflows
- Custom receipt templates per tournament