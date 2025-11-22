# Implementation Tasks: Postcode-Based Territory Assignment

**Feature**: 003-postcode-territories
**Branch**: `003-postcode-territories`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2025-11-21

## Summary

Replace polygon-based territory drawing with postcode-based assignment. Import UK postcode districts from free OS Open Data, enable click-to-select on map, display property counts via OS Places API, and allow assigning multiple postcodes to agents.

---

## Phase 1: Setup & Prerequisites

- [ ] T001 Download OS Open Data Boundary-Line dataset from https://osdatahub.os.uk/downloads/open/BoundaryLine
- [ ] T002 Extract postcode district boundaries from downloaded dataset
- [ ] T003 Analyze data format and determine import strategy

---

## Phase 2: Foundational Tasks (Database Schema)

- [ ] T004 [P] Create postcodes table with code, boundary, center_point columns in supabase/migrations/
- [ ] T005 [P] Create postcode_property_counts cache table in supabase/migrations/
- [ ] T006 [P] Create agent_postcodes junction table for many-to-many relationship in supabase/migrations/
- [ ] T007 Add spatial indexes (GiST) on postcode boundary and center_point columns
- [ ] T008 Create migration to import postcode district data (INSERT statements)
- [ ] T009 Run migrations and verify ~2,900 postcode districts imported
- [ ] T010 Test spatial queries - find postcode at coordinates, find postcodes in viewport

---

## Phase 3: User Story 4 - Seed Database with UK Postcodes (P1 - Prerequisite)

**Goal**: Import all UK postcode districts into database with boundaries for map display and querying.

**Independent Test**: Query database for postcodes. Verify ~2,900 districts exist with boundaries. Test spatial lookup by coordinates.

### Implementation Tasks

- [ ] T011 [US4] Write import script to convert OS data to SQL in scripts/import-postcodes.ts
- [ ] T012 [US4] Generate postcode district boundaries (convex hull from unit postcodes)
- [ ] T013 [US4] Create SQL migration with all postcode INSERT statements
- [ ] T014 [US4] Apply migration to seed database with postcodes
- [ ] T015 [US4] Verify import: SELECT COUNT(*) FROM postcodes should return ~2,900
- [ ] T016 [US4] Test spatial query: Find postcode containing Taunton coordinates

---

## Phase 4: User Story 1 - Select Postcodes by Clicking Map (P1)

**Goal**: Enable clicking map to select postcodes with visual highlighting and toggle functionality.

**Independent Test**: Click on Taunton. Verify TA1 postcode highlighted. Click multiple postcodes, verify selection list updates. Click again to deselect.

### Implementation Tasks

- [ ] T017 [US1] Update MapBox component to render postcode polygons from database in apps/dashboard/components/admin/territory-map.tsx
- [ ] T018 [US1] Add viewport-based postcode loading (only load visible postcodes) in territory-map.tsx
- [ ] T019 [US1] Implement click handler to query postcode at coordinates using PostGIS ST_Contains
- [ ] T020 [US1] Add postcode selection state management in apps/dashboard/components/admin/territory-page-client.tsx
- [ ] T021 [US1] Implement visual highlighting for selected postcodes on map
- [ ] T022 [US1] Add toggle selection logic (click to select, click again to deselect)
- [ ] T023 [US1] Display selected postcodes list in sidebar UI
- [ ] T024 [US1] Test clicking Taunton area selects TA1 postcode
- [ ] T025 [US1] Test selecting multiple postcodes updates list correctly
- [ ] T026 [US1] Test deselecting postcode removes from list

---

## Phase 5: User Story 2 - View Property Counts Per Postcode (P1)

**Goal**: Display residential property count for each selected postcode using OS Places API with caching.

**Independent Test**: Select postcode TA1. Verify property count loads and displays. Select again, verify cached count loads instantly.

### Implementation Tasks

- [ ] T027 [US2] Create API endpoint GET /api/admin/postcodes/[code]/property-count
- [ ] T028 [US2] Implement property count query using postcode boundary and OS Places API
- [ ] T029 [US2] Add caching logic - check postcode_property_counts table first
- [ ] T030 [US2] Store API result in cache with 24-hour TTL
- [ ] T031 [US2] Display property count in postcode selection UI
- [ ] T032 [US2] Show loading spinner during API call
- [ ] T033 [US2] Calculate and display total count across all selected postcodes
- [ ] T034 [US2] Add refresh button to update stale cached counts
- [ ] T035 [US2] Test TA1 property count loads correctly
- [ ] T036 [US2] Test cached count loads instantly on second selection
- [ ] T037 [US2] Test total count sums correctly across 3 postcodes

---

## Phase 6: User Story 3 - Assign Multiple Postcodes to Agent (P2)

**Goal**: Save selected postcodes to agent's territory, support multi-postcode assignment, detect overlaps.

**Independent Test**: Select 3 postcodes. Assign to agent. Verify all saved to agent_postcodes table. View agent territory, confirm all 3 postcodes displayed with total count.

### Implementation Tasks

- [ ] T038 [US3] Update territory assignment API to save postcode list in apps/dashboard/app/api/admin/territories/route.ts
- [ ] T039 [US3] Insert records into agent_postcodes junction table
- [ ] T040 [US3] Implement overlap detection - query if postcode already assigned to another agent
- [ ] T041 [US3] Display overlap warning in UI but allow assignment
- [ ] T042 [US3] Update GET /api/admin/territories to include assigned postcodes
- [ ] T043 [US3] Display assigned postcodes in agent territory card
- [ ] T044 [US3] Show total property count across all agent's postcodes
- [ ] T045 [US3] Implement unassign postcode functionality
- [ ] T046 [US3] Test assigning 3 postcodes to agent saves correctly
- [ ] T047 [US3] Test overlap detection warns when postcode already assigned
- [ ] T048 [US3] Test unassigning postcode removes from agent territory

---

## Phase 7: Polish & Migration

- [ ] T049 [P] Update territory UI to show both polygon and postcode modes during transition
- [ ] T050 [P] Add documentation for postcode import process
- [ ] T051 Create migration helper to suggest postcodes for existing polygon territories
- [ ] T052 Add performance monitoring for postcode queries
- [ ] T053 Document OS Open Data update process (annual refresh)
- [ ] T054 Test complete workflow end-to-end with real agent

---

## Task Dependencies

### User Story Completion Order

```
User Story 4 (Seed Postcodes) → MUST complete first
    ↓
User Story 1 (Click to Select) → Depends on US4
    ↓
User Story 2 (Property Counts) → Depends on US1
    ↓
User Story 3 (Assignment) → Depends on US1 & US2

Polish Phase (after all stories complete)
```

### Critical Path

```
T001-T003 (Download Data) → T004-T010 (Database Schema) → T011-T016 (Import Postcodes - US4)
    ↓
T017-T026 (Map Selection - US1)
    ↓
T027-T037 (Property Counts - US2)
    ↓
T038-T048 (Assignment - US3)
    ↓
T049-T054 (Polish)
```

---

## Parallel Execution Opportunities

### Foundational Tasks (After T003)
- T004, T005, T006 can run in parallel (different migration files)
- T007 runs after all tables created

### US1 Tasks (After US4 Complete)
- T017-T018 (Map rendering) || T019-T020 (Click handling)
- Tests T024-T026 run in parallel after implementation

### US2 Tasks (After US1 Complete)
- T027-T030 (API + caching) || T031-T034 (UI updates)
- Tests T035-T037 run in parallel

### US3 Tasks (After US1 & US2 Complete)
- T038-T042 (Backend) || T043-T045 (Frontend)
- Tests T046-T048 run in parallel

### Polish Tasks (All Parallel)
- T049-T054 can all run in parallel

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**User Stories 4 + 1**: Import postcodes + Click to select
- Can select postcodes on map
- Visual highlighting works
- Selection list displays
- NO property counts yet (add later)
- NO assignment yet (add later)

**Estimated**: 8-12 hours
**Deliverable**: Interactive postcode selection on map

### Phase 2 Scope

**Add User Story 2**: Property counts
- Display counts per postcode
- Caching functional
- Totals calculated

**Estimated**: +4 hours
**Deliverable**: Postcode selection with market sizing

### Full Implementation

**All User Stories**: Complete territory assignment
- Full postcode assignment workflow
- Overlap detection
- Agent territory management

**Estimated**: 16-20 hours total

---

## Success Checklist

After completing all tasks:

- [ ] Database contains ~2,900 UK postcode districts
- [ ] Map displays postcode boundaries
- [ ] Clicking map selects postcode at that location
- [ ] Selected postcodes visually highlighted
- [ ] Property counts display for each postcode
- [ ] Counts cached for 24 hours
- [ ] Multiple postcodes assignable to agent
- [ ] Agent territory shows assigned postcodes
- [ ] Overlap detection warns but allows assignment
- [ ] System faster than polygon drawing (< 1 minute for 10 postcodes)

---

## Notes

- **Total Tasks**: 54 (10 setup, 6 foundational, 10 US4, 10 US1, 11 US2, 11 US3, 6 polish)
- **Parallelizable**: 15 tasks marked [P]
- **Estimated Duration**: 16-20 hours (MVP: 8-12 hours)
- **Data Source**: OS Open Data (free, one-time download)
- **API Usage**: OS Places API (existing Premium subscription)
- **Migration**: Can coexist with polygon system during transition

**Recommended Approach**: Implement MVP (US4 + US1) first to validate approach, then add property counts and assignment.
