# Tasks: Redis Rate Limiting & OpenAPI Documentation

**Input**: Design documents from `/specs/007-redis-ratelimit-openapi/`
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

**Purpose**: Install dependencies and configure environment

- [x] T001 Install Upstash dependencies: `pnpm add @upstash/ratelimit @upstash/redis --filter=@nest/dashboard`
- [x] T002 Install OpenAPI dependencies: `pnpm add @asteasolutions/zod-to-openapi swagger-ui-react --filter=@nest/dashboard`
- [x] T003 Install OpenAPI type definitions: `pnpm add -D @types/swagger-ui-react --filter=@nest/dashboard`
- [x] T004 Add environment variables to `.env.local.example` for UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create Upstash Redis client in `apps/dashboard/lib/redis.ts`
- [x] T006 Create OpenAPI directory structure: `apps/dashboard/lib/openapi/`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Distributed Rate Limiting (Priority: P1) 🎯 MVP

**Goal**: Replace in-memory rate limiting with Upstash Redis for distributed persistence across server instances and deployments

**Independent Test**: Deploy to multiple server instances and verify rate limits persist across requests routed to different servers. Test that redeployment preserves rate limit state.

### Implementation for User Story 1

- [x] T007 [US1] Create rate limiters configuration (login: 5/15min, contact: 5/1hr) in `apps/dashboard/lib/redis.ts`
- [x] T008 [US1] Refactor `apps/dashboard/lib/rate-limiter.ts` to use Upstash Redis with graceful degradation (fail-open)
- [x] T009 [US1] Maintain backwards-compatible interface: `isRateLimited()`, `getRemainingAttempts()`, `resetRateLimit()`, `getResetTime()`
- [x] T010 [US1] Update `apps/dashboard/app/api/auth/login/route.ts` to use new rate limiter (verify existing usage)
- [x] T011 [US1] Update `apps/dashboard/app/api/public/contact/route.ts` to use new Redis-based rate limiter with IP identifier
- [x] T012 [US1] Add error logging for rate limit storage failures in `apps/dashboard/lib/rate-limiter.ts`
- [x] T013 [US1] Add rate limit response headers (X-RateLimit-Remaining, X-RateLimit-Reset) to rate-limited endpoints

**Checkpoint**: Rate limiting should now persist across deployments and server instances

---

## Phase 4: User Story 2 - API Documentation Portal (Priority: P2)

**Goal**: Provide interactive API documentation with Swagger UI at `/api-docs`, auto-generated from existing Zod schemas

**Independent Test**: Access `/api-docs` and verify all 39 API endpoints are documented with correct request/response schemas. Use "Try it out" to execute test requests.

### Implementation for User Story 2

- [x] T014 [P] [US2] Create OpenAPI registry with Zod schema registration in `apps/dashboard/lib/openapi/registry.ts`
- [x] T015 [P] [US2] Register all validation schemas from `@nest/validation` (auth, agent, content, contact, fees, global-content, property, territory, webhooks)
- [x] T016 [US2] Define Auth API routes (/api/auth/*) in `apps/dashboard/lib/openapi/routes/auth.ts`
- [x] T017 [P] [US2] Define Admin Agent routes (/api/admin/agents/*) in `apps/dashboard/lib/openapi/routes/admin-agents.ts`
- [x] T018 [P] [US2] Define Admin Content routes (/api/admin/content/*) in `apps/dashboard/lib/openapi/routes/admin-content.ts`
- [x] T019 [P] [US2] Define Admin Global Content routes (/api/admin/global-content/*) in `apps/dashboard/lib/openapi/routes/admin-global.ts`
- [x] T020 [P] [US2] Define Admin Territory routes (/api/admin/territories/*) in `apps/dashboard/lib/openapi/routes/admin-territories.ts`
- [x] T021 [P] [US2] Define Agent routes (/api/agent/*) in `apps/dashboard/lib/openapi/routes/agent.ts`
- [x] T022 [P] [US2] Define Public routes (/api/public/*) in `apps/dashboard/lib/openapi/routes/public.ts`
- [x] T023 [P] [US2] Define Webhook routes (/api/webhooks/*) in `apps/dashboard/lib/openapi/routes/webhooks.ts`
- [x] T024 [US2] Create route index combining all route definitions in `apps/dashboard/lib/openapi/routes/index.ts`
- [x] T025 [US2] Create OpenAPI spec generator in `apps/dashboard/lib/openapi/spec.ts`
- [x] T026 [US2] Create OpenAPI JSON endpoint in `apps/dashboard/app/api/openapi.json/route.ts`
- [x] T027 [US2] Create dynamic Swagger UI component in `apps/dashboard/components/swagger-ui.tsx`
- [x] T028 [US2] Create API docs page in `apps/dashboard/app/api-docs/page.tsx`
- [x] T029 [US2] Add admin-only access control to `/api-docs` route (optional: dev-only in production)

**Checkpoint**: API documentation should be accessible at `/api-docs` with interactive Swagger UI

---

## Phase 5: User Story 3 - Rate Limit Feedback (Priority: P3)

**Goal**: Provide clear user feedback when rate-limited, including time until reset

**Independent Test**: Trigger rate limits on login/contact forms and verify user-friendly error messages display with retry timing

### Implementation for User Story 3

- [x] T030 [US3] Update login form error handling to display rate limit message with retry time in `apps/dashboard/app/(auth)/login/page.tsx`
- [x] T031 [US3] Ensure rate limit API responses include `resetAt` timestamp and `remaining` count
- [x] T032 [US3] Update contact form error handling to display rate limit message with retry time (if client-side form exists)
- [x] T033 [US3] Format rate limit time remaining in human-readable format (e.g., "Try again in 5 minutes")

**Checkpoint**: Users should see clear feedback with retry timing when rate-limited

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T034 [P] Add Upstash environment variables to Vercel project (Production + Preview) **[MANUAL - Requires Vercel dashboard access]**
- [x] T035 [P] Update `.env.local.example` with comments explaining each Upstash variable
- [ ] T036 Validate OpenAPI spec against contracts/openapi.yaml reference **[OPTIONAL - No reference file exists]**
- [ ] T037 Run quickstart.md validation steps to verify setup **[OPTIONAL - Manual validation]**
- [ ] T038 [P] Add rate limiter unit tests in `tests/unit/rate-limiter-redis.test.ts` **[OPTIONAL - Deferred]**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 and US3 can proceed in parallel after US1 if desired
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after US1 (depends on rate limit infrastructure being in place)

### Within Each User Story

- Models/utilities before services
- Services before routes
- Routes before UI components
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel
- T014-T015, T017-T023 can run in parallel within US2 (different files)
- T030-T033 can run sequentially (interdependent)
- Polish tasks T034-T038 marked [P] can run in parallel

---

## Parallel Example: User Story 2 (API Documentation)

```bash
# Launch all route definition tasks in parallel:
Task: "T017 [P] [US2] Define Admin Agent routes"
Task: "T018 [P] [US2] Define Admin Content routes"
Task: "T019 [P] [US2] Define Admin Global Content routes"
Task: "T020 [P] [US2] Define Admin Territory routes"
Task: "T021 [P] [US2] Define Agent routes"
Task: "T022 [P] [US2] Define Public routes"
Task: "T023 [P] [US2] Define Webhook routes"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T006)
3. Complete Phase 3: User Story 1 (T007-T013)
4. **STOP and VALIDATE**: Test rate limiting persists across deployments
5. Deploy with production-ready rate limiting

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP with Redis rate limiting!)
3. Add User Story 2 → Test independently → Deploy (adds API docs)
4. Add User Story 3 → Test independently → Deploy (improves UX)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 is critical for production security - prioritize this
- US2 route definitions can all be done in parallel for speed
