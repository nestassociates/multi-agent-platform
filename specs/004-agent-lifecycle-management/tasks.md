# Tasks: Agent Lifecycle Management

**Input**: Design documents from `/specs/004-agent-lifecycle-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on Turborepo monorepo structure:
- **Dashboard**: `apps/dashboard/`
- **Packages**: `packages/`
- **Database**: `supabase/migrations/`
- **Tests**: `tests/`

---

## Phase 1: Database Schema Changes

**Purpose**: Add new tables and columns to support agent lifecycle

- [x] T001 [P] Create migration to expand agents.status enum in supabase/migrations/20251125000001_expand_agent_status.sql
- [x] T002 [P] Create migration for agent_onboarding_checklist table in supabase/migrations/20251125000002_create_onboarding_checklist.sql
- [x] T003 [P] Create migration to add agents.branch_name column in supabase/migrations/20251125000003_add_branch_name.sql
- [x] T004 [P] Create migration to add indexes on agents.status and agents.apex27_branch_id in supabase/migrations/20251125000004_add_indexes.sql
- [x] T005 Create migration to migrate existing agents to 'active' status in supabase/migrations/20251125000005_migrate_existing_agents.sql
- [x] T006 Apply all migrations and verify schema changes

---

## Phase 2: TypeScript Types & Validation

**Purpose**: Update shared types and validation schemas

- [x] T007 [P] Update Agent type in packages/shared-types/src/entities.ts to include new status values and branch_name
- [x] T008 [P] Create AgentOnboardingChecklist type in packages/shared-types/src/entities.ts
- [x] T009 [P] Update agent validation schema in packages/validation/src/agent.ts to include new status enum
- [x] T010 [P] Create activation/deactivation request schemas in packages/validation/src/agent.ts
- [x] T011 [P] Create checklist update schema in packages/validation/src/agent.ts

---

## Phase 3: User Story 1 - Auto-Detect Agents from Apex27 (Priority: P1)

**Goal**: Automatically detect new agents from Apex27 property data and create draft agent records

**Independent Test**: Send webhook with new branch_id, verify draft agent created, verify admin email sent, verify properties assigned, verify NO site build triggered

### Implementation for User Story 1

**Auto-Detection Service**

- [x] T012 [P] [US1] Create agent detection service in apps/dashboard/lib/services/agent-detection.ts
- [x] T013 [US1] Implement ensureAgentExists() function with idempotent logic in agent-detection.ts
- [x] T014 [US1] Implement scanPropertiesForNewAgents() function in agent-detection.ts
- [x] T015 [US1] Implement notifyAdminNewAgent() email function in agent-detection.ts

**Webhook Integration**

- [x] T016 [US1] Modify Apex27 webhook handler in apps/dashboard/app/api/webhooks/apex27/route.ts to call ensureAgentExists()
- [x] T017 [US1] Add unique constraint check for agents.apex27_branch_id in webhook handler
- [x] T018 [US1] Add error handling for duplicate branch_id in webhook handler

**Admin Notification**

- [x] T019 [P] [US1] Create agent-detected email template in packages/email/templates/agent-detected.tsx
- [x] T020 [US1] Integrate email sending in agent detection service

**Manual Trigger**

- [x] T021 [P] [US1] Create POST /api/admin/agents/auto-detect endpoint in apps/dashboard/app/api/admin/agents/auto-detect/route.ts
- [x] T022 [US1] Implement scan all properties logic in auto-detect endpoint

**Checkpoint**: New agents auto-created from Apex27, admins notified, no builds triggered

---

## Phase 4: User Story 2 - Admin Agent Setup (Priority: P1)

**Goal**: Enable admins to create user accounts for draft agents

**Independent Test**: Find draft agent in list, click "Setup", create user account, verify welcome email sent, verify status changes to 'pending_profile'

### Implementation for User Story 2

**UI Components**

- [x] T023 [P] [US2] Create agent status badge component in apps/dashboard/components/admin/agent-status-badge.tsx
- [x] T024 [P] [US2] Create agent auto-detect banner component in apps/dashboard/components/admin/agent-auto-detect-banner.tsx
- [x] T025 [US2] Modify agents list page in apps/dashboard/app/(admin)/agents/page.tsx to add status filter
- [x] T026 [US2] Add "Setup" action button for draft agents in agents list page

**Agent Creation Updates**

- [x] T027 [US2] Modify POST /api/admin/agents endpoint in apps/dashboard/app/api/admin/agents/route.ts to set status='pending_profile'
- [x] T028 [US2] Add checklist creation in POST /api/admin/agents endpoint
- [x] T029 [US2] Update checklist.user_created and checklist.welcome_email_sent in endpoint

**Status Filter**

- [x] T030 [US2] Add status query parameter to GET /api/admin/agents endpoint in apps/dashboard/app/api/admin/agents/route.ts
- [x] T031 [US2] Implement status filtering logic in GET endpoint

**Checkpoint**: Admins can setup draft agents, status tracking works

---

## Phase 5: User Story 3 - Agent Profile Completion (Priority: P1)

**Goal**: Track agent profile completion and auto-transition status when complete

**Independent Test**: Log in as agent, complete profile fields one-by-one, see progress percentage update, complete final field, verify status auto-changes to 'pending_admin', verify admin notified

### Implementation for User Story 3

**Profile Completion Service**

- [x] T032 [P] [US3] Create profile completion calculator in apps/dashboard/lib/services/profile-completion.ts
- [x] T033 [US3] Implement calculateProfileCompletion() function (6 required fields)
- [x] T034 [US3] Implement updateChecklistProgress() function

**Profile API Integration**

- [x] T035 [US3] Modify PATCH /api/agent/profile endpoint in apps/dashboard/app/api/agent/profile/route.ts
- [x] T036 [US3] Add profile completion calculation after each profile update
- [x] T037 [US3] Add auto-status transition when completion reaches 100%
- [x] T038 [US3] Add admin notification email when agent ready for review

**Email Template**

- [x] T039 [P] [US3] Create profile-complete email template in packages/email/templates/profile-complete.tsx

**UI Updates**

- [x] T040 [P] [US3] Add profile completion progress bar to apps/dashboard/app/(agent)/profile/page.tsx
- [x] T041 [US3] Display checklist of required fields in profile page

**Checkpoint**: Profile completion tracked, auto-transitions work, admins notified

---

## Phase 6: User Story 4 - Admin Approval & Activation (Priority: P1)

**Goal**: Enable admins to review and approve agents, triggering site deployment

**Independent Test**: View agent pending admin approval, review onboarding checklist, click "Approve & Deploy", verify status='active', verify build queued, verify agent receives email, verify site deploys

### Implementation for User Story 4

**Activation Service**

- [x] T042 [P] [US4] Create agent activation service in apps/dashboard/lib/services/agent-activation.ts
- [x] T043 [US4] Implement activateAgent() function (status update, checklist update, queue build, audit log)
- [x] T044 [US4] Implement validateReadyForActivation() function (check profile complete)
- [x] T045 [US4] Implement queueActivationBuild() function (P1 priority build)

**Activation API**

- [x] T046 [P] [US4] Create POST /api/admin/agents/[id]/activate endpoint in apps/dashboard/app/api/admin/agents/[id]/activate/route.ts
- [x] T047 [US4] Implement activation validation in endpoint
- [x] T048 [US4] Call activation service from endpoint
- [x] T049 [US4] Add error handling for duplicate activation

**Onboarding Checklist UI**

- [x] T050 [P] [US4] Create onboarding checklist component in apps/dashboard/components/admin/agent-onboarding-checklist.tsx
- [x] T051 [P] [US4] Create GET /api/admin/agents/[id]/checklist endpoint in apps/dashboard/app/api/admin/agents/[id]/checklist/route.ts
- [x] T052 [US4] Add "Onboarding" tab to agent detail page in apps/dashboard/app/(admin)/agents/[id]/page.tsx
- [x] T053 [US4] Display checklist component in onboarding tab
- [x] T054 [US4] Add "Approve & Deploy Site" button to onboarding tab

**Email Template**

- [x] T055 [P] [US4] Create site-activated email template in packages/email/templates/site-activated.tsx
- [x] T056 [US4] Send activation email after successful activation

**Build System Integration**

- [x] T057 [US4] Modify build processor in packages/build-system/builder.ts to filter by agents.status='active'
- [x] T058 [US4] Add JOIN with agents table in build queue query
- [x] T059 [US4] Add logging for skipped builds (non-active agents)

**Audit Logging**

- [x] T060 [US4] Add audit log entry on activation in activation service
- [x] T061 [US4] Include activated_by_user_id and timestamp in audit log

**Checkpoint**: Admins can activate agents, sites deploy only for active agents, audit trail complete

---

## Phase 7: User Story 5 - Agent Status Management (Priority: P2)

**Goal**: Enable admins to deactivate, reactivate, and suspend agents

**Independent Test**: Deactivate active agent, verify no new builds processed, verify site stays live, reactivate agent, verify builds resume

### Implementation for User Story 5

**Deactivation Service**

- [x] T062 [P] [US5] Implement deactivateAgent() function in apps/dashboard/lib/services/agent-activation.ts
- [x] T063 [P] [US5] Implement reactivateAgent() function in agent-activation.ts
- [x] T064 [P] [US5] Implement suspendAgent() function in agent-activation.ts

**Deactivation API**

- [x] T065 [P] [US5] Create POST /api/admin/agents/[id]/deactivate endpoint in apps/dashboard/app/api/admin/agents/[id]/deactivate/route.ts
- [x] T066 [US5] Add deactivation reason validation (required, min 10 chars)
- [x] T067 [US5] Update checklist with deactivation metadata

**Status Transition Guards**

- [x] T068 [P] [US5] Create status transition validator in apps/dashboard/lib/services/status-validator.ts
- [x] T069 [US5] Implement canTransition() function with allowed transitions map
- [x] T070 [US5] Add transition validation to all status change endpoints

**UI Actions**

- [x] T071 [P] [US5] Add "Deactivate" action to agent detail page in apps/dashboard/app/(admin)/agents/[id]/page.tsx
- [x] T072 [P] [US5] Add "Reactivate" action for inactive agents
- [x] T073 [P] [US5] Add "Suspend" action with confirmation dialog
- [x] T074 [US5] Add deactivation reason input modal

**Bulk Operations**

- [x] T075 [P] [US5] Add bulk status update UI to agents list page
- [x] T076 [US5] Create POST /api/admin/agents/bulk-update endpoint in apps/dashboard/app/api/admin/agents/bulk-update/route.ts
- [x] T077 [US5] Implement bulk status change logic with transaction

**Status History**

- [x] T078 [P] [US5] Display status change history in agent detail page
- [x] T079 [US5] Query audit_logs for status changes
- [x] T080 [US5] Format status timeline with dates and admin names

**Checkpoint**: Complete status management, bulk operations, audit trail for all changes

---

## Phase 8: Polish & Integration

**Purpose**: Final integration, testing, and documentation

**Testing**

- [x] T081 [P] Create integration test for auto-detection in tests/integration/agent-auto-detection.spec.ts
- [x] T082 [P] Create integration test for activation flow in tests/integration/agent-activation.spec.ts
- [x] T083 [P] Create E2E test for complete lifecycle in tests/e2e/agent-lifecycle.spec.ts
- [x] T084 Test auto-detection with real Apex27 webhook
- [x] T085 Test activation flow end-to-end with test agent
- [x] T086 Verify build filtering works (draft agents skipped)

**Documentation**

- [x] T087 [P] Update main README.md to link to agent lifecycle docs
- [x] T088 [P] Create admin guide for agent lifecycle in specs/004-agent-lifecycle-management/admin-guide.md
- [x] T089 [P] Create agent guide for onboarding in specs/004-agent-lifecycle-management/agent-guide.md

**Migration & Deployment**

- [x] T090 Create migration script in apps/dashboard/scripts/migrate-existing-agents.ts
- [ ] T091 Test migration script on staging database
- [ ] T092 Run migration on production database (16 agents → 'active')
- [ ] T093 Verify all existing agents have checklists created
- [ ] T094 Deploy to production and monitor for 24 hours

**Monitoring**

- [x] T095 [P] Add metrics for agent activation time in apps/dashboard/lib/metrics.ts
- [x] T096 [P] Add dashboard widget for draft agents count
- [ ] T097 Monitor auto-detection success rate (should be >99%)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Database): No dependencies - can start immediately
- **Phase 2** (Types): Depends on Phase 1 completion
- **Phase 3** (US1): Depends on Phase 2
- **Phase 4** (US2): Depends on Phase 2 + US1
- **Phase 5** (US3): Depends on Phase 2 + US2
- **Phase 6** (US4): Depends on Phase 2 + US3 (needs completed profiles to activate)
- **Phase 7** (US5): Depends on Phase 6 (needs activation to exist before deactivation)
- **Phase 8** (Polish): Depends on all user stories complete

### User Story Dependencies

```
Phase 1 (Database) + Phase 2 (Types)
  ↓
US1 (Auto-Detect) ← Must complete first
  ↓
US2 (Admin Setup) ← Needs agents to exist
  ↓
US3 (Profile Completion) ← Needs users to exist
  ↓
US4 (Activation) ← Needs completed profiles
  ↓
US5 (Status Management) ← Needs activation to work
```

**Critical Path**: Must be done sequentially in order
**No Parallel Opportunities**: User stories are tightly coupled

### Within-Phase Parallel Opportunities

**Phase 1 (Database)**:
- T001-T004 can run in parallel (different migration files)
- T005 must run after T001-T004 complete

**Phase 2 (Types)**:
- T007-T011 can all run in parallel (different files/sections)

**Phase 3 (US1)**:
- T012-T015 can run in parallel (service functions)
- T019 can run in parallel (email template)
- T021-T022 can run in parallel (separate endpoint)

**Phase 4 (US2)**:
- T023-T024 can run in parallel (UI components)
- T027-T029 can run in parallel (same file, different logic)

**Phase 5 (US3)**:
- T032-T034 can run in parallel (service functions)
- T039-T041 can run in parallel (different files)

**Phase 6 (US4)**:
- T042-T045 can run in parallel (service functions)
- T050-T051 can run in parallel (different files)
- T055 can run in parallel (email template)

**Phase 7 (US5)**:
- T062-T064 can run in parallel (service functions)
- T071-T073 can run in parallel (UI components)
- T075-T076 can run in parallel (different files)

**Phase 8 (Polish)**:
- T081-T083 can run in parallel (test files)
- T087-T089 can run in parallel (documentation)
- T095-T096 can run in parallel (monitoring)

---

## Implementation Strategy

### Sequential MVP Approach

Since user stories are dependent, implement in strict order:

**Week 1: Database + Auto-Detection (US1)**
- Day 1: Database migrations (T001-T006)
- Day 2: Types & validation (T007-T011)
- Day 3-4: Auto-detection service (T012-T022)

**Week 2: Admin Setup + Profile Completion (US2 + US3)**
- Day 1-2: Admin setup UI (T023-T031)
- Day 3-4: Profile completion tracking (T032-T041)

**Week 3: Activation + Status Management (US4 + US5)**
- Day 1-3: Activation flow (T042-T061)
- Day 4-5: Status management (T062-T080)

**Week 4: Polish & Deploy**
- Day 1-2: Testing (T081-T086)
- Day 3: Documentation (T087-T089)
- Day 4-5: Migration & deployment (T090-T097)

**Total Time**: 4 weeks for complete feature

### Testing Strategy

**Manual Testing After Each Phase:**
- After US1: Trigger webhook, verify agent created
- After US2: Setup draft agent, verify email sent
- After US3: Complete profile, verify auto-transition
- After US4: Activate agent, verify build triggered
- After US5: Deactivate/reactivate, verify builds filter correctly

**Integration Testing:**
- T081-T083: Automated tests for full lifecycle
- T084-T086: Real-world verification

---

## Task Count Summary

| Phase | User Story | Priority | Task Count | Estimated Time |
|-------|------------|----------|------------|----------------|
| 1 | Database | - | 6 | 1 day |
| 2 | Types | - | 5 | 0.5 day |
| 3 | US1: Auto-Detect | P1 | 11 | 2 days |
| 4 | US2: Admin Setup | P1 | 9 | 2 days |
| 5 | US3: Profile Completion | P1 | 10 | 2 days |
| 6 | US4: Activation | P1 | 20 | 3 days |
| 7 | US5: Status Management | P2 | 19 | 2.5 days |
| 8 | Polish | - | 17 | 3 days |
| **Total** | | | **97** | **16 days** |

### Parallel Execution Potential

- **42% of tasks** (41 tasks) marked [P] can run in parallel
- However, user stories must be sequential (dependencies)
- Parallel opportunities exist within each phase
- With 1 developer: 16 days
- With 2 developers (pair programming per phase): 12 days

### MVP Scope

**Minimum Viable Product** (US1-US4):
- Database + Types + US1 + US2 + US3 + US4 = **61 tasks**
- **Estimated Time**: 10-12 days
- **Delivers**: Auto-detection, admin setup, profile tracking, activation with site deployment

**US5 can be added later** (status management is enhancement, not core requirement)

---

## Validation Checkpoints

After each phase:
- **Phase 1**: Verify migrations applied, existing agents have status='active'
- **Phase 2**: Verify types compile, no TypeScript errors
- **Phase 3**: Verify auto-detection creates draft agents
- **Phase 4**: Verify admin can setup draft agents
- **Phase 5**: Verify profile completion triggers status change
- **Phase 6**: Verify activation triggers build
- **Phase 7**: Verify deactivation stops builds
- **Phase 8**: All tests pass, documentation complete

---

## Next Steps

### To Start Implementation

1. **Create feature branch**: `git checkout -b 004-agent-lifecycle-management` (DONE)
2. **Run `/speckit.implement`**: Auto-execute tasks in dependency order
3. **OR Manual execution**: Work through tasks T001-T097 sequentially
4. **Test after each phase**: Verify checkpoint criteria met
5. **Deploy when ready**: After all tasks complete and tests pass

### Migration Plan for Existing 16 Agents

**Before Starting Implementation:**
```sql
-- Backup agents table
SELECT * INTO agents_backup FROM agents;

-- After Phase 1 complete, verify:
SELECT id, subdomain, status FROM agents;
-- All should have status='active'

-- Verify checklists:
SELECT COUNT(*) FROM agent_onboarding_checklist;
-- Should return: 16
```

**Rollback Plan:**
```sql
-- If migration fails
TRUNCATE agent_onboarding_checklist;
UPDATE agents SET status = 'active';
```

---

## Notes

- **Sequential Dependencies**: User stories MUST be completed in order (US1→US2→US3→US4→US5)
- **[P] tasks**: Within each phase, these can run in parallel
- **Checkpoints**: Test after each user story phase before proceeding
- **Migration First**: Complete Phase 1 before any code changes
- **Backwards Compatible**: Existing agents continue working throughout migration
- **No Breaking Changes**: All changes are additive or have migration strategy
