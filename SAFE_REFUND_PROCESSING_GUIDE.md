# Safe Refund Processing Guide
## How to Issue Refunds Without MatchPro Overdraft Risk

---

## 🎯 CRITICAL UNDERSTANDING

**Stripe Rule:** Refunds must be processed from the same account that created the customer.

**Old System Risk:** Customers created in MatchPro account → Refunds must come from MatchPro → Tournament may not cover cost

**New System Safety:** Customers created in Connect account → Refunds come from Connect account → Zero MatchPro risk

---

## 🔍 IDENTIFYING PAYMENT TYPE

### Before Processing ANY Refund:

**Step 1: Check Payment Source**
```
New System Payments: Customer created on Connect account
- Payment Intent will show Connect account metadata
- Refund can be processed safely from Connect account
- Zero MatchPro risk

Legacy System Payments: Customer created on MatchPro account  
- Payment Intent shows MatchPro as source
- Refund MUST come from MatchPro account
- HIGH risk of MatchPro absorbing cost
```

### API Check Method:
```bash
# Check payment intent source
curl -H "Authorization: Bearer sk_..." \
  https://api.stripe.com/v1/payment_intents/pi_...

# Look for:
- "application": null (MatchPro main account - RISKY)
- "application": "ca_..." (Connect account - SAFE)
```

---

## ✅ SAFE REFUND PROCEDURES

### For New System Payments (Connect Account)
1. **Verify Connect Account Balance:** Ensure tournament has sufficient Stripe balance
2. **Process Refund:** Use Connect account refund API
3. **Result:** Refund comes from tournament's balance, zero MatchPro cost

```javascript
// Safe refund processing
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: refundAmount,
}, {
  stripeAccount: connectAccountId // Process from Connect account
});
```

### For Legacy System Payments (High Risk)
1. **Check Tournament Balance First:** Verify they can cover the refund cost
2. **Coordinate with Tournament:** Get confirmation they'll reimburse MatchPro
3. **Process with Caution:** Understand MatchPro may absorb cost
4. **Attempt Recovery:** Try transfer from tournament to recover cost

```javascript
// Risky refund processing - use with caution
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: refundAmount,
  // Comes from MatchPro main account - RISK!
});

// Attempt cost recovery
try {
  const recovery = await stripe.transfers.create({
    amount: refundAmount,
    currency: 'usd',
    destination: 'main_matchpro_account'
  }, {
    stripeAccount: connectAccountId
  });
} catch (error) {
  // MatchPro absorbs the cost!
}
```

---

## 🚨 OVERDRAFT PREVENTION CHECKLIST

### Before Processing ANY Refund:

- [ ] **Identify payment type** (Connect account vs MatchPro account)
- [ ] **Check tournament Stripe balance** (for new payments)
- [ ] **Verify tournament can cover cost** (for legacy payments)  
- [ ] **Get approval for risky refunds** (legacy payments)
- [ ] **Document refund source** (for accounting)

### Red Flags - DO NOT PROCESS:
- ❌ Legacy payment + Tournament has no Stripe balance
- ❌ Legacy payment + Tournament refuses to cover cost
- ❌ Large refund amounts without verification
- ❌ Bulk refunds without balance checks

---

## 📊 REFUND PROCESSING DECISION TREE

```
Refund Request Received
↓
Check Payment Source
↓
┌─────────────────┬─────────────────┐
│  Connect Account │  MatchPro Account │
│    (NEW/SAFE)    │   (LEGACY/RISKY)  │
└─────────────────┴─────────────────┘
↓                    ↓
Check Connect        Check Tournament
Account Balance      Willingness to Pay
↓                    ↓
┌──────────────┬──────────────┐
│ Sufficient   │ Insufficient │
│   Balance    │   Balance    │
└──────────────┴──────────────┘
↓                    ↓
✅ Process Safely    ❌ DENY REFUND
Zero MatchPro Risk   High MatchPro Risk
```

---

## 💡 BEST PRACTICES

### Immediate Actions:
1. **Transition Priority:** Move all active tournaments to new Connect account system
2. **Legacy Management:** Handle legacy refunds with extreme caution
3. **Balance Monitoring:** Track tournament Stripe account balances
4. **Documentation:** Record all refund sources for accounting

### Long-term Strategy:
1. **Phase Out Legacy:** Gradually eliminate MatchPro main account payments
2. **Tournament Education:** Train organizers on maintaining Stripe balances
3. **Automated Checks:** Build balance verification into refund workflows
4. **Risk Reporting:** Monitor and report MatchPro absorption incidents

---

## 🔧 TECHNICAL IMPLEMENTATION

### Current System Status:
- ✅ **New Payment Flow:** Implemented with Connect account customer creation
- ✅ **Refund Logic:** Enhanced to detect payment source and route accordingly  
- ✅ **Safety Checks:** Connect account validation before payment processing
- ⚠️ **Legacy Support:** Maintained for existing payments with cost recovery

### API Endpoints:
- `POST /api/refunds/process` - Intelligent refund processing with source detection
- `GET /api/refunds/absorption-report` - MatchPro cost absorption tracking
- `GET /api/refunds/:paymentIntentId` - Detailed refund analysis

---

## 📈 SUCCESS METRICS

### Monitor These KPIs:
- **Connect Account Refund Success Rate:** Target 100%
- **MatchPro Cost Absorption:** Target $0 for new payments
- **Legacy Payment Volume:** Track declining trend
- **Tournament Balance Health:** Monitor average Stripe balances

### Alert Thresholds:
- **High Risk:** Legacy refund > $500 without tournament coverage
- **System Health:** Connect account refund failure rate > 5%
- **Financial Impact:** MatchPro absorption > $100/month from new payments

---

**KEY TAKEAWAY:** The new Connect account system eliminates MatchPro overdraft risk, but legacy payments still require careful handling until fully transitioned.