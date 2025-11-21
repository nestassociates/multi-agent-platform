# Deployment Guide: Exportable Properties Filter

**Feature**: 002-exportable-properties-filter
**Status**: ✅ Code Complete - Ready for Deployment
**Date**: 2025-11-21

---

## ⚠️ Critical Information

**This feature will permanently delete ~10,680 properties from the database.**

Before deploying:
1. ✅ Backup production database
2. ✅ Test in dry-run mode
3. ✅ Verify exportable properties list
4. ✅ Schedule during low-traffic hours
5. ✅ Have rollback plan ready

---

## Implementation Summary

### ✅ Completed Code Changes

**Files Modified**:
1. `apps/dashboard/app/api/webhooks/apex27/route.ts` - Added exportable filter
2. `apps/dashboard/lib/services/property-service.ts` - Added filtering logic and hard delete
3. `apps/dashboard/app/api/cron/sync-properties/route.ts` - Added filtered metrics

**Files Created**:
1. `apps/dashboard/app/api/admin/properties/cleanup-non-exportable/route.ts` - Cleanup endpoint

**What Changed**:
- ✅ Webhook now filters non-exportable properties on create/update
- ✅ Webhook deletes properties when they become non-exportable
- ✅ Cron sync skips non-exportable properties
- ✅ All deletions are hard deletes (permanent removal)
- ✅ Comprehensive logging and metrics tracking
- ✅ Cleanup endpoint with dry-run mode for safety

---

## Deployment Steps

### Step 1: Deploy Code (No Data Changes)

```bash
# 1. Commit changes
git add -A
git commit -m "feat: add exportable properties filter

Filter Apex27 sync to only include exportable properties.
Does not include cleanup - deploy filtering first, cleanup later.

Changes:
- Webhook filters on exportable field
- Cron sync skips non-exportable properties
- Hard delete when property becomes non-exportable
- Cleanup endpoint with dry-run mode

Ready for: Deploy filtering, monitor, then run cleanup"

# 2. Push to GitHub
git push origin 002-exportable-properties-filter

# 3. Create Pull Request
gh pr create --title "Add Exportable Properties Filter" --body "See specs/002-exportable-properties-filter/spec.md"

# 4. Deploy to Vercel (after PR merged)
# Vercel will auto-deploy from main branch
```

**Expected Impact**: NEW properties will be filtered, but existing ~10,680 non-exportable properties remain in database.

---

### Step 2: Monitor Filtering (24-48 Hours)

After deploying the code, monitor for 24-48 hours:

**Check Sentry Logs**:
- Look for "[Webhook] Filtering non-exportable property" messages
- Verify no errors in property sync
- Confirm exportable properties still syncing correctly

**Check Cron Sync Logs**:
```
[Sync] Filtering summary: {
  total: 10880,
  exportable: 200,
  nonExportable: 10680,
  synced: 200,
  filtered: 10680,
  skipped: 0,
  errors: 0
}
```

**Verify**:
- Webhook filtering working correctly
- Cron sync filtering working correctly
- No exportable properties accidentally filtered
- Agents can still see their marketed properties

---

### Step 3: Run Cleanup (After Monitoring Period)

⚠️ **CRITICAL**: Do NOT run cleanup until filtering has been monitored for 24-48 hours!

#### 3A. Backup Database

```bash
# Via Supabase Dashboard:
# Settings → Database → Create Backup → "pre-cleanup-backup-2025-11-21"

# Or download backup locally
supabase db dump > backup_pre_cleanup_$(date +%Y%m%d_%H%M%S).sql
```

#### 3B. Test in Dry-Run Mode

```bash
curl -X POST https://your-domain.com/api/admin/properties/cleanup-non-exportable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

**Expected Response**:
```json
{
  "dry_run": true,
  "would_delete": 10680,
  "would_keep": 200,
  "sample_deletions": [...]
}
```

**Review**:
- Check `would_delete` count (~10,680 expected)
- Check `would_keep` count (~200 expected)
- Review `sample_deletions` to verify they're non-exportable
- **CRITICAL**: Verify NO marketed properties in deletion list

#### 3C. Execute Cleanup (Production)

**Timing**: Schedule during low-traffic hours (e.g., 2-4 AM)

```bash
curl -X POST https://your-domain.com/api/admin/properties/cleanup-non-exportable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}'
```

**Monitor Progress**:
- Watch server logs for batch deletion progress
- Check Sentry for any errors
- Estimated duration: 30-60 seconds

**Expected Response**:
```json
{
  "success": true,
  "deleted_count": 10680,
  "remaining_count": 200,
  "duration_ms": 45000,
  "timestamp": "2025-11-21T..."
}
```

#### 3D. Verify Results

**1. Check Database Count**:
```sql
SELECT COUNT(*) FROM properties;
-- Expected: ~200 (was ~10,880)
```

**2. Check Agent Dashboards**:
- Log in as test agent
- Navigate to Properties tab
- Should only see marketed properties (no valuations)

**3. Check WordPress**:
- Visit public property search
- Verify property count matches database
- All properties should be actively marketed

**4. Check Sentry**:
- Review logs for cleanup operation
- Verify no errors during deletion
- Confirm batch processing completed

---

## Rollback Plan

If issues arise:

### Immediate Rollback (If Cleanup Caused Issues)

```bash
# 1. Restore from backup
psql $DATABASE_URL < backup_pre_cleanup_[DATE].sql

# 2. Revert code changes (if needed)
git revert [COMMIT_HASH]
git push origin main

# 3. Redeploy to Vercel
# Vercel auto-deploys on push
```

### Disable Filtering (If Filtering Causing Issues)

```bash
# 1. Comment out exportable checks in webhook
# 2. Comment out exportable filter in cron sync
# 3. Deploy hotfix
```

---

## Success Metrics

After deployment and cleanup:

- [ ] Property count reduced from ~10,880 to ~200
- [ ] Webhook logs show filtered properties
- [ ] Cron sync logs show filtering metrics
- [ ] Agent dashboards show only marketed properties
- [ ] WordPress shows only exportable properties
- [ ] Zero non-exportable properties in database
- [ ] No errors in Sentry for 48 hours
- [ ] Agent property counts match Apex27 exportable counts

---

## Monitoring

**Key Metrics to Watch (Post-Deployment)**:

1. **Filtering Metrics** (from cron sync logs):
   - `filtered`: Should match non-exportable count from Apex27
   - `synced`: Should match exportable count from Apex27
   - `errors`: Should be 0

2. **Property Counts**:
   - Database: Should stabilize at ~200
   - Per agent: Should match their exportable listings
   - WordPress: Should match database count

3. **Sentry Alerts**:
   - No errors during webhook/cron filtering
   - No accidental deletions of exportable properties
   - Cleanup operation completed successfully

---

## Next Steps After Deployment

1. **Update Documentation** (T034-T035):
   - Add exportable filtering section to APEX27_INTEGRATION_GUIDE.md
   - Update WordPress integration docs

2. **Monitor** (T036-T037):
   - Watch Sentry for 48 hours
   - Verify WordPress property search
   - Check agent feedback

3. **Future Enhancements** (T038 - Optional):
   - Build monitoring dashboard showing sync metrics
   - Add alerts for filtering anomalies
   - Track filtering trends over time

---

## Troubleshooting

### Issue: Too many properties deleted

**Diagnosis**: Check if exportable field is being read correctly from Apex27
**Fix**: Review getAllListings() to ensure exportable field is included

### Issue: Too few properties deleted

**Diagnosis**: Some non-exportable properties not identified
**Fix**: Re-run cleanup endpoint (it's idempotent)

### Issue: Cleanup times out

**Diagnosis**: Too many properties to delete in one request
**Fix**: Already implemented batch processing (100 per batch)

---

## Implementation Complete ✅

**Code Status**: Ready for deployment
**Testing Status**: Manual testing required (see quickstart.md)
**Deployment Risk**: Medium (one-time data deletion)
**Recommended Approach**: Deploy filtering first, monitor, then run cleanup

**Files Changed**: 4
**Lines Added**: ~200
**Estimated Deployment Time**: 1 hour (including monitoring)
**Estimated Cleanup Time**: 1-2 minutes

Ready to deploy when you are! 🚀
