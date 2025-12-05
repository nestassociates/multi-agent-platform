# Agent Lifecycle Management - Admin Guide

This guide explains how administrators manage agents through their complete lifecycle, from initial detection to activation and ongoing status management.

## Overview

The agent lifecycle consists of six statuses:

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `draft` | Auto-detected from Apex27, no user account yet | Setup Account |
| `pending_profile` | User account created, awaiting profile completion | View Progress |
| `pending_admin` | Profile complete, awaiting admin review | Approve, Deploy Site |
| `active` | Fully active, site deployed | Deactivate, Suspend |
| `inactive` | Deactivated by admin | Reactivate |
| `suspended` | Suspended for compliance issues | Reactivate (with review) |

## Agent Discovery

### Automatic Detection

Agents are automatically discovered when properties are received from Apex27:

1. **Webhook Received**: Apex27 sends property data with branch information
2. **Branch Check**: System checks if `apex27_branch_id` exists in database
3. **Draft Created**: If new branch, a draft agent record is created
4. **Admin Notified**: Email sent to admin team about new agent detected

**No action required** - the system handles detection automatically.

### Manual Scan

To manually scan for new agents from existing properties:

1. Go to **Agents** page
2. Click **"Scan for New Agents"** button
3. System scans all properties for unmatched branch IDs
4. New draft agents are created for any found

## Setting Up Draft Agents

When a new agent is detected (status: `draft`), an admin must create their user account:

### Step 1: Find Draft Agents

1. Go to **Agents** page
2. Filter by Status: **Draft**
3. Review the list of agents awaiting setup

### Step 2: Create User Account

1. Click on a draft agent to open their detail page
2. Click **"Setup Account"**
3. Fill in the required information:
   - **Email**: Agent's email address (will receive welcome email)
   - **First Name**: Agent's first name
   - **Last Name**: Agent's last name
   - **Subdomain**: Their site subdomain (e.g., `john-smith` → `john-smith.nestassociates.co.uk`)
4. Click **Create Account**

### What Happens

- User account created in Supabase Auth
- Agent status changes to `pending_profile`
- Welcome email sent with login instructions
- Onboarding checklist initialized

## Monitoring Profile Completion

Agents in `pending_profile` status are completing their profiles. You can monitor progress:

### View Progress

1. Go to agent detail page
2. Click **"Onboarding"** tab
3. View the checklist showing:
   - ✓ User account created
   - ✓/✗ Profile photo uploaded
   - ✓/✗ Bio written
   - ✓/✗ Contact details added
   - ✓/✗ Social media links (optional)
   - ✓/✗ Commission rates set

### Progress Percentage

The profile completion percentage shows how close the agent is to being ready:
- **0-50%**: Just started, missing key information
- **50-99%**: Making progress, some fields remaining
- **100%**: Ready for admin review

When an agent reaches 100%, their status automatically changes to `pending_admin`.

## Approving Agents

Agents with `pending_admin` status are ready for your review.

### Review Process

1. Go to **Agents** page
2. Filter by Status: **Pending Admin**
3. Click on an agent to review
4. Check the **Onboarding** tab to see:
   - Profile completeness
   - Photo quality
   - Bio content
   - Contact information

### Approve and Deploy

1. Review all information
2. Click **"Approve Agent"** - This sets status to `active`
3. Click **"Deploy Site"** - This queues the microsite build

**Important**: Approval and deployment are separate actions:
- **Approve**: Marks agent as active in the system
- **Deploy**: Queues their microsite for building

### Site Deployment

After clicking Deploy:
1. Build added to queue with **P1 priority** (high priority)
2. Build system generates static site
3. Site deployed to `{subdomain}.nestassociates.co.uk`
4. Agent receives activation email with site URL

## Managing Active Agents

### Deactivating an Agent

To temporarily deactivate an agent:

1. Go to agent detail page
2. Click **"Deactivate"**
3. Enter reason (minimum 10 characters)
4. Confirm deactivation

**Effects**:
- Status changes to `inactive`
- No new builds are processed
- Existing site remains live (content not removed)
- Agent cannot access dashboard

### Reactivating an Agent

To reactivate a deactivated agent:

1. Go to agent detail page
2. Click **"Reactivate"**
3. Confirm reactivation

**Effects**:
- Status changes to `active`
- Builds resume processing
- Agent regains dashboard access

### Suspending an Agent

For compliance or serious issues:

1. Go to agent detail page
2. Click **"Suspend"**
3. Enter reason (required)
4. Confirm suspension

**Effects**:
- Status changes to `suspended`
- Same as deactivation, but flagged for compliance review
- Requires admin review before reactivation

## Bulk Operations

### Bulk Status Update

To update multiple agents at once:

1. Go to **Agents** page
2. Select agents using checkboxes
3. Click **"Bulk Actions"**
4. Choose action: Deactivate, Reactivate
5. Enter reason (if deactivating)
6. Confirm

## Status History

Every status change is logged for audit purposes:

1. Go to agent detail page
2. Scroll to **"Status History"** section
3. View timeline showing:
   - Previous status
   - New status
   - Admin who made change
   - Date/time
   - Reason (if applicable)

## Build Filtering

The build system only processes agents with `active` status:

| Agent Status | Builds Processed? |
|--------------|-------------------|
| `draft` | No |
| `pending_profile` | No |
| `pending_admin` | No |
| `active` | **Yes** |
| `inactive` | No |
| `suspended` | No |

This ensures draft or deactivated agents don't consume build resources.

## Email Notifications

The system sends automated emails at key stages:

| Event | Recipients | Template |
|-------|------------|----------|
| New agent detected | Admin team | `agent-detected` |
| Profile complete | Admin team | `profile-complete` |
| Site activated | Agent | `site-activated` |

## Troubleshooting

### Agent not appearing in list

- Check status filter - they may be filtered out
- Verify Apex27 webhook is working
- Run manual agent scan

### Agent stuck in pending_profile

- Agent hasn't completed required fields
- Check onboarding checklist for missing items
- Contact agent to complete profile

### Build not processing

- Verify agent status is `active`
- Check build queue for errors
- Verify Vercel integration is configured

### Can't deactivate agent

- Must have admin or super_admin role
- Agent must be in `active` status
- Reason must be at least 10 characters

## API Reference

### Approve Agent
```
POST /api/admin/agents/{id}/approve
```

### Deploy Site
```
POST /api/admin/agents/{id}/deploy
```

### Deactivate Agent
```
POST /api/admin/agents/{id}/deactivate
Body: { "reason": "string (min 10 chars)" }
```

### Reactivate Agent
```
POST /api/admin/agents/{id}/reactivate
```

### Suspend Agent
```
POST /api/admin/agents/{id}/suspend
Body: { "reason": "string (min 10 chars)" }
```

### Bulk Update
```
POST /api/admin/agents/bulk-update
Body: {
  "agentIds": ["uuid", "uuid"],
  "status": "inactive" | "active",
  "reason": "string"
}
```

## Support

For issues with agent management:
- Check audit logs for error details
- Review this guide for correct procedures
- Contact development team if system errors occur
