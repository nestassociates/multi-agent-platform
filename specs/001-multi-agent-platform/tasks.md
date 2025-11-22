# Tasks: Multi-Agent Real Estate Platform

**Input**: Design documents from `/specs/001-multi-agent-platform/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are included based on the TDD requirement in the feature specification. Tests should be written and verified to FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on Turborepo monorepo structure from plan.md:
- **Dashboard**: `apps/dashboard/`
- **Agent Site**: `apps/agent-site/`
- **Shared Packages**: `packages/`
- **Database**: `supabase/`
- **Tests**: `tests/` and within each app/package

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo structure and core dependencies

- [x] T001 Initialize Turborepo monorepo structure with root package.json
- [x] T002 [P] Create apps/dashboard directory with Next.js 14 App Router
- [x] T003 [P] Create apps/agent-site directory with Astro 4.x
- [x] T004 [P] Create packages/shared-types directory with TypeScript
- [x] T005 [P] Create packages/ui directory for shadcn/ui components
- [x] T006 [P] Create packages/database directory for migrations and RLS
- [x] T007 [P] Create packages/validation directory for Zod schemas
- [x] T008 [P] Create packages/build-system directory for build orchestration
- [x] T009 [P] Create packages/email directory for email templates
- [x] T010 [P] Configure Turborepo pipeline in turbo.json
- [x] T011 [P] Setup TypeScript configuration with project references in root tsconfig.json
- [x] T012 [P] Configure ESLint and Prettier for monorepo in root config files
- [x] T013 [P] Create .env.example files in apps/dashboard/.env.example and apps/agent-site/.env.example
- [x] T014 [P] Setup Tailwind CSS configuration in apps/dashboard/tailwind.config.js
- [x] T015 [P] Setup Tailwind CSS configuration in apps/agent-site/tailwind.config.js
- [x] T016 Install core dependencies: next, react, astro, @supabase/supabase-js, zod, react-hook-form
- [x] T017 [P] Create .gitignore with node_modules, .env.local, .turbo, .vercel
- [x] T018 [P] Create README.md with project overview and link to specs/001-multi-agent-platform/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [x] T019 Initialize Supabase project and configure supabase/config.toml
- [x] T020 [P] Create database migration for profiles table in supabase/migrations/20241029000001_create_profiles.sql
- [x] T021 [P] Create database migration for agents table in supabase/migrations/20241029000002_create_agents.sql
- [x] T022 [P] Create database migration for properties table with PostGIS in supabase/migrations/20241029000003_create_properties.sql
- [x] T023 [P] Create database migration for territories table with PostGIS in supabase/migrations/20241029000004_create_territories.sql
- [x] T024 [P] Create database migration for content_submissions table in supabase/migrations/20241029000005_create_content_submissions.sql
- [x] T025 [P] Create database migration for build_queue table in supabase/migrations/20241029000006_create_build_queue.sql
- [x] T026 [P] Create database migration for global_content table in supabase/migrations/20241029000007_create_global_content.sql
- [x] T027 [P] Create database migration for audit_logs table in supabase/migrations/20241029000008_create_audit_logs.sql
- [x] T028 [P] Create database migration for contact_form_submissions table in supabase/migrations/20241029000009_create_contact_form_submissions.sql
- [x] T029 [P] Create update_updated_at_column() function in supabase/migrations/20241029000010_create_functions.sql
- [x] T030 Apply all database migrations and verify schema

### Row Level Security Policies

- [x] T031 [P] Create RLS policies for profiles table in supabase/migrations/20241029000011_rls_profiles.sql
- [x] T032 [P] Create RLS policies for agents table in supabase/migrations/20241029000012_rls_agents.sql
- [x] T033 [P] Create RLS policies for properties table in supabase/migrations/20241029000013_rls_properties.sql
- [x] T034 [P] Create RLS policies for territories table in supabase/migrations/20241029000014_rls_territories.sql
- [x] T035 [P] Create RLS policies for content_submissions table in supabase/migrations/20241029000015_rls_content_submissions.sql
- [x] T036 [P] Create RLS policies for build_queue table in supabase/migrations/20241029000016_rls_build_queue.sql
- [x] T037 [P] Create RLS policies for global_content table in supabase/migrations/20241029000017_rls_global_content.sql
- [x] T038 [P] Create RLS policies for audit_logs table in supabase/migrations/20241029000018_rls_audit_logs.sql
- [x] T039 [P] Create RLS policies for contact_form_submissions table in supabase/migrations/20241029000019_rls_contact_form_submissions.sql
- [x] T040 Enable RLS on all tables and verify policies work correctly

### TypeScript Types & Shared Code

- [x] T041 [P] Copy entity types from specs/001-multi-agent-platform/contracts/types/entities.ts to packages/shared-types/src/entities.ts
- [x] T042 [P] Copy API types from specs/001-multi-agent-platform/contracts/types/api.ts to packages/shared-types/src/api.ts
- [x] T043 [P] Create Zod schemas for authentication in packages/validation/src/auth.ts
- [x] T044 [P] Create Zod schemas for agents in packages/validation/src/agent.ts
- [x] T045 [P] Create Zod schemas for content in packages/validation/src/content.ts
- [x] T046 [P] Create Zod schemas for properties in packages/validation/src/property.ts
- [x] T047 [P] Create Zod schemas for territories in packages/validation/src/territory.ts
- [x] T048 [P] Create Zod schema for Apex27 webhook in packages/validation/src/webhooks.ts
- [x] T049 Create Supabase client factory in packages/database/lib/client.ts (server and browser clients)
- [x] T050 Create common database queries helper in packages/database/lib/queries.ts

### Authentication & Authorization Foundation

- [x] T051 Implement Supabase Auth helper functions in apps/dashboard/lib/supabase/server.ts
- [x] T052 [P] Implement Supabase Auth helper functions in apps/dashboard/lib/supabase/client.ts
- [x] T053 Create Next.js middleware for role-based route protection in apps/dashboard/middleware.ts
- [x] T054 [P] Create auth utilities (getUser, requireAuth, requireRole) in apps/dashboard/lib/auth.ts
- [x] T055 [P] Create login page UI in apps/dashboard/app/(auth)/login/page.tsx
- [x] T056 [P] Create password reset page UI in apps/dashboard/app/(auth)/reset-password/page.tsx
- [x] T057 [P] Create 2FA setup page UI in apps/dashboard/app/(auth)/2fa-setup/page.tsx
- [x] T058 Implement login API route in apps/dashboard/app/api/auth/login/route.ts
- [x] T059 [P] Implement logout API route in apps/dashboard/app/api/auth/logout/route.ts
- [x] T060 [P] Implement password reset API route in apps/dashboard/app/api/auth/reset/route.ts

### UI Component Library Setup

- [x] T061 [P] Initialize shadcn/ui in packages/ui with Button component
- [x] T062 [P] Add Input component to packages/ui/components/ui/input.tsx
- [x] T063 [P] Add Dialog component to packages/ui/components/ui/dialog.tsx
- [x] T064 [P] Add Table component to packages/ui/components/ui/table.tsx
- [x] T065 [P] Add Form component to packages/ui/components/ui/form.tsx
- [x] T066 [P] Add Select component to packages/ui/components/ui/select.tsx
- [x] T067 [P] Add Textarea component to packages/ui/components/ui/textarea.tsx
- [x] T068 [P] Add Badge component to packages/ui/components/ui/badge.tsx
- [x] T069 [P] Add Card component to packages/ui/components/ui/card.tsx
- [x] T070 [P] Add Tabs component to packages/ui/components/ui/tabs.tsx

### Testing Infrastructure

- [x] T071 [P] Setup Jest configuration in root jest.config.js
- [x] T072 [P] Setup Playwright configuration in playwright.config.ts
- [x] T073 [P] Install testing dependencies: jest, @testing-library/react, @playwright/test, @axe-core/playwright
- [x] T074 [P] Create test utilities in tests/utils/test-helpers.ts
- [x] T075 [P] Create mock Supabase client for tests in tests/utils/mock-supabase.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent Account Creation and First Login (Priority: P1) 🎯 MVP

**Goal**: Enable admins to create agent accounts, send welcome emails, and allow agents to log in and update their profiles

**Independent Test**: Create an agent account through admin dashboard, receive welcome email, log in with temporary credentials, change password, update profile with bio and qualifications. Verify agent record exists in database and profile changes are saved.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T076 [P] [US1] E2E test for admin creates agent flow in tests/e2e/agent-creation.spec.ts
- [x] T077 [P] [US1] E2E test for agent first login and password change in tests/e2e/agent-first-login.spec.ts
- [x] T078 [P] [US1] E2E test for agent profile update in tests/e2e/agent-profile-update.spec.ts
- [x] T079 [P] [US1] Contract test for POST /api/admin/agents in tests/contract/agent-creation.spec.ts
- [x] T080 [P] [US1] Contract test for PATCH /api/agent/profile in tests/contract/agent-profile.spec.ts

### Implementation for User Story 1

**Admin: Agent Creation Form**

- [x] T0*81 [P] [US1] Create agent creation form component in apps/dashboard/components/admin/create-agent-form.tsx
- [x] T0*82 [P] [US1] Create agent list page in apps/dashboard/app/(admin)/agents/page.tsx
- [x] T0*83 [US1] Create create agent page in apps/dashboard/app/(admin)/agents/new/page.tsx
- [x] T0*84 [US1] Implement POST /api/admin/agents endpoint (create agent, profile, send email) in apps/dashboard/app/api/admin/agents/route.ts
- [x] T0*85 [US1] Implement GET /api/admin/agents endpoint (list with pagination, search, filters) in apps/dashboard/app/api/admin/agents/route.ts

**Email: Welcome Email**

- [x] T0*86 [P] [US1] Create welcome email template using React Email in packages/email/templates/welcome.tsx
- [x] T0*87 [US1] Create email sender utility with Resend in packages/email/lib/sender.ts

**Agent: First Login & Password Change**

- [x] T0*88 [P] [US1] Create force password change page in apps/dashboard/app/(auth)/change-password/page.tsx
- [x] T0*89 [US1] Implement password change API route in apps/dashboard/app/api/auth/change-password/route.ts
- [x] T0*90 [US1] Add middleware redirect for agents with temporary passwords in apps/dashboard/middleware.ts

**Agent: Profile Editor**

- [x] T0*91 [P] [US1] Create agent profile editor form component in apps/dashboard/components/agent/profile-editor.tsx
- [x] T0*92 [P] [US1] Create agent profile page in apps/dashboard/app/(agent)/profile/page.tsx
- [x] T0*93 [US1] Implement GET /api/agent/profile endpoint in apps/dashboard/app/api/agent/profile/route.ts
- [x] T0*94 [US1] Implement PATCH /api/agent/profile endpoint (update bio, qualifications, social links) in apps/dashboard/app/api/agent/profile/route.ts
- [x] T0*95 [P] [US1] Create image upload component for avatar in apps/dashboard/components/shared/image-upload.tsx
- [x] T0*96 [US1] Implement image upload to Supabase Storage with auto-crop in apps/dashboard/lib/storage.ts

**Validation & Error Handling**

- [x] T0*97 [US1] Add validation for agent creation (email uniqueness, subdomain format) in apps/dashboard/app/api/admin/agents/route.ts
- [x] T0*98 [US1] Add error handling and logging for agent creation flow in apps/dashboard/lib/error-handler.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Admins can create agents, agents can log in and update profiles.

---

## Phase 4: User Story 2 - Property Synchronization from Apex27 (Priority: P1)

**Goal**: Sync property data from Apex27 via hybrid approach (webhooks + periodic full sync), match to agents by branch ID, and store in database

**Architecture Update (2025-11-03)**: Main API supports webhooks! Using James's recommended hybrid approach: real-time webhooks + 6-hour full sync for reconciliation.

**Independent Test**: Register webhook with Apex27, trigger property update in CRM, verify webhook received and property stored. Run manual full sync, confirm properties matched to agents by branch_id. Test with different property statuses.

### Tests for User Story 2

- [x] T099 [P] [US2] Integration test for Apex27 webhook (no signature validation - per James)
- [x] T100 [P] [US2] Integration test for property create event in tests/integration/property-sync-create.spec.ts
- [x] T101 [P] [US2] Integration test for property update event in tests/integration/property-sync-update.spec.ts
- [x] T102 [P] [US2] Integration test for property delete event in tests/integration/property-sync-delete.spec.ts
- [x] T103 [P] [US2] Contract test for POST /api/webhooks/apex27 in tests/contract/apex27-webhook.spec.ts

### Implementation for User Story 2

**API Client & Data Processing**

- [x] T104 [P] [US2] Create Main API client in apps/dashboard/lib/apex27/client.ts
- [x] T105 [P] [US2] Create Apex27 webhook handler in apps/dashboard/app/api/webhooks/apex27/route.ts
- [x] T106 [US2] Implement webhook event handling (no signature validation - per James)
- [x] T107 [US2] Implement branch_id to agent_id mapping logic in property-service.ts

**Property Data Processing**

- [x] T108 [P] [US2] Create property upsert service in apps/dashboard/lib/services/property-service.ts
- [x] T109 [US2] Implement property create event handler in webhook route
- [x] T110 [US2] Implement property update event handler in webhook route
- [x] T111 [US2] Implement property delete event handler in webhook route
- [x] T112 [US2] Add PostGIS point creation from latitude/longitude (upsert_property_from_apex27 function)

**Property Display (Agent View)**

- [x] T113 [P] [US2] Create property list in apps/dashboard/app/(agent)/my-properties/page.tsx
- [x] T114 [P] [US2] Create agent properties page (integrated with T113)
- [x] T115 [US2] Implement GET /api/agent/properties endpoint in apps/dashboard/app/api/agent/properties/route.ts

**Error Handling & Sync Infrastructure**

- [x] T116 [US2] Add webhook error handling in webhook route (returns 200 to prevent retries)
- [x] T117 [US2] Add sync logging (console logs for all sync operations)
- [x] T118 [US2] Add full sync cron job (apps/dashboard/app/api/cron/sync-properties/route.ts) + admin manual trigger

**Note**: T104-106 modified from "signature validation" to "Main API client + webhook handler without signatures" per James @ Apex27.

**Checkpoint**: At this point, User Story 2 should be fully functional. Apex27 webhooks sync properties to correct agents automatically.

---

## Phase 5: User Story 3 - Agent Content Creation and Approval (Priority: P1)

**Goal**: Enable agents to create blog posts/area guides with rich text editor, submit for review, and enable admins to approve or reject with feedback

**Independent Test**: Log in as agent, create blog post with Tiptap editor, add images, save as draft (verify auto-save), submit for review. Log in as admin, view moderation queue, approve content (verify build job queued), or reject with feedback (verify agent receives email).

### Tests for User Story 3

- [x] T119 [P] [US3] E2E test for agent creates blog post and submits in tests/e2e/content-creation.spec.ts
- [x] T120 [P] [US3] E2E test for admin approves content in tests/e2e/content-approval.spec.ts
- [x] T121 [P] [US3] E2E test for admin rejects content with feedback in tests/e2e/content-rejection.spec.ts
- [x] T122 [P] [US3] Contract test for POST /api/agent/content in tests/contract/content-creation.spec.ts
- [x] T123 [P] [US3] Contract test for POST /api/admin/content/:id/approve in tests/contract/content-approval.spec.ts

### Implementation for User Story 3

**Rich Text Editor Component**

- [x] T124 [P] [US3] Install Tiptap dependencies: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-image
- [x] T125 [P] [US3] Create reusable RichTextEditor component in packages/ui/components/rich-text-editor.tsx
- [x] T126 [US3] Add image upload extension for Tiptap (uploads to Supabase Storage) in packages/ui/components/rich-text-editor-image-extension.ts
- [x] T127 [US3] Add auto-save functionality (30-second interval) to editor component

**Agent: Content Creation**

- [x] T128 [P] [US3] Create content creation form component in apps/dashboard/components/agent/content-form.tsx
- [x] T129 [P] [US3] Create slug generator utility (auto-generate from title) in apps/dashboard/lib/slug-generator.ts
- [x] T130 [P] [US3] Create character counter component for limited fields in packages/ui/components/character-counter.tsx
- [x] T131 [P] [US3] Create agent content management page in apps/dashboard/app/(agent)/content/page.tsx
- [x] T132 [P] [US3] Create new content page in apps/dashboard/app/(agent)/content/new/page.tsx
- [x] T133 [US3] Implement POST /api/agent/content endpoint (create draft) in apps/dashboard/app/api/agent/content/route.ts
- [x] T134 [US3] Implement PATCH /api/agent/content/:id endpoint (update, submit for review) in apps/dashboard/app/api/agent/content/[id]/route.ts
- [x] T135 [US3] Implement GET /api/agent/content endpoint (list with status filter) in apps/dashboard/app/api/agent/content/route.ts

**Admin: Content Moderation**

- [x] T136 [P] [US3] Create moderation queue component in apps/dashboard/components/admin/moderation-queue.tsx
- [x] T137 [P] [US3] Create content preview pane component in apps/dashboard/components/admin/content-preview.tsx
- [x] T138 [P] [US3] Create admin content moderation page in apps/dashboard/app/(admin)/content-moderation/page.tsx
- [x] T139 [US3] Implement GET /api/admin/content/moderation endpoint in apps/dashboard/app/api/admin/content/moderation/route.ts
- [x] T140 [US3] Implement POST /api/admin/content/:id/approve endpoint (change status, queue build) in apps/dashboard/app/api/admin/content/[id]/approve/route.ts
- [x] T141 [US3] Implement POST /api/admin/content/:id/reject endpoint (change status, send email) in apps/dashboard/app/api/admin/content/[id]/reject/route.ts

**Email: Content Feedback**

- [x] T142 [P] [US3] Create content approved email template in packages/email/templates/content-approved.tsx
- [x] T143 [P] [US3] Create content rejected email template in packages/email/templates/content-rejected.tsx
- [x] T144 [US3] Integrate email sending in approve/reject API routes

**Build Queue Integration**

- [x] T145 [US3] Create build queue service in packages/build-system/queue.ts (add to queue, check duplicates)
- [x] T146 [US3] Integrate build queue service in content approval endpoint (create P2 build job)

**Checkpoint**: At this point, User Story 3 should be fully functional. Agents create content, admins moderate, approvals queue builds.

---

## Phase 6: User Story 4 - Visual Territory Assignment (Priority: P2)

**Goal**: Enable admins to draw territory polygons on interactive map, calculate property counts via OS Data Hub API, check overlaps, and save territories

**Independent Test**: Log in as admin, navigate to territory map, see existing territories as colored polygons, click "Create Territory", draw polygon, select agent, see property count calculation, see overlap warning (if applicable), save territory, verify it appears on map.

### Tests for User Story 4

- [x] T147 [P] [US4] Integration test for territory overlap detection in tests/integration/territory-overlap.spec.ts
- [x] T148 [P] [US4] Integration test for OS Data Hub property count query in tests/integration/os-datahub-integration.spec.ts
- [x] T149 [P] [US4] E2E test for territory creation flow in tests/e2e/territory-creation.spec.ts
- [x] T150 [P] [US4] Contract test for POST /api/admin/territories in tests/contract/territories.spec.ts

### Implementation for User Story 4

**Map Interface**

- [x] T151 [P] [US4] Install Mapbox dependencies: mapbox-gl, @mapbox/mapbox-gl-draw (Implemented with postcode-based system)
- [x] T152 [P] [US4] Create Mapbox map component in apps/dashboard/components/admin/territory-map.tsx (Implemented as postcode-map.tsx)
- [x] T153 [US4] Add drawing mode controls (create, edit, delete polygons) to map component (Replaced with click-to-select postcodes)
- [x] T154 [US4] Add color assignment utility (unique color per agent) in apps/dashboard/lib/color-generator.ts
- [x] T155 [US4] Display existing territories as colored polygons on map (Implemented with postcode boundaries)

**Territory Creation**

- [x] T156 [P] [US4] Create territory form component in apps/dashboard/components/admin/territory-form.tsx (Implemented as postcode selection in sidebar)
- [x] T157 [P] [US4] Create admin territories page in apps/dashboard/app/(admin)/territories/page.tsx
- [x] T158 [US4] Implement POST /api/admin/territories endpoint (create territory) in apps/dashboard/app/api/admin/territories/route.ts
- [x] T159 [US4] Implement GET /api/admin/territories endpoint (list all) in apps/dashboard/app/api/admin/territories/route.ts

**OS Data Hub Integration**

- [x] T160 [P] [US4] Create OS Data Hub API client in apps/dashboard/lib/os-datahub-client.ts
- [x] T161 [US4] Implement property count query (polygon to API) in OS Data Hub client (Implemented with postcode-based queries)
- [x] T162 [US4] Add property count calculation to territory creation endpoint

**Overlap Detection**

- [x] T163 [US4] Create PostGIS overlap check query in packages/database/lib/spatial-queries.ts
- [x] T164 [US4] Integrate overlap detection in POST /api/admin/territories endpoint
- [x] T165 [US4] Display overlap warning in territory form UI (but allow saving)

**Territory Editing**

- [x] T166 [P] [US4] Add vertex dragging for territory editing in map component (Not applicable - postcode-based system)
- [x] T167 [US4] Implement PATCH /api/admin/territories/:id endpoint in apps/dashboard/app/api/admin/territories/[id]/route.ts
- [x] T168 [US4] Add "Refresh Property Count" button functionality (Implemented via delete/reassign)

**Territory List View**

- [x] T169 [P] [US4] Create territory list component in apps/dashboard/components/admin/territory-list.tsx (Implemented in sidebar)
- [x] T170 [US4] Add click-to-highlight on map when selecting from list (Implemented with color-coded territories)

**Checkpoint**: At this point, User Story 4 should be fully functional. Admins can create, edit territories with property counts and overlap detection.

---

## Phase 7: User Story 5 - Agent Microsite Static Build and Deployment (Priority: P2)

**Goal**: Process build queue with cron job, fetch agent data and content, generate Astro static sites, deploy to subdomains

**Independent Test**: Trigger manual build from admin dashboard, monitor queue status changing from pending→processing→completed, verify JSON data file generated, verify Astro site deployed to subdomain, visit live URL and see agent data/content/properties.

### Tests for User Story 5

- [ ] T171 [P] [US5] Integration test for build queue processing in tests/integration/build-queue.spec.ts
- [ ] T172 [P] [US5] Integration test for data file generation in tests/integration/build-data-generation.spec.ts
- [ ] T173 [P] [US5] Integration test for Vercel API build trigger in tests/integration/vercel-deployment.spec.ts
- [ ] T174 [P] [US5] E2E test for full build workflow in tests/e2e/agent-site-build.spec.ts

### Implementation for User Story 5

**Astro Agent Site Template**

- [x] T175 [P] [US5] Create Astro base layout in apps/agent-site/src/layouts/BaseLayout.astro
- [x] T176 [P] [US5] Create homepage in apps/agent-site/src/pages/index.astro
- [x] T177 [P] [US5] Create about page in apps/agent-site/src/pages/about.astro
- [x] T178 [P] [US5] Create services page in apps/agent-site/src/pages/services.astro
- [x] T179 [P] [US5] Create properties page in apps/agent-site/src/pages/properties/index.astro
- [x] T180 [P] [US5] Create property detail page in apps/agent-site/src/pages/properties/[slug].astro
- [x] T181 [P] [US5] Create blog archive page in apps/agent-site/src/pages/blog/index.astro
- [x] T182 [P] [US5] Create blog post page in apps/agent-site/src/pages/blog/[slug].astro
- [x] T183 [P] [US5] Create area guides archive in apps/agent-site/src/pages/areas/index.astro
- [x] T184 [P] [US5] Create area guide detail in apps/agent-site/src/pages/areas/[slug].astro
- [x] T185 [P] [US5] Create reviews page in apps/agent-site/src/pages/reviews.astro
- [x] T186 [P] [US5] Create contact page in apps/agent-site/src/pages/contact.astro

**Astro Components**

- [x] T187 [P] [US5] Create Hero component in apps/agent-site/src/components/Hero.astro
- [x] T188 [P] [US5] Create PropertyCard component in apps/agent-site/src/components/PropertyCard.astro
- [x] T189 [P] [US5] Create BlogCard component in apps/agent-site/src/components/BlogCard.astro
- [x] T190 [P] [US5] Create ContactForm component in apps/agent-site/src/components/ContactForm.astro (Implemented as ContactForm.tsx)

**Data File Generation**

- [ ] T191 [P] [US5] Create data generator service in packages/build-system/data-generator.ts
- [ ] T192 [US5] Implement fetch agent data (profile, bio, qualifications, social links) in data generator
- [ ] T193 [US5] Implement fetch approved content (blog posts, area guides) in data generator
- [ ] T194 [US5] Implement fetch properties for agent in data generator
- [ ] T195 [US5] Implement fetch global templates (header, footer) in data generator
- [ ] T196 [US5] Generate agent.json file in correct format for Astro consumption

**Build Queue Processor**

- [ ] T197 [P] [US5] Create Vercel API client in packages/build-system/vercel-client.ts
- [ ] T198 [P] [US5] Create build processor service in packages/build-system/builder.ts
- [ ] T199 [US5] Implement fetch pending builds query (ordered by priority, created_at) in build processor
- [ ] T200 [US5] Implement parallel build processing (up to 20 concurrent) in build processor
- [ ] T201 [US5] Implement Vercel API build trigger in Vercel client
- [ ] T202 [US5] Implement build status polling in Vercel client
- [ ] T203 [US5] Implement build completion handler (update status, logs) in build processor
- [ ] T204 [US5] Implement build failure handler (retry logic, exponential backoff) in build processor

**Cron Job Setup**

- [ ] T205 [US5] Create Vercel cron endpoint in apps/dashboard/app/api/cron/process-builds/route.ts
- [ ] T206 [US5] Configure vercel.json with cron schedule (every 2 minutes)
- [ ] T207 [US5] Add duplicate detection (update trigger_reason if pending build exists) in cron endpoint

**Email: Build Failure Notification**

- [ ] T208 [P] [US5] Create build failed email template in packages/email/templates/build-failed.tsx
- [ ] T209 [US5] Send email to admin team when build fails after 3 retries

**Admin: Build Queue Monitoring**

- [ ] T210 [P] [US5] Create build queue list component in apps/dashboard/components/admin/build-queue-list.tsx
- [ ] T211 [P] [US5] Create admin build queue page in apps/dashboard/app/(admin)/build-queue/page.tsx
- [ ] T212 [US5] Implement GET /api/admin/build-queue endpoint in apps/dashboard/app/api/admin/build-queue/route.ts
- [ ] T213 [US5] Implement POST /api/admin/build-queue/:agent_id/trigger endpoint (manual trigger) in apps/dashboard/app/api/admin/build-queue/[agent_id]/trigger/route.ts
- [ ] T214 [US5] Implement POST /api/admin/build-queue/:id/retry endpoint in apps/dashboard/app/api/admin/build-queue/[id]/retry/route.ts

**SEO & Performance Optimization**

- [ ] T215 [P] [US5] Add SEO meta tags to Astro layout (Open Graph, Twitter Cards) in apps/agent-site/src/layouts/BaseLayout.astro
- [ ] T216 [P] [US5] Generate sitemap.xml dynamically in apps/agent-site/src/pages/sitemap.xml.ts
- [ ] T217 [P] [US5] Generate robots.txt in apps/agent-site/public/robots.txt
- [ ] T218 [P] [US5] Add schema.org markup (LocalBusiness, Person) in Astro layout
- [ ] T219 [P] [US5] Configure image optimization in apps/agent-site/astro.config.mjs

**Checkpoint**: At this point, User Story 5 should be fully functional. Build queue processes automatically, generates static sites, deploys to subdomains.

---

## Phase 8: User Story 6 - Admin Agent Management Interface (Priority: P2)

**Goal**: Enable admins to view searchable agent list, view agent details across tabs, edit agent information, and trigger manual builds

**Independent Test**: Log in as admin, see agent list with pagination, use search to filter agents, click agent row to view details, switch between tabs (Overview, Content, Properties, Analytics, Settings), click Edit button, update bio in modal, save changes, verify rebuild triggered.

### Tests for User Story 6

- [ ] T220 [P] [US6] E2E test for agent list search and filter in tests/e2e/agent-list.spec.ts
- [ ] T221 [P] [US6] E2E test for agent detail view tabs in tests/e2e/agent-detail.spec.ts
- [ ] T222 [P] [US6] E2E test for agent editing in tests/e2e/agent-edit.spec.ts
- [ ] T223 [P] [US6] Contract test for GET /api/admin/agents in tests/contract/agent-list.spec.ts

### Implementation for User Story 6

**Agent List View**

- [ ] T224 [P] [US6] Create agent table component with search and filters in apps/dashboard/components/admin/agent-table.tsx
- [ ] T225 [P] [US6] Create status filter dropdown in apps/dashboard/components/admin/status-filter.tsx
- [ ] T226 [US6] Update agents list page with table, search, filters, pagination in apps/dashboard/app/(admin)/agents/page.tsx
- [ ] T227 [US6] Add search and filter query parameters to GET /api/admin/agents endpoint

**Agent Detail View**

- [ ] T228 [P] [US6] Create agent detail page in apps/dashboard/app/(admin)/agents/[id]/page.tsx
- [ ] T229 [P] [US6] Create agent overview tab component in apps/dashboard/components/admin/agent-overview.tsx
- [ ] T230 [P] [US6] Create agent content tab component in apps/dashboard/components/admin/agent-content-tab.tsx
- [ ] T231 [P] [US6] Create agent properties tab component in apps/dashboard/components/admin/agent-properties-tab.tsx
- [ ] T232 [P] [US6] Create agent analytics tab (placeholder for US8) in apps/dashboard/components/admin/agent-analytics-tab.tsx
- [ ] T233 [P] [US6] Create agent settings tab component in apps/dashboard/components/admin/agent-settings-tab.tsx
- [ ] T234 [US6] Implement GET /api/admin/agents/:id endpoint (detailed view with counts) in apps/dashboard/app/api/admin/agents/[id]/route.ts

**Agent Editing**

- [ ] T235 [P] [US6] Create edit agent modal component in apps/dashboard/components/admin/edit-agent-modal.tsx
- [ ] T236 [US6] Implement PATCH /api/admin/agents/:id endpoint (update agent, trigger rebuild) in apps/dashboard/app/api/admin/agents/[id]/route.ts
- [ ] T237 [US6] Add validation to prevent email/subdomain changes without workflow

**Agent Deletion**

- [ ] T238 [P] [US6] Create delete confirmation dialog in apps/dashboard/components/admin/delete-agent-dialog.tsx
- [ ] T239 [US6] Implement DELETE /api/admin/agents/:id endpoint (cascade delete, archive site) in apps/dashboard/app/api/admin/agents/[id]/route.ts

**View Live Site**

- [ ] T240 [US6] Add "View Live Site" button that opens agent microsite URL in new tab

**Checkpoint**: At this point, User Story 6 should be fully functional. Admins have full agent management capabilities.

---

## Phase 9: User Story 7 - Global Content Management and Deployment (Priority: P3)

**Goal**: Enable admins to edit global templates, preview changes, publish, and trigger batch rebuild of all agent sites

**Independent Test**: Log in as admin, navigate to global content, edit footer template in rich text editor, click preview, see how it looks, click publish, confirm batch rebuild dialog, see progress indicator "Rebuilding sites: X/Y complete", receive completion email.

### Tests for User Story 7

- [ ] T241 [P] [US7] E2E test for global content editing in tests/e2e/global-content-edit.spec.ts
- [ ] T242 [P] [US7] E2E test for batch rebuild flow in tests/e2e/batch-rebuild.spec.ts
- [ ] T243 [P] [US7] Integration test for batch build job creation in tests/integration/batch-builds.spec.ts

### Implementation for User Story 7

**Global Content Editor**

- [ ] T244 [P] [US7] Create global content editor page in apps/dashboard/app/(admin)/global-content/page.tsx
- [ ] T245 [P] [US7] Create global content form component in apps/dashboard/components/admin/global-content-form.tsx
- [ ] T246 [P] [US7] Create preview modal component in apps/dashboard/components/admin/global-content-preview.tsx
- [ ] T247 [US7] Implement GET /api/admin/global-content endpoint in apps/dashboard/app/api/admin/global-content/route.ts
- [ ] T248 [US7] Implement PATCH /api/admin/global-content/:type endpoint (save draft or publish) in apps/dashboard/app/api/admin/global-content/[type]/route.ts

**Batch Rebuild**

- [ ] T249 [P] [US7] Create batch rebuild confirmation dialog in apps/dashboard/components/admin/batch-rebuild-dialog.tsx
- [ ] T250 [US7] Implement POST /api/admin/global-content/deploy endpoint (create P3 builds for all agents) in apps/dashboard/app/api/admin/global-content/deploy/route.ts
- [ ] T251 [US7] Add progress tracking for batch rebuilds
- [ ] T252 [P] [US7] Create batch rebuild progress component in apps/dashboard/components/admin/batch-rebuild-progress.tsx

**Email: Batch Rebuild Complete**

- [ ] T253 [P] [US7] Create batch rebuild complete email template in packages/email/templates/batch-rebuild-complete.tsx
- [ ] T254 [US7] Send email when batch rebuild completes

**Version Control**

- [ ] T255 [P] [US7] Add version history tracking for global content in global_content table
- [ ] T256 [US7] Implement GET /api/admin/global-content/:type/versions endpoint for rollback capability

**Checkpoint**: At this point, User Story 7 should be fully functional. Admins can manage global content and deploy to all sites.

---

## Phase 10: User Story 8 - Agent Analytics Dashboard (Priority: P3)

**Goal**: Display traffic statistics from Google Analytics 4, property view metrics, lead sources, and conversion tracking for agents

**Independent Test**: Log in as agent, navigate to analytics dashboard, select date range (last 7/30/90 days), see traffic overview (page views, unique visitors, bounce rate), view top pages list, see property views ranked, check lead source data.

### Tests for User Story 8

- [ ] T257 [P] [US8] Integration test for GA4 data fetching in tests/integration/ga4-integration.spec.ts
- [ ] T258 [P] [US8] E2E test for analytics dashboard in tests/e2e/agent-analytics.spec.ts

### Implementation for User Story 8

**Google Analytics 4 Integration**

- [ ] T259 [P] [US8] Install @google-analytics/data dependency
- [ ] T260 [P] [US8] Create GA4 client in apps/dashboard/lib/ga4-client.ts
- [ ] T261 [US8] Implement fetch page views query in GA4 client
- [ ] T262 [US8] Implement fetch unique visitors query in GA4 client
- [ ] T263 [US8] Implement fetch bounce rate query in GA4 client
- [ ] T264 [US8] Implement fetch top pages query in GA4 client

**Analytics Dashboard UI**

- [ ] T265 [P] [US8] Create analytics overview component in apps/dashboard/components/agent/analytics-overview.tsx
- [ ] T266 [P] [US8] Create traffic chart component (line chart for 3 months) in apps/dashboard/components/agent/traffic-chart.tsx
- [ ] T267 [P] [US8] Create top pages component in apps/dashboard/components/agent/top-pages.tsx
- [ ] T268 [P] [US8] Create property views component in apps/dashboard/components/agent/property-views.tsx
- [ ] T269 [P] [US8] Create lead sources component in apps/dashboard/components/agent/lead-sources.tsx
- [ ] T270 [P] [US8] Create date range selector component in apps/dashboard/components/shared/date-range-selector.tsx
- [ ] T271 [P] [US8] Create agent analytics page in apps/dashboard/app/(agent)/analytics/page.tsx

**Analytics API Endpoints**

- [ ] T272 [US8] Implement GET /api/agent/analytics/overview endpoint in apps/dashboard/app/api/agent/analytics/overview/route.ts
- [ ] T273 [US8] Implement GET /api/agent/analytics/top-pages endpoint in apps/dashboard/app/api/agent/analytics/top-pages/route.ts
- [ ] T274 [US8] Implement GET /api/agent/analytics/property-views endpoint in apps/dashboard/app/api/agent/analytics/property-views/route.ts
- [ ] T275 [US8] Implement GET /api/agent/analytics/lead-sources endpoint in apps/dashboard/app/api/agent/analytics/lead-sources/route.ts

**Dashboard Home Stats**

- [ ] T276 [P] [US8] Create dashboard stats component in apps/dashboard/components/agent/dashboard-stats.tsx
- [ ] T277 [P] [US8] Update agent dashboard home page in apps/dashboard/app/(agent)/dashboard/page.tsx
- [ ] T278 [US8] Implement GET /api/agent/dashboard/stats endpoint in apps/dashboard/app/api/agent/dashboard/stats/route.ts

**Checkpoint**: At this point, User Story 8 should be fully functional. Agents can view comprehensive analytics.

---

## Phase 11: User Story 9 - Agent Profile Self-Management (Priority: P3)

**Goal**: Enable agents to edit their own profiles (phone, bio, qualifications, social links, photo), preview changes, and trigger site rebuilds

**Independent Test**: Log in as agent, navigate to profile editor, update phone number, edit bio in rich text editor, add/remove qualifications, upload profile photo, click preview to see changes, click save to trigger rebuild.

### Tests for User Story 9

- [ ] T279 [P] [US9] E2E test for agent profile editing in tests/e2e/agent-self-edit-profile.spec.ts
- [ ] T280 [P] [US9] Integration test for profile photo upload and crop in tests/integration/profile-photo-upload.spec.ts

### Implementation for User Story 9

**Note**: This builds on US1 profile editor but adds preview and rebuild trigger

**Profile Preview**

- [ ] T281 [P] [US9] Create profile preview component (shows how profile looks on site) in apps/dashboard/components/agent/profile-preview.tsx
- [ ] T282 [US9] Add "Preview" button to profile editor that opens preview modal

**Photo Upload with Auto-Crop**

- [ ] T283 [P] [US9] Install image processing library: sharp or @vercel/og
- [ ] T284 [US9] Implement auto-crop to square aspect ratio in apps/dashboard/lib/image-processor.ts
- [ ] T285 [US9] Update image upload component to use auto-crop for profile photos

**Rebuild Trigger**

- [ ] T286 [US9] Update PATCH /api/agent/profile endpoint to create build job when profile saved
- [ ] T287 [US9] Add success message "Profile updated. Your site will be rebuilt shortly."

**Field Restrictions**

- [ ] T288 [US9] Ensure first_name and last_name are read-only for agents (admin-only edit)

**Checkpoint**: At this point, User Story 9 should be fully functional. Agents can manage their profiles independently.

---

## Phase 12: User Story 10 - Public API Endpoints for WordPress Integration (Priority: P3)

**Goal**: Provide public API endpoints for WordPress site to fetch agents and search properties across network

**Independent Test**: Make GET request to /api/public/agents, verify JSON response with all active agents. Make GET request to /api/public/properties with query params (?transaction_type=sale&bedrooms=3), verify filtered results. Check CORS headers allow WordPress domain. Verify 5-minute caching works.

### Tests for User Story 10

- [ ] T289 [P] [US10] Contract test for GET /api/public/agents in tests/contract/public-agents.spec.ts
- [ ] T290 [P] [US10] Contract test for GET /api/public/properties in tests/contract/public-properties.spec.ts
- [ ] T291 [P] [US10] Integration test for CORS headers in tests/integration/public-api-cors.spec.ts
- [ ] T292 [P] [US10] Integration test for cache behavior in tests/integration/public-api-cache.spec.ts

### Implementation for User Story 10

**Public Agents Endpoint**

- [ ] T293 [P] [US10] Implement GET /api/public/agents endpoint (return active agents only) in apps/dashboard/app/api/public/agents/route.ts
- [ ] T294 [US10] Add CORS headers for WordPress domain in public agents endpoint
- [ ] T295 [US10] Add 5-minute cache headers in public agents endpoint
- [ ] T296 [US10] Format response: id, name (first + last), email, phone, bio, subdomain, avatar_url

**Public Properties Endpoint**

- [ ] T297 [P] [US10] Implement GET /api/public/properties endpoint with query filters in apps/dashboard/app/api/public/properties/route.ts
- [ ] T298 [US10] Add query parameter handling: transaction_type, min_price, max_price, bedrooms, postcode, location
- [ ] T299 [US10] Add CORS headers for WordPress domain in public properties endpoint
- [ ] T300 [US10] Add 5-minute cache headers in public properties endpoint
- [ ] T301 [US10] Format response with agent info and property link URL

**WordPress Widget Documentation**

- [ ] T302 [P] [US10] Create WordPress integration guide in specs/001-multi-agent-platform/wordpress-integration.md
- [ ] T303 [P] [US10] Create JavaScript widget example code for agent directory
- [ ] T304 [P] [US10] Create JavaScript widget example code for property search

**Checkpoint**: At this point, User Story 10 should be fully functional. WordPress site can integrate with public APIs.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Accessibility

- [ ] T305 [P] Install accessibility testing: @axe-core/playwright, eslint-plugin-jsx-a11y
- [ ] T306 [P] Create accessibility test suite in tests/e2e/accessibility.spec.ts
- [ ] T307 Run accessibility audit on all dashboard pages, fix violations
- [ ] T308 Run accessibility audit on all agent site pages, fix violations
- [ ] T309 [P] Add skip links to dashboard layout in apps/dashboard/app/layout.tsx
- [ ] T310 [P] Add skip links to agent site layout in apps/agent-site/src/layouts/BaseLayout.astro
- [ ] T311 Verify keyboard navigation works for all interactive elements
- [ ] T312 Test with screen readers (NVDA/VoiceOver) and fix issues

### Performance Optimization

- [ ] T313 [P] Run Lighthouse audit on agent sites, optimize to 95+ scores
- [ ] T314 [P] Add database query performance monitoring in apps/dashboard/lib/perf-monitor.ts
- [ ] T315 Optimize slow database queries (add indexes, use joins instead of N+1)
- [ ] T316 [P] Implement Next.js image optimization for dashboard in apps/dashboard/components/optimized-image.tsx
- [ ] T317 [P] Configure Astro image optimization for agent sites in apps/agent-site/astro.config.mjs
- [ ] T318 Add CDN caching headers for static assets
- [ ] T319 [P] Implement lazy loading for images below fold in agent sites
- [ ] T320 Profile API endpoint response times, optimize to <200ms p95

### Security Hardening

- [ ] T321 [P] Implement rate limiting middleware in apps/dashboard/middleware.ts
- [ ] T322 [P] Add helmet.js security headers in apps/dashboard/middleware.ts
- [ ] T323 Add input sanitization for rich text content (DOMPurify) in apps/dashboard/lib/sanitize.ts
- [ ] T324 Verify RLS policies work correctly (test with different user roles)
- [ ] T325 [P] Add CSRF protection for form submissions
- [ ] T326 Audit API routes for service role key exposure (ensure never client-side)
- [ ] T327 [P] Implement webhook replay protection (track processed webhook IDs) in apps/dashboard/lib/webhook-security.ts
- [ ] T328 Run OWASP Top 10 security checklist and fix issues

### Monitoring & Observability

- [ ] T329 [P] Setup Sentry in apps/dashboard/lib/sentry.ts
- [ ] T330 [P] Setup Vercel Analytics in apps/dashboard/app/layout.tsx
- [ ] T331 [P] Create custom metrics dashboard in apps/dashboard/app/(admin)/metrics/page.tsx
- [ ] T332 Implement build queue depth metric
- [ ] T333 Implement webhook success rate metric
- [ ] T334 Implement API response time tracking
- [ ] T335 [P] Configure alert thresholds in monitoring service

### Email Templates & Notifications

- [ ] T336 [P] Create content submission received email in packages/email/templates/content-submitted.tsx
- [ ] T337 [P] Create weekly summary email template in packages/email/templates/weekly-summary.tsx
- [ ] T338 Implement weekly summary cron job in apps/dashboard/app/api/cron/weekly-summary/route.ts

### Documentation & Developer Experience

- [ ] T339 [P] Verify quickstart.md is accurate and complete
- [ ] T340 [P] Create deployment guide in specs/001-multi-agent-platform/deployment.md
- [ ] T341 [P] Create API documentation site from openapi.yaml using Swagger UI
- [ ] T342 [P] Add inline code comments for complex logic
- [ ] T343 Update README.md with architecture diagram and links to docs

### Testing & Quality

- [ ] T344 [P] Add unit tests for validation schemas in packages/validation/
- [ ] T345 [P] Add unit tests for utilities and helpers in apps/dashboard/lib/
- [ ] T346 Verify all E2E tests pass
- [ ] T347 Verify all contract tests pass
- [ ] T348 Verify all integration tests pass
- [ ] T349 Run test coverage report, ensure 70%+ for critical business logic
- [ ] T350 [P] Add CI/CD pipeline in .github/workflows/ci.yml
- [ ] T351 [P] Add deployment workflow in .github/workflows/deploy.yml

### Final Validation

- [ ] T352 Run full manual test of all 10 user stories
- [ ] T353 Verify all functional requirements (FR-001 through FR-248) are met
- [ ] T354 Verify all success criteria (SC-001 through SC-020) are achieved
- [ ] T355 Run Lighthouse audit on 3 sample agent sites, verify 95+ scores
- [ ] T356 Run security audit, verify OWASP Top 10 compliance
- [ ] T357 Run accessibility audit, verify WCAG 2.1 AA compliance
- [ ] T358 Performance test: Verify 20 concurrent builds work without degradation
- [ ] T359 Load test: Verify 100+ concurrent dashboard users supported
- [ ] T360 Webhook stress test: Verify 10 webhooks/second processed correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-12)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P2) → US6 (P2) → US7 (P3) → US8 (P3) → US9 (P3) → US10 (P3)
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

**P1 Stories (Must complete for MVP)**:
- **User Story 1 (US1)**: Agent Account Creation - No dependencies on other stories
- **User Story 2 (US2)**: Property Synchronization - No dependencies on other stories (but integrates with US1 agent data)
- **User Story 3 (US3)**: Content Creation & Approval - Depends on US5 (build system) for publish workflow

**P2 Stories (High priority)**:
- **User Story 4 (US4)**: Territory Assignment - Independent, no dependencies
- **User Story 5 (US5)**: Static Site Build - Depends on US1 (agents exist), US2 (properties exist), US3 (content exists)
- **User Story 6 (US6)**: Admin Agent Management - Depends on US1 (agents exist)

**P3 Stories (Can be added incrementally)**:
- **User Story 7 (US7)**: Global Content - Depends on US5 (build system)
- **User Story 8 (US8)**: Agent Analytics - Independent, can add anytime
- **User Story 9 (US9)**: Agent Profile Self-Management - Depends on US1 (profile exists), US5 (rebuild on save)
- **User Story 10 (US10)**: WordPress Public API - Depends on US1 (agents), US2 (properties)

### Critical Path for MVP

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundational) ← BLOCKING
  ↓
Phase 3 (US1: Agent Creation) + Phase 4 (US2: Property Sync) [can run in parallel]
  ↓
Phase 5 (US3: Content Creation) + Phase 7 (US5: Build System) [can run in parallel]
  ↓
Phase 8 (US6: Admin Management) [optional for MVP]
  ↓
MVP COMPLETE ← Can deploy and test with real users
```

### Parallel Opportunities

**Within Setup Phase (Phase 1)**:
- T002-T009 (create directories) can all run in parallel
- T011-T018 (config files) can all run in parallel

**Within Foundational Phase (Phase 2)**:
- T020-T028 (database migrations) can run in parallel
- T031-T039 (RLS policies) can run in parallel
- T041-T048 (TypeScript types and Zod schemas) can run in parallel
- T061-T070 (shadcn/ui components) can run in parallel
- T071-T075 (test infrastructure) can run in parallel

**User Story Level**:
- Once Foundational completes, US1 and US2 can start in parallel (different codebases)
- US4 (Territories) can be developed in parallel with US3/US5
- US8 (Analytics), US9 (Profile), US10 (Public API) are all independent

**Within Each User Story**:
- All test tasks marked [P] can run in parallel
- Model/component tasks marked [P] can run in parallel
- Different developers can work on different components simultaneously

---

## Parallel Example: User Story 1 (Agent Creation)

```bash
# Launch all tests for US1 in parallel:
claude code task "E2E test for admin creates agent flow in tests/e2e/agent-creation.spec.ts"
claude code task "E2E test for agent first login and password change in tests/e2e/agent-first-login.spec.ts"
claude code task "E2E test for agent profile update in tests/e2e/agent-profile-update.spec.ts"

# After tests fail (expected), launch components in parallel:
claude code task "Create agent creation form component in apps/dashboard/components/admin/create-agent-form.tsx"
claude code task "Create agent list page in apps/dashboard/app/(admin)/agents/page.tsx"
claude code task "Create welcome email template using React Email in packages/email/templates/welcome.tsx"

# Then sequentially:
# T084: API endpoint (depends on form and email template being ready)
# T085: List endpoint
```

---

## Parallel Example: User Story 5 (Build System)

```bash
# Launch all Astro page creation in parallel:
claude code task "Create homepage in apps/agent-site/src/pages/index.astro"
claude code task "Create about page in apps/agent-site/src/pages/about.astro"
claude code task "Create services page in apps/agent-site/src/pages/services.astro"
claude code task "Create properties page in apps/agent-site/src/pages/properties/index.astro"
claude code task "Create blog archive page in apps/agent-site/src/pages/blog/index.astro"

# Launch all components in parallel:
claude code task "Create Hero component in apps/agent-site/src/components/Hero.astro"
claude code task "Create PropertyCard component in apps/agent-site/src/components/PropertyCard.astro"
claude code task "Create BlogCard component in apps/agent-site/src/components/BlogCard.astro"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3, 5 Only)

This is the minimum viable product that delivers core value:

1. **Complete Phase 1**: Setup (T001-T018) - 18 tasks
2. **Complete Phase 2**: Foundational (T019-T075) - 57 tasks
3. **Complete Phase 3**: User Story 1 - Agent Creation (T076-T098) - 23 tasks
4. **Complete Phase 4**: User Story 2 - Property Sync (T099-T118) - 20 tasks
5. **Complete Phase 5**: User Story 3 - Content Creation (T119-T146) - 28 tasks
6. **Complete Phase 7**: User Story 5 - Build System (T171-T219) - 49 tasks
7. **STOP and VALIDATE**: Test all 4 stories independently
8. **MVP Ready**: Can onboard 16 agents, sync properties, approve content, deploy sites

**MVP Total**: ~195 tasks
**Estimated Time**: 6-8 weeks with 2-3 developers

### Incremental Delivery

After MVP:

1. **Add User Story 6**: Admin Agent Management (T220-T240) - 21 tasks
   - **Value**: Better admin UX for managing multiple agents
   - **Time**: 1 week

2. **Add User Story 4**: Territory Assignment (T147-T170) - 24 tasks
   - **Value**: Geographic organization and market intelligence
   - **Time**: 1.5 weeks

3. **Add User Story 7**: Global Content (T241-T256) - 16 tasks
   - **Value**: Platform-wide template updates
   - **Time**: 1 week

4. **Add User Story 8**: Analytics (T257-T278) - 22 tasks
   - **Value**: Agent performance insights
   - **Time**: 1 week

5. **Add User Story 9**: Profile Self-Management (T279-T288) - 10 tasks
   - **Value**: Agent autonomy, reduced admin workload
   - **Time**: 3 days

6. **Add User Story 10**: WordPress Integration (T289-T304) - 16 tasks
   - **Value**: Main site integration for lead generation
   - **Time**: 3 days

7. **Complete Phase 13**: Polish (T305-T360) - 56 tasks
   - **Value**: Production-ready quality, security, performance
   - **Time**: 2 weeks

**Full Platform Total**: ~360 tasks
**Estimated Time**: 12-14 weeks with 2-3 developers

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

**Week 1-2**:
- Developer A: User Story 1 (Agent Creation)
- Developer B: User Story 2 (Property Sync)
- Developer C: User Story 5 (Build System - setup only)

**Week 3-4**:
- Developer A: User Story 3 (Content Creation)
- Developer B: User Story 6 (Admin Management)
- Developer C: User Story 5 (Build System - complete)

**Week 5-6**:
- Developer A: User Story 4 (Territories)
- Developer B: User Story 8 (Analytics)
- Developer C: User Story 7 (Global Content)

**Week 7-8**:
- All: Polish phase (accessibility, performance, security)

---

## Task Count Summary

| Phase | User Story | Priority | Task Count | Estimated Time |
|-------|------------|----------|------------|----------------|
| 1 | Setup | - | 18 | 2 days |
| 2 | Foundational | - | 57 | 1 week |
| 3 | US1: Agent Creation | P1 | 23 | 1 week |
| 4 | US2: Property Sync | P1 | 20 | 1 week |
| 5 | US3: Content Creation | P1 | 28 | 1.5 weeks |
| 6 | US4: Territories | P2 | 24 | 1.5 weeks |
| 7 | US5: Build System | P2 | 49 | 2 weeks |
| 8 | US6: Admin Management | P2 | 21 | 1 week |
| 9 | US7: Global Content | P3 | 16 | 1 week |
| 10 | US8: Analytics | P3 | 22 | 1 week |
| 11 | US9: Profile Self-Mgmt | P3 | 10 | 3 days |
| 12 | US10: WordPress API | P3 | 16 | 3 days |
| 13 | Polish | - | 56 | 2 weeks |
| **Total** | | | **360** | **14 weeks** |

### Parallel Execution Potential

- **36% of tasks** (130 tasks) marked [P] can run in parallel
- **User stories** can be worked on in parallel by different developers
- With 3 developers working in parallel, estimated time reduces to **10-12 weeks**

### MVP Task Count

- Setup + Foundational + US1 + US2 + US3 + US5 = **195 tasks**
- With 2-3 developers: **6-8 weeks** to MVP
- MVP delivers: Agent onboarding, property sync, content moderation, static site generation

---

## Notes

- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Checkpoints**: Stop after each user story phase to validate independently
- **Test-first**: All test tasks should be written and verified to FAIL before implementation
- **Commit frequently**: Commit after each task or logical group of tasks
- **MVP mindset**: Focus on US1, US2, US3, US5 first for fastest time to value
- **Avoid coupling**: Each user story should work independently (loose integration, not tight coupling)
- **Quality gates**: Don't move to next phase until current phase tests pass

---

## Next Steps

### To Start Implementation

1. **Run Setup Phase**: Execute T001-T018 to initialize project structure
2. **Run Foundational Phase**: Execute T019-T075 to set up database, auth, UI components
3. **Choose MVP or Full**:
   - **MVP path**: Execute Phases 3, 4, 5, 7 (US1, US2, US3, US5) - 195 tasks
   - **Full path**: Execute all phases sequentially - 360 tasks
4. **Use `/speckit.implement`**: Auto-execute tasks in dependency order
5. **Manual execution**: Use todo list to track progress through each phase

### Validation Checkpoints

- After Phase 2: Verify database, auth, and UI foundation works
- After Phase 3: Test agent creation end-to-end
- After Phase 4: Test property webhook end-to-end
- After Phase 5: Test content approval workflow end-to-end
- After Phase 7: Test full build and deployment end-to-end
- After MVP: Onboard 2-3 test agents, create real content, verify sites work
- After each additional story: Verify it works independently without breaking previous stories
- Before production: Complete Phase 13 (Polish) for security, performance, accessibility
