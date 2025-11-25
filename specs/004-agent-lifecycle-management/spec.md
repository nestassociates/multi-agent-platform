# Feature Specification: Agent Lifecycle Management

**Feature ID**: 004-agent-lifecycle-management
**Priority**: P1 (Critical for production)
**Status**: In Development
**Created**: 2025-11-25

## Executive Summary

Implement controlled agent onboarding and site deployment workflow. Auto-detect new agents from Apex27 property data, manage onboarding checklist, and provide admin control over when agent microsites are deployed.

## Problem Statement

**Current Issues:**
1. Agents must be manually created by admins (tedious for 16+ agents)
2. No control over when agent sites are first deployed
3. Sites can go live with incomplete profiles
4. No clear onboarding workflow or status tracking
5. Build system deploys all agents regardless of readiness

**Business Impact:**
- Poor first impression if incomplete sites go live
- Admin time wasted on manual agent creation
- No quality control before public deployment
- Confusion about which agents are "ready"

## Goals

### Primary Goals
1. **Auto-detect agents** from Apex27 property data (branch_id)
2. **Control site deployment** - admins activate when ready
3. **Track onboarding progress** with checklist
4. **Prevent incomplete sites** from going live
5. **Streamline admin workflow** for managing 16+ agents

### Success Criteria
- ✅ New Apex27 agents auto-created with status='draft'
- ✅ Properties sync to draft agents (no site deployed)
- ✅ Onboarding checklist tracks completion
- ✅ Sites only deploy for agents with status='active'
- ✅ Admins can activate/deactivate agents
- ✅ Agents can complete their profiles before site goes live

## User Stories

### US1: Auto-Detect Agents from Apex27
**As an** admin
**I want** the system to auto-detect new agents from Apex27 property data
**So that** I don't have to manually create agent records for each branch

**Acceptance Criteria:**
- When property arrives with unknown branch_id, auto-create agent record
- Agent status is 'draft' (not deployed)
- Admin receives email notification about new agent
- Properties are assigned to draft agent
- Draft agents do NOT trigger site builds

### US2: Admin Agent Setup
**As an** admin
**I want** to create user accounts for auto-detected agents
**So that** they can log in and complete their profiles

**Acceptance Criteria:**
- Admin can click "Setup" on draft agent
- Creates user account with email/password
- Sends welcome email to agent
- Agent status changes to 'pending_profile'
- Onboarding checklist updates automatically

### US3: Agent Profile Completion
**As an** agent
**I want** to complete my profile before my site goes live
**So that** my public site has accurate information

**Acceptance Criteria:**
- Agent must fill required fields: bio, photo, phone, qualifications
- System tracks profile completion percentage
- When complete, status changes to 'pending_admin'
- Admin is notified that agent is ready for review

### US4: Admin Approval & Activation
**As an** admin
**I want** to review and approve agent profiles before deploying sites
**So that** only quality, complete sites go live

**Acceptance Criteria:**
- Admin sees onboarding checklist on agent detail page
- Admin can review profile completeness
- "Approve & Deploy Site" button triggers:
  - Status change to 'active'
  - Build queue entry created (P1 priority)
  - Email sent to agent ("Your site is live!")
  - Audit log created
- Site deploys only after approval

### US5: Agent Status Management
**As an** admin
**I want** to manage agent statuses (active/inactive/suspended)
**So that** I can control which agents have live sites

**Acceptance Criteria:**
- Status filter on agents list page
- Bulk status update capability
- Deactivate keeps site live, stops new builds
- Suspend removes site from public access
- Status badges visible throughout UI
- Audit log tracks all status changes

## Technical Specification

### Database Changes

#### 1. Expand `agents.status` Enum

**Current:**
```sql
status TEXT CHECK (status IN ('active', 'inactive'))
```

**New:**
```sql
status TEXT CHECK (status IN ('draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended'))
```

**Status Definitions:**
- `draft` - Auto-created from Apex27, no user account yet
- `pending_profile` - User created, agent needs to complete profile
- `pending_admin` - Profile complete, awaiting admin approval
- `active` - Approved and deployed, site is live
- `inactive` - Temporarily disabled, site stays live but no new builds
- `suspended` - Banned/removed, site taken down

#### 2. New Table: `agent_onboarding_checklist`

```sql
CREATE TABLE agent_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  -- Checklist items
  user_created BOOLEAN DEFAULT false,
  welcome_email_sent BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  profile_completion_pct INTEGER DEFAULT 0,
  admin_approved BOOLEAN DEFAULT false,
  site_deployed BOOLEAN DEFAULT false,

  -- Metadata
  activated_at TIMESTAMPTZ,
  activated_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(agent_id)
);
```

#### 3. Add `branch_name` to `agents`

```sql
ALTER TABLE agents ADD COLUMN branch_name TEXT;
```

### API Changes

#### New Endpoints

**POST /api/admin/agents/auto-detect**
- Manually trigger auto-detection scan
- Returns count of new agents created

**POST /api/admin/agents/:id/activate**
- Approve agent and trigger site deployment
- Request body: `{ reason?: string }`
- Returns: `{ success: true, build_id: string }`

**POST /api/admin/agents/:id/deactivate**
- Set agent to inactive
- Request body: `{ reason: string }`
- Returns: `{ success: true }`

**GET /api/admin/agents/:id/checklist**
- Get onboarding checklist for agent
- Returns: `{ checklist: AgentOnboardingChecklist }`

**PATCH /api/admin/agents/:id/checklist**
- Update checklist item
- Request body: `{ field: string, value: boolean }`

#### Modified Endpoints

**POST /api/admin/agents** (existing)
- Now creates agent with status='pending_profile'
- Auto-creates checklist record
- Sets `user_created=true` in checklist

**GET /api/admin/agents** (existing)
- Add status filter query param
- Add sort by status

### Service Layer

#### New Service: `agent-detection.ts`

```typescript
interface DetectionResult {
  newAgents: Agent[];
  existingAgents: Agent[];
  propertiesAssigned: number;
}

async function detectAgentsFromProperties(): Promise<DetectionResult>
async function autoCreateAgent(branchId: string, branchName?: string): Promise<Agent>
async function notifyAdminNewAgent(agent: Agent): Promise<void>
```

**Trigger Points:**
1. Apex27 webhook handler (on new property)
2. Manual admin trigger
3. Scheduled cron job (daily)

#### Modified Service: `build-processor.ts`

**Current:**
```typescript
// Builds all pending jobs
const { data: pendingBuilds } = await supabase
  .from('build_queue')
  .select('*')
  .eq('status', 'pending');
```

**New:**
```typescript
// Only build ACTIVE agents
const { data: pendingBuilds } = await supabase
  .from('build_queue')
  .select(`
    *,
    agents!inner(status)
  `)
  .eq('status', 'pending')
  .eq('agents.status', 'active');
```

### UI Components

#### New Components

**`components/admin/agent-onboarding-checklist.tsx`**
- Displays checklist with checkmarks
- Shows completion percentage
- "Approve & Deploy" button (when ready)
- Status badge

**`components/admin/agent-status-badge.tsx`**
- Color-coded status indicator
- Tooltip with status description

**`components/admin/agent-auto-detect-banner.tsx`**
- Shows when draft agents exist
- "X new agents detected from Apex27"
- Link to filtered view

#### Modified Components

**`app/(admin)/agents/page.tsx`**
- Add status filter dropdown
- Add status badges to table
- Add "Setup" action for draft agents
- Add bulk status update

**`app/(admin)/agents/[id]/page.tsx`**
- Add "Onboarding" tab
- Display checklist component
- Add activate/deactivate buttons
- Show activation history

### Email Templates

#### New Template: `agent-detected.tsx`

**To:** Admin team
**Subject:** New Agent Detected from Apex27
**Content:**
- Agent branch ID and name
- Number of properties assigned
- Link to setup agent
- Instructions for next steps

#### New Template: `site-activated.tsx`

**To:** Agent
**Subject:** Your Website is Now Live!
**Content:**
- Congratulations message
- Site URL
- Next steps (add content, update info)
- Support contact

#### Modified Template: `welcome.tsx`

**Changes:**
- Add note that site is NOT live yet
- Explain onboarding process
- Set expectations for activation

### Business Logic

#### Profile Completion Rules

**Required Fields:**
- first_name, last_name
- email, phone
- bio (min 100 characters)
- avatar_url (profile photo uploaded)
- qualifications (at least 1)

**Calculation:**
```typescript
function calculateProfileCompletion(profile: Profile, agent: Agent): number {
  let completed = 0;
  const total = 6;

  if (profile.first_name && profile.last_name) completed++;
  if (profile.email && profile.phone) completed++;
  if (profile.bio && profile.bio.length >= 100) completed++;
  if (profile.avatar_url) completed++;
  if (profile.qualifications && profile.qualifications.length > 0) completed++;
  if (agent.subdomain) completed++;

  return Math.round((completed / total) * 100);
}
```

#### Auto-Detection Logic

**When property webhook arrives:**
```typescript
1. Extract branch_id from property data
2. Check if agent exists with this branch_id
3. If not exists:
   a. Create agent record (status='draft')
   b. Create checklist record
   c. Send email to admin
   d. Log audit event
4. Assign property to agent (draft or active)
5. Return success
```

**Prevent duplicates:**
- Unique constraint on `agents.branch_id`
- Idempotent operation (safe to retry)

#### Build Queue Filter Logic

**Current:**
```typescript
// Builds happen for ANY status
processBuilds() // builds all agents
```

**New:**
```typescript
// Only process builds for ACTIVE agents
async function processBuilds() {
  const builds = await fetchPendingBuilds();

  for (const build of builds) {
    const agent = await getAgent(build.agent_id);

    if (agent.status !== 'active') {
      console.log(`Skipping build for ${agent.subdomain} - status: ${agent.status}`);
      continue; // Skip non-active agents
    }

    await processBuild(build);
  }
}
```

## Non-Functional Requirements

### Performance
- Auto-detection should complete in <2 seconds
- Status changes should be immediate (no polling)
- Checklist updates should be real-time

### Security
- Only admins can change agent status
- Only admins can activate sites
- Agents cannot self-activate
- Audit all status changes

### Reliability
- Auto-detection must be idempotent
- Handle duplicate branch_ids gracefully
- Retry failed activations
- Email failures should not block activation

## Migration Strategy

### Existing Agents (16 already created)

**Option A: Migrate All to 'active'**
```sql
UPDATE agents SET status = 'active' WHERE status IS NULL OR status = 'inactive';

INSERT INTO agent_onboarding_checklist (agent_id, user_created, profile_completed, admin_approved, site_deployed, activated_at)
SELECT id, true, true, true, true, NOW() FROM agents;
```

**Option B: Manual Review**
- Admin reviews each agent
- Sets appropriate status
- Completes checklist retroactively

**Recommendation:** Option A (mark all existing as 'active')

### Deployment Plan

1. **Phase 1: Database**
   - Add new status enum values
   - Create checklist table
   - Migrate existing agents
   - Add branch_name column

2. **Phase 2: Backend**
   - Deploy auto-detection service
   - Update build processor filter
   - Add new API endpoints
   - Deploy email templates

3. **Phase 3: Frontend**
   - Deploy new UI components
   - Update agents list page
   - Add onboarding tab
   - Add status filters

4. **Phase 4: Testing**
   - Create test agent from Apex27
   - Verify auto-detection works
   - Test full onboarding flow
   - Verify build filtering

## Testing Strategy

### Unit Tests
- Auto-detection service
- Profile completion calculator
- Status transition validator
- Build queue filter

### Integration Tests
- Apex27 webhook → auto-create agent
- Admin activates → build triggered
- Profile completion → status change
- Deactivate → no new builds

### E2E Tests
1. Complete onboarding flow
2. Auto-detect from webhook
3. Admin setup and activation
4. Agent profile completion
5. Site deployment verification

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate agents created | Medium | Unique constraint on branch_id |
| Build system breaks | High | Feature flag for new filter |
| Existing agents broken | High | Careful migration script |
| Email failures | Low | Queue retries, non-blocking |
| Profile requirements change | Medium | Make checklist configurable |

## Future Enhancements

1. **Customizable Onboarding Checklist**
   - Admin defines required fields
   - Per-agent custom requirements

2. **Automated Approval**
   - Auto-approve if checklist 100% complete
   - Configurable auto-approval rules

3. **Scheduled Activation**
   - Agent picks go-live date
   - Site deploys at scheduled time

4. **Preview Environment**
   - Staging URL before activation
   - Agent can preview their site

5. **Onboarding Analytics**
   - Track time to activation
   - Identify bottlenecks
   - Completion rates by field

## Glossary

- **Draft Agent**: Auto-created from Apex27, no user account
- **Pending Profile**: User created, profile incomplete
- **Pending Admin**: Profile complete, awaiting approval
- **Active**: Approved and deployed
- **Inactive**: Temporarily disabled
- **Suspended**: Banned/removed
- **Onboarding Checklist**: Tracks completion of required steps
- **Activation**: Admin approval + site deployment

## References

- Main Platform Spec: `specs/001-multi-agent-platform/spec.md`
- Build System Design: `specs/001-multi-agent-platform/plan.md` (Phase 7)
- Agent Data Model: `specs/001-multi-agent-platform/data-model.md`
