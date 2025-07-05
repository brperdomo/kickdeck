# MatchPro Standardized Pricing Guide

## Tournament Fee Structure Standards

All MatchPro events must use the **Empire Super Cup pricing model** to ensure consistent, realistic pricing with cent amounts rather than rounded dollars.

### Required Tournament Base Costs

| Age Group | Standard Base Cost | Total After 4% Platform Fee |
|-----------|-------------------|------------------------------|
| 7v7       | $895.00           | $930.80                      |
| 9v9       | $995.00           | $1,034.80                    |
| 11v11     | $1,195.00         | $1,242.80                    |

### Platform Fee Structure (Applied to ALL Events)

- **Platform Fee Rate**: 4% of tournament cost
- **Stripe Processing**: 2.9% + $0.30 of total charged
- **MatchPro Revenue**: Platform fee minus Stripe costs (~$8.50-$11.50 per transaction)

### Implementation Requirements

1. **New Events**: Use the standardized base costs above
2. **Existing Events**: Update to match Empire Super Cup pricing if using rounded amounts
3. **Platform Fee Collection**: Automatically applied via Stripe Connect application_fee_amount

### Recently Corrected Events

- **Rise Cup** (ID: 1825427780): Updated from rounded pricing ($900, $1,025) to standard pricing ($895, $995)
- **Empire Super Cup** (ID: 1844329078): Already using correct pricing structure

### Fee Calculation Formula

```
Tournament Base Cost = Standard amount from table above
Platform Fee = Tournament Base Cost × 0.04
Total Charged = Tournament Base Cost + Platform Fee
Stripe Fee = (Total Charged × 0.029) + $0.30
MatchPro Revenue = Platform Fee - Stripe Fee
Tournament Receives = Tournament Base Cost (full amount)
```

### Verification

All transactions should result in:
- Realistic cent amounts (e.g., $930.80, $1,034.80, $1,242.80)
- Consistent 4% platform fee collection
- Positive MatchPro revenue after Stripe costs

**Last Updated**: July 5, 2025
**Status**: Rise Cup corrected, all future events to follow this standard