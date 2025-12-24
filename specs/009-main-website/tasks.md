# Tasks: Nest Associates Main Website

**Input**: Design documents from `/specs/009-main-website/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests NOT explicitly requested - focus on implementation tasks only.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo app**: `apps/main-site/src/`
- **Components**: `apps/main-site/src/components/`
- **Collections**: `apps/main-site/src/collections/`
- **Lib**: `apps/main-site/src/lib/`
- **App routes**: `apps/main-site/src/app/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js 15 project with Payload CMS 3.0, configure tooling

- [ ] T001 Create Next.js 15 project at apps/main-site/ with App Router and TypeScript
- [ ] T002 Install Payload CMS 3.0 dependencies (@payloadcms/next, @payloadcms/db-postgres, @payloadcms/richtext-lexical)
- [ ] T003 [P] Install UI dependencies (tailwindcss, clsx, class-variance-authority, tailwind-merge, lucide-react)
- [ ] T004 [P] Install form dependencies (react-hook-form, @hookform/resolvers, zod)
- [ ] T005 [P] Configure Tailwind CSS in apps/main-site/tailwind.config.ts
- [ ] T006 [P] Configure TypeScript in apps/main-site/tsconfig.json
- [ ] T007 [P] Create .env.local template in apps/main-site/.env.example
- [ ] T008 Configure next.config.mjs with Payload integration in apps/main-site/next.config.mjs
- [ ] T009 Create base layout with globals.css in apps/main-site/src/app/layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**Checkpoint**: No user story work can begin until this phase is complete

### Payload CMS Core Setup

- [ ] T010 Create Payload config with PostgreSQL adapter in apps/main-site/src/payload.config.ts
- [ ] T011 Create Users collection with admin/editor roles in apps/main-site/src/collections/Users.ts
- [ ] T012 [P] Create Media collection with image sizes in apps/main-site/src/collections/Media.ts
- [ ] T013 Create Payload admin route group at apps/main-site/src/app/(payload)/admin/[[...segments]]/page.tsx
- [ ] T014 Create Payload API routes at apps/main-site/src/app/(payload)/api/[...slug]/route.ts
- [ ] T015 Run Payload migrations to create payload schema in Supabase

### Dashboard API Client

- [ ] T016 Create Dashboard API client types in apps/main-site/src/lib/api/types.ts
- [ ] T017 Create getProperties function in apps/main-site/src/lib/api/dashboard.ts
- [ ] T018 Create getAgents function in apps/main-site/src/lib/api/dashboard.ts
- [ ] T019 Create getAgentById function in apps/main-site/src/lib/api/dashboard.ts
- [ ] T020 Create getPropertyBySlug function in apps/main-site/src/lib/api/dashboard.ts

### Apex27 CRM Client

- [ ] T021 Create Apex27 types in apps/main-site/src/lib/apex27/types.ts
- [ ] T022 Create findContactByEmail function in apps/main-site/src/lib/apex27/client.ts
- [ ] T023 Create createContact function in apps/main-site/src/lib/apex27/client.ts
- [ ] T024 Create getOrCreateContact function in apps/main-site/src/lib/apex27/client.ts
- [ ] T025 Create createLead function in apps/main-site/src/lib/apex27/client.ts

### Shared UI Components

- [ ] T026 [P] Create Button component in apps/main-site/src/components/ui/button.tsx
- [ ] T027 [P] Create Input component in apps/main-site/src/components/ui/input.tsx
- [ ] T028 [P] Create Card component in apps/main-site/src/components/ui/card.tsx
- [ ] T029 [P] Create Badge component in apps/main-site/src/components/ui/badge.tsx
- [ ] T030 [P] Create Select component in apps/main-site/src/components/ui/select.tsx
- [ ] T031 [P] Create Skeleton component in apps/main-site/src/components/ui/skeleton.tsx
- [ ] T032 Create cn utility in apps/main-site/src/lib/utils.ts

### Layout Components

- [ ] T033 Create Header component with navigation in apps/main-site/src/components/layout/Header.tsx
- [ ] T034 Create Footer component in apps/main-site/src/components/layout/Footer.tsx
- [ ] T035 Create MobileNav component in apps/main-site/src/components/layout/MobileNav.tsx
- [ ] T036 Create Breadcrumbs component with schema.org markup in apps/main-site/src/components/layout/Breadcrumbs.tsx
- [ ] T037 Update root layout to include Header/Footer in apps/main-site/src/app/layout.tsx

### SEO Infrastructure

- [ ] T038 Create generateMetadata helper in apps/main-site/src/lib/seo/metadata.ts
- [ ] T039 Create JSON-LD components (RealEstateListing, RealEstateAgent, BreadcrumbList) in apps/main-site/src/components/seo/JsonLd.tsx
- [ ] T040 Create OpenGraph image generation route at apps/main-site/src/app/api/og/route.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Property Search and Discovery (Priority: P1) MVP

**Goal**: Visitors can browse, filter, and view property listings

**Independent Test**: Navigate to /buy or /rent, apply filters, click property card, view details with gallery

### Property Components

- [ ] T041 [P] [US1] Create PropertyCard component in apps/main-site/src/components/property/PropertyCard.tsx
- [ ] T042 [P] [US1] Create PropertyGrid component in apps/main-site/src/components/property/PropertyGrid.tsx
- [ ] T043 [P] [US1] Create PropertyFilters component in apps/main-site/src/components/property/PropertyFilters.tsx
- [ ] T044 [P] [US1] Create PropertyGallery component with lightbox in apps/main-site/src/components/property/PropertyGallery.tsx
- [ ] T045 [P] [US1] Create PropertyFeatures component in apps/main-site/src/components/property/PropertyFeatures.tsx
- [ ] T046 [P] [US1] Create PropertyStatusBadge component (SOLD/LET) in apps/main-site/src/components/property/PropertyStatusBadge.tsx
- [ ] T047 [P] [US1] Create PropertyAgentCard component in apps/main-site/src/components/property/PropertyAgentCard.tsx
- [ ] T048 [US1] Create NoResults component for empty searches in apps/main-site/src/components/property/NoResults.tsx

### Property Pages

- [ ] T049 [US1] Create Buy page with filters at apps/main-site/src/app/(frontend)/buy/page.tsx
- [ ] T050 [US1] Create Rent page with filters at apps/main-site/src/app/(frontend)/rent/page.tsx
- [ ] T051 [US1] Create Property detail page at apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [ ] T052 [US1] Add generateMetadata for property pages in apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
- [ ] T053 [US1] Add JSON-LD RealEstateListing to property detail page
- [ ] T054 [US1] Create loading.tsx skeleton for property pages

### Homepage (MVP Entry Point)

- [ ] T055 [US1] Create Homepage with hero and featured properties at apps/main-site/src/app/(frontend)/page.tsx
- [ ] T056 [US1] Create HeroSection component in apps/main-site/src/components/home/HeroSection.tsx
- [ ] T057 [US1] Create FeaturedProperties component in apps/main-site/src/components/home/FeaturedProperties.tsx

**Checkpoint**: Property search fully functional - MVP deliverable

---

## Phase 4: User Story 2 - Seller/Landlord Lead Generation (Priority: P2)

**Goal**: Property owners can submit valuation requests via forms

**Independent Test**: Visit /sell or /landlords, complete form, verify confirmation shown

### Valuation Form Components

- [ ] T058 [P] [US2] Create ValuationForm component with Zod validation in apps/main-site/src/components/forms/ValuationForm.tsx
- [ ] T059 [P] [US2] Create AddressInput component for property address in apps/main-site/src/components/forms/AddressInput.tsx
- [ ] T060 [P] [US2] Create FormSuccess component for confirmations in apps/main-site/src/components/forms/FormSuccess.tsx

### Form API Routes

- [ ] T061 [US2] Create valuation form API route at apps/main-site/src/app/api/forms/valuation/route.ts
- [ ] T062 [US2] Implement Apex27 valuation lead creation in valuation route

### Lead Gen Pages

- [ ] T063 [US2] Create Sell page with ValuationForm at apps/main-site/src/app/(frontend)/sell/page.tsx
- [ ] T064 [US2] Create Landlords page with ValuationForm at apps/main-site/src/app/(frontend)/landlords/page.tsx
- [ ] T065 [US2] Add SEO metadata to Sell and Landlords pages

**Checkpoint**: Lead generation forms working - core business value delivered

---

## Phase 5: User Story 3 - Agent Directory and Contact (Priority: P3)

**Goal**: Visitors can browse agents and contact them directly

**Independent Test**: Visit /agents, click agent card, view profile with listings, submit contact form

### Agent Components

- [ ] T066 [P] [US3] Create AgentCard component in apps/main-site/src/components/agent/AgentCard.tsx
- [ ] T067 [P] [US3] Create AgentGrid component in apps/main-site/src/components/agent/AgentGrid.tsx
- [ ] T068 [P] [US3] Create AgentProfile component in apps/main-site/src/components/agent/AgentProfile.tsx
- [ ] T069 [P] [US3] Create AgentContactForm component in apps/main-site/src/components/agent/AgentContactForm.tsx
- [ ] T070 [P] [US3] Create AgentListings component showing their properties in apps/main-site/src/components/agent/AgentListings.tsx

### Agent API Routes

- [ ] T071 [US3] Create agent contact form API route at apps/main-site/src/app/api/forms/agent-contact/route.ts
- [ ] T072 [US3] Implement Apex27 agent-specific lead creation with branchId

### Agent Pages

- [ ] T073 [US3] Create Agents directory page at apps/main-site/src/app/(frontend)/agents/page.tsx
- [ ] T074 [US3] Create Agent profile page at apps/main-site/src/app/(frontend)/agent/[id]/page.tsx
- [ ] T075 [US3] Add JSON-LD RealEstateAgent to agent profile page
- [ ] T076 [US3] Add generateMetadata for agent pages

**Checkpoint**: Agent directory and direct contact working

---

## Phase 6: User Story 4 - General Contact (Priority: P3)

**Goal**: Visitors can submit general enquiries

**Independent Test**: Visit /contact, fill form, submit, verify confirmation

### Contact Components

- [ ] T077 [P] [US4] Create ContactForm component in apps/main-site/src/components/forms/ContactForm.tsx
- [ ] T078 [P] [US4] Create ContactInfo component (address, phone, email) in apps/main-site/src/components/contact/ContactInfo.tsx

### Contact API

- [ ] T079 [US4] Create contact form API route at apps/main-site/src/app/api/forms/contact/route.ts
- [ ] T080 [US4] Implement Apex27 general contact lead creation

### Contact Page

- [ ] T081 [US4] Create Contact page at apps/main-site/src/app/(frontend)/contact/page.tsx
- [ ] T082 [US4] Add SEO metadata to Contact page

**Checkpoint**: General contact form working

---

## Phase 7: User Story 5 - Blog/Journal (Priority: P4)

**Goal**: Visitors can read blog articles managed via CMS

**Independent Test**: Visit /journal, browse posts, click article, read content

### Payload Posts Collection

- [ ] T083 [US5] Create Posts collection with Lexical editor in apps/main-site/src/collections/Posts.ts
- [ ] T084 [US5] Update payload.config.ts to include Posts collection
- [ ] T085 [US5] Run Payload migration for Posts table

### Blog Components

- [ ] T086 [P] [US5] Create BlogCard component in apps/main-site/src/components/blog/BlogCard.tsx
- [ ] T087 [P] [US5] Create BlogGrid component in apps/main-site/src/components/blog/BlogGrid.tsx
- [ ] T088 [P] [US5] Create BlogArticle component in apps/main-site/src/components/blog/BlogArticle.tsx
- [ ] T089 [P] [US5] Create CategoryFilter component in apps/main-site/src/components/blog/CategoryFilter.tsx
- [ ] T090 [P] [US5] Create RelatedPosts component in apps/main-site/src/components/blog/RelatedPosts.tsx

### Blog Pages

- [ ] T091 [US5] Create Journal listing page at apps/main-site/src/app/(frontend)/journal/page.tsx
- [ ] T092 [US5] Create Journal article page at apps/main-site/src/app/(frontend)/journal/[slug]/page.tsx
- [ ] T093 [US5] Add generateStaticParams for blog posts (ISR)
- [ ] T094 [US5] Add JSON-LD Article schema to blog article page

**Checkpoint**: Blog/Journal fully functional with CMS

---

## Phase 8: User Story 6 - Agent Recruitment (Priority: P4)

**Goal**: Prospective agents can apply to join

**Independent Test**: Visit /join, complete application form, verify confirmation

### Join Components

- [ ] T095 [P] [US6] Create JoinForm component with validation in apps/main-site/src/components/forms/JoinForm.tsx
- [ ] T096 [P] [US6] Create JoinBenefits component in apps/main-site/src/components/join/JoinBenefits.tsx

### Join API

- [ ] T097 [US6] Create join form API route at apps/main-site/src/app/api/forms/join/route.ts
- [ ] T098 [US6] Implement Apex27 recruitment lead creation

### Join Page

- [ ] T099 [US6] Create Join page at apps/main-site/src/app/(frontend)/join/page.tsx
- [ ] T100 [US6] Add SEO metadata to Join page

**Checkpoint**: Agent recruitment form working

---

## Phase 9: User Story 7 - Buyer Registration (Priority: P5)

**Goal**: Buyers can register for property alerts

**Independent Test**: Visit /register, complete preferences, verify confirmation and Apex27 submission

### Registration Components

- [ ] T101 [P] [US7] Create RegistrationForm component with preferences in apps/main-site/src/components/forms/RegistrationForm.tsx
- [ ] T102 [P] [US7] Create PreferenceSelector component (budget, bedrooms, locations) in apps/main-site/src/components/forms/PreferenceSelector.tsx

### Registration API

- [ ] T103 [US7] Create registration form API route at apps/main-site/src/app/api/forms/register/route.ts
- [ ] T104 [US7] Implement Apex27 buyer registration lead creation with preferences in notes

### Registration Page

- [ ] T105 [US7] Create Register page at apps/main-site/src/app/(frontend)/register/page.tsx
- [ ] T106 [US7] Add SEO metadata to Register page

**Checkpoint**: Buyer registration working with Apex27

---

## Phase 10: User Story 8 - Reviews (Priority: P5)

**Goal**: Visitors can view testimonials and reviews

**Independent Test**: Visit /reviews, see reviews with ratings and sources

### Payload Reviews Collection

- [ ] T107 [US8] Create Reviews collection in apps/main-site/src/collections/Reviews.ts
- [ ] T108 [US8] Update payload.config.ts to include Reviews collection
- [ ] T109 [US8] Run Payload migration for Reviews table

### Reviews Components

- [ ] T110 [P] [US8] Create ReviewCard component in apps/main-site/src/components/reviews/ReviewCard.tsx
- [ ] T111 [P] [US8] Create ReviewGrid component in apps/main-site/src/components/reviews/ReviewGrid.tsx
- [ ] T112 [P] [US8] Create StarRating component in apps/main-site/src/components/reviews/StarRating.tsx
- [ ] T113 [P] [US8] Create ReviewCarousel for homepage in apps/main-site/src/components/reviews/ReviewCarousel.tsx

### Reviews Page

- [ ] T114 [US8] Create Reviews page at apps/main-site/src/app/(frontend)/reviews/page.tsx
- [ ] T115 [US8] Add featured reviews carousel to homepage

**Checkpoint**: Reviews page and carousel working

---

## Phase 11: User Story 9 - CMS Content Management (Priority: P6)

**Goal**: Marketing team can manage blog posts and reviews via admin panel

**Independent Test**: Login to /admin, create post, publish, verify on public site

### CMS Access Control

- [ ] T116 [US9] Implement access control for Posts collection (read public, write admin/editor)
- [ ] T117 [US9] Implement access control for Reviews collection
- [ ] T118 [US9] Implement access control for Media collection
- [ ] T119 [US9] Create first admin user via Payload CLI

### CMS Enhancements

- [ ] T120 [US9] Add draft/publish workflow to Posts collection
- [ ] T121 [US9] Configure Payload admin UI labels and descriptions
- [ ] T122 [US9] Add image upload validation (max size, formats) to Media collection

**Checkpoint**: CMS fully operational for marketing team

---

## Phase 12: User Story 10 - Static Information Pages (Priority: P6)

**Goal**: About, Policies pages accessible, Area Guides hidden

### Static Pages

- [ ] T123 [P] [US10] Create About page at apps/main-site/src/app/(frontend)/about/page.tsx
- [ ] T124 [P] [US10] Create Privacy Policy page at apps/main-site/src/app/(frontend)/policies/privacy/page.tsx
- [ ] T125 [P] [US10] Create Terms of Service page at apps/main-site/src/app/(frontend)/policies/terms/page.tsx
- [ ] T126 [P] [US10] Create Cookie Policy page at apps/main-site/src/app/(frontend)/policies/cookies/page.tsx
- [ ] T127 [US10] Create Policies index page at apps/main-site/src/app/(frontend)/policies/page.tsx
- [ ] T128 [US10] Add SEO metadata to all static pages

### Feature-Flagged Pages

- [ ] T129 [US10] Create Area Guides page (hidden from nav) at apps/main-site/src/app/(frontend)/area-guides/page.tsx
- [ ] T130 [US10] Create feature flag config for Area Guides in apps/main-site/src/lib/config/features.ts

**Checkpoint**: All static pages in place, Area Guides ready for future

---

## Phase 13: GDPR Compliance & Analytics (Cross-cutting)

**Purpose**: Cookie consent, privacy compliance, GA4 integration

### Cookie Consent

- [ ] T131 Create CookieConsent component in apps/main-site/src/components/gdpr/CookieConsent.tsx
- [ ] T132 Create cookie consent storage hook in apps/main-site/src/hooks/useCookieConsent.ts
- [ ] T133 Add CookieConsent to root layout
- [ ] T134 Create Cookie Settings modal for changing consent in apps/main-site/src/components/gdpr/CookieSettings.tsx

### Google Analytics 4

- [ ] T135 Create Analytics component with consent mode v2 in apps/main-site/src/components/analytics/Analytics.tsx
- [ ] T136 Create gtag helper functions in apps/main-site/src/lib/analytics/gtag.ts
- [ ] T137 Add Analytics to root layout (conditionally loaded)

---

## Phase 14: SEO & Sitemap (Cross-cutting)

**Purpose**: XML sitemap, robots.txt, SEO finalization

### Sitemap & Robots

- [ ] T138 Create dynamic sitemap at apps/main-site/src/app/sitemap.ts
- [ ] T139 Create robots.txt at apps/main-site/src/app/robots.ts
- [ ] T140 Include properties, agents, posts in sitemap dynamically

### SEO Metadata

- [ ] T141 Add generateMetadata to all remaining pages
- [ ] T142 Create OpenGraph images for key pages
- [ ] T143 Add canonical URLs to all pages

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, responsive fixes, edge cases

### Error Handling

- [ ] T144 Create error.tsx boundary in apps/main-site/src/app/(frontend)/error.tsx
- [ ] T145 Create not-found.tsx page in apps/main-site/src/app/(frontend)/not-found.tsx
- [ ] T146 Create global-error.tsx in apps/main-site/src/app/global-error.tsx
- [ ] T147 Add API error fallback handling (offline, Apex27 failure)

### Performance & Responsiveness

- [ ] T148 Audit all pages for responsive design (320px-2560px)
- [ ] T149 Add loading skeletons to all async pages
- [ ] T150 Implement image optimization with next/image
- [ ] T151 Add lazy loading to below-fold components

### Final Validation

- [ ] T152 Validate all forms submit to Apex27 correctly
- [ ] T153 Validate all pages have proper SEO metadata
- [ ] T154 Validate cookie consent blocks GA4 until accepted
- [ ] T155 Validate breadcrumbs appear on all applicable pages
- [ ] T156 Run Lighthouse audit and fix issues
- [ ] T157 Update quickstart.md with final setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Stories (Phase 3-12)**: All depend on Phase 2 completion
- **Cross-cutting (Phase 13-15)**: Can start after Phase 2, recommended after Phase 3

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Property Search) | Phase 2 | Phase 2 complete |
| US2 (Lead Gen) | Phase 2 | Phase 2 complete |
| US3 (Agent Directory) | Phase 2 | Phase 2 complete |
| US4 (Contact) | Phase 2 | Phase 2 complete |
| US5 (Blog) | Phase 2 | Phase 2 complete |
| US6 (Recruitment) | Phase 2 | Phase 2 complete |
| US7 (Registration) | Phase 2 | Phase 2 complete |
| US8 (Reviews) | Phase 2 | Phase 2 complete |
| US9 (CMS) | US5, US8 | Blog & Reviews collections exist |
| US10 (Static Pages) | Phase 2 | Phase 2 complete |

### Parallel Opportunities

Within each user story, tasks marked [P] can run in parallel:
- All UI components for a story
- All API routes (if independent)
- Static pages in Phase 12

---

## Parallel Example: Phase 2 Foundation

```bash
# These can all run in parallel (marked [P]):
Task T026: "Create Button component"
Task T027: "Create Input component"
Task T028: "Create Card component"
Task T029: "Create Badge component"
Task T030: "Create Select component"
Task T031: "Create Skeleton component"
```

## Parallel Example: User Story 1 Components

```bash
# All US1 components can be built in parallel:
Task T041: "Create PropertyCard component"
Task T042: "Create PropertyGrid component"
Task T043: "Create PropertyFilters component"
Task T044: "Create PropertyGallery component"
Task T045: "Create PropertyFeatures component"
Task T046: "Create PropertyStatusBadge component"
Task T047: "Create PropertyAgentCard component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T040)
3. Complete Phase 3: User Story 1 - Property Search (T041-T057)
4. **STOP and VALIDATE**: Users can browse and view properties
5. Deploy/demo MVP

### Incremental Delivery

1. **MVP**: Setup + Foundation + US1 (Property Search) → Deploy
2. **Revenue**: Add US2 (Lead Gen) + US4 (Contact) → Deploy
3. **Trust Building**: Add US3 (Agents) + US8 (Reviews) → Deploy
4. **Content Marketing**: Add US5 (Blog) + US9 (CMS) → Deploy
5. **Engagement**: Add US7 (Registration) + US6 (Recruitment) → Deploy
6. **Compliance**: Add US10 (Static) + GDPR + SEO → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Phase 2 complete:
   - Developer A: US1 (Property Search) - MVP critical
   - Developer B: US2 (Lead Gen) + US4 (Contact) - Revenue
   - Developer C: US3 (Agent Directory) - Trust
3. After core stories complete:
   - Developer A: US5 (Blog) + US9 (CMS)
   - Developer B: US7 + US8 (Registration/Reviews)
   - Developer C: Phase 13-15 (GDPR/SEO/Polish)

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All forms route to Apex27 CRM - critical business requirement
- Cookie consent must block GA4 - GDPR compliance requirement
