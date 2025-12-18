# Tasks: Postcode Sector Territory Subdivision

**Input**: Design documents from `/specs/008-postcode-sector-territories/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/dashboard/` for Next.js app, `packages/` for shared packages
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Prepare database schema and type definitions

- [x] T001 Create database migration file `supabase/migrations/20251218000001_add_postcode_sectors.sql` with postcode_sectors table schema
- [x] T002 Add sector_code column to agent_postcodes table in migration (nullable, references postcode_sectors)
- [x] T003 Create sector_property_counts cache table in migration
- [x] T004 Add PostGIS spatial indexes for sector boundaries in migration
- [x] T005 Add RLS policies for postcode_sectors and sector_property_counts (public read)
- [x] T006 Create helper function `get_sector_geojson()` in migration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and utilities that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Copy type definitions from `specs/008-postcode-sector-territories/contracts/types.ts` to `packages/shared-types/src/sectors.ts`
- [x] T008 Export sector types from `packages/shared-types/src/index.ts`
- [x] T009 Add Zod schemas for sector validation in `packages/validation/src/territory.ts` (sector code, district code validation)
- [x] T010 Run migration against Supabase: `supabase db push` **[MANUAL - requires Supabase CLI]**
- [x] T011 Generate updated Supabase types: `supabase gen types typescript` **[MANUAL - requires Supabase CLI]**
- [x] T012 Update `apps/dashboard/lib/supabase/types.ts` with generated sector types **[MANUAL - after T011]**

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 4 - Import Sector Boundary Data (Priority: P2 - but done first)

**Goal**: Populate the system with UK postcode sector boundaries from Edinburgh DataShare open data

**Rationale for Early Implementation**: Must have sector data loaded before testing any other user story

**Independent Test**: Run import script and verify ~12,000 sectors are loaded with valid boundaries

### Data Import Implementation

- [x] T013 [US4] Create import script structure in `scripts/import-sectors.ts`
- [x] T014 [US4] Add GDAL/ogr2ogr conversion instructions in quickstart.md (Shapefile to GeoJSON)
- [x] T015 [US4] Parse GeoJSON sectors file, extract sector code and boundary polygon
- [x] T016 [US4] Derive district_code from sector code (e.g., "TA1 1" → "TA1")
- [x] T017 [US4] Validate sector codes match parent districts in postcodes table
- [x] T018 [US4] Generate SQL batch files (500 sectors per batch) in `scripts/sector_batches/`
- [x] T019 [US4] Calculate area_km2 from boundary polygon using PostGIS ST_Area
- [x] T020 [US4] Calculate center_point using PostGIS ST_Centroid for label placement
- [x] T021 [US4] Add import progress logging (X of 12,000 sectors imported)
- [x] T022 [US4] Add npm script: `"import:sectors": "tsx scripts/import-sectors.ts"`
- [x] T023 [US4] Document import process in quickstart.md with data attribution

**Checkpoint**: ~12,000 sectors should be loaded in postcode_sectors table

---

## Phase 4: User Story 1 - Admin Assigns Sectors to Agent (Priority: P1) - MVP

**Goal**: Enable administrators to drill down into districts and assign specific sectors to agents

**Independent Test**: Load district TA1, expand to see sectors TA1 1-5, select TA1 1-3, assign to an agent, verify assignment persists

### API Implementation for User Story 1

- [x] T024 [US1] Create `apps/dashboard/app/api/admin/sectors/list/route.ts` - GET sectors by district
- [x] T025 [US1] Return sectors with boundaries as GeoJSON, include assigned_agent info
- [x] T026 [US1] Validate district parameter matches DISTRICT_CODE_REGEX
- [x] T027 [US1] Create `apps/dashboard/app/api/admin/sectors/[code]/count/route.ts` - GET property count
- [x] T028 [US1] Integrate OS Data Hub API for sector-level property counts
- [x] T029 [US1] Cache property counts in sector_property_counts table (1-year TTL)

### Territory Assignment Extension

- [x] T030 [US1] Create `apps/dashboard/app/api/admin/territories/postcode/route.ts` for sector assignment
- [x] T031 [US1] When sector_codes provided, create individual sector assignments in agent_postcodes
- [x] T032 [US1] When sector_codes null/empty, create district-level assignment (existing behavior)
- [x] T033 [US1] Return assignment results with sector_code values

### UI Implementation for User Story 1

- [x] T034 [US1] Add `expandedDistrict` state to `apps/dashboard/components/admin/postcode-page-client.tsx`
- [x] T035 [US1] Add `selectedSectors` state for tracking sector selections
- [x] T036 [US1] Add drill-down double-click handler for district expansion
- [x] T037 [US1] Create `handleDistrictDrillDown()` function calling /api/admin/sectors/list
- [x] T038 [US1] Modify `apps/dashboard/components/admin/postcode-map.tsx` to render sector layer
- [x] T039 [US1] Add sector boundaries as separate Mapbox source when district expanded
- [x] T040 [US1] Style sectors with fill color (assigned vs unassigned vs selected)
- [x] T041 [US1] Add sector code labels at center_point positions
- [x] T042 [US1] Add click handler for sector selection (toggle in selectedSectors)
- [x] T043 [US1] Update assignment panel to show selected sectors count
- [x] T044 [US1] Pass sector_codes to assignment API when sectors are selected
- [x] T045 [US1] Clear sector selection and collapse after successful assignment

**Checkpoint**: Admins can drill into districts, select sectors, and assign to agents

---

## Phase 5: User Story 2 - Admin Assigns Full District (Priority: P1)

**Goal**: Preserve existing district-level assignment workflow without requiring sector selection

**Independent Test**: Select district BS1 without expanding, assign to agent, verify full district assignment created

### Implementation for User Story 2

- [x] T046 [US2] Ensure clicking district without expanding selects entire district
- [x] T047 [US2] When district selected (not expanded), assignment sends sector_codes: null
- [x] T048 [US2] Verify agent_postcodes row created with sector_code IS NULL for district assignment
- [x] T049 [US2] Display district as fully assigned (solid fill) in map view
- [x] T050 [US2] Add "Assign Full District" button when district is expanded but no sectors selected

**Checkpoint**: District-level assignments work exactly as before

---

## Phase 6: User Story 3 - View Mixed Assignments (Priority: P2)

**Goal**: Visually distinguish between fully-assigned districts, partially-assigned districts, and sector-level assignments

**Independent Test**: Create mixed assignments (full district + partial district), verify visual indicators

### API Support for Mixed Assignments

- [x] T051 [US3] Modify /api/admin/postcodes/list to include assignment_status field
- [x] T052 [US3] Calculate assignment_status: 'unassigned' | 'full' | 'partial' per district
- [x] T053 [US3] Include sector_count and assigned_sector_count for partial districts
- [x] T054 [US3] Return assigned_agent info at district level when full assignment

### UI Visualization for Mixed Assignments

- [x] T055 [US3] Add visual indicator for partial assignment (amber color + dashed outline)
- [x] T056 [US3] Show "TA1 (3/5 sectors)" badge in sidebar for partially assigned districts
- [x] T057 [US3] When expanding partial district, show which sectors are assigned to whom
- [x] T058 [US3] Color-code sectors by assigned agent (consistent agent colors)
- [x] T059 [US3] Add legend showing assignment status indicators

**Checkpoint**: Map clearly shows full vs partial vs unassigned districts

---

## Phase 7: User Story 5 - Prevent Conflicting Assignments (Priority: P3)

**Goal**: Detect and prevent invalid overlapping assignments between district and sector levels

**Independent Test**: Attempt conflicting assignments and verify appropriate error messages

### Conflict Detection API

- [x] T060 [US5] Create `apps/dashboard/app/api/admin/territories/check-conflicts/route.ts`
- [x] T061 [US5] Check if target district already assigned to different agent
- [x] T062 [US5] Check if any target sectors already assigned to different agents
- [x] T063 [US5] Check if assigning full district conflicts with existing sector assignments
- [x] T064 [US5] Return conflict details: type, code, conflicting agent info

### Conflict Handling in Assignment Flow

- [x] T065 [US5] Call check-conflicts API before creating assignment
- [x] T066 [US5] Display conflict warning modal with conflict details
- [x] T067 [US5] Offer options: Cancel, Reassign (remove existing)
- [x] T068 [US5] If Reassign selected, delete conflicting assignments before creating new
- [x] T069 [US5] Database constraint added in migration (unique on agent_id, postcode_code, sector_code)

**Checkpoint**: System prevents all invalid overlapping assignments with clear feedback

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Testing, documentation, and improvements that affect multiple user stories

- [x] T070 [P] Add loading state when fetching sectors for expanded district
- [x] T071 [P] Add error handling for missing sector data (BT postcodes, edge cases)
- [x] T072 [P] Display "Sector data not available" for districts without sector boundaries
- [ ] T073 [P] Add keyboard navigation for sector selection (Shift+click for range) **[FUTURE]**
- [ ] T074 [P] Update territory export to include sector-level assignments **[FUTURE]**
- [ ] T075 [P] Add E2E test: sector assignment flow in `tests/e2e/territories-sectors.spec.ts` **[FUTURE]**
- [ ] T076 [P] Add unit tests for conflict detection logic **[FUTURE]**
- [ ] T077 [P] Update quickstart.md with final testing instructions **[FUTURE]**
- [x] T078 [P] Add data attribution footer for sector boundaries (Geolytix copyright)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **Data Import (Phase 3)**: Depends on Foundational - Should complete before UI work
- **User Stories (Phase 4-7)**: All depend on Foundational and Data Import
  - US1 and US2 can proceed in parallel (both P1)
  - US3 depends on US1/US2 being complete (needs mixed data)
  - US5 can proceed independently after US1
- **Polish (Phase 8)**: Depends on core user stories being complete

### User Story Dependencies

- **User Story 4 (Import)**: Can start after Foundational - No dependencies on other stories
- **User Story 1 (P1)**: Can start after Data Import - Core drill-down functionality
- **User Story 2 (P1)**: Can start after Foundational - Independent of US1
- **User Story 3 (P2)**: Depends on US1 and US2 - Needs both assignment types
- **User Story 5 (P3)**: Can start after US1 - Adds conflict detection layer

### Within Each User Story

- API routes before UI components
- Database operations before API routes
- UI state management before visual rendering
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T006) can run sequentially (single migration file)
- T007-T009 can run in parallel (different packages)
- T024-T029 (API) and T034-T045 (UI) in US1 - API first, then UI
- T051-T054 (API) and T055-T059 (UI) in US3 - API first, then UI
- All Phase 8 tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T012)
3. Complete Phase 3: Data Import (T013-T023) - Load sector boundaries
4. Complete Phase 4: User Story 1 (T024-T045) - Sector assignment
5. Complete Phase 5: User Story 2 (T046-T050) - District assignment preserved
6. **STOP and VALIDATE**: Test both sector and district assignments work
7. Deploy with core sector subdivision functionality

### Incremental Delivery

1. Setup + Foundational + Import → Sector data ready
2. Add US1 + US2 → Test independently → Deploy (MVP with sector assignment!)
3. Add US3 → Test independently → Deploy (adds visual indicators)
4. Add US5 → Test independently → Deploy (adds conflict protection)
5. Each story adds value without breaking previous stories

---

## Task Summary

| Phase | Tasks | Purpose |
|-------|-------|---------|
| Phase 1: Setup | T001-T006 | Database schema |
| Phase 2: Foundational | T007-T012 | Types and validation |
| Phase 3: Data Import (US4) | T013-T023 | Load sector boundaries |
| Phase 4: US1 - Sector Assignment | T024-T045 | Core drill-down feature |
| Phase 5: US2 - District Assignment | T046-T050 | Preserve existing workflow |
| Phase 6: US3 - Mixed View | T051-T059 | Visual indicators |
| Phase 7: US5 - Conflict Detection | T060-T069 | Prevent invalid assignments |
| Phase 8: Polish | T070-T078 | Testing and documentation |

**Total Tasks**: 78

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Data import (US4) is listed as P2 but implemented first because other stories depend on having sector data
- BT (Northern Ireland) postcodes may not have sector data - handle gracefully
