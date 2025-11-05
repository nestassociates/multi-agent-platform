# Next Session: Complete Phase 4 Property Sync

## Quick Start Checklist

Follow these TODOs in order to make Phase 4 fully functional.

---

## 1. Add Status Filter to Main API Client

**File**: `apps/dashboard/lib/apex27/client.ts`

**What to do**:
Add status parameter to `getListings()` and `getAllListings()` functions:

```typescript
export interface GetListingsOptions {
  page?: number;
  pageSize?: number;
  minDtsUpdated?: string;
  status?: 'available' | 'pending'; // NEW
}
```

Then in the fetch call, add status to query params if provided.

**Why**: Currently fetches 10,880 properties (includes valuations, pending, archived). Need to filter to only marketed properties (~200).

**Test Filter Options**:
- `status=available`
- `saleProgression=for_sale`
- Both combined

---

## 2. Test Filtered API Call

**Command**:
```bash
curl -X GET 'https://api.apex27.co.uk/listings?page=1&pageSize=10&status=available' \
  -H 'X-Api-Key: e66d531515e195b90f38975e0a7e2d75' | jq 'length'
```

**Expected**: Should return ~200 total properties (not 10,880)

**Verify**: Count matches Portal API's 188 marketed properties

---

## 3. Update Test Agent with Real Branch ID

**Current test agent**: `5d5a7d6f-4d38-4dce-941a-564b94cf7f2d` (created yesterday)

**SQL to update**:
```sql
UPDATE agents
SET apex27_branch_id = '710'  -- Tom Lawrence - South Somerset
WHERE id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

**Alternative branches**:
- Branch 707: George Bailey (Taunton Deane A)
- Branch 709: James Warne (Taunton Deane C)
- Branch 710: Tom Lawrence (South Somerset) ← **Most properties**
- Branch 717: Lyn Parent (Kent/Sevenoaks)

---

## 4. Run Manual Sync

**URL**: `http://localhost:3000/api/cron/sync-properties`

**Command**:
```bash
curl http://localhost:3000/api/cron/sync-properties
```

**Expected Response**:
```json
{
  "success": true,
  "summary": {
    "totalListings": 200,
    "synced": 15,  // Properties for branch 710
    "skipped": 185, // Other branches
    "errors": 0
  }
}
```

**Verify in database**:
```sql
SELECT COUNT(*) FROM properties WHERE agent_id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

---

## 5. Add APEX27_API_KEY to Vercel

**Method 1: Vercel Dashboard**
1. Go to https://vercel.com/nestassociates/multi-agent-platform/settings/environment-variables
2. Add: `APEX27_API_KEY` = `e66d531515e195b90f38975e0a7e2d75`
3. Scope: Production, Preview, Development
4. Save

**Method 2: Vercel CLI** (if linked)
```bash
vercel env add APEX27_API_KEY production
# Paste: e66d531515e195b90f38975e0a7e2d75
```

---

## 6. Deploy Phase 4 to Production

**Already auto-deployed** when you pushed to GitHub!

**Verify**:
1. Check Vercel deployment status
2. Visit: https://multi-agent-platform-eight.vercel.app/properties
3. Should see empty state (no properties yet, waiting for sync)

---

## 7. Register Webhook with Apex27

**API Call**:
```bash
curl -X POST https://api.apex27.co.uk/webhooks \
  -H 'X-Api-Key: e66d531515e195b90f38975e0a7e2d75' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://multi-agent-platform-eight.vercel.app/api/webhooks/apex27",
    "name": "Nest Associates Property Sync",
    "description": "Real-time property synchronization for agent microsites",
    "events": ["listing.create", "listing.update", "listing.delete"],
    "enabled": true
  }'
```

**Verify**:
```bash
curl -X GET https://api.apex27.co.uk/webhooks \
  -H 'X-Api-Key: e66d531515e195b90f38975e0a7e2d75'
```

---

## 8. Test Webhook

**In Apex27 CRM**:
1. Edit any property (change price, description, etc.)
2. Save changes

**In your app**:
1. Check Vercel function logs for `/api/webhooks/apex27`
2. Should see: `[Webhook] Received update event for listing XXXXX`
3. Verify property updated in database

**Check database**:
```sql
SELECT apex27_id, title, price, updated_at
FROM properties
ORDER BY updated_at DESC
LIMIT 5;
```

---

## 9. Verify Cron Job on Vercel

**Check vercel.json** is deployed:
```json
{
  "crons": [{
    "path": "/api/cron/sync-properties",
    "schedule": "0 */6 * * *"
  }]
}
```

**Monitor**:
- Wait 6 hours OR trigger manually
- Check Vercel logs: Functions → Cron Jobs
- Should see sync running every 6 hours

---

## 10. Document Branch Assignments

**Create mapping file**: `docs/branch-agent-mapping.md`

**Based on API data, these branches exist**:
- 707: George Bailey (george.bailey@nestassociates.co.uk)
- 709: James Warne (james.warne@nestassociates.co.uk)
- 710: Tom Lawrence (tom.lawrence@nestassociates.co.uk)
- 713, 715, 716, 717, 1210, 1790, 1954, 1963, 1983, 2342, 2610, 2741

**Document**:
- Which agent should get which branch
- How many properties each branch has
- Contact info for each branch

---

## Success Criteria

After completing all TODOs:
- ✅ Sync fetches ~200 properties (not 10,880)
- ✅ Properties assigned to correct agents by branch_id
- ✅ Agent can view their properties at `/my-properties`
- ✅ Admin can view all properties at `/properties`
- ✅ Webhook receives real-time updates from Apex27
- ✅ Cron runs every 6 hours automatically

---

## Files Modified

All changes should be in:
- `apps/dashboard/lib/apex27/client.ts` (add status filter)
- Supabase database (update test agent)
- Vercel environment variables (add API key)

No other files need changes if everything works correctly!
