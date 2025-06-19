# SendGrid Template Data Verification Checklist

## Verified Data Fields for Your MatchPro Templates

Based on your application's email service analysis, here are the exact data fields to verify in each SendGrid template:

### Password Reset Template (d-7eb7ea1c19ca4090a0cefa3a2be75088)
**Required placeholders:**
- `{{username}}` or `{{resetLink}}` or `{{resetUrl}}`
- `{{expiryHours}}` (shows "24")
- `{{supportEmail}}` (shows "support@matchpro.ai")

### Registration Confirmation (d-4eca2752ddd247158dd1d5433407cd5e)
**Team Information:**
- `{{teamName}}` - Actual team name from registration
- `{{eventName}}` - Event they're registering for
- `{{ageGroup}}` - U12, U14, etc.
- `{{bracket}}` - Division/bracket assignment
- `{{clubName}}` - Club affiliation (optional)

**Contact Details:**
- `{{submitterName}}` - Person who submitted registration
- `{{submitterEmail}}` - Primary contact email
- `{{managerName}}` - Team manager
- `{{managerEmail}}` - Manager contact
- `{{managerPhone}}` - Manager phone number
- `{{headCoachName}}` - Head coach name

**Registration Details:**
- `{{registrationDate}}` - Formatted date/time
- `{{totalAmount}}` - Registration cost (e.g., "175.00")
- `{{addRosterLater}}` - Boolean for roster upload option

**Payment Information:**
- `{{cardBrand}}` - "Visa", "Mastercard", etc.
- `{{cardLastFour}}` - Last 4 digits (e.g., "4242")
- `{{setupIntentId}}` - Stripe setup intent ID

**System Links:**
- `{{loginLink}}` - Dashboard URL
- `{{supportEmail}}` - Support contact

### Payment Confirmation (d-3697f286c1e748f298710282e515ee25)
**Transaction Details:**
- `{{paymentId}}` - Stripe payment intent ID
- `{{transactionId}}` - Transaction reference
- `{{receiptNumber}}` - Generated receipt number
- `{{paymentDate}}` - When payment was processed
- `{{totalAmount}}` - Final charged amount

**Fee Breakdown:**
- `{{selectedFees}}` - Array of fee objects
  - Each fee has: `{{name}}` and `{{amount}}`

### Team Status Templates
**Approved (d-1bca14d4dc8e41e5a7ed2131124d470e):**
- `{{teamName}}`, `{{eventName}}`, `{{userName}}`
- `{{paymentAmount}}` - Final charged amount
- `{{approvalDate}}` - When team was approved

**Rejected (d-4160d22e727944128335d7a3910b8092):**
- `{{teamName}}`, `{{eventName}}`, `{{userName}}`
- `{{reason}}` - Why team was rejected

**Waitlisted (d-23265a10149a4144893cf84e32cc3f54):**
- `{{teamName}}`, `{{eventName}}`, `{{userName}}`
- `{{position}}` - Waitlist position number

## Critical Verification Points

### 1. Payment Card Information
Check these display correctly in your templates:
- Card brand: `{{cardBrand}}` → "Visa"
- Last four: `{{cardLastFour}}` → "4242"
- Combined: "{{cardBrand}} ending in {{cardLastFour}}"

### 2. Currency Formatting
- Amounts are sent as strings like "175.00"
- Use: `${{totalAmount}}` for proper display
- Fee arrays: `{{#each selectedFees}}{{name}}: ${{amount}}{{/each}}`

### 3. Date Formatting
- Dates come pre-formatted: "January 19, 2025 at 3:18 PM"
- Use directly: `{{registrationDate}}`, `{{paymentDate}}`

### 4. Conditional Content
For optional fields, use conditional blocks:
```handlebars
{{#if clubName}}
Club: {{clubName}}
{{/if}}

{{#if addRosterLater}}
Roster will be uploaded later
{{else}}
Roster included with registration
{{/if}}
```

### 5. Contact Information Display
Verify these show real contact data:
- `{{submitterName}}` - Registration submitter
- `{{managerName}}` - Team manager
- `{{headCoachName}}` - Head coach

## Action Items for Your SendGrid Templates

1. **Open each template in SendGrid editor**
2. **Search for placeholder variables** using the field names above
3. **Verify spelling matches exactly** (case-sensitive)
4. **Test conditional logic** for optional fields
5. **Check currency formatting** uses proper symbols
6. **Validate link placeholders** point to correct URLs

## Templates Ready for Production Use

Your templates successfully received test data with:
- ✅ Real team names and event details
- ✅ Actual payment card information
- ✅ Proper contact details and dates
- ✅ Transaction IDs and amounts
- ✅ Working dashboard links

All merge fields in your SendGrid templates should now display authentic MatchPro data instead of empty placeholders.