# Quick Start: Exportable Properties Filter

**Feature**: 002-exportable-properties-filter
**Purpose**: Test and verify the exportable properties filtering functionality

## Prerequisites

- Apex27 CRM access (to mark properties as exportable/non-exportable)
- Admin dashboard access
- Database access (for verification queries)
- Sentry dashboard access (for monitoring)

## Testing the Filter

### Test 1: Webhook Filters Non-Exportable Properties

**Goal**: Verify webhooks correctly skip non-exportable properties

**Steps**:
1. Mark a property as **non-exportable** in Apex27 CRM
2. Trigger a property update in Apex27 (change price or description)
3. Wait 5-10 seconds for webhook delivery
4. Query database: `SELECT * FROM properties WHERE apex27_id = '[ID]'`
5. **Expected**: Property should not exist OR be deleted if it previously existed

**Success Criteria**: ✅ Non-exportable property not in database

---

### Test 2: Webhook Syncs Exportable Properties

**Goal**: Verify exportable properties are still synced correctly

**Steps**:
1. Mark a property as **exportable** in Apex27 CRM
2. Trigger a property update in Apex27
3. Wait 5-10 seconds for webhook delivery
4. Query database: `SELECT * FROM properties WHERE apex27_id = '[ID]'`
5. **Expected**: Property exists with latest data

**Success Criteria**: ✅ Exportable property synced successfully

---

### Test 3: Property Becomes Non-Exportable

**Goal**: Verify existing property is deleted when marked non-exportable

**Steps**:
1. Start with a property that's **currently synced** (exportable: true)
2. Note the property ID and verify it's visible on WordPress
3. Mark the property as **non-exportable** in Apex27
4. Wait 10-15 seconds for webhook
5. Query database to confirm deletion
6. Check WordPress - property should be gone

**Success Criteria**: ✅ Property removed within 30 seconds

---

### Test 4: Cron Sync Filters Correctly

**Goal**: Verify the 6-hourly cron job filters properties

**Steps**:
1. Manually trigger cron: `curl http://localhost:3002/api/cron/sync-properties -H "Authorization: Bearer [CRON_SECRET]"`
2. Check server logs for filtering metrics
3. **Expected logs**:
   ```
   Synced: 200 properties
   Skipped (non-exportable): 10,680 properties
   ```
4. Query database: Property count should be ~200

**Success Criteria**: ✅ Only exportable properties synced, metrics logged

---

## Running the One-Time Cleanup

### Preparation

**1. Backup Database** (CRITICAL - Do NOT skip!)
```bash
# Via Supabase Dashboard:
# Settings → Database → Create Backup

# Or via CLI (if configured):
supabase db dump > backup_before_cleanup_$(date +%Y%m%d).sql
```

**2. Check Current Counts**
```sql
-- Total properties
SELECT COUNT(*) FROM properties;
-- Expected: ~10,880

-- Properties by agent (top 5)
SELECT agent_id, COUNT(*)
FROM properties
GROUP BY agent_id
ORDER BY COUNT(*) DESC
LIMIT 5;
```

### Dry-Run Mode

**Test the cleanup without deleting anything**:

```bash
curl -X POST http://localhost:3002/api/admin/properties/cleanup-non-exportable \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

**Expected Response**:
```json
{
  "dry_run": true,
  "would_delete": 10680,
  "would_keep": 200,
  "sample_deletions": [
    {"apex27_id": "123", "title": "Valuation - 123 Main St", "exportable": false},
    {"apex27_id": "456", "title": "Pending - 456 Oak Ave", "exportable": false}
  ]
}
```

**Review the deletion list carefully!**
- Verify sample properties are indeed non-exportable
- Check no marketed properties in deletion list

---

### Execute Cleanup

**WARNING**: This permanently deletes ~10,680 properties. Ensure backup is complete!

```bash
curl -X POST http://localhost:3002/api/admin/properties/cleanup-non-exportable \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}'
```

**Expected Response**:
```json
{
  "success": true,
  "deleted_count": 10680,
  "remaining_count": 200,
  "duration_ms": 45000
}
```

**Monitor Progress**:
- Watch server logs for deletion progress
- Check Sentry for any errors
- Estimated time: 30-60 seconds

---

### Post-Cleanup Verification

**1. Check Property Counts**
```sql
-- Should be ~200 now
SELECT COUNT(*) FROM properties;

-- All should have exportable data
SELECT agent_id, COUNT(*)
FROM properties
GROUP BY agent_id;
```

**2. Verify Agent Dashboards**
- Log in as test agent
- Navigate to Properties tab
- Should see only marketed properties (no valuations)

**3. Check WordPress**
- Visit public property search
- Verify all displayed properties are exportable
- Check property count matches database count

**4. Monitor Sentry**
- Check for any errors during cleanup
- Verify deletion logs captured

---

## Troubleshooting

### Issue: Cleanup times out

**Solution**: The endpoint might need batching for large deletions
```typescript
// If needed, add batch processing:
const BATCH_SIZE = 100;
for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
  const batch = toDelete.slice(i, i + BATCH_SIZE);
  await deleteProperties(batch);
}
```

### Issue: Exportable properties were deleted

**Rollback**:
```bash
# Restore from backup
psql $DATABASE_URL < backup_before_cleanup_[DATE].sql
```

Then review the filtering logic before retrying.

### Issue: Property count doesn't match expected ~200

**Debug**:
```sql
-- Check how many properties Apex27 thinks are exportable
-- Compare with our database count
SELECT COUNT(*) FROM properties;

-- Check if any non-exportable slipped through
-- (This query would need the exportable field to be stored)
```

---

## Success Checklist

After implementing and testing, verify:

- [ ] Webhook filters non-exportable properties (Test 1)
- [ ] Webhook syncs exportable properties (Test 2)
- [ ] Properties deleted when marked non-exportable (Test 3)
- [ ] Cron sync filters correctly (Test 4)
- [ ] Cleanup dry-run shows correct counts
- [ ] Cleanup executes successfully
- [ ] Property count: ~10,880 → ~200
- [ ] No exportable properties deleted
- [ ] Agent dashboards show only marketed properties
- [ ] WordPress shows only exportable properties
- [ ] Sentry logs show filtering metrics
- [ ] No errors in production for 48 hours post-deployment

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Disable filtering in webhook/cron (comment out checks)
2. **Restore data**: Restore from pre-cleanup database backup
3. **Investigate**: Check Sentry logs for errors
4. **Fix**: Update filtering logic based on findings
5. **Re-test**: Run through all test scenarios again
6. **Re-deploy**: With fixes applied

## Monitoring

**Key Metrics to Watch**:
- Property count (should stabilize at ~200)
- Sync success rate (should be 100% for exportable properties)
- Deletion count per sync (should be 0 after initial cleanup)
- Agent property counts (should match their exportable listings)
- WordPress property counts (should match database)

**Sentry Alerts**:
- Any deletion of exportable property (CRITICAL)
- Sync failures (WARNING)
- Cleanup errors (CRITICAL)
