# Phase 4 Completion TODO List

**Status**: Ready for execution
**Estimated Time**: 1-2 hours total
**Context**: See `docs/NEXT_SESSION_GUIDE.md` for detailed instructions

---

## 🤖 Tasks for Web Agent (GitHub Web Interface Only)

**What web agent CAN do**: Edit code files via GitHub web interface

**See `docs/WEB_AGENT_TASKS.md` for exact code changes**

---

## 👤 Tasks Requiring Your Access (Supabase/Vercel/API Testing)

**What requires local/dashboard access**: Database updates, API testing, deployment verification

---

## Tasks (Execute in Order)

### 1. [🤖 WEB AGENT] Add status filter to Main API client (only sync marketed properties, not all 10,880)

**File**: `apps/dashboard/lib/apex27/client.ts`

**Action**: Add status parameter to filter out valuations/pending properties

**Details**: **See `docs/WEB_AGENT_TASKS.md` Task 1 for exact code changes**

---

### 2. [👤 YOU] Test filtered API call returns ~200 properties (not 10,880)

**Action**: Verify filter works correctly (requires curl/API access)

**Test Command**:
```bash
curl -X GET 'https://api.apex27.co.uk/listings?page=1&pageSize=10&websiteStatus=active' \
  -H 'X-Api-Key: e66d531515e195b90f38975e0a7e2d75'
```

**Expected**: ~200 total properties (not 10,880)

---

### 3. [👤 YOU] Update existing test agent with real branch ID (710 or 707) in database

**Agent ID**: `5d5a7d6f-4d38-4dce-941a-564b94cf7f2d`

**Action**: Update via Supabase Dashboard → SQL Editor

**SQL**:
```sql
UPDATE agents
SET apex27_branch_id = '710'  -- Tom Lawrence - South Somerset
WHERE id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

**Available branches**: 707, 709, 710 (recommended - most properties)

---

### 4. [ ] Run manual sync and verify properties appear for test agent

**Action**: Trigger sync and check database

**Command**:
```bash
curl http://localhost:3000/api/cron/sync-properties
```

**Verify**:
```sql
SELECT COUNT(*) FROM properties
WHERE agent_id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

**Expected**: Should see properties for branch 710

---

### 5. [👤 YOU] Add APEX27_API_KEY to Vercel environment variables

**Action**: Add via Vercel Dashboard (web agent cannot do this)

**Steps**:
1. Go to https://vercel.com/nestassociates/multi-agent-platform/settings/environment-variables
2. Click "Add New"
3. Name: `APEX27_API_KEY`
4. Value: `e66d531515e195b90f38975e0a7e2d75`
5. Scopes: Production, Preview, Development
6. Save

**Why needed**: Production build requires this env var

---

### 6. [ ] Deploy Phase 4 to production and verify build succeeds

**Action**: Push to GitHub (auto-deploys to Vercel)

**Verify**: Check deployment at https://multi-agent-platform-eight.vercel.app/properties

---

### 7. [ ] Register webhook with Apex27 Main API (POST /webhooks)

**Command**:
```bash
curl -X POST https://api.apex27.co.uk/webhooks \
  -H 'X-Api-Key: e66d531515e195b90f38975e0a7e2d75' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://multi-agent-platform-eight.vercel.app/api/webhooks/apex27",
    "name": "Nest Associates Property Sync",
    "description": "Real-time property synchronization",
    "events": ["listing.create", "listing.update", "listing.delete"],
    "enabled": true
  }'
```

---

### 8. [ ] Test webhook by updating a property in Apex27 CRM

**Action**:
1. Edit any property in Apex27 CRM
2. Check Vercel function logs
3. Verify property updated in database

**Expected Log**: `[Webhook] Received update event for listing XXXXX`

---

### 9. [ ] Verify cron job runs automatically on Vercel (check logs after 6 hours)

**Schedule**: Every 6 hours (`0 */6 * * *` in vercel.json)

**Check**: Vercel Dashboard → Functions → Cron Jobs

**Expected**: Logs showing sync every 6 hours

---

### 10. [🤖 WEB AGENT] Document which branch IDs should be assigned to which agents

**File**: Create `docs/branch-agent-mapping.md`

**Action**: Create documentation file with branch mappings

**Details**: **See `docs/WEB_AGENT_TASKS.md` Task 2 for full content to add**

---

## Critical Notes

**API Keys**:
- Main API: `e66d531515e195b90f38975e0a7e2d75` (use this for everything)
- Portal API: `9836a370901f3d514b9c0beef1e15e7d` (optional, marketed only)

**Property Filtering**:
- WITHOUT filter: 10,880 properties (includes valuations, pending, archived)
- WITH filter: ~200 properties (actively marketed - what we want!)

**Security**:
- No HMAC signature validation needed (per James @ Apex27)
- Cron endpoints protected with CRON_SECRET
- Webhooks trusted by endpoint URL

---

## After Completion

Phase 4 will be fully functional with:
- Real-time property updates via webhooks
- Periodic full sync every 6 hours
- Properties matched to agents by branch ID
- Agent microsites ready for property display (Phase 7)

Ready to move to Phase 5 (Content Creation) or Phase 7 (Build System).
