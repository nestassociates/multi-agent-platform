# Quickstart: Agent Lifecycle Management

**Feature**: 004-agent-lifecycle-management
**Time to Complete**: 15 minutes

## Prerequisites

- Nest platform already deployed (from spec 001)
- Supabase project configured
- Admin access to dashboard
- Apex27 webhook configured

## Setup

### 1. Run Database Migrations

```bash
cd /Users/dan/Documents/Websites/Nest\ Associates/Project\ Nest/Nest

# Apply migrations in order
npm run supabase:migration:up
```

**Migrations Applied:**
1. `20251125000001_expand_agent_status.sql` - Expands status enum
2. `20251125000002_create_onboarding_checklist.sql` - Creates checklist table
3. `20251125000003_migrate_existing_agents.sql` - Migrates existing 16 agents

### 2. Verify Migration

```bash
# Check all existing agents have status='active'
npm run supabase:query "SELECT id, subdomain, status FROM agents;"

# Check all checklists created
npm run supabase:query "SELECT COUNT(*) FROM agent_onboarding_checklist;"
# Should return: 16 (one per agent)
```

### 3. Deploy Code

```bash
# Build and deploy
pnpm run build
git add -A
git commit -m "feat: implement agent lifecycle management"
git push origin 004-agent-lifecycle-management

# Create PR and merge to main
# Vercel will auto-deploy
```

## Usage

### Admin Workflow: New Agent from Apex27

#### Scenario: Apex27 Sends Property for New Branch

**What Happens Automatically:**
1. Property webhook received with `branch_id: "BR999"`
2. System auto-creates agent record (status='draft')
3. Admin receives email: "New Agent Detected from Apex27"
4. Properties assigned to draft agent
5. Dashboard banner appears: "1 new agent detected"

**Admin Actions:**

1. **Navigate to Agents List**
   ```
   Dashboard → Agents → Filter: Draft
   ```

2. **Click "Setup" on Draft Agent**
   - Enter agent email, name
   - Click "Create User Account"
   - System sends welcome email
   - Status changes to 'pending_profile'

3. **Wait for Agent to Complete Profile**
   - Agent logs in with temporary password
   - Agent fills bio, uploads photo, adds qualifications
   - When 100% complete:
     - Status auto-changes to 'pending_admin'
     - Admin receives notification email

4. **Review and Activate**
   ```
   Dashboard → Agents → Filter: Pending Admin
   ```
   - Click agent name
   - Go to "Onboarding" tab
   - Review checklist (should be 100%)
   - Click "Approve & Deploy Site"
   - Status changes to 'active'
   - Build queued (P1 priority)
   - Agent receives "Site is live!" email

### Agent Workflow: Complete Profile

**Trigger**: Admin creates user account, agent receives welcome email

**Steps:**

1. **Log in to Dashboard**
   ```
   https://dashboard.nestassociates.com/login
   Email: [from welcome email]
   Password: [temporary password]
   ```

2. **Change Password** (forced on first login)

3. **Complete Profile**
   ```
   Dashboard → Profile
   ```

4. **Required Fields:**
   - ✅ Upload profile photo
   - ✅ Write bio (min 100 characters)
   - ✅ Add phone number
   - ✅ Add at least 1 qualification
   - ✅ Verify subdomain
   - ✅ Confirm email

5. **Submit**
   - Click "Save Profile"
   - System checks completion
   - If 100%: Status → 'pending_admin'
   - If <100%: Shows "X% complete" message

6. **Wait for Admin Approval**
   - Receive email when site goes live

### Admin Workflow: Manage Agent Status

#### Temporarily Disable Agent

**Use Case**: Agent on vacation, temporarily inactive

```
Dashboard → Agents → [Agent Name] → Actions → Deactivate

Reason: "Agent on vacation until Jan 2025"
```

**Effect:**
- Status: active → inactive
- Site: Stays live (static)
- Builds: Skipped for this agent
- Properties: Continue syncing

#### Reactivate Agent

```
Dashboard → Agents → [Agent Name] → Actions → Activate
```

**Effect:**
- Status: inactive → active
- Builds: Resume for this agent

#### Suspend Agent

**Use Case**: Agent violated terms, removal

```
Dashboard → Agents → [Agent Name] → Actions → Suspend

Reason: "Contract terminated"
```

**Effect:**
- Status: any → suspended
- Site: Taken offline
- Login: Blocked
- Irreversible (requires admin intervention to undo)

### Admin Workflow: Manual Auto-Detection

**Use Case**: Missed webhook, manual check

```
Dashboard → Agents → [Auto-Detect] button
```

**What Happens:**
1. Scans all properties in database
2. Finds unique branch_ids
3. Creates agents for any unknown branches
4. Shows results: "3 new agents created"

## Verification

### Test Auto-Detection

1. **Manually trigger webhook with new branch_id:**
   ```bash
   curl -X POST https://dashboard.nestassociates.com/api/webhooks/apex27 \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "BranchID=TEST999&DisplayAddress=Test+Property"
   ```

2. **Check dashboard:**
   - Go to Agents → Filter: Draft
   - Should see new agent "agent-test999"

3. **Check email:**
   - Admin should receive "New Agent Detected" email

### Test Full Onboarding

1. **Setup Draft Agent:**
   - Filter for draft agents
   - Click "Setup"
   - Create user account
   - Verify status → 'pending_profile'

2. **Complete Profile (as agent):**
   - Log in as agent
   - Fill all required fields
   - Save profile
   - Verify status → 'pending_admin'

3. **Activate (as admin):**
   - Go to agent detail → Onboarding tab
   - Click "Approve & Deploy"
   - Verify status → 'active'
   - Verify build queued
   - Wait for build to complete
   - Visit agent site URL

### Test Build Filtering

1. **Create test agent (status='draft')**

2. **Queue manual build:**
   ```
   Dashboard → Build Queue → [Trigger Build for Draft Agent]
   ```

3. **Check build processor:**
   - Build should stay in 'pending' status
   - Should NOT process (agent not active)

4. **Activate agent:**
   - Change status to 'active'

5. **Wait for next cron cycle** (2 minutes):
   - Build should now process
   - Site should deploy

## Troubleshooting

### Agent Not Auto-Created from Webhook

**Check:**
1. Webhook received successfully (check logs)
2. Property has valid `branch_id` field
3. Database has unique constraint on `agents.branch_id`

**Fix:**
- Run manual auto-detect: Dashboard → Agents → Auto-Detect

### Profile Shows Complete But Status Still 'pending_profile'

**Cause**: Profile completion checker may need update

**Fix:**
```bash
# Manually trigger recalculation
PATCH /api/admin/agents/[id]/checklist
{
  "field": "profile_completed",
  "value": true
}
```

### Build Not Processing for Active Agent

**Check:**
1. Agent status is 'active'
2. Build queue has entry for this agent
3. Build queue status is 'pending'

**Fix:**
- Check build processor logs
- Verify SQL filter includes agent
- Manually retry build

### Existing Agents Missing Checklist

**Run Migration Again:**
```sql
INSERT INTO agent_onboarding_checklist (
  agent_id, user_created, profile_completed, admin_approved, site_deployed, activated_at
)
SELECT id, true, true, true, true, created_at
FROM agents
WHERE id NOT IN (SELECT agent_id FROM agent_onboarding_checklist);
```

## Next Steps

After setup complete:

1. **Test with one agent:**
   - Trigger test webhook
   - Complete full onboarding flow
   - Verify site deploys correctly

2. **Monitor first week:**
   - Check auto-detection success rate
   - Track time-to-activation metrics
   - Gather admin feedback

3. **Optimize if needed:**
   - Adjust profile requirements
   - Tune email notifications
   - Add bulk operations if needed

4. **Document for users:**
   - Agent onboarding guide
   - Admin activation guide
   - FAQ for common issues

## Support

**Questions?** Check:
- `/specs/004-agent-lifecycle-management/spec.md` - Feature specification
- `/specs/004-agent-lifecycle-management/research.md` - Design decisions
- `/specs/004-agent-lifecycle-management/data-model.md` - Database schema
- `/SECURITY-AUDIT.md` - Security considerations

**Issues?** File in GitHub with label `feature:agent-lifecycle`
