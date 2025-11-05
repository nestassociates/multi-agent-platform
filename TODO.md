# Phase 4 Completion TODO List

**Status**: Ready for execution
**Estimated Time**: 1-2 hours total
**Context**: See `docs/NEXT_SESSION_GUIDE.md` for detailed instructions

---

## Tasks (Execute in Order)

### 1. [ ] Add status filter to Main API client (only sync marketed properties, not all 10,880)

**File**: `apps/dashboard/lib/apex27/client.ts`

**Action**: Add status parameter to filter out valuations/pending properties

**Details**: See NEXT_SESSION_GUIDE.md section 1

---

### 2. [ ] Test filtered API call returns ~200 properties (not 10,880)

**Action**: Verify filter works correctly

**Test Command**:
```bash
curl -X GET 'https://api.apex27.co.uk/listings?page=1&pageSize=10&status=available' \
  -H 'X-Api-Key: e66d531515e195b90f38975e0a7e2d75'
```

**Expected**: ~200 total properties

---

### 3. [ ] Update existing test agent with real branch ID (710 or 707) in database

**Agent ID**: `5d5a7d6f-4d38-4dce-941a-564b94cf7f2d`

**SQL**:
```sql
UPDATE agents
SET apex27_branch_id = '710'  -- Tom Lawrence - South Somerset
WHERE id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

**Available branches**: 707, 709, 710, 713, 715, 716, 717, 1210, 1790, 1954, 1983

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

### 5. [ ] Add APEX27_API_KEY to Vercel environment variables

**Value**: `e66d531515e195b90f38975e0a7e2d75`

**Method**: Vercel Dashboard → Settings → Environment Variables

**Scopes**: Production, Preview, Development

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

### 10. [ ] Document which branch IDs should be assigned to which agents

**File**: Create `docs/branch-agent-mapping.md`

**Content**: Map Apex27 branches to actual Nest Associates agents

**Branches found**:
- 707: George Bailey (george.bailey@nestassociates.co.uk)
- 709: James Warne (james.warne@nestassociates.co.uk)
- 710: Tom Lawrence (tom.lawrence@nestassociates.co.uk)
- 713: Ellie Wills (ellie.wills@nestassociates.co.uk)
- 715: Matt Hollow (matt.hollow@nestassociates.co.uk)
- 716: Libby Last (libby.last@nestassociates.co.uk)
- 717: Lyn Parent (lyn.parent@nestassociates.co.uk)
- 1983: Georgina Davie (georgina.davie@nestassociates.co.uk)
- Others: 1210, 1790, 1954, 1963, 2342, 2610, 2741

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
