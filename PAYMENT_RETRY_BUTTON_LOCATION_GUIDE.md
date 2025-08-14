# Payment Retry Button Location Guide

## Where to Find the Payment Retry Button

### **Admin Dashboard Teams Section**
**Path**: `/admin` → **Teams** tab

The payment retry button is now available in the **Admin Dashboard** under the **Teams** management section. Here's exactly where to find it:

### **Step-by-Step Instructions:**

1. **Access Admin Dashboard**
   - Navigate to `/admin` in your browser
   - Make sure you're logged in as an administrator

2. **Go to Teams Tab**
   - Click on the **"Teams"** tab in the main navigation
   - This will show you all registered teams across all events

3. **Find the Team Table**
   - Look for the table showing all teams with columns:
     - Team Name
     - Event  
     - Age Group
     - Submitter Email
     - Registration Date
     - Roster Count
     - Final Total
     - **Payment Method** (shows payment status)
     - **Actions** (where the retry button appears)

4. **Locate the Retry Button**
   - In the **Actions** column (rightmost column)
   - The payment retry button appears **only for teams with failed payments**
   - Look for teams with payment status showing "Payment Failed" or similar
   - The button will appear as:
     - **"Check Payment"** (initial state) - Click to check if retry is possible
     - **"Retry Payment"** (green button) - Click to actually retry the payment
     - **"Cannot Retry"** (gray button) - Shows if retry is not possible with reason

### **For B2013 White (SDSC SURF) Specifically:**

**Team Details:**
- **Team ID**: 783
- **Team Name**: B2013 White  
- **Club**: SDSC SURF
- **Amount**: $1,195.00
- **Issue**: 5 failed payment attempts due to "PaymentMethod cannot be attached"

**Finding the Team:**
1. In the admin dashboard teams table
2. Look for "B2013 White" under team name
3. Check the "SDSC SURF" club name in parentheses
4. Payment status should show "Payment Failed" 
5. In the Actions column, you'll see the retry button

### **Button States:**

1. **Initial State**: "Retry Payment" (blue) - Click to check eligibility
2. **Eligible State**: "Retry Payment" (green) - Ready to process
3. **Processing State**: "Processing..." (disabled) - Payment in progress  
4. **Success State**: Button disappears (payment completed)
5. **Ineligible State**: "Cannot Retry" (gray) - Shows reason in tooltip

### **What Happens When You Click:**

1. **First Click**: Checks if payment can be retried
2. **Second Click**: Fixes PaymentMethod attachment and processes payment
3. **Success**: Team status updates to "paid", email confirmation sent
4. **Failure**: Shows specific error message for troubleshooting

### **Visual Indicators:**

- **Green Button**: Ready to retry payment
- **Spinning Icon**: Processing payment  
- **Checkmark Icon**: Payment successful
- **Alert Icon**: Cannot retry (hover for reason)

The button is intelligent and only appears for teams that actually need payment retry assistance, making it easy for admins to quickly identify and resolve payment issues.

## Status: READY FOR USE ✅
**Date**: August 14, 2025  
**Location**: Admin Dashboard → Teams Tab → Actions Column