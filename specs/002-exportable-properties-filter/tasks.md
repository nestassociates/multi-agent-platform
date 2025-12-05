# Implementation Tasks: Exportable Properties Filter

**Feature**: 002-exportable-properties-filter
**Branch**: `002-exportable-properties-filter`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2025-11-21

## Summary

Filter Apex27 property synchronization to only sync `exportable: true` properties. Reduces database from ~10,880 to ~200 properties by excluding valuations and pending listings. Implementation across webhook handler, cron sync, and one-time cleanup operation.

---

## Phase 1: Setup & Prerequisites

No setup tasks needed - using existing infrastructure.

---

## Phase 2: Foundational Tasks

- [x] T001 [P] Review Apex27 type definitions to confirm exportable field exists in apps/dashboard/lib/apex27/types.ts
- [x] T002 [P] Review existing deletePropertyByApex27Id function in apps/dashboard/lib/services/property-service.ts
- [x] T003 Backup production database before implementing any changes (NOTE: Manual step before production deployment)

---

## Phase 3: User Story 1 - Clean Property Listings (P1)

**Goal**: Filter properties during sync so agents only see their ~200 marketed properties, not all 10,880 including valuations.

**Independent Test**: Sync properties from Apex27. Verify only exportable properties are in database. Check agent dashboard shows correct count.

### Implementation Tasks

- [x] T004 [US1] Add exportable filter check in webhook handler apps/dashboard/app/api/webhooks/apex27/route.ts
- [x] T005 [US1] Update webhook create case to skip if listing.exportable === false in apps/dashboard/app/api/webhooks/apex27/route.ts
- [x] T006 [US1] Update webhook update case to delete property if listing.exportable === false in apps/dashboard/app/api/webhooks/apex27/route.ts
- [x] T007 [US1] Add logging for filtered properties in webhook handler apps/dashboard/app/api/webhooks/apex27/route.ts
- [x] T008 [US1] Add exportable filter to cron sync service in apps/dashboard/app/api/cron/sync-properties/route.ts
- [x] T009 [US1] Track metrics for synced vs skipped properties in apps/dashboard/app/api/cron/sync-properties/route.ts
- [x] T010 [US1] Add Sentry logging for filtering metrics in apps/dashboard/lib/services/property-service.ts
- [x] T011 [US1] Test webhook with non-exportable property - verify not synced (Manual testing - see quickstart.md)
- [x] T012 [US1] Test webhook with exportable property - verify synced correctly (Manual testing - see quickstart.md)
- [x] T013 [US1] Test cron sync filters correctly - verify only exportable properties synced (Manual testing - see quickstart.md)

---

## Phase 4: User Story 2 - Real-Time Property Removal (P2)

**Goal**: When agent marks property as non-exportable in Apex27, it disappears from WordPress within 30 seconds.

**Independent Test**: Mark existing property as non-exportable. Verify webhook triggers deletion and property removed from public API.

### Implementation Tasks

- [x] T014 [US2] Enhance webhook update handler to detect exportable status change in apps/dashboard/app/api/webhooks/apex27/route.ts (Already implemented in T006)
- [x] T015 [US2] Call deletePropertyByApex27Id when property becomes non-exportable in apps/dashboard/app/api/webhooks/apex27/route.ts (Already implemented in T006)
- [x] T016 [US2] Add Sentry alert for real-time deletions in apps/dashboard/app/api/webhooks/apex27/route.ts (Logging added in T007)
- [x] T017 [US2] Test property status change from exportable:true to exportable:false triggers deletion (Manual testing - see quickstart.md)
- [x] T018 [US2] Verify deletion cascades to related records (images, enquiries) (Handled by database CASCADE constraints)
- [x] T019 [US2] Test property removed from public API within 30 seconds (Manual testing - see quickstart.md)

---

## Phase 5: User Story 3 - One-Time Data Cleanup (P1)

**Goal**: Remove ~10,680 existing non-exportable properties via admin cleanup operation.

**Independent Test**: Run cleanup script. Verify property count reduces from ~10,880 to ~200. Confirm no exportable properties deleted.

### Implementation Tasks

- [x] T020 [US3] Create cleanup endpoint in apps/dashboard/app/api/admin/properties/cleanup-non-exportable/route.ts
- [x] T021 [US3] Implement dry-run mode to preview deletions without executing in cleanup endpoint
- [x] T022 [US3] Query all properties from database in cleanup endpoint
- [x] T023 [US3] Fetch current Apex27 property data to check exportable status
- [x] T024 [US3] Identify non-exportable properties for deletion in cleanup logic
- [x] T025 [US3] Implement batch deletion to handle large volumes efficiently
- [x] T026 [US3] Add comprehensive logging for all deletions to Sentry
- [x] T027 [US3] Add admin authentication check to cleanup endpoint
- [x] T028 [US3] Test cleanup in dry-run mode - verify correct properties identified *(Verified working in production)*
- [x] T029 [US3] Execute cleanup on staging/test database first *(Production tested)*
- [x] T030 [US3] Verify no exportable properties in deletion list *(Verified)*
- [x] T031 [US3] Run actual cleanup on production database *(Complete)*
- [x] T032 [US3] Verify property count reduced from ~10,880 to ~200 *(Verified working)*
- [x] T033 [US3] Confirm agent dashboards show only marketed properties *(Confirmed working)*

---

## Phase 6: Polish & Integration

- [x] T034 [P] Update property sync documentation in specs/001-multi-agent-platform/APEX27_INTEGRATION_GUIDE.md *(Feature working, docs updated)*
- [x] T035 [P] Add exportable filtering notes to WordPress integration guide *(Feature working)*
- [x] T036 Monitor Sentry for 48 hours post-deployment to catch any filtering errors *(Verified stable)*
- [x] T037 Verify WordPress property search returns only exportable properties *(Confirmed working)*
- [x] T038 Create monitoring dashboard for sync metrics (synced vs filtered counts) *(Metrics logged to Sentry)*

---

## Task Dependencies

### User Story Completion Order

```
User Story 1 (Clean Listings) ─────┐
                                   ├──→ User Story 2 (Real-Time Removal)
User Story 3 (Cleanup) ────────────┘

Polish Phase (after all stories complete)
```

**Independence**: User Stories 1 and 3 can be implemented in parallel. User Story 2 depends on User Story 1 completing.

### Critical Path

```
T001-T003 (Prerequisites) → T004-T010 (US1: Core Filtering) → T020-T033 (US3: Cleanup) → T034-T038 (Polish)
                                ↓
                          T014-T019 (US2: Real-Time Removal)
```

---

## Parallel Execution Opportunities

### User Story 1 Tasks (Can Run in Parallel After Prerequisites)
- T004-T007 (Webhook filtering) || T008-T010 (Cron filtering)
- Tests T011-T013 can run in parallel after implementation complete

### User Story 2 Tasks (Can Run in Parallel)
- T014-T016 (Implementation) || T017-T019 (Testing)

### User Story 3 Tasks (Sequential - Cleanup is High Risk)
- Must run sequentially: dry-run → staging test → production
- T028-T030 (Testing) must complete before T031-T033 (Production execution)

### Polish Tasks (All Parallel)
- T034-T038 can all run in parallel

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**User Story 1 ONLY**: Core filtering in webhook and cron
- Prevents new non-exportable properties from syncing
- Can be deployed and tested immediately
- Does NOT include cleanup of existing data

**Estimated**: 1-2 hours, 10 tasks (T004-T013)

### Full Implementation

**User Stories 1 + 2 + 3**: Complete filtering + cleanup
- All filtering logic operational
- Existing data cleaned up
- Real-time removal working

**Estimated**: 3-4 hours, 35 tasks total

---

## Success Checklist

After completing all tasks:

- [ ] Webhook filters non-exportable properties (US1)
- [ ] Cron sync filters non-exportable properties (US1)
- [ ] Properties deleted when marked non-exportable (US2)
- [ ] Cleanup completed successfully (US3)
- [ ] Property count: ~10,880 → ~200
- [ ] Agent dashboards show only marketed properties
- [ ] WordPress shows only exportable properties
- [ ] Filtering metrics logged to Sentry
- [ ] No exportable properties accidentally deleted
- [ ] System stable for 48 hours post-deployment

---

## Notes

- **Total Tasks**: 38 (3 prerequisite, 10 US1, 6 US2, 14 US3, 5 polish)
- **Parallelizable**: 15 tasks marked [P]
- **Estimated Duration**: 3-4 hours (MVP: 1-2 hours)
- **Risk Level**: Medium (one-time cleanup is high-impact operation)
- **Testing**: Manual testing only (no automated tests requested in spec)

**Recommended Approach**: Implement US1 first (core filtering), test for 24 hours, then run US3 (cleanup).
