# SendGrid Template Data Mapping for KickDeck

## Real Data Fields Your Application Sends

Based on your email service analysis, here are the actual data fields your KickDeck application captures and sends to SendGrid templates:

### Password Reset Template
**Template ID:** `d-7eb7ea1c19ca4090a0cefa3a2be75088`
```
{
  "username": "User's actual username",
  "resetUrl": "https://app.kickdeck.io/reset-password?token=abc123",
  "token": "actual_reset_token",
  "expiryHours": 24
}
```

### Registration Confirmation Template  
**Template ID:** `d-4eca2752ddd247158dd1d5433407cd5e`
```
{
  "teamName": "Team registration name",
  "eventName": "Actual event name",
  "ageGroup": "U12, U14, etc.",
  "bracket": "Division/bracket name",
  "clubName": "Club affiliation",
  "submitterName": "Person who submitted registration",
  "submitterEmail": "Contact email",
  "headCoachName": "Head coach name",
  "managerName": "Team manager name", 
  "managerEmail": "Manager contact email",
  "managerPhone": "Manager phone number",
  "registrationDate": "January 15, 2025 at 2:30 PM",
  "totalAmount": "150.00",
  "selectedFees": [{"name": "Registration Fee", "amount": "150.00"}],
  "cardBrand": "Visa",
  "cardLastFour": "4242",
  "setupIntentId": "seti_1234567890",
  "addRosterLater": true/false,
  "loginLink": "https://app.kickdeck.io/dashboard",
  "supportEmail": "support@kickdeck.io",
  "organizationName": "KickDeck",
  "currentYear": 2025
}
```

### Payment Receipt Template
**Template ID:** `d-3697f286c1e748f298710282e515ee25`
```
{
  "teamName": "Team name",
  "eventName": "Event name",
  "registrationDate": "Registration date formatted",
  "paymentDate": "Payment processing date",
  "totalAmount": "150.00",
  "cardBrand": "Visa",
  "cardLastFour": "4242", 
  "paymentId": "pi_1234567890",
  "transactionId": "Stripe transaction ID",
  "receiptNumber": "Generated receipt number",
  "selectedFees": [{"name": "Fee name", "amount": "Amount"}],
  "submitterName": "Contact person",
  "submitterEmail": "Contact email",
  "loginLink": "Dashboard URL",
  "supportEmail": "support@kickdeck.io"
}
```

### Team Status Templates (Approved/Rejected/Waitlisted)
**Approved ID:** `d-1bca14d4dc8e41e5a7ed2131124d470e`
**Rejected ID:** `d-4160d22e727944128335d7a3910b8092` 
**Waitlisted ID:** `d-23265a10149a4144893cf84e32cc3f54`
```
{
  "teamName": "Team name",
  "eventName": "Event name", 
  "userName": "User's name",
  "paymentAmount": "150.00" (for approved),
  "reason": "Rejection reason" (for rejected),
  "position": "Waitlist position" (for waitlisted),
  "supportEmail": "support@kickdeck.io"
}
```

## Critical Fields to Verify in Your SendGrid Templates

**Payment Information:**
- `{{cardBrand}}` - Shows as "Visa", "Mastercard", etc.
- `{{cardLastFour}}` - Last 4 digits of card (e.g., "4242")
- `{{totalAmount}}` - Formatted currency amount (e.g., "150.00")

**Team Details:**
- `{{teamName}}` - Actual team registration name
- `{{eventName}}` - Real event name from database
- `{{ageGroup}}` - Age group selection (U12, U14, etc.)
- `{{clubName}}` - Club affiliation if provided

**Contact Information:**
- `{{submitterName}}` - Person who submitted registration
- `{{submitterEmail}}` - Contact email address
- `{{managerName}}` - Team manager name
- `{{managerPhone}}` - Manager phone number

**Dates & Links:**
- `{{registrationDate}}` - Formatted date/time
- `{{paymentDate}}` - Payment processing date
- `{{loginLink}}` - Direct link to user dashboard

## Recommendations for Your SendGrid Templates

1. **Use these exact field names** in your dynamic templates
2. **Test with conditional logic** for optional fields like `{{clubName}}`
3. **Format currency consistently** using `${{totalAmount}}`
4. **Handle missing data gracefully** with fallback text
5. **Use `{{#if fieldName}}` blocks** for optional sections

Your application is already sending rich, real data to these templates. Ensure your SendGrid template designs use these exact variable names to display the actual KickDeck information.