# 🚀 RETROACTIVE METADATA KICKOFF GUIDE

**How to Start the Retroactive Metadata Update Process**

---

## 🎯 **AVAILABLE OPTIONS**

### **Option 1: API Endpoints (Recommended for Testing)**

**Test with a specific team first:**
```bash
# Check if Team 1567 needs metadata updates
GET https://your-domain.replit.app/api/admin/metadata/check-team/1567

# Update specific team's payment metadata
POST https://your-domain.replit.app/api/admin/metadata/update-team/1567
```

**Update all teams in an event:**
```bash
# Update all teams in Empire Super Cup (Event ID 123)
POST https://your-domain.replit.app/api/admin/metadata/update-event/123
```

**Update ALL teams with payment data:**
```bash
# GLOBAL update - use with caution
POST https://your-domain.replit.app/api/admin/metadata/update-all
```

### **Option 2: Standalone Script (Recommended for Bulk Processing)**

**Run the bulk update script directly:**
```bash
# SSH into your Replit environment or run in shell
cd /workspace
npx tsx server/scripts/retroactiveMetadataUpdate.ts
```

This script will:
- Process all teams with payment data
- Update in batches with rate limiting
- Provide detailed progress reporting
- Handle errors gracefully

### **Option 3: Admin Dashboard Integration (Future Enhancement)**

We could build a simple admin interface where you click a button to trigger updates, but the API endpoints work immediately.

---

## 🔍 **STEP-BY-STEP PROCESS**

### **STEP 1: Identify Target Payment**
First, let's find the team associated with payment `py_1RvnRmP1QwgwjWUMH9rdnj2`:

```sql
-- Check for teams with payment amount $465.70 (46570 cents)
SELECT id, name, total_amount, created_at, manager_email, payment_intent_id
FROM teams 
WHERE total_amount = 46570 
AND created_at BETWEEN '2025-08-15' AND '2025-08-20'
ORDER BY created_at;
```

### **STEP 2: Test with One Team**
```bash
# Replace 1567 with the actual team ID you found
curl -X POST "https://your-domain.replit.app/api/admin/metadata/update-team/1567" \
  -H "Content-Type: application/json"
```

### **STEP 3: Verify Results**
Check Stripe dashboard to confirm the payment now shows:
- Customer Name: "Team Phoenix FC U14 - Sarah Johnson"
- Customer Email: "sarah@phoenixfc.com" 
- Description: "Team: Phoenix FC U14 | Event: Rise Cup | TeamID: 1567"
- Rich Metadata: Complete team details

### **STEP 4: Scale Up**
Once verified, run the bulk update for all teams:

```bash
# Option A: API endpoint
curl -X POST "https://your-domain.replit.app/api/admin/metadata/update-all"

# Option B: Direct script
npx tsx server/scripts/retroactiveMetadataUpdate.ts
```

---

## 📊 **EXPECTED RESULTS**

### **Before Update:**
```
Payment: py_1RvnRmP1QwgwjWUMH9rdnj2
Customer: [NO NAME] 
Metadata: {}
Status: UNIDENTIFIABLE
```

### **After Update:**
```
Payment: py_1RvnRmP1QwgwjWUMH9rdnj2
Customer: "Phoenix FC U14 - Sarah Johnson"
Description: "Team: Phoenix FC U14 | Event: Rise Cup | TeamID: 1567" 
Metadata: {
  teamId: "1567",
  teamName: "Phoenix FC U14",
  eventName: "Rise Cup",
  managerEmail: "sarah@phoenixfc.com",
  internalReference: "TEAM-1567-456"
}
Status: FULLY IDENTIFIABLE
```

---

## ⚡ **QUICK START COMMANDS**

### **Right Now - Test One Team:**
```bash
# Find a team with payment data
curl "https://your-domain.replit.app/api/admin/metadata/check-team/100"

# Update that team's metadata  
curl -X POST "https://your-domain.replit.app/api/admin/metadata/update-team/100"
```

### **After Testing - Full Update:**
```bash
# Run bulk script for all teams
npx tsx server/scripts/retroactiveMetadataUpdate.ts
```

---

## 🔒 **SAFETY NOTES**

- Updates are **additive only** - no existing data is removed
- Rate limiting prevents Stripe API overload
- Each update is logged for audit purposes
- Failed updates are reported but don't stop the process
- You can run the process multiple times safely

---

## 🎯 **RECOMMENDATION**

**Start with Option 2 (Standalone Script)** for the most comprehensive results:

1. Open terminal in your Replit environment
2. Run: `npx tsx server/scripts/retroactiveMetadataUpdate.ts`
3. Watch the progress output
4. Check Stripe dashboard for results

This will resolve your payment identification crisis for all existing payments in one operation.