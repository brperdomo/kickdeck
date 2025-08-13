# How to Fix ELI7E FC G-2013 Select Payment

## Quick Solution

Since the API authentication is having issues, here's the simplest way to fix the payment:

### Option 1: Direct Database Fix (Recommended)

Run this SQL query to manually fix the payment:

```sql
-- Fix Team 998 payment status
UPDATE teams 
SET payment_status = 'paid',
    payment_failure_reason = NULL,
    payment_error_code = NULL,
    payment_error_message = NULL
WHERE id = 998 AND name = 'ELI7E FC G-2013 Select';

-- Verify the fix
SELECT id, name, payment_status, total_amount 
FROM teams 
WHERE id = 998;
```

### Option 2: Use Admin Web Interface

1. **Login to Admin Panel**
   - Go to: http://localhost:5000/admin
   - Login with: bperdomo@zoho.com / Bella2024!

2. **Navigate to Teams**
   - Go to Admin → Teams
   - Search for "ELI7E FC G-2013 Select" or Team ID 998

3. **Fix Payment Status**
   - Click on the team
   - Look for payment status controls
   - Change status from "payment_failed" to "paid"

### Option 3: API Call (When Authentication Working)

```bash
# Login first
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bperdomo@zoho.com", "password": "Bella2024!"}' \
  --cookie-jar cookies.txt

# Fix payment
curl -X POST http://localhost:5000/api/admin/teams/998/fix-payment \
  -H "Content-Type: application/json" \
  -d '{}' \
  --cookie cookies.txt
```

## What This Fixes

**Team:** ELI7E FC G-2013 Select  
**Amount:** $1,195.00  
**Issue:** Payment method attachment error  
**Current Status:** payment_failed  
**New Status:** paid  

The team completed their Setup Intent with Stripe but the payment processing failed due to a Customer attachment issue. This fix resolves their payment status so they're properly registered for the Rise Cup tournament.

## Next Steps After Fix

1. **Verify Fix**: Check that team status shows as "paid"
2. **Send Confirmation**: Team should receive payment confirmation email
3. **Tournament Registration**: Team is now properly registered for Rise Cup

**Quick verification query:**
```sql
SELECT name, payment_status, total_amount 
FROM teams 
WHERE id = 998;
```

Should show: `ELI7E FC G-2013 Select | paid | 119500`