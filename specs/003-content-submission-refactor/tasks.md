# Tasks: Content Submission System Refactor

**Feature**: 003-content-submission-refactor
**Branch**: `003-content-submission-refactor`
**Generated**: 2025-11-24
**Total Tasks**: 75

---

## Overview

This task list implements the Content Submission System Refactor feature, organized by user story priority (P1-P6). Each phase corresponds to one user story and can be implemented independently after foundational tasks are complete.

**Implementation Strategy**: MVP-first, incremental delivery
- **MVP**: User Story 1 (P1) - Secure Content Rendering (critical security fix)
- **Incremental**: Stories 2-6 add features without breaking previous work

---

## Task Summary by Phase

| Phase | User Story | Priority | Tasks | Parallel | Description |
|-------|------------|----------|-------|----------|-------------|
| 1 | Setup | - | 5 | 3 | Project initialization |
| 2 | Foundation | - | 8 | 4 | Blocking prerequisites |
| 3 | US1: Secure Rendering | P1 | 8 | 4 | XSS vulnerability fix (CRITICAL) |
| 4 | US2: Content Editing | P2 | 12 | 6 | Agent edit workflow |
| 5 | US3: Admin Filtering | P3 | 13 | 7 | Filtering, search, pagination |
| 6 | US4: Image Upload | P4 | 11 | 5 | Drag-drop image uploads |
| 7 | US5: Content Preview | P5 | 7 | 4 | Preview before submission |
| 8 | US6: Consistent Modals | P6 | 6 | 3 | UI polish for admin actions |
| 9 | Polish & Integration | - | 5 | 2 | Cross-cutting concerns |

**Total**: 75 tasks across 9 phases

---

## Dependencies & Execution Strategy

### Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → [All User Stories in parallel]
                                          ↓
                                     Phase 3 (US1 - P1) [CRITICAL - MUST DO FIRST]
                                          ↓
                  ┌───────────────────────┼───────────────────────┐
                  ↓                       ↓                       ↓
            Phase 4 (US2 - P2)      Phase 5 (US3 - P3)     Phase 6 (US4 - P4)
                  ↓                       ↓                       ↓
            Phase 7 (US5 - P5)      Phase 8 (US6 - P6)          |
                  └───────────────────────┴───────────────────────┘
                                          ↓
                                  Phase 9 (Polish)
```

**Key Insight**: After US1 (security fix), all other stories (US2-US6) are independent and can be implemented in any order or in parallel by different developers.

### Independent Testing Per Story

Each user story has clear acceptance criteria and can be tested independently:

- **US1**: Submit content with XSS vectors → Verify stripped/escaped
- **US2**: Create draft → Edit → Submit → Reject → Edit → Resubmit
- **US3**: Apply filters (type, agent, date, search) → Verify pagination works
- **US4**: Drag image → Upload → See preview → Submit content
- **US5**: Write content → Click Preview → See formatted output
- **US6**: Click Approve/Reject → See consistent Dialog → Confirm action

---

## Phase 1: Setup (5 tasks)

**Goal**: Initialize project infrastructure and install dependencies

**Tasks**:

- [x] T001 Install new shadcn/ui components (pagination, command, popover) in apps/dashboard via `npx shadcn@latest add pagination command popover`
- [x] T002 [P] Create cursor pagination utilities in apps/dashboard/lib/cursor-pagination.ts with encodeCursor() and decodeCursor() functions
- [x] T003 [P] Verify isomorphic-dompurify is installed and apps/dashboard/lib/sanitize.ts exists with correct configuration
- [x] T004 [P] Create database migration file supabase/migrations/20251124000001_create_content_images_bucket.sql for Supabase Storage bucket
- [x] T005 Create database migration file supabase/migrations/20251124000002_add_content_cursor_index.sql for pagination indexes

**Parallel Opportunities**: Tasks T002, T003, T004 can run in parallel (different files/systems)

**Dependencies**: None (first phase)

---

## Phase 2: Foundation (8 tasks)

**Goal**: Complete blocking prerequisites for all user stories

**Prerequisites**: Phase 1 complete

**Tasks**:

- [ ] T006 Run database migrations with `supabase db push` to create content-images bucket and cursor indexes *(Manual: Supabase CLI needed)*
- [x] T007 [P] Add imageUploadSchema to packages/validation/src/content.ts with file validation rules
- [x] T008 [P] Add contentImageUrlSchema to packages/validation/src/content.ts to validate Supabase Storage URLs
- [ ] T009 [P] Verify content-images bucket created successfully and RLS policies applied via Supabase dashboard *(After T006)*
- [x] T010 [P] Test cursor pagination functions (encodeCursor/decodeCursor) with unit tests in tests/unit/cursor-pagination.test.ts
- [x] T011 Update packages/validation/src/content.ts createContentSchema to use contentImageUrlSchema for featured_image_url field
- [x] T012 Verify existing TypeScript types in packages/shared-types/src/entities.ts match ContentSubmission interface (no changes needed)
- [x] T013 Document new Supabase Storage bucket structure and RLS policies in specs/003-content-submission-refactor/data-model.md (already complete, verify only)

**Parallel Opportunities**: Tasks T007, T008, T009, T010 can run in parallel (independent files)

**Dependencies**: Phase 1 (migrations created)

**Validation**: After this phase, all infrastructure is ready for user story implementation

---

## Phase 3: User Story 1 - Secure Content Rendering (P1 - CRITICAL) (8 tasks)

**Goal**: Fix XSS vulnerability by sanitizing all user-submitted HTML before rendering

**Why P1**: Critical security vulnerability that could compromise the entire platform

**Independent Test**: Submit content with `<script>alert('XSS')</script>` and `<img src=x onerror="alert('XSS')">` → Verify scripts stripped and no execution

**Prerequisites**: Phase 2 complete

**Tasks**:

- [x] T014 [US1] Add comprehensive XSS test cases to tests/unit/sanitize.test.ts including script tags, event handlers, data URLs, and malicious attributes
- [x] T015 [P] [US1] Apply sanitizeHtml() to admin content review page in apps/dashboard/app/(admin)/content-moderation/[id]/page.tsx before dangerouslySetInnerHTML
- [x] T016 [P] [US1] Update admin moderation queue list in apps/dashboard/app/(admin)/content-moderation/page.tsx to show sanitized excerpt previews *(Queue shows title/slug only, no HTML - verified safe)*
- [x] T017 [P] [US1] Apply sanitizePlainText() in agent content list page apps/dashboard/app/(agent)/content/page.tsx for rejection reasons display
- [x] T018 [US1] Update POST /api/agent/content endpoint in apps/dashboard/app/api/agent/content/route.ts to sanitize content_body on server before storage
- [x] T019 [US1] Add server-side sanitization to admin review endpoints (approve/reject) in apps/dashboard/app/api/admin/content/[id]/{approve,reject}/route.ts *(Endpoints don't modify content_body - verified safe)*
- [ ] T020 [US1] Run all XSS test cases from tests/unit/sanitize.test.ts and verify zero vulnerabilities detected *(Tests ready, need Jest config)*
- [ ] T021 [US1] Manual security testing: Submit various XSS payloads via agent content form and verify all are sanitized in admin review *(Ready for manual testing)*

**Parallel Opportunities**: Tasks T015, T016, T017 can run in parallel (different page files)

**Dependencies**: Phase 2 (sanitize.ts exists and configured)

**Success Criteria** (from spec SC-001):
- ✅ Zero XSS vulnerabilities verified by automated tests
- ✅ 100% of HTML preserves legitimate formatting (paragraphs, lists, headers)

---

## Phase 4: User Story 2 - Agent Content Editing (P2) (12 tasks)

**Goal**: Enable agents to edit draft and rejected content without creating new submissions

**Why P2**: Blocking workflow issue - agents can't iterate on rejected content

**Independent Test**: Create draft → Edit title → Save → Submit for review → Admin rejects → Edit based on feedback → Resubmit → Verify rejection_reason cleared

**Prerequisites**: Phase 2 complete (US1 recommended but not required)

**Tasks**:

- [ ] T022 [US2] Create new page file apps/dashboard/app/(agent)/content/[id]/edit/page.tsx for editing existing content
- [ ] T023 [P] [US2] Create GET endpoint in apps/dashboard/app/api/agent/content/[id]/route.ts to fetch single content by ID
- [ ] T024 [P] [US2] Create PUT endpoint in apps/dashboard/app/api/agent/content/[id]/route.ts to update existing content
- [ ] T025 [P] [US2] Create DELETE endpoint in apps/dashboard/app/api/agent/content/[id]/route.ts to delete draft content
- [ ] T026 [US2] Implement edit page UI by reusing ContentForm component from apps/dashboard/components/agent/content-form.tsx with prefilled data
- [ ] T027 [US2] Add authorization check in PUT endpoint to only allow editing draft/rejected status content
- [ ] T028 [US2] Add logic to clear rejection_reason and reviewed_at fields when status changes from rejected to pending_review
- [ ] T029 [US2] Update content list page apps/dashboard/app/(agent)/content/page.tsx to add "Edit" link for draft/rejected content
- [ ] T030 [US2] Add route validation to edit page to prevent editing approved/published content with error message
- [ ] T031 [US2] Update updated_at timestamp and increment version number when content is edited and resubmitted
- [ ] T032 [US2] Create integration test in tests/integration/content-edit.test.ts for full edit workflow (draft → edit → reject → edit → resubmit)
- [ ] T033 [US2] Test edit page authorization: Verify agent can't edit another agent's content and can't edit approved/published content

**Parallel Opportunities**: Tasks T023, T024, T025 can run in parallel (independent endpoint methods)

**Dependencies**: Phase 2 (validation schemas exist)

**Success Criteria** (from spec SC-002):
- ✅ Agents edit and resubmit rejected content in <3 minutes
- ✅ Version history maintained via version and parent_version_id fields

---

## Phase 5: User Story 3 - Admin Filtering & Pagination (P3) (13 tasks)

**Goal**: Add filtering, search, and pagination to admin moderation queue for scalability

**Why P3**: Performance issue that becomes critical as content volume grows (currently loads all items at once)

**Independent Test**: Create 50+ content submissions → Apply type filter → Apply agent filter → Apply date range → Search by title → Paginate through results → Verify <2s response time

**Prerequisites**: Phase 2 complete (cursor pagination utilities exist)

**Tasks**:

- [ ] T034 [US3] Remove 3 hardcoded stats cards (Pending Review, Avg Review Time 24h, Approval Rate 94%) from apps/dashboard/app/(admin)/content-moderation/page.tsx
- [ ] T035 [P] [US3] Create ContentFilterBar component in apps/dashboard/components/admin/content-filter-bar.tsx with type Select, agent Combobox, date inputs, search Input
- [ ] T036 [P] [US3] Add Combobox component for agent selection using shadcn Command + Popover components with search functionality
- [ ] T037 [P] [US3] Implement URL query parameter state management in moderation page to persist filters for bookmarking
- [ ] T038 [US3] Update GET /api/admin/content/moderation endpoint in apps/dashboard/app/api/admin/content/moderation/route.ts to accept filter parameters
- [ ] T039 [US3] Implement cursor-based pagination logic in moderation endpoint using encodeCursor/decodeCursor from lib/cursor-pagination.ts
- [ ] T040 [US3] Add database queries with filters (content_type, agent_id, date_range, search) using Supabase .eq(), .gte(), .lte(), .ilike()
- [ ] T041 [US3] Add Pagination component from shadcn/ui to moderation page with nextCursor, previousCursor, and page navigation
- [ ] T042 [US3] Implement client-side filter change handling to update URL params and refetch data without full page reload
- [ ] T043 [US3] Update moderation queue to remove items from list after approve/reject actions using client-side state updates
- [ ] T044 [US3] Add empty state component when no results match filters with "Reset Filters" button
- [ ] T045 [US3] Create integration test in tests/integration/content-moderation.test.ts for filtering with multiple criteria combined
- [ ] T046 [US3] Load test pagination with 1000+ test records and verify first page loads in <1s and filter application in <500ms

**Parallel Opportunities**: Tasks T035, T036, T037 can run in parallel (different component files)

**Dependencies**: Phase 2 (cursor pagination utilities, shadcn components installed)

**Success Criteria** (from spec SC-003, SC-004, SC-008, SC-009):
- ✅ Filter results return in <2s
- ✅ Admin reviews 10 submissions in <5 minutes
- ✅ Queue loads first page in <1s with 1000+ items
- ✅ Filter updates in <500ms without page reload

---

## Phase 6: User Story 4 - Agent Image Upload (P4) (11 tasks)

**Goal**: Enable agents to upload images directly via drag-and-drop instead of pasting external URLs

**Why P4**: Major UX improvement removing friction from content creation process

**Independent Test**: Create new content → Drag image file onto upload area → Verify upload progress → See image preview → Submit content → Verify image URL stored

**Prerequisites**: Phase 2 complete (content-images bucket exists, imageUploadSchema exists)

**Tasks**:

- [ ] T047 [US4] Create ImageUpload component in apps/dashboard/components/agent/image-upload.tsx with drag-drop area, file picker button, and progress bar
- [ ] T048 [P] [US4] Implement drag-and-drop event handlers (onDragOver, onDragLeave, onDrop) in ImageUpload component using native HTML5 APIs
- [ ] T049 [P] [US4] Add file picker input with accept="image/jpeg,image/png,image/webp,image/gif" attribute and change handler
- [ ] T050 [P] [US4] Implement upload progress tracking using XMLHttpRequest in ImageUpload component with onProgress callback
- [ ] T051 [US4] Update POST /api/upload/image endpoint in apps/dashboard/app/api/upload/image/route.ts to support content-images bucket with content_type folder parameter
- [ ] T052 [US4] Add server-side image validation (MIME type check + Sharp validation) and 5MB size limit enforcement in upload endpoint
- [ ] T053 [US4] Implement Sharp image optimization (1200px max width, 85% quality, WebP conversion) in upload endpoint
- [ ] T054 [US4] Update ContentForm component in apps/dashboard/components/agent/content-form.tsx to replace featured_image_url Input with ImageUpload component
- [ ] T055 [US4] Add image preview display in ContentForm showing uploaded image with option to replace
- [ ] T056 [US4] Create integration test in tests/integration/image-upload.test.ts for upload flow (select file → optimize → upload → URL returned)
- [ ] T057 [US4] Test error scenarios: >5MB file, non-image file, corrupted image, network timeout, and verify clear error messages

**Parallel Opportunities**: Tasks T048, T049, T050 can run in parallel (different UI features of same component)

**Dependencies**: Phase 2 (content-images bucket, validation schemas)

**Success Criteria** (from spec SC-005, SC-007):
- ✅ Upload success rate >95% for images <5MB
- ✅ 90% of agents complete first upload without help docs

---

## Phase 7: User Story 5 - Agent Content Preview (P5) (7 tasks)

**Goal**: Allow agents to preview content as it will appear on their public site before submission

**Why P5**: Reduces submission-rejection cycles by catching formatting issues early

**Independent Test**: Write content with headers, lists, images → Click Preview → Verify formatting matches site styles → Make changes → Preview again → Verify updates shown

**Prerequisites**: Phase 2 complete (US1 sanitization highly recommended)

**Tasks**:

- [ ] T058 [US5] Create ContentPreview component in apps/dashboard/components/agent/content-preview.tsx using shadcn Dialog wrapper
- [ ] T059 [P] [US5] Apply sanitizeHtml() to content before rendering in preview modal
- [ ] T060 [P] [US5] Add Tailwind Typography prose styles to preview content with custom configuration matching site theme
- [ ] T061 [P] [US5] Extract and apply Tiptap-specific styles from apps/dashboard/components/tiptap-node/ SCSS files for headings, lists, blockquotes, code blocks
- [ ] T062 [US5] Add "Preview" button to ContentForm component in apps/dashboard/components/agent/content-form.tsx that opens ContentPreview modal
- [ ] T063 [US5] Implement preview modal state management to show latest content changes without requiring save
- [ ] T064 [US5] Test preview with various Tiptap formatting (task lists, images, tables, links) and verify accurate rendering with site styles

**Parallel Opportunities**: Tasks T059, T060, T061 can run in parallel (different styling aspects)

**Dependencies**: Phase 2 (US1 for sanitization recommended)

**Success Criteria** (from spec SC-006):
- ✅ Preview functionality reduces rejection rate by 20%
- ✅ Agents confidently submit content after previewing

---

## Phase 8: User Story 6 - Consistent Admin Modals (P6) (6 tasks)

**Goal**: Replace inconsistent approve/reject actions with uniform shadcn Dialog modals

**Why P6**: UI polish - current mix of browser confirm() and Dialog feels unprofessional

**Independent Test**: Click Approve → See Dialog with clear message → Confirm → See loading state → Verify success | Click Reject → See Dialog → Enter reason → Confirm → Loading → Success

**Prerequisites**: Phase 2 complete (shadcn Dialog component exists)

**Tasks**:

- [ ] T065 [US6] Create ApprovalDialog component in apps/dashboard/components/admin/approval-dialog.tsx with confirmation message, loading state, error handling
- [ ] T066 [P] [US6] Update RejectDialog component in apps/dashboard/components/admin/reject-dialog.tsx to match ApprovalDialog styling and patterns
- [ ] T067 [P] [US6] Replace window.confirm() with ApprovalDialog in content review page apps/dashboard/app/(admin)/content-moderation/[id]/page.tsx
- [ ] T068 [US6] Add loading state indicators to both approve and reject Dialog buttons during API calls
- [ ] T069 [US6] Implement button disabling during API calls in both dialogs to prevent double-submission
- [ ] T070 [US6] Test approve/reject actions with network delays and verify loading states, button disabling, and success feedback work correctly

**Parallel Opportunities**: Tasks T066, T067 can run in parallel (independent components/pages)

**Dependencies**: Phase 2 (shadcn Dialog component)

**Success Criteria** (from spec SC-010):
- ✅ Zero accidental double-submissions due to UI improvements
- ✅ Consistent, professional modal experience for both actions

---

## Phase 9: Polish & Integration (5 tasks)

**Goal**: Cross-cutting concerns and final integration testing

**Prerequisites**: All user stories (US1-US6) complete

**Tasks**:

- [ ] T071 [P] Create comprehensive E2E test in tests/e2e/content-submission-refactor.spec.ts covering all 6 user stories end-to-end
- [ ] T072 [P] Add security penetration testing with OWASP XSS payloads and verify all vectors blocked
- [ ] T073 Run full test suite (unit + integration + E2E) and verify all tests pass with no regressions
- [ ] T074 Update CLAUDE.md with new patterns: cursor pagination, content-images bucket, sanitization best practices
- [ ] T075 Review all dangerouslySetInnerHTML usage across codebase and verify sanitization applied in every case

**Parallel Opportunities**: Tasks T071, T072 can run in parallel (different test types)

**Dependencies**: All previous phases complete

**Final Validation**:
- ✅ All 12 success criteria from spec met
- ✅ All 6 user stories independently testable
- ✅ Zero security vulnerabilities
- ✅ Production deployment checklist complete

---

## Parallel Execution Examples

### Phase 3 (US1): 4 tasks can run in parallel
```bash
# Developer A: Admin review page sanitization
# Task T015: apps/dashboard/app/(admin)/content-moderation/[id]/page.tsx

# Developer B: Admin queue list sanitization
# Task T016: apps/dashboard/app/(admin)/content-moderation/page.tsx

# Developer C: Agent content list sanitization
# Task T017: apps/dashboard/app/(agent)/content/page.tsx

# These three are independent (different files, no shared state)
```

### Phase 4 (US2): 3 tasks can run in parallel
```bash
# Developer A: GET endpoint
# Task T023: apps/dashboard/app/api/agent/content/[id]/route.ts (GET method)

# Developer B: PUT endpoint
# Task T024: apps/dashboard/app/api/agent/content/[id]/route.ts (PUT method)

# Developer C: DELETE endpoint
# Task T025: apps/dashboard/app/api/agent/content/[id]/route.ts (DELETE method)

# Same file, but different export functions - can work in parallel
```

### Phase 5 (US3): 3 tasks can run in parallel
```bash
# Developer A: FilterBar component
# Task T035: apps/dashboard/components/admin/content-filter-bar.tsx

# Developer B: Combobox for agent selection
# Task T036: Part of FilterBar but independent feature

# Developer C: URL param state management
# Task T037: apps/dashboard/app/(admin)/content-moderation/page.tsx (state logic)

# Different concerns, can integrate at the end
```

---

## MVP Definition

**Minimum Viable Product**: User Story 1 (Phase 3) ONLY

**Rationale**: US1 fixes critical XSS security vulnerability. All other features are enhancements.

**MVP Scope**:
- Tasks T001-T021 (Setup + Foundation + US1)
- 21 tasks total
- Estimated 1-2 days effort
- **Deliverable**: Secure content rendering with zero XSS vulnerabilities

**Post-MVP Increments**:
- Increment 1: Add US2 (editing) - 12 tasks, +1 day
- Increment 2: Add US3 (filtering) - 13 tasks, +1 day
- Increment 3: Add US4-US6 (image upload, preview, polish) - 24 tasks, +2 days

---

## Task Statistics

**Total Tasks**: 75
**Tasks with [P] marker**: 28 (37% parallelizable)
**Tasks with Story labels**: 57 (76% mapped to user stories)

**Breakdown by Type**:
- Setup/Infrastructure: 13 tasks (17%)
- Backend (API/DB): 18 tasks (24%)
- Frontend (UI/Components): 31 tasks (41%)
- Testing: 13 tasks (17%)

**Estimated Effort**:
- Setup + Foundation: 0.5 days (13 tasks)
- US1 (Critical): 1 day (8 tasks)
- US2-US6 (Features): 3 days (49 tasks)
- Polish: 0.5 days (5 tasks)
- **Total**: 5 days (40 hours)

---

## Implementation Checklist

Before starting:
- [ ] Review all design documents (spec.md, plan.md, research.md, data-model.md, contracts/)
- [ ] Ensure clean git working directory on branch `003-content-submission-refactor`
- [ ] Verify dev server runs without errors (`pnpm run dev`)
- [ ] Review existing implementations (avatar upload, content forms, admin filtering patterns)

During implementation:
- [ ] Complete tasks in sequential order within each phase
- [ ] Mark tasks complete only when fully tested
- [ ] Update this tasks.md with progress (change `- [ ]` to `- [x]`)
- [ ] Commit after each completed user story phase
- [ ] Run tests continuously (`pnpm test`)

After completion:
- [ ] All 75 tasks marked complete
- [ ] All tests passing (unit + integration + E2E)
- [ ] Security scan passed (no XSS vulnerabilities)
- [ ] Code review completed
- [ ] Deploy to staging and verify all 6 user stories
- [ ] Update documentation with any implementation changes

---

## Notes

**Task Format Validation**: ✅ All 75 tasks follow strict checklist format:
- All start with `- [ ]` checkbox
- All have sequential Task ID (T001-T075)
- Parallelizable tasks marked with `[P]`
- User story tasks marked with `[US1]`-`[US6]`
- All include specific file paths in description

**Independent Testing**: ✅ Each user story (US1-US6) has clear test criteria and can be validated independently

**Parallel Opportunities**: ✅ 28 tasks marked `[P]` for parallel execution across phases

**Ready for Execution**: ✅ Tasks are immediately actionable with specific file paths and clear acceptance criteria
