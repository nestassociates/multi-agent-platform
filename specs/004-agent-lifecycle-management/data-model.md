# Data Model: Agent Lifecycle Management

**Feature**: 004-agent-lifecycle-management
**Date**: 2025-11-25

## Schema Changes

### 1. Modify `agents` Table

#### Add `branch_name` Column

```sql
ALTER TABLE agents ADD COLUMN branch_name TEXT;
COMMENT ON COLUMN agents.branch_name IS 'Human-readable branch name from Apex27';
```

**Purpose**: Store branch name alongside branch_id for better UX

**Example Data:**
- `branch_id`: "BR001"
- `branch_name`: "Manchester City Centre"

#### Expand `status` Enum

**Current:**
```sql
status TEXT CHECK (status IN ('active', 'inactive'))
```

**New:**
```sql
ALTER TABLE agents DROP CONSTRAINT agents_status_check;
ALTER TABLE agents ADD CONSTRAINT agents_status_check
  CHECK (status IN ('draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended'));
```

**Status Definitions:**

| Status | Meaning | Can Login | Site Deployed | Receives Builds |
|--------|---------|-----------|---------------|-----------------|
| `draft` | Auto-detected, no user | ❌ | ❌ | ❌ |
| `pending_profile` | User created, profile incomplete | ✅ | ❌ | ❌ |
| `pending_admin` | Profile complete, awaiting approval | ✅ | ❌ | ❌ |
| `active` | Approved and live | ✅ | ✅ | ✅ |
| `inactive` | Temp disabled | ✅ | ✅ (static) | ❌ |
| `suspended` | Banned | ❌ | ❌ | ❌ |

### 2. Create `agent_onboarding_checklist` Table

```sql
CREATE TABLE agent_onboarding_checklist (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Checklist Items (boolean flags)
  user_created BOOLEAN NOT NULL DEFAULT false,
  welcome_email_sent BOOLEAN NOT NULL DEFAULT false,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  site_deployed BOOLEAN NOT NULL DEFAULT false,

  -- Progress Tracking
  profile_completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion_pct >= 0 AND profile_completion_pct <= 100),

  -- Activation Metadata
  activated_at TIMESTAMPTZ,
  activated_by_user_id UUID REFERENCES auth.users(id),
  deactivated_at TIMESTAMPTZ,
  deactivated_by_user_id UUID REFERENCES auth.users(id),
  deactivation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(agent_id)
);

-- Indexes
CREATE INDEX idx_agent_onboarding_checklist_agent_id ON agent_onboarding_checklist(agent_id);
CREATE INDEX idx_agent_onboarding_checklist_profile_completed ON agent_onboarding_checklist(profile_completed);
CREATE INDEX idx_agent_onboarding_checklist_admin_approved ON agent_onboarding_checklist(admin_approved);

-- Auto-update timestamp
CREATE TRIGGER update_agent_onboarding_checklist_updated_at
  BEFORE UPDATE ON agent_onboarding_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE agent_onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- Admins can see all checklists
CREATE POLICY "Admins can view all checklists"
  ON agent_onboarding_checklist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Agents can see their own checklist (read-only)
CREATE POLICY "Agents can view own checklist"
  ON agent_onboarding_checklist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_onboarding_checklist.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Only admins can update checklists
CREATE POLICY "Admins can update checklists"
  ON agent_onboarding_checklist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

**Purpose**: Track onboarding progress and gate deployment

**Relationships:**
- `agent_id` → `agents.id` (1:1)
- `activated_by_user_id` → `auth.users.id` (who approved)

### 3. Add Index on `agents.status`

```sql
CREATE INDEX idx_agents_status ON agents(status);
COMMENT ON INDEX idx_agents_status IS 'Optimize build queue filtering by agent status';
```

**Purpose**: Speed up build queue queries that filter by agent status

### 4. Add Index on `agents.branch_id`

```sql
CREATE INDEX idx_agents_branch_id ON agents(branch_id);
COMMENT ON INDEX idx_agents_branch_id IS 'Optimize auto-detection lookups';
```

**Purpose**: Fast lookup during auto-detection from webhook

## Entity Relationships

```
auth.users (Supabase Auth)
  ↓ 1:1
profiles (user_id)
  ↓ 1:1
agents (user_id) ←─────┐
  ↓ 1:1                │
agent_onboarding_checklist (agent_id)
  │                    │
  ├─ activated_by_user_id → auth.users
  └─ deactivated_by_user_id → auth.users

agents
  ↓ 1:N
properties (agent_id)

agents
  ↓ 1:N
content_submissions (agent_id)

agents
  ↓ 1:N
build_queue (agent_id)
```

## Data Validation Rules

### Agent Status Transitions

**Allowed Transitions:**
```typescript
draft → pending_profile  // Admin creates user
pending_profile → pending_admin  // Profile 100% complete (auto)
pending_admin → active  // Admin approves (manual)
active ↔ inactive  // Admin toggles (manual)
any → suspended  // Admin bans (manual)
```

**Forbidden Transitions:**
- ❌ draft → active (must go through onboarding)
- ❌ suspended → any (terminal state)
- ❌ pending_profile → active (must complete profile first)

### Profile Completion Rules

**Required Fields** (6 total):
1. `profiles.first_name` AND `profiles.last_name` (exists)
2. `profiles.email` AND `profiles.phone` (both filled)
3. `profiles.bio` (length >= 100 characters)
4. `profiles.avatar_url` (image uploaded)
5. `profiles.qualifications` (array length >= 1)
6. `agents.subdomain` (exists and valid)

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

### Auto-Detection Rules

**When to Auto-Create:**
- Property webhook received
- `property.branch_id` is not null/empty
- No existing agent with this `branch_id`

**What to Create:**
```typescript
{
  branch_id: string,        // From Apex27
  branch_name: string | null,  // From Apex27 (if available)
  subdomain: string,        // Generated: "agent-{branch_id}"
  status: 'draft',          // Always draft
  user_id: null,            // No user yet
  created_at: NOW(),
}
```

**Prevent Duplicates:**
- Unique constraint on `agents.branch_id`
- Use `ON CONFLICT DO NOTHING` pattern
- Check existence before INSERT

## Migration Data

### Existing Agents (16 records)

**Assumptions:**
- All have `user_id` (user accounts exist)
- All have profiles (names, emails filled)
- Sites are already deployed
- Status is currently 'active' or NULL

**Migration:**
```sql
-- Set status for existing agents
UPDATE agents
SET status = 'active'
WHERE status IS NULL OR status IN ('active', 'inactive');

-- Create checklist records (mark everything complete)
INSERT INTO agent_onboarding_checklist (
  agent_id,
  user_created,
  welcome_email_sent,
  profile_completed,
  profile_completion_pct,
  admin_approved,
  site_deployed,
  activated_at,
  activated_by_user_id
)
SELECT
  a.id,
  true,  -- user_id exists
  true,  -- assumed sent
  true,  -- profile exists
  100,   -- 100% complete
  true,  -- implicitly approved
  true,  -- site already deployed
  a.created_at,  -- use creation as activation time
  (SELECT user_id FROM profiles WHERE role = 'super_admin' LIMIT 1)  -- system activation
FROM agents a
WHERE NOT EXISTS (
  SELECT 1 FROM agent_onboarding_checklist WHERE agent_id = a.id
);
```

## Sample Data

### Draft Agent (Auto-Detected)

```json
{
  "id": "uuid-1",
  "branch_id": "BR999",
  "branch_name": "New Branch London",
  "subdomain": "agent-br999",
  "status": "draft",
  "user_id": null,
  "created_at": "2025-11-25T10:00:00Z"
}
```

**Checklist:**
```json
{
  "agent_id": "uuid-1",
  "user_created": false,
  "welcome_email_sent": false,
  "profile_completed": false,
  "profile_completion_pct": 0,
  "admin_approved": false,
  "site_deployed": false
}
```

### Active Agent (Fully Onboarded)

```json
{
  "id": "uuid-2",
  "branch_id": "BR001",
  "branch_name": "Manchester City",
  "subdomain": "john-smith-manchester",
  "status": "active",
  "user_id": "user-uuid-2",
  "created_at": "2025-11-01T10:00:00Z"
}
```

**Checklist:**
```json
{
  "agent_id": "uuid-2",
  "user_created": true,
  "welcome_email_sent": true,
  "profile_completed": true,
  "profile_completion_pct": 100,
  "admin_approved": true,
  "site_deployed": true,
  "activated_at": "2025-11-02T14:30:00Z",
  "activated_by_user_id": "admin-uuid"
}
```

## Query Patterns

### Find Draft Agents Needing Setup

```sql
SELECT a.*, COUNT(p.id) as property_count
FROM agents a
LEFT JOIN properties p ON p.agent_id = a.id
WHERE a.status = 'draft'
ORDER BY a.created_at DESC;
```

### Find Agents Ready for Approval

```sql
SELECT a.*, c.profile_completion_pct
FROM agents a
INNER JOIN agent_onboarding_checklist c ON c.agent_id = a.id
WHERE a.status = 'pending_admin'
AND c.profile_completed = true
ORDER BY c.updated_at DESC;
```

### Get Agent with Full Onboarding Status

```sql
SELECT
  a.*,
  p.first_name,
  p.last_name,
  p.email,
  c.user_created,
  c.welcome_email_sent,
  c.profile_completed,
  c.profile_completion_pct,
  c.admin_approved,
  c.site_deployed,
  c.activated_at
FROM agents a
LEFT JOIN profiles p ON p.user_id = a.user_id
LEFT JOIN agent_onboarding_checklist c ON c.agent_id = a.id
WHERE a.id = $1;
```

### Filter Build Queue by Active Agents

```sql
SELECT bq.*
FROM build_queue bq
INNER JOIN agents a ON a.id = bq.agent_id
WHERE bq.status = 'pending'
AND a.status = 'active'
ORDER BY bq.priority DESC, bq.created_at ASC;
```

## Backward Compatibility

### Existing Code Compatibility

**Breaking Changes:** None

**Compatible Changes:**
- ✅ New status values extend existing enum
- ✅ New checklist table doesn't affect existing queries
- ✅ Build filter change is additive (respects existing pending builds)
- ✅ All existing agents migrated to 'active' status

### API Compatibility

**Existing Endpoints:**
- `GET /api/admin/agents` - Still works, now includes status
- `POST /api/admin/agents` - Still works, now sets status='pending_profile'
- `PATCH /api/admin/agents/:id` - Still works, now can update status

**New Endpoints:**
- `POST /api/admin/agents/:id/activate` - New, optional
- `POST /api/admin/agents/:id/deactivate` - New, optional
- `GET /api/admin/agents/:id/checklist` - New, optional

### Frontend Compatibility

**Changes:**
- Agent list page: Add status filter (optional, defaults to 'all')
- Agent detail page: Add onboarding tab (additive)
- No breaking changes to existing UI

## Data Integrity

### Constraints

1. **Unique Branch ID**
   ```sql
   ALTER TABLE agents ADD CONSTRAINT agents_branch_id_unique UNIQUE (branch_id);
   ```

2. **One Checklist Per Agent**
   ```sql
   UNIQUE(agent_id) -- Already in table definition
   ```

3. **Status Transitions**
   - Enforced at application level (not database)
   - Logged in audit_logs table

### Cascade Deletes

**When agent deleted:**
```sql
agent_onboarding_checklist → CASCADE DELETE
properties → SET NULL (keep historical data)
content_submissions → SET NULL (keep content)
build_queue → CASCADE DELETE (no need to build deleted agent)
```

## Performance Considerations

### Indexes

```sql
-- Auto-detection lookup (frequently queried)
CREATE INDEX idx_agents_branch_id ON agents(branch_id);

-- Build filtering (every 2 minutes via cron)
CREATE INDEX idx_agents_status ON agents(status);

-- Checklist queries
CREATE INDEX idx_agent_onboarding_checklist_agent_id ON agent_onboarding_checklist(agent_id);
CREATE INDEX idx_agent_onboarding_checklist_profile_completed ON agent_onboarding_checklist(profile_completed);
```

### Query Performance

**Auto-Detection:**
- Query: `SELECT * FROM agents WHERE branch_id = $1` (indexed)
- Expected: <5ms
- Frequency: Every property webhook (~100/day)

**Build Filtering:**
- Query: JOIN with agents on status='active'
- Expected: <50ms for 50 agents
- Frequency: Every 2 minutes (cron job)

**Checklist Updates:**
- Query: `UPDATE agent_onboarding_checklist SET ... WHERE agent_id = $1`
- Expected: <10ms
- Frequency: ~20/day (profile edits)

## Sample Queries

### Auto-Detect and Create Agent

```typescript
// Check if agent exists
const { data: existing } = await supabase
  .from('agents')
  .select('id')
  .eq('branch_id', branchId)
  .maybeSingle();

if (existing) return existing;

// Create new agent
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

return newAgent;
```

### Calculate Profile Completion

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

const { data: agent } = await supabase
  .from('agents')
  .select('*')
  .eq('user_id', userId)
  .single();

const pct = calculateProfileCompletion(profile, agent);

await supabase
  .from('agent_onboarding_checklist')
  .update({
    profile_completion_pct: pct,
    profile_completed: pct === 100,
  })
  .eq('agent_id', agent.id);
```

### Activate Agent

```typescript
// Transaction-style updates
const { error } = await supabase.rpc('activate_agent', {
  p_agent_id: agentId,
  p_admin_user_id: adminUserId,
});

// OR manual approach:
await supabase
  .from('agents')
  .update({ status: 'active' })
  .eq('id', agentId);

await supabase
  .from('agent_onboarding_checklist')
  .update({
    admin_approved: true,
    activated_at: new Date().toISOString(),
    activated_by_user_id: adminUserId,
  })
  .eq('agent_id', agentId);

await supabase
  .from('build_queue')
  .insert({
    agent_id: agentId,
    priority: 'P1',
    trigger_reason: 'agent_activated',
  });

await supabase
  .from('audit_logs')
  .insert({
    table_name: 'agents',
    record_id: agentId,
    action: 'ACTIVATE',
    user_id: adminUserId,
  });
```

## Migration Checklist

- [ ] Backup agents table before migration
- [ ] Run migration in transaction
- [ ] Verify all existing agents have status='active' after migration
- [ ] Verify all checklists created for existing agents
- [ ] Test auto-detection with test property
- [ ] Test activation flow with test agent
- [ ] Verify build filtering works
- [ ] Rollback plan documented and tested
