# Tasks: Separate Reviews & Fees from Content System

**Input**: Design documents from `/specs/005-separate-reviews-fees/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No explicit test tasks - feature relies on manual testing per quickstart.md scenarios

**Organization**: Tasks grouped by user story (US1, US2, US3) from spec.md to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Environment & Prerequisites)

**Purpose**: Obtain Google Maps API key and prepare environment

- [x] T001 Obtain Google Maps Embed API key from Google Cloud Console (console.cloud.google.com → APIs & Services → Credentials)
- [x] T002 Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to apps/dashboard/.env.local
- [x] T003 Restrict API key in Google Cloud Console to Maps Embed API only and add HTTP referrer restrictions

---

## Phase 2: Foundational (Database & Type System)

**Purpose**: Database schema changes and shared type updates that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create migration file supabase/migrations/20251126000001_archive_old_content_types.sql with is_archived column, UPDATE query, and CHECK constraint
- [x] T005 Create migration file supabase/migrations/20251126000002_create_agent_fees.sql with agent_fees table and RLS policies
- [x] T006 Create migration file supabase/migrations/20251126000003_add_google_place_id.sql with google_place_id column on agents table
- [x] T007 Apply migration 20251126000001_archive_old_content_types.sql using Supabase MCP apply_migration tool
- [x] T008 Apply migration 20251126000002_create_agent_fees.sql using Supabase MCP apply_migration tool
- [x] T009 Apply migration 20251126000003_add_google_place_id.sql using Supabase MCP apply_migration tool
- [x] T010 [P] Update packages/validation/src/content.ts line 8 to change enum to z.enum(['blog_post', 'area_guide'])
- [x] T011 [P] Create packages/validation/src/fees.ts with feeStructureSchema (sales_percentage, lettings_percentage, minimum_fee, notes)
- [x] T012 [P] Update packages/validation/src/index.ts to export fees module
- [x] T013 [P] Update packages/shared-types/src/entities.ts line 11 to change ContentType = 'blog_post' | 'area_guide'
- [x] T014 [P] Add AgentFee interface to packages/shared-types/src/entities.ts
- [x] T015 [P] Add google_place_id field to Agent interface in packages/shared-types/src/entities.ts
- [x] T016 Build validation and shared-types packages: pnpm run build --filter=@nest/validation --filter=@nest/shared-types

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent Creates Blog Content (Priority: P1) 🎯 MVP

**Goal**: Restrict content creation to blog_post and area_guide only, archive deprecated types

**Independent Test**: Log in as agent, navigate to /content/new, verify dropdown shows only 2 options. View content list, verify no review/fee content displayed. Create blog post successfully.

### Implementation for User Story 1

- [x] T017 [P] [US1] Update apps/dashboard/components/agent/content-form.tsx lines 21-26 to remove review and fee_structure from contentTypeOptions array
- [x] T018 [P] [US1] Update apps/dashboard/app/(agent)/content/page.tsx lines 42-47 to remove review and fee_structure from contentTypeLabels
- [x] T019 [US1] Update apps/dashboard/app/(agent)/content/page.tsx line 74 to add .eq('is_archived', false) filter to content query
- [x] T020 [US1] Update apps/dashboard/app/api/agent/content/route.ts line 165 to add .eq('is_archived', false) filter to GET query
- [x] T021 [US1] Verify content creation works: Test creating blog_post and area_guide through UI
- [x] T022 [US1] Verify archived content hidden: Check content list doesn't show old review/fee_structure records
- [x] T023 [US1] Verify API validation: Test POST to /api/agent/content with type="review" returns validation error

**Checkpoint**: Content system restricted to blog_post and area_guide. Old content archived and hidden.

---

## Phase 4: User Story 2 - Agent Manages Fee Structure (Priority: P2)

**Goal**: Enable agents to configure and update their commission rates through dedicated fee management page

**Independent Test**: Log in as agent, navigate to /fees, enter commission rates, save successfully, verify display updates.

### Implementation for User Story 2

- [x] T024 [P] [US2] Create apps/dashboard/app/api/agent/fees/route.ts with GET handler (fetch agent's fees from agent_fees table)
- [x] T025 [P] [US2] Add POST handler to apps/dashboard/app/api/agent/fees/route.ts with Zod validation and upsert logic
- [x] T026 [P] [US2] Create apps/dashboard/components/agent/fee-structure-form.tsx with React Hook Form, Zod resolver, and 4 fields (sales %, lettings %, min fee, notes)
- [x] T027 [US2] Create apps/dashboard/app/(agent)/fees/page.tsx with server-side data fetch, FeeStructureForm component, and current fee display card
- [x] T028 [US2] Test fee creation: Navigate to /fees, enter sales=1.5%, lettings=10%, save, verify database record created
- [x] T029 [US2] Test fee updates: Change sales to 2.0%, save, verify updated_at timestamp changes
- [x] T030 [US2] Test validation: Try sales=150%, verify error message displays
- [x] T031 [US2] Test optional fields: Save with only required fields (no min_fee/notes), verify success

**Checkpoint**: Fee structure system fully functional. Agents can create/update fees independently of other features.

---

## Phase 5: User Story 3 - Agent Displays GMB Reviews (Priority: P3)

**Goal**: Enable agents to connect Google My Business profile and display reviews via embedded Maps widget

**Independent Test**: Log in as agent, navigate to /reviews, enter valid Google Place ID, verify embedded map widget displays reviews.

### Implementation for User Story 3

- [x] T032 [P] [US3] Update apps/dashboard/app/api/agent/profile/route.ts PATCH handler to accept google_place_id in request body and update agents table
- [x] T033 [P] [US3] Create apps/dashboard/components/agent/gmb-place-id-form.tsx with form to save Place ID, client-side format validation (starts with "ChIJ"), and link to Google Place ID Finder
- [x] T034 [P] [US3] Create apps/dashboard/components/agent/gmb-reviews-widget.tsx with iframe embedding Google Maps using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and placeId prop
- [x] T035 [US3] Create apps/dashboard/app/(agent)/reviews/page.tsx with conditional rendering (widget if Place ID exists, form if not), server-side agent data fetch
- [x] T036 [US3] Test Place ID save: Enter valid Place ID, submit form, verify stored in database
- [x] T037 [US3] Test widget display: With valid Place ID, verify iframe loads and shows Google Maps with reviews
- [x] T038 [US3] Test Place ID update: Change existing Place ID, verify widget refreshes with new location

**Checkpoint**: GMB reviews integration complete. Agents can display their Google reviews independently of content/fee systems.

---

## Phase 6: Navigation & Polish

**Purpose**: Cross-cutting improvements and final integration

- [x] T039 Update apps/dashboard/app/(agent)/layout.tsx to add navigation links for "Reviews" (href="/reviews") and "Fees" (href="/fees")
- [x] T040 Test navigation: Click Reviews link, verify page loads. Click Fees link, verify page loads. Click Content link, verify existing functionality works.
- [x] T041 Run full TypeScript build: pnpm run build --filter=@nest/dashboard to verify no type errors
- [x] T042 Test complete user flow for US1: Create blog post from start to finish
- [x] T043 Test complete user flow for US2: Configure fee structure from scratch
- [x] T044 Test complete user flow for US3: Connect GMB and view reviews
- [x] T045 Verify all quickstart.md scenarios pass (3 scenarios documented)
- [x] T046 Clean up debug logs: Remove console.log from apps/dashboard/app/api/admin/content/moderation/route.ts lines 115 and 127

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase (T016) completion
  - User stories CAN proceed in parallel if desired
  - Or sequentially in priority order: US1 → US2 → US3
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Phase 3**: Independent - can start after T016, no dependencies on US2/US3
- **User Story 2 (P2) - Phase 4**: Independent - can start after T016, no dependencies on US1/US3
- **User Story 3 (P3) - Phase 5**: Independent - can start after T016, no dependencies on US1/US2

### Within Each User Story

- Models/schemas before API endpoints (validation needed in endpoints)
- API endpoints before UI pages (pages call APIs)
- Components before pages (pages import components)
- Core implementation before testing tasks

### Parallel Opportunities

**Setup Phase (T001-T003)**:
- T001-T003 sequential (API key setup)

**Foundational Phase (T004-T016)**:
- T004-T006: Sequential (create migration files)
- T007-T009: Sequential (apply migrations in order)
- T010-T015: ALL PARALLEL (different files, no conflicts)
- T016: Final (requires T010-T015 complete)

**User Story Phases (T017-T038)**:
- Once T016 complete, ALL THREE user stories can run in parallel:
  - US1 (T017-T023): 7 tasks
  - US2 (T024-T031): 8 tasks
  - US3 (T032-T038): 7 tasks
- Within each story:
  - US1: T017-T018 parallel, then T019-T020 parallel
  - US2: T024-T026 parallel, then T027 sequential
  - US3: T032-T034 parallel, then T035 sequential

**Polish Phase (T039-T046)**:
- Sequential (depends on all stories complete)

---

## Parallel Example: After Foundational Phase

```bash
# Launch User Story 1 tasks (can run while US2/US3 also running):
Task T017: Update content-form.tsx
Task T018: Update content page labels
# Then:
Task T019: Add archived filter to page query
Task T020: Add archived filter to API query

# Simultaneously, launch User Story 2 tasks:
Task T024: Create fees API GET handler
Task T025: Add fees API POST handler
Task T026: Create fee-structure-form component
# Then:
Task T027: Create fees page

# Simultaneously, launch User Story 3 tasks:
Task T032: Update profile API
Task T033: Create gmb-place-id-form component
Task T034: Create gmb-reviews-widget component
# Then:
Task T035: Create reviews page
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T016) - **MUST FINISH**
3. Complete Phase 3: User Story 1 (T017-T023)
4. **STOP and VALIDATE**: Run US1 acceptance scenarios from spec.md
5. Optional: Deploy with just content restriction working

**Result**: Content system works with only blog_post/area_guide. Simplest deployable increment.

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational (T001-T016) → **Foundation ready**
2. Add User Story 1 (T017-T023) → Test independently → **Deploy MVP**
3. Add User Story 2 (T024-T031) → Test independently → **Deploy with fees**
4. Add User Story 3 (T032-T038) → Test independently → **Deploy complete feature**
5. Add Polish (T039-T046) → **Final release**

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With 2-3 developers available:

1. **Together**: Complete Setup + Foundational (T001-T016)
2. **Once T016 done, split work**:
   - Developer A: User Story 1 (T017-T023)
   - Developer B: User Story 2 (T024-T031)
   - Developer C: User Story 3 (T032-T038)
3. **Merge independently**: Each story can be reviewed/merged separately
4. **Together**: Polish phase (T039-T046)

**Timeline**: ~1 hour parallel vs ~2.5 hours sequential

---

## Task Summary

**Total Tasks**: 46
- Setup: 3 tasks
- Foundational: 13 tasks (blocks all stories)
- User Story 1: 7 tasks (independent)
- User Story 2: 8 tasks (independent)
- User Story 3: 7 tasks (independent)
- Polish: 8 tasks

**Parallel Opportunities**: 12 tasks marked [P] can run simultaneously within their phases

**Independent Stories**: All 3 user stories can start after T016 and work in parallel

**MVP Scope**: T001-T023 (Setup + Foundational + US1) = 23 tasks for minimum viable product

---

## Notes

- [P] tasks affect different files with no dependencies - safe to run in parallel
- [US1], [US2], [US3] labels map to user stories in spec.md for traceability
- Each user story is independently testable per acceptance scenarios in spec.md
- Stop at any checkpoint to validate story independently
- Commit after completing each user story phase for clean git history
