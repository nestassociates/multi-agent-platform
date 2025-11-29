# Tasks: Astro Agent Microsite Deployment System

**Input**: Design documents from `/specs/006-astro-microsite-deployment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested - tests are NOT included in this task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**IMPORTANT**: Astro template tasks (Phase 7) are BLOCKED waiting for Figma designs from external designer. Backend phases (1-6) can proceed immediately.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Turborepo monorepo structure:
- **Dashboard app**: `apps/dashboard/`
- **Agent site app**: `apps/agent-site/` (⏸️ BLOCKED ON FIGMA)
- **Build system package**: `packages/build-system/`
- **Validation package**: `packages/validation/`
- **Shared types package**: `packages/shared-types/`

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Validation schemas and type definitions used across multiple user stories

- [x] T001 [P] Create contact form validation schema in packages/validation/src/contact.ts
- [x] T002 [P] Create global content validation schemas (header, footer, legal) in packages/validation/src/global-content.ts
- [x] T003 [P] Add SectionVisibility and NavItem interfaces to packages/build-system/src/types.ts
- [x] T004 [P] Add PublicProperty and PublicPropertyResponse types to packages/shared-types/src/entities.ts
- [x] T005 [P] Add ContactFormRequest and ContactFormResponse types to packages/shared-types/src/entities.ts
- [x] T006 Export new validation schemas from packages/validation/src/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement determineSectionVisibility() function in packages/build-system/src/data-generator.ts
- [x] T008 Implement generateNavigation() function in packages/build-system/src/data-generator.ts
- [x] T009 Update AgentSiteData interface to include sections and navigation in packages/build-system/src/types.ts
- [x] T010 Remove properties from AgentSiteData (properties are fetched at runtime) in packages/build-system/src/data-generator.ts
- [x] T011 Implement queueGlobalContentRebuild() function in packages/build-system/src/queue.ts
- [x] T012 Seed global_content table with default values if empty (header, footer, legal pages) via Supabase migration or seed script

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent Site Visitor Views Property Listings (Priority: P1) 🎯 MVP ✅

**Goal**: Visitors can browse properties on agent microsites with filtering and pagination. Properties are fetched client-side for freshness.

**Independent Test**: Load an agent's property page, verify properties display with photos, price, bedrooms. Filter by marketing type. Refresh to see new properties without rebuild.

### Implementation for User Story 1

- [x] T013 [P] [US1] Create public properties API route at apps/dashboard/app/api/public/agents/[id]/properties/route.ts
- [x] T014 [US1] Implement agent validation (exists, is active) in properties route
- [x] T015 [US1] Implement property query with marketing_type filter in properties route
- [x] T016 [US1] Implement cursor-based pagination for properties endpoint
- [x] T017 [US1] Add Cache-Control headers (5 min) and ETag support to properties response
- [x] T018 [P] [US1] Create public agent info API route at apps/dashboard/app/api/public/agents/[id]/info/route.ts
- [x] T019 [US1] Return only public-safe fields (id, name, avatarUrl, phone, subdomain) from agent info endpoint

**Checkpoint**: User Story 1 complete - properties API ready for client-side fetching

---

## Phase 4: User Story 2 - Agent Content Gets Published to Their Site (Priority: P1) ✅

**Goal**: When content is approved, agent site automatically rebuilds with new blog posts/area guides. Navigation shows/hides based on content availability.

**Independent Test**: Create a blog post, approve it, verify rebuild is queued with correct priority. Verify navigation reflects content availability in generated data.

### Implementation for User Story 2

- [x] T020 [US2] Update generateAgentSiteData() to call determineSectionVisibility() in packages/build-system/src/data-generator.ts
- [x] T021 [US2] Update generateAgentSiteData() to call generateNavigation() and include in output
- [x] T022 [US2] Ensure content approval workflow queues rebuild with priority 3 (Normal) - verify in existing content approval API (uses priority 2/High which is appropriate)
- [x] T023 [US2] Verify blog posts with status='approved' are included in generated data
- [x] T024 [US2] Verify area guides with status='approved' are included in generated data
- [x] T025 [US2] Verify sections.blog is true only when approved blog posts exist
- [x] T026 [US2] Verify sections.areaGuides is true only when approved area guides exist

**Checkpoint**: User Story 2 complete - content publishing triggers rebuilds with correct visibility

---

## Phase 5: User Story 3 - Admin Manages Global Site Content (Priority: P2)

**Goal**: Admins can edit header, footer, and legal pages. Publishing triggers rebuilds for ALL active agents.

**Independent Test**: Edit footer content as admin, publish it, verify rebuild jobs queued for all active agents with emergency priority.

### Implementation for User Story 3

- [x] T027 [P] [US3] Create global content list API at apps/dashboard/app/api/admin/global-content/route.ts (GET)
- [x] T028 [P] [US3] Create global content type API at apps/dashboard/app/api/admin/global-content/[type]/route.ts (GET, PUT)
- [x] T029 [US3] Implement admin authentication check in global content API routes
- [x] T030 [US3] Implement Zod validation for header, footer, and legal content schemas in update endpoint
- [x] T031 [US3] Create publish endpoint at apps/dashboard/app/api/admin/global-content/[type]/publish/route.ts
- [x] T032 [US3] Call queueGlobalContentRebuild() on publish to queue all active agents with priority 1
- [x] T033 [P] [US3] Create GlobalContentList component at apps/dashboard/components/admin/global-content-list.tsx
- [x] T034 [P] [US3] Create GlobalContentEditor component at apps/dashboard/components/admin/global-content-editor.tsx
- [x] T035 [US3] Create global content list page at apps/dashboard/app/(admin)/global-content/page.tsx
- [x] T036 [US3] Create global content edit page at apps/dashboard/app/(admin)/global-content/[type]/page.tsx
- [x] T037 [US3] Implement TipTap editor for legal page HTML editing in GlobalContentEditor
- [x] T038 [US3] Implement structured form for header/footer editing in GlobalContentEditor
- [x] T039 [US3] Add publish confirmation dialog with rebuild count warning
- [x] T040 [US3] Add global content link to admin navigation sidebar

**Checkpoint**: User Story 3 complete - admins can manage and publish global content

---

## Phase 6: User Story 4 - Site Visitor Contacts Agent (Priority: P2)

**Goal**: Visitors can submit contact forms from agent microsites. Submissions are stored and agents are notified via email.

**Independent Test**: Submit a contact form with valid data, verify submission stored in database and email sent to agent.

### Implementation for User Story 4

- [x] T041 [P] [US4] Create contact form API route at apps/dashboard/app/api/public/contact/route.ts
- [x] T042 [US4] Implement CORS validation for agent site subdomains
- [x] T043 [US4] Implement Zod validation using contactFormSchema
- [x] T044 [US4] Implement honeypot bot detection (reject if honeypot field not empty)
- [x] T045 [US4] Implement rate limiting (5 submissions per IP per hour)
- [x] T046 [US4] Implement HTML sanitization for message content
- [x] T047 [US4] Insert valid submission into contact_form_submissions table
- [x] T048 [P] [US4] Create ContactNotificationEmail React component at packages/email/templates/contact-notification.tsx
- [x] T049 [US4] Send notification email to agent via Resend after successful submission
- [x] T050 [US4] Return appropriate error responses (400, 403, 404, 429) per contract

**Checkpoint**: User Story 4 complete - contact form submissions working end-to-end

---

## Phase 7: User Story 5 - Agent Profile and Fees Display (Priority: P3)

**Goal**: Agent profile, bio, qualifications, and fee structure display on their microsite. Changes trigger rebuilds.

**Independent Test**: Update agent fees in dashboard, verify rebuild queued with correct priority. Verify sections.fees reflects fee content availability.

### Implementation for User Story 5

- [x] T051 [US5] Verify profile update triggers rebuild with priority 4 (Low) in existing profile API
- [x] T052 [US5] Verify fees update triggers rebuild with priority 4 (Low) in existing fees API
- [x] T053 [US5] Verify sections.fees is true only when agent has fee structure content
- [x] T054 [US5] Verify sections.reviews is true only when profile has google_place_id
- [x] T055 [US5] Include agent fees HTML in generated AgentSiteData content

**Checkpoint**: User Story 5 complete - profile and fees data included in site generation

---

## Phase 8: Astro Templates (⏸️ BLOCKED ON FIGMA)

**Purpose**: Astro page templates and components for agent microsites

**⚠️ BLOCKED**: Waiting for Figma design templates from external designer. These tasks cannot start until designs arrive.

### Astro Site Infrastructure (when unblocked)

- [ ] T056 [P] Create site data loader at apps/agent-site/src/lib/data.ts
- [ ] T057 [P] Create GlobalHeader component at apps/agent-site/src/components/GlobalHeader.astro
- [ ] T058 [P] Create GlobalFooter component at apps/agent-site/src/components/GlobalFooter.astro
- [ ] T059 [P] Create Navigation component at apps/agent-site/src/components/Navigation.astro
- [ ] T060 Create BaseLayout at apps/agent-site/src/layouts/BaseLayout.astro

### Astro Pages (when unblocked)

- [ ] T061 [P] Create homepage at apps/agent-site/src/pages/index.astro
- [ ] T062 [P] Create about page at apps/agent-site/src/pages/about.astro
- [ ] T063 [P] Create services page at apps/agent-site/src/pages/services.astro
- [ ] T064 [P] Create contact page at apps/agent-site/src/pages/contact.astro
- [ ] T065 Create PropertyList React component at apps/agent-site/src/components/PropertyList.tsx (client-side fetch)
- [ ] T066 Create properties page at apps/agent-site/src/pages/properties/index.astro
- [ ] T067 Create blog index page (conditional) at apps/agent-site/src/pages/blog/index.astro
- [ ] T068 Create blog post page at apps/agent-site/src/pages/blog/[slug].astro
- [ ] T069 Create area guides index page (conditional) at apps/agent-site/src/pages/areas/index.astro
- [ ] T070 Create area guide page at apps/agent-site/src/pages/areas/[slug].astro
- [ ] T071 Create reviews page (conditional) at apps/agent-site/src/pages/reviews.astro
- [ ] T072 Create fees page (conditional) at apps/agent-site/src/pages/fees.astro
- [ ] T073 [P] Create privacy page at apps/agent-site/src/pages/privacy.astro
- [ ] T074 [P] Create terms page at apps/agent-site/src/pages/terms.astro
- [ ] T075 [P] Create cookies page at apps/agent-site/src/pages/cookies.astro

### Conditional Page Generation (when unblocked)

- [ ] T076 Implement getStaticPaths() in blog pages to skip generation when no approved posts
- [ ] T077 Implement getStaticPaths() in area guide pages to skip generation when no approved guides
- [ ] T078 Implement getStaticPaths() in reviews page to skip generation when no google_place_id
- [ ] T079 Implement getStaticPaths() in fees page to skip generation when no fee content

**Checkpoint**: Astro templates complete - sites ready for deployment

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T080 Add rate limiting middleware for all public API endpoints
- [ ] T081 Add comprehensive error logging for build queue operations
- [ ] T082 Add admin notification when build fails
- [ ] T083 Verify global content seed data exists in production database
- [ ] T084 Run quickstart.md validation scenarios
- [ ] T085 Update CLAUDE.md with feature-specific guidelines if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5)
- **Astro Templates (Phase 8)**: BLOCKED on Figma designs - independent of backend phases
- **Polish (Phase 9)**: Depends on backend user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Public properties API
- **User Story 2 (P1)**: Can start after Foundational - Data generator enhancements
- **User Story 3 (P2)**: Can start after Foundational - Global content admin
- **User Story 4 (P2)**: Can start after Foundational - Contact form API
- **User Story 5 (P3)**: Can start after Foundational - Profile/fees visibility

### Within Each User Story

- API routes before UI components
- Validation before business logic
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (all parallel)**:
```
T001, T002, T003, T004, T005 can run in parallel
T006 depends on T001-T005
```

**Phase 3 (US1)**:
```
T013, T018 can run in parallel (different endpoints)
```

**Phase 5 (US3)**:
```
T027, T028 can run in parallel (different endpoints)
T033, T034 can run in parallel (different components)
```

**Phase 8 (when unblocked)**:
```
T056-T059 (components) can run in parallel
T061-T064 (core pages) can run in parallel
T073-T075 (legal pages) can run in parallel
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all validation schemas together:
Task T001: "Create contact form validation schema in packages/validation/src/contact.ts"
Task T002: "Create global content validation schemas in packages/validation/src/global-content.ts"

# Launch all type definitions together:
Task T003: "Add SectionVisibility and NavItem interfaces to packages/build-system/src/types.ts"
Task T004: "Add PublicProperty types to packages/shared-types/src/entities.ts"
Task T005: "Add ContactForm types to packages/shared-types/src/entities.ts"
```

---

## Implementation Strategy

### MVP First (Backend Only - No Figma Dependency)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T012)
3. Complete Phase 3: User Story 1 - Properties API (T013-T019)
4. **STOP and VALIDATE**: Test properties API independently
5. Deploy backend - MVP ready!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 (Properties) → Test → Deploy
3. Add User Story 2 (Content Publishing) → Test → Deploy
4. Add User Story 3 (Global Content Admin) → Test → Deploy
5. Add User Story 4 (Contact Form) → Test → Deploy
6. Add User Story 5 (Profile/Fees) → Test → Deploy
7. **WAIT for Figma** → Phase 8: Astro Templates
8. Final integration and polish

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 2 (core data pipeline)
   - Developer B: User Story 3 (global content admin UI)
   - Developer C: User Story 4 (contact form)
3. User Story 5 is small - can be picked up by anyone
4. Phase 8 (Astro) requires designer input first

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Astro templates (Phase 8) are BLOCKED** until Figma designs arrive
- Backend phases (1-7) can proceed immediately
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

| Phase | Tasks | Parallel | Status |
|-------|-------|----------|--------|
| Phase 1: Setup | T001-T006 (6) | 5 of 6 | Ready |
| Phase 2: Foundational | T007-T012 (6) | 0 of 6 | Ready |
| Phase 3: US1 Properties | T013-T019 (7) | 2 of 7 | Ready |
| Phase 4: US2 Content | T020-T026 (7) | 0 of 7 | Ready |
| Phase 5: US3 Global | T027-T040 (14) | 4 of 14 | Ready |
| Phase 6: US4 Contact | T041-T050 (10) | 2 of 10 | Ready |
| Phase 7: US5 Profile | T051-T055 (5) | 0 of 5 | Ready |
| Phase 8: Astro | T056-T079 (24) | 12 of 24 | ⏸️ BLOCKED |
| Phase 9: Polish | T080-T085 (6) | 0 of 6 | After backend |

**Total Tasks**: 85
**Backend Tasks (can start now)**: 55
**Blocked Tasks (Astro)**: 24
**Polish Tasks**: 6
