# Research: Agent Lifecycle Management

**Feature**: 004-agent-lifecycle-management
**Date**: 2025-11-25

## Research Questions

### Q1: How should agent status flow work?

**Decision**: Six-state lifecycle with clear transitions

**Status States:**
1. `draft` - Auto-created from Apex27, no user yet
2. `pending_profile` - User created, agent completing profile
3. `pending_admin` - Profile complete, awaiting admin approval
4. `active` - Approved and deployed
5. `inactive` - Temporarily disabled
6. `suspended` - Banned/removed

**State Transitions:**
```
draft → pending_profile (admin creates user)
pending_profile → pending_admin (profile 100% complete)
pending_admin → active (admin approves)
active ↔ inactive (admin toggles)
any → suspended (admin bans)
```

**Rationale:**
- Clear separation between auto-detected and user-created agents
- Profile completion tracked automatically
- Admin has final approval control
- Flexible deactivation without data loss

**Alternatives Considered:**
- Simple active/inactive: Too coarse, doesn't track onboarding progress
- Separate `onboarding_complete` boolean: Doesn't show which step agent is on
- Auto-activation when profile complete: Removes admin quality control

### Q2: What makes a profile "complete"?

**Decision**: Required fields checklist with 100% completion threshold

**Required Fields:**
1. Profile photo uploaded (`avatar_url`)
2. Bio written (min 100 characters)
3. Phone number added
4. At least 1 qualification added
5. Subdomain confirmed/set
6. Email verified

**Completion Calculation:**
```typescript
profileCompletionPct = (completedFields / totalFields) * 100
Status changes to 'pending_admin' when profileCompletionPct === 100
```

**Rationale:**
- Ensures minimum quality bar for public sites
- Clear checklist for agents to follow
- Automated status transition removes admin burden
- Flexible - can adjust requirements later

**Alternatives Considered:**
- Manual admin marking: Too much admin work
- Partial completion allowed: Results in incomplete public sites
- Hard validation on each field: Too rigid, blocks agents

### Q3: When should auto-detection run?

**Decision**: Multi-trigger approach for reliability

**Triggers:**
1. **Real-time**: Apex27 property webhook (primary)
2. **Scheduled**: Daily cron job at 2am (catch missed webhooks)
3. **Manual**: Admin button for immediate scan

**Implementation:**
```typescript
// In webhook handler
async function handlePropertyWebhook(property: Apex27Property) {
  await detectAndCreateAgent(property.branch_id, property.branch_name);
  await assignPropertyToAgent(property);
}

// Idempotent - safe to call multiple times
async function detectAndCreateAgent(branchId: string, branchName?: string) {
  const existing = await findAgentByBranchId(branchId);
  if (existing) return existing; // Already exists

  return await createAgent({
    branch_id: branchId,
    branch_name: branchName,
    status: 'draft',
    subdomain: generateSubdomain(branchId), // e.g., "agent-br001"
  });
}
```

**Rationale:**
- Webhook provides real-time detection (best UX)
- Cron job ensures no agents missed (reliability)
- Manual trigger allows admin control (troubleshooting)
- Idempotent design prevents duplicates

**Alternatives Considered:**
- Webhook only: Misses agents if webhook fails
- Cron only: 24hr delay for new agents
- Batch import: Requires admin work, not automated

### Q4: How to handle build filtering?

**Decision**: Build processor filters by `agents.status='active'`

**Current Build Logic:**
```typescript
// Processes ALL pending builds
const builds = await supabase
  .from('build_queue')
  .select('*')
  .eq('status', 'pending');
```

**New Build Logic:**
```typescript
// Only process builds for ACTIVE agents
const builds = await supabase
  .from('build_queue')
  .select(`
    *,
    agents!inner(status)
  `)
  .eq('status', 'pending')
  .eq('agents.status', 'active');
```

**Rationale:**
- Simple SQL filter (performant)
- No code changes to build processor logic
- Build jobs for draft agents stay in queue (can activate later)
- Backwards compatible (existing agents migrate to 'active')

**Alternatives Considered:**
- Delete builds for non-active agents: Loses build history
- Add `deployable` boolean to build_queue: Redundant with agent status
- Check status in processor loop: Less efficient than SQL filter

### Q5: How to notify admins of new agents?

**Decision**: Email notification + dashboard banner

**Email Template**: `packages/email/templates/agent-detected.tsx`
**Content:**
- Subject: "New Agent Detected from Apex27"
- Agent branch ID and name
- Number of properties assigned
- Link to agent setup page
- Auto-detected timestamp

**Dashboard Banner**: `components/admin/agent-auto-detect-banner.tsx`
**Shows when:**
- One or more agents have status='draft'
- Dismissible per-session (localStorage)
- Links to filtered agents view

**Rationale:**
- Email ensures admins don't miss new agents
- Banner provides visual reminder in dashboard
- Non-blocking (doesn't stop property sync)

**Alternatives Considered:**
- Email only: Easy to miss in inbox
- Banner only: Only visible when logged in
- Slack notification: Requires extra integration

### Q6: How to migrate existing 16 agents?

**Decision**: Automated migration script marking all as 'active'

**Migration Strategy:**
```sql
-- Expand status enum
ALTER TABLE agents DROP CONSTRAINT agents_status_check;
ALTER TABLE agents ADD CONSTRAINT agents_status_check
  CHECK (status IN ('draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended'));

-- Migrate existing agents to 'active'
UPDATE agents
SET status = 'active'
WHERE status IS NULL OR status IN ('active', 'inactive');

-- Create checklist records for existing agents
INSERT INTO agent_onboarding_checklist (
  agent_id,
  user_created,
  welcome_email_sent,
  profile_completed,
  profile_completion_pct,
  admin_approved,
  site_deployed,
  activated_at
)
SELECT
  id,
  true,  -- user already created
  true,  -- welcome email already sent
  true,  -- profile assumed complete
  100,   -- 100% complete
  true,  -- implicitly approved (already live)
  true,  -- site already deployed
  created_at  -- use creation time as activation
FROM agents
WHERE id NOT IN (SELECT agent_id FROM agent_onboarding_checklist);
```

**Rationale:**
- Preserves existing live sites (all marked 'active')
- Assumes current agents are fully onboarded
- Safe - doesn't change existing functionality
- Allows new workflow to run alongside existing agents

**Alternatives Considered:**
- Manual review: Too time-consuming for 16 agents
- Leave as NULL: Would break build filtering
- Mark as 'pending_admin': Would take sites offline

## Technology Decisions

### Database: PostgreSQL Enum Expansion

**Decision**: Use `ALTER TABLE ... DROP CONSTRAINT` then re-add with new values

**Why:**
- PostgreSQL doesn't support `ALTER TYPE ... ADD VALUE` for CHECK constraints
- Must drop and recreate constraint
- Safe for production (zero downtime)

**Reference**: PostgreSQL docs on CHECK constraints

### Onboarding Checklist: Separate Table vs. JSON Column

**Decision**: Separate table `agent_onboarding_checklist`

**Pros:**
- Strongly typed columns (boolean flags)
- Easy to query (find agents by completion status)
- Can add foreign keys (activated_by_user_id)
- Better indexing

**Cons:**
- Extra JOIN when fetching agent with checklist
- One more table to maintain

**Rationale**: Type safety and queryability outweigh JOIN cost

**Alternative Rejected**: JSONB column in agents table - harder to query, no type safety

### Auto-Detection: Real-time vs. Batch

**Decision**: Real-time detection in webhook handler + daily cron backup

**Pattern:**
```typescript
// In /api/webhooks/apex27/route.ts
export async function POST(request: NextRequest) {
  const property = await parseWebhook(request);

  // Auto-detect agent (idempotent)
  const agent = await ensureAgentExists(property.branch_id, property.branch_name);

  // Assign property
  await upsertProperty(property, agent.id);

  return NextResponse.json({ success: true });
}
```

**Rationale:**
- Zero delay for new agents (instant)
- Webhook handler already processing property
- Minimal code addition (~10 lines)
- Idempotent - safe to retry

**Alternative Rejected**: Batch cron job only - 24hr delay unacceptable

### Profile Completion: Automatic vs. Manual Trigger

**Decision**: Automatic status change when profile 100% complete

**Implementation:**
```typescript
// In PATCH /api/agent/profile endpoint
export async function PATCH(request: NextRequest) {
  // Update profile
  await updateProfile(profileData);

  // Recalculate completion
  const completionPct = calculateProfileCompletion(profile, agent);
  await updateChecklist(agent.id, {
    profile_completed: completionPct === 100,
    profile_completion_pct: completionPct
  });

  // Auto-transition if complete
  if (completionPct === 100 && agent.status === 'pending_profile') {
    await updateAgentStatus(agent.id, 'pending_admin');
    await notifyAdminProfileComplete(agent);
  }

  return NextResponse.json({ success: true });
}
```

**Rationale:**
- Removes manual step (better UX)
- Immediate feedback for agent
- Admins notified when ready for review
- No ambiguity about completion

**Alternative Rejected**: Manual "Mark as complete" button - extra click, confusion

## Implementation Patterns

### Idempotent Auto-Detection

**Pattern**: Upsert-style logic with unique constraint

```typescript
async function ensureAgentExists(branchId: string, branchName?: string): Promise<Agent> {
  // Check if exists
  const existing = await supabase
    .from('agents')
    .select('*')
    .eq('branch_id', branchId)
    .maybeSingle();

  if (existing.data) {
    return existing.data; // Already exists
  }

  // Create new (status='draft')
  const { data: newAgent } = await supabase
    .from('agents')
    .insert({
      branch_id: branchId,
      branch_name: branchName,
      subdomain: `agent-${branchId.toLowerCase()}`,
      status: 'draft',
    })
    .select()
    .single();

  // Create checklist
  await supabase
    .from('agent_onboarding_checklist')
    .insert({ agent_id: newAgent.id });

  // Notify admin
  await sendAgentDetectedEmail(newAgent);

  return newAgent;
}
```

### Status Transition Guards

**Pattern**: Validate allowed transitions before applying

```typescript
const ALLOWED_TRANSITIONS = {
  draft: ['pending_profile', 'suspended'],
  pending_profile: ['pending_admin', 'draft', 'suspended'],
  pending_admin: ['active', 'pending_profile', 'suspended'],
  active: ['inactive', 'suspended'],
  inactive: ['active', 'suspended'],
  suspended: [], // Terminal state
};

function canTransition(from: AgentStatus, to: AgentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
```

### Audit Logging

**Pattern**: Log all status changes with reason

```typescript
async function changeAgentStatus(
  agentId: string,
  newStatus: AgentStatus,
  adminUserId: string,
  reason?: string
) {
  // Update status
  await supabase
    .from('agents')
    .update({ status: newStatus })
    .eq('id', agentId);

  // Log audit trail
  await supabase
    .from('audit_logs')
    .insert({
      table_name: 'agents',
      record_id: agentId,
      action: 'UPDATE',
      changes: { status: { old: currentStatus, new: newStatus } },
      user_id: adminUserId,
      metadata: { reason },
    });
}
```

## Open Questions

1. **Profile Requirements**: Should requirements be configurable per-agent or platform-wide?
   - **Recommendation**: Platform-wide initially, make configurable in v2

2. **Auto-Subdomain Generation**: How to generate subdomains for auto-detected agents?
   - **Recommendation**: `agent-{branch_id}` format (e.g., "agent-br001")
   - Admin can change later

3. **Email Frequency**: How often to notify admins about new agents?
   - **Recommendation**: Immediate email per agent (low volume expected)
   - Could batch if >5 agents/day

4. **Existing Agent Migration**: Mark all as 'active' or require review?
   - **Recommendation**: Mark all as 'active' (they're already live)

## Dependencies

### Existing Infrastructure
- ✅ Supabase database with agents, profiles tables
- ✅ Apex27 webhook handler
- ✅ Build queue system
- ✅ Email sending via Resend
- ✅ Admin agent management UI

### New Infrastructure Needed
- New table: `agent_onboarding_checklist`
- Expanded enum: `agents.status`
- New column: `agents.branch_name`

### External Dependencies
- None (uses existing Apex27 webhook, Supabase, Resend)

## Performance Considerations

### Auto-Detection Performance
- **Query Cost**: 1 SELECT + 1 INSERT per new agent
- **Expected Load**: <10 new agents/week
- **Optimization**: Unique constraint prevents duplicate queries

### Build Filtering Performance
- **Current**: Fetches all pending builds
- **New**: Adds INNER JOIN on agents table
- **Impact**: Negligible (<1ms overhead)
- **Index Needed**: Create index on `agents.status` for faster filtering

### Checklist Updates
- **Frequency**: ~20 profile updates/day
- **Query Cost**: 1 UPDATE per profile change
- **Impact**: Negligible

## Security Considerations

### Auto-Detection Security
- **Risk**: Malicious webhook creates spam agents
- **Mitigation**: Webhook already has rate limiting (100/min)
- **Mitigation**: Unique constraint on branch_id prevents duplicates

### Status Change Authorization
- **Rule**: Only admins can change status
- **Enforcement**: API routes check `role IN ('admin', 'super_admin')`
- **Audit**: All status changes logged with admin user_id

### Data Integrity
- **Risk**: Orphaned checklist records
- **Mitigation**: `ON DELETE CASCADE` on agent_id foreign key
- **Risk**: Invalid status transitions
- **Mitigation**: Status transition guard functions

## Migration Strategy

### Database Migration Order
1. **Migration 1**: Expand agents.status constraint
2. **Migration 2**: Create agent_onboarding_checklist table
3. **Migration 3**: Migrate existing agents to 'active' status
4. **Migration 4**: Add branch_name column
5. **Migration 5**: Create index on agents.status

### Code Deployment Order
1. **Deploy database migrations** (backwards compatible)
2. **Deploy backend services** (auto-detection, activation)
3. **Deploy API endpoints** (new endpoints, modified filters)
4. **Deploy frontend UI** (checklist component, status filters)
5. **Test with one agent** (create test agent, verify flow)
6. **Enable auto-detection** (feature flag if needed)

### Rollback Plan
If issues occur:
1. Set all draft agents to 'active' (emergency escape)
2. Revert build filter to process all agents
3. Email template changes are non-breaking
4. UI changes are additive (backwards compatible)

## Testing Strategy

### Unit Tests
- `calculateProfileCompletion()` - various profile states
- `canTransition()` - all valid/invalid transitions
- `generateSubdomain()` - branch ID formats

### Integration Tests
- Auto-detection from webhook
- Profile completion → status change
- Admin activation → build triggered
- Build filtering (only active agents)

### E2E Tests
1. **Complete onboarding flow:**
   - Webhook arrives → draft agent created
   - Admin creates user → pending_profile
   - Agent completes profile → pending_admin
   - Admin activates → active + build queued
   - Verify site deployed

2. **Deactivation flow:**
   - Admin deactivates active agent
   - Verify no new builds for this agent
   - Verify site stays live

### Manual Testing Checklist
- [ ] Create test agent via auto-detection
- [ ] Verify email sent to admin
- [ ] Create user account for draft agent
- [ ] Log in as agent, complete profile
- [ ] Verify auto-transition to pending_admin
- [ ] Log in as admin, approve agent
- [ ] Verify build queued
- [ ] Verify site deploys
- [ ] Deactivate agent
- [ ] Verify no new builds

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Duplicate agents created | Low | Medium | Unique constraint on branch_id |
| Build system stops working | Low | High | Feature flag + rollback plan |
| Existing agents break | Low | High | Careful migration + testing |
| Profile requirements too strict | Medium | Low | Make configurable in code |
| Auto-detection misses agents | Low | Medium | Daily cron backup |
| Email spam | Low | Low | Rate limit + admin whitelist |

## Success Metrics

### Operational
- Auto-detection success rate >99%
- Average time-to-activation <24 hours
- Zero duplicate agents created
- Zero existing agents broken

### User Experience
- Admin time per agent <5 minutes
- Agent profile completion rate >90%
- Site activation approval <1 hour

### Technical
- Build queue filter adds <10ms overhead
- Auto-detection completes in <2s
- Status transitions complete in <500ms

## Next Steps

After research approval:
1. Generate data-model.md (database schema details)
2. Generate contracts/ (API endpoint specs)
3. Generate quickstart.md (setup instructions)
4. Run `/speckit.tasks` to create implementation tasks
