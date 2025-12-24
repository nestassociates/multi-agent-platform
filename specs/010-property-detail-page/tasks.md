# Tasks: Property Detail Page

**Input**: Design documents from `/specs/010-property-detail-page/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks included - not explicitly requested in spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Main-site app**: `apps/main-site/src/`
- **Dashboard API**: `apps/dashboard/app/api/`
- **Shared types**: `apps/main-site/src/lib/api/types.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [x] T001 Add mapbox-gl and @types/mapbox-gl to apps/main-site/package.json
- [x] T002 [P] Add NEXT_PUBLIC_MAPBOX_TOKEN to apps/main-site/.env.example
- [x] T003 [P] Extend Property type in apps/main-site/src/lib/api/types.ts with EPC, utilities, extended specs fields
- [x] T004 [P] Add shadcn accordion component to apps/main-site/src/components/ui/accordion.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API endpoint and type infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create GET /api/public/properties/[slug]/route.ts in apps/dashboard/app/api/public/properties/[slug]/route.ts
- [x] T006 Implement property detail response transformation with EPC, utilities from raw_data in apps/dashboard/app/api/public/properties/[slug]/route.ts
- [x] T007 Update getPropertyBySlug function to use new endpoint in apps/main-site/src/lib/api/dashboard.ts
- [x] T008 Add getAgentOtherProperties function in apps/main-site/src/lib/api/dashboard.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Property Details (Priority: P1) MVP

**Goal**: Users can view comprehensive property information including photos, price, features, and location

**Independent Test**: Navigate to any property URL and verify all property information displays correctly across all screen sizes

### Implementation for User Story 1

- [x] T009 [US1] Create PropertyStats component (5-column grid with icons) in apps/main-site/src/components/property/PropertyStats.tsx
- [x] T010 [P] [US1] Create PropertyDescription component (expandable text) in apps/main-site/src/components/property/PropertyDescription.tsx
- [x] T011 [P] [US1] Create PropertyDetails component (4-column grid) in apps/main-site/src/components/property/PropertyDetails.tsx
- [x] T012 [US1] Update property detail page layout with new components in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T013 [US1] Implement SOLD badge overlay logic (sold/let_agreed status) in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T014 [US1] Implement responsive grid layouts (mobile/tablet/desktop) in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T015 [US1] Add skeleton loaders for property content in apps/main-site/src/app/(frontend)/property/[slug]/loading.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Browse Property Images (Priority: P1)

**Goal**: Users can view all property images with synchronized carousel navigation

**Independent Test**: Interact with image gallery carousel and verify all images display and sync correctly

### Implementation for User Story 2

- [x] T016 [US2] Enhance PropertyGallery with stacked thumbnails layout (desktop) in apps/main-site/src/components/property/PropertyGallery.tsx
- [x] T017 [US2] Implement thumbnail sync - clicking thumbnail updates main image and all thumbnails in apps/main-site/src/components/property/PropertyGallery.tsx
- [x] T018 [US2] Implement carousel navigation arrow sync with thumbnails in apps/main-site/src/components/property/PropertyGallery.tsx
- [x] T019 [US2] Add mobile swipe navigation with touch events in apps/main-site/src/components/property/PropertyGallery.tsx
- [x] T020 [US2] Handle edge cases: 1 image (hide arrows), 2 images (adapt grid), 0 images (placeholder) in apps/main-site/src/components/property/PropertyGallery.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Contact Agent for Viewing (Priority: P1)

**Goal**: Users can request a viewing by completing a validated contact form

**Independent Test**: Complete and submit viewing request form and verify submission success

### Implementation for User Story 3

- [x] T021 [US3] Create ViewingRequestForm component with React Hook Form + Zod in apps/main-site/src/components/property/ViewingRequestForm.tsx
- [x] T022 [US3] Implement form fields: firstName, surname, email, phone, propertyToSell, propertyToLet dropdowns in apps/main-site/src/components/property/ViewingRequestForm.tsx
- [x] T023 [US3] Implement form validation with error display in apps/main-site/src/components/property/ViewingRequestForm.tsx
- [x] T024 [US3] Implement form submission to existing /api/public/viewing-request endpoint in apps/main-site/src/components/property/ViewingRequestForm.tsx
- [x] T025 [US3] Add success confirmation and loading states in apps/main-site/src/components/property/ViewingRequestForm.tsx
- [x] T026 [US3] Implement CTA button scroll-to-form functionality in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T027 [US3] Add honeypot field for bot detection in apps/main-site/src/components/property/ViewingRequestForm.tsx

**Checkpoint**: At this point, all P1 user stories (1, 2, 3) should be fully functional - MVP complete

---

## Phase 6: User Story 4 - View Agent Information (Priority: P2)

**Goal**: Users can see agent details and contact them directly

**Independent Test**: Verify agent information displays correctly and contact actions work

### Implementation for User Story 4

- [x] T028 [US4] Create AgentCard component with name, phone, avatar, social icons in apps/main-site/src/components/property/AgentCard.tsx
- [x] T029 [US4] Implement tel: link for phone number in apps/main-site/src/components/property/AgentCard.tsx
- [x] T030 [P] [US4] Implement social media icon links (Instagram, Facebook, LinkedIn) in apps/main-site/src/components/property/AgentCard.tsx
- [x] T031 [US4] Add mobile agent info section with responsive layout in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T032 [US4] Add desktop sidebar agent card with sticky positioning in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx

**Checkpoint**: At this point, User Story 4 should work independently

---

## Phase 7: User Story 5 - View Property Specifications (Priority: P2)

**Goal**: Users can view detailed property specs in collapsible accordions

**Independent Test**: Expand each accordion section and verify content displays correctly

### Implementation for User Story 5

- [x] T033 [US5] Create PropertyAccordions component with 3 sections in apps/main-site/src/components/property/PropertyAccordions.tsx
- [x] T034 [US5] Implement Floor Plan accordion with image display in apps/main-site/src/components/property/PropertyAccordions.tsx
- [x] T035 [US5] Implement Utilities/Rights accordion with two-column list in apps/main-site/src/components/property/PropertyAccordions.tsx
- [x] T036 [US5] Implement EPC accordion with efficiency rating charts in apps/main-site/src/components/property/PropertyAccordions.tsx
- [x] T037 [US5] Hide accordion sections when data is unavailable in apps/main-site/src/components/property/PropertyAccordions.tsx
- [x] T038 [US5] Implement accordion open/close animation with chevron rotation in apps/main-site/src/components/property/PropertyAccordions.tsx

**Checkpoint**: At this point, User Story 5 should work independently

---

## Phase 8: User Story 6 - View Property Location on Map (Priority: P2)

**Goal**: Users can see property location on an interactive map

**Independent Test**: Verify map loads with correct property location marker

### Implementation for User Story 6

- [x] T039 [US6] Create PropertyMap component with Mapbox GL in apps/main-site/src/components/property/PropertyMap.tsx
- [x] T040 [US6] Implement greyscale map style in apps/main-site/src/components/property/PropertyMap.tsx
- [x] T041 [US6] Add custom marker at property coordinates in apps/main-site/src/components/property/PropertyMap.tsx
- [x] T042 [US6] Implement zoom and pan controls in apps/main-site/src/components/property/PropertyMap.tsx
- [x] T043 [US6] Handle missing coordinates - hide map section in apps/main-site/src/components/property/PropertyMap.tsx
- [x] T044 [US6] Import Mapbox CSS in apps/main-site/src/components/property/PropertyMap.tsx (inline import)

**Checkpoint**: At this point, User Story 6 should work independently

---

## Phase 9: User Story 7 - Browse Agent's Other Properties (Priority: P2)

**Goal**: Users can browse other properties from the same agent in a carousel

**Independent Test**: Verify carousel shows other properties from same agent with working navigation

### Implementation for User Story 7

- [x] T045 [US7] Create carousel component (or add shadcn carousel) in apps/main-site/src/components/ui/carousel.tsx
- [x] T046 [US7] Create AgentOtherProperties component in apps/main-site/src/components/property/AgentOtherProperties.tsx
- [x] T047 [US7] Implement API fetch for agent's other properties (excluding current) in apps/main-site/src/components/property/AgentOtherProperties.tsx
- [x] T048 [US7] Display section title as "[Agent First Name]'S OTHER PROPERTIES" in apps/main-site/src/components/property/AgentOtherProperties.tsx
- [x] T049 [US7] Implement carousel navigation arrows in apps/main-site/src/components/property/AgentOtherProperties.tsx
- [x] T050 [US7] Add property cards with click navigation to detail pages in apps/main-site/src/components/property/AgentOtherProperties.tsx
- [x] T051 [US7] Hide section when agent has only one property in apps/main-site/src/components/property/AgentOtherProperties.tsx

**Checkpoint**: At this point, User Story 7 should work independently

---

## Phase 10: User Story 8 - Read Agent Reviews (Priority: P3)

**Goal**: Users can read reviews about the listing agent

**Independent Test**: Verify reviews section displays agent's Google reviews correctly

### Implementation for User Story 8

- [x] T052 [US8] Create AgentReviews component with GMB integration in apps/main-site/src/components/property/AgentReviews.tsx
- [x] T053 [US8] Implement link to agent's Google Business Profile in apps/main-site/src/components/property/AgentReviews.tsx
- [x] T054 [US8] Hide reviews section when agent has no google_place_id in apps/main-site/src/components/property/AgentReviews.tsx

**Checkpoint**: At this point, User Story 8 should work independently

---

## Phase 11: User Story 9 - Share Property (Priority: P3)

**Goal**: Users can share property via social media or direct link

**Independent Test**: Click share icon and verify dropdown options work

### Implementation for User Story 9

- [x] T055 [US9] Create ShareDropdown component with dropdown menu in apps/main-site/src/components/property/ShareDropdown.tsx
- [x] T056 [US9] Implement "Copy Link" with clipboard API and confirmation toast in apps/main-site/src/components/property/ShareDropdown.tsx
- [x] T057 [US9] Implement social share links (Facebook, Twitter, WhatsApp) in apps/main-site/src/components/property/ShareDropdown.tsx
- [x] T058 [US9] Add share button to property detail page header in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx

**Checkpoint**: At this point, User Story 9 should work independently

---

## Phase 12: User Story 10 - View Video Tour (Priority: P3)

**Goal**: Users can access video tour of the property

**Independent Test**: Click video tour icon and verify external link opens

### Implementation for User Story 10

- [x] T059 [US10] Add video tour icon button (conditional on virtual_tour_url) in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T060 [US10] Implement open in new tab for Instagram video URLs in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [x] T061 [US10] Hide video icon when virtual_tour_url is null in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx

**Checkpoint**: At this point, all user stories should be independently functional

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [ ] T062 [P] Review all components for WCAG 2.1 AA accessibility compliance in apps/main-site/src/components/property/
- [ ] T063 [P] Add aria-labels and keyboard navigation to all interactive elements in apps/main-site/src/components/property/
- [ ] T064 [P] Optimize images with proper sizes attribute across all property components
- [ ] T065 Performance audit - ensure page load under 3s goal
- [x] T066 [P] Add export statements to apps/main-site/src/components/property/index.ts
- [ ] T067 Run Lighthouse audit and address any issues
- [ ] T068 Validate all responsive breakpoints (mobile, tablet, desktop)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-12)**: All depend on Foundational phase completion
  - P1 stories (US1, US2, US3) should complete first for MVP
  - P2 stories (US4, US5, US6, US7) can proceed in parallel after P1
  - P3 stories (US8, US9, US10) can proceed in parallel after P2
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Can Start After | Dependencies |
|-------|----------|-----------------|--------------|
| US1 - View Property Details | P1 | Phase 2 | None |
| US2 - Browse Property Images | P1 | Phase 2 | None |
| US3 - Contact Agent for Viewing | P1 | Phase 2 | None |
| US4 - View Agent Information | P2 | Phase 2 | None |
| US5 - View Property Specifications | P2 | Phase 2 | None |
| US6 - View Property Location | P2 | Phase 2 | T001, T002 (Mapbox) |
| US7 - Agent's Other Properties | P2 | Phase 2 | T008, T045 |
| US8 - Read Agent Reviews | P3 | Phase 2 | None |
| US9 - Share Property | P3 | Phase 2 | None |
| US10 - View Video Tour | P3 | Phase 2 | None |

### Within Each User Story

- Models/types before components
- Components before page integration
- Core functionality before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks run sequentially (API dependency chain)
- Once Foundational phase completes, all user stories can start in parallel
- Within stories, tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch these in parallel:
Task T009: "Create PropertyStats component in apps/main-site/src/components/property/PropertyStats.tsx"
Task T010: "Create PropertyDescription component in apps/main-site/src/components/property/PropertyDescription.tsx"
Task T011: "Create PropertyDetails component in apps/main-site/src/components/property/PropertyDetails.tsx"

# Then sequentially:
Task T012: "Update property detail page layout with new components"
Task T013: "Implement SOLD badge overlay logic"
Task T014: "Implement responsive grid layouts"
Task T015: "Add skeleton loaders"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (View Property Details)
4. Complete Phase 4: User Story 2 (Browse Property Images)
5. Complete Phase 5: User Story 3 (Contact Agent for Viewing)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready - **This is the MVP**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add P1 Stories (US1, US2, US3) → Test independently → Deploy/Demo (MVP!)
3. Add P2 Stories (US4, US5, US6, US7) → Test independently → Deploy/Demo
4. Add P3 Stories (US8, US9, US10) → Test independently → Deploy/Demo
5. Polish phase → Final deployment
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + 4
   - Developer B: User Story 2 + 5
   - Developer C: User Story 3 + 6 + 7
3. Stories complete and integrate independently

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 68 |
| **Setup Tasks** | 4 |
| **Foundational Tasks** | 4 |
| **User Story Tasks** | 53 |
| **Polish Tasks** | 7 |
| **P1 (MVP) Tasks** | 19 |
| **P2 Tasks** | 24 |
| **P3 Tasks** | 10 |
| **Parallel Opportunities** | 23 tasks marked [P] |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP scope = Phase 1 + Phase 2 + User Stories 1, 2, 3 (Tasks T001-T027)
