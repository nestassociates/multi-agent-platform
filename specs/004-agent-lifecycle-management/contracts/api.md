# API Contracts: Agent Lifecycle Management

**Feature**: 004-agent-lifecycle-management
**Date**: 2025-11-25

## New Endpoints

### POST /api/admin/agents/:id/activate

**Purpose**: Approve agent and trigger site deployment

**Authentication**: Required (admin/super_admin only)

**Request:**
```typescript
POST /api/admin/agents/[id]/activate
Content-Type: application/json

{
  reason?: string  // Optional activation reason/notes
}
```

**Response Success (200):**
```typescript
{
  success: true,
  agent: {
    id: string,
    status: 'active',
    subdomain: string,
    activated_at: string  // ISO 8601
  },
  build: {
    id: string,
    status: 'pending',
    priority: 'P1'
  }
}
```

**Response Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `404 Not Found` - Agent doesn't exist
- `400 Bad Request` - Agent not ready for activation (profile incomplete)
- `409 Conflict` - Agent already active

**Error Response:**
```typescript
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Side Effects:**
1. Updates `agents.status` to 'active'
2. Updates `agent_onboarding_checklist.admin_approved` to true
3. Sets `agent_onboarding_checklist.activated_at`
4. Sets `agent_onboarding_checklist.activated_by_user_id`
5. Creates `build_queue` entry with priority='P1'
6. Sends email to agent ("Your site is live!")
7. Creates `audit_logs` entry

---

### POST /api/admin/agents/:id/deactivate

**Purpose**: Temporarily disable agent (keeps site live, stops new builds)

**Authentication**: Required (admin/super_admin only)

**Request:**
```typescript
POST /api/admin/agents/[id]/deactivate
Content-Type: application/json

{
  reason: string  // Required: why deactivating
}
```

**Response Success (200):**
```typescript
{
  success: true,
  agent: {
    id: string,
    status: 'inactive',
    subdomain: string,
    deactivated_at: string
  }
}
```

**Response Errors:**
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `400 Bad Request` - Missing reason

**Side Effects:**
1. Updates `agents.status` to 'inactive'
2. Sets `agent_onboarding_checklist.deactivated_at`
3. Sets `agent_onboarding_checklist.deactivated_by_user_id`
4. Sets `agent_onboarding_checklist.deactivation_reason`
5. Creates `audit_logs` entry
6. Future builds for this agent are skipped (existing site stays live)

---

### POST /api/admin/agents/auto-detect

**Purpose**: Manually trigger auto-detection scan of all properties

**Authentication**: Required (admin/super_admin only)

**Request:**
```typescript
POST /api/admin/agents/auto-detect
```

**Response Success (200):**
```typescript
{
  success: true,
  results: {
    scanned_properties: number,
    new_agents_created: number,
    agents: Array<{
      id: string,
      branch_id: string,
      branch_name: string | null,
      subdomain: string,
      property_count: number
    }>
  }
}
```

**Response Errors:**
- `401 Unauthorized`
- `403 Forbidden`
- `500 Internal Server Error`

**Side Effects:**
1. Scans all properties for unique branch_ids
2. Creates agent records for unknown branch_ids (status='draft')
3. Creates checklist records for new agents
4. Sends email notifications for each new agent
5. Creates audit_logs entries

---

### GET /api/admin/agents/:id/checklist

**Purpose**: Get onboarding checklist for agent

**Authentication**: Required (admin/super_admin only)

**Request:**
```typescript
GET /api/admin/agents/[id]/checklist
```

**Response Success (200):**
```typescript
{
  success: true,
  checklist: {
    agent_id: string,
    user_created: boolean,
    welcome_email_sent: boolean,
    profile_completed: boolean,
    profile_completion_pct: number,  // 0-100
    admin_approved: boolean,
    site_deployed: boolean,
    activated_at: string | null,
    activated_by_user_id: string | null,
    deactivated_at: string | null,
    deactivation_reason: string | null
  }
}
```

**Response Errors:**
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found` - Agent or checklist doesn't exist

---

### PATCH /api/admin/agents/:id/checklist

**Purpose**: Manually update checklist item (for edge cases)

**Authentication**: Required (admin/super_admin only)

**Request:**
```typescript
PATCH /api/admin/agents/[id]/checklist
Content-Type: application/json

{
  field: 'user_created' | 'welcome_email_sent' | 'admin_approved',
  value: boolean
}
```

**Response Success (200):**
```typescript
{
  success: true,
  checklist: { /* updated checklist */ }
}
```

**Response Errors:**
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `400 Bad Request` - Invalid field or value

**Note**: `profile_completed` is auto-calculated and cannot be manually set

---

## Modified Endpoints

### GET /api/admin/agents

**Changes**: Add status filter query parameter

**Request:**
```typescript
GET /api/admin/agents?status=draft&page=1&limit=20
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: 'draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended', 'all' (default) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |
| `search` | string | Search by name, email, subdomain |

**Response:**
```typescript
{
  success: true,
  agents: Array<{
    id: string,
    first_name: string,
    last_name: string,
    email: string,
    subdomain: string,
    status: AgentStatus,  // NEW
    branch_id: string,
    branch_name: string | null,  // NEW
    property_count: number,
    content_count: number,
    created_at: string
  }>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

---

### POST /api/admin/agents

**Changes**: Sets initial status to 'pending_profile' and creates checklist

**Existing Request:**
```typescript
POST /api/admin/agents
Content-Type: application/json

{
  email: string,
  first_name: string,
  last_name: string,
  subdomain: string,
  branch_id?: string  // NEW: Optional branch_id
}
```

**Response (unchanged structure, new fields):**
```typescript
{
  success: true,
  agent: {
    id: string,
    user_id: string,
    subdomain: string,
    status: 'pending_profile',  // NEW: Was 'active' before
    branch_id: string | null
  }
}
```

**New Side Effects:**
- Sets `agents.status = 'pending_profile'` (was 'active')
- Creates `agent_onboarding_checklist` record
- Sets `checklist.user_created = true`
- Sets `checklist.welcome_email_sent = true`

---

### PATCH /api/agent/profile

**Changes**: Auto-updates checklist and transitions status

**Existing Request:**
```typescript
PATCH /api/agent/profile
Content-Type: application/json

{
  phone?: string,
  bio?: string,
  qualifications?: string[],
  avatar_url?: string,
  // ... other fields
}
```

**Response (same structure):**
```typescript
{
  success: true,
  profile: { /* updated profile */ }
}
```

**New Side Effects:**
1. Recalculates `profile_completion_pct`
2. Updates `agent_onboarding_checklist.profile_completion_pct`
3. If 100% complete:
   - Sets `checklist.profile_completed = true`
   - Changes `agents.status` to 'pending_admin'
   - Sends email to admin ("Agent ready for review")

---

## TypeScript Types

### Agent Status

```typescript
export type AgentStatus =
  | 'draft'
  | 'pending_profile'
  | 'pending_admin'
  | 'active'
  | 'inactive'
  | 'suspended';

export interface Agent {
  id: string;
  user_id: string | null;
  branch_id: string;
  branch_name: string | null;  // NEW
  subdomain: string;
  status: AgentStatus;  // MODIFIED (was 'active' | 'inactive')
  created_at: string;
  updated_at: string;
}
```

### Onboarding Checklist

```typescript
export interface AgentOnboardingChecklist {
  id: string;
  agent_id: string;

  // Checklist items
  user_created: boolean;
  welcome_email_sent: boolean;
  profile_completed: boolean;
  profile_completion_pct: number;  // 0-100
  admin_approved: boolean;
  site_deployed: boolean;

  // Metadata
  activated_at: string | null;
  activated_by_user_id: string | null;
  deactivated_at: string | null;
  deactivated_by_user_id: string | null;
  deactivation_reason: string | null;

  created_at: string;
  updated_at: string;
}
```

### API Request/Response Types

```typescript
// Activation
export interface ActivateAgentRequest {
  reason?: string;
}

export interface ActivateAgentResponse {
  success: true;
  agent: {
    id: string;
    status: 'active';
    subdomain: string;
    activated_at: string;
  };
  build: {
    id: string;
    status: 'pending';
    priority: 'P1';
  };
}

// Deactivation
export interface DeactivateAgentRequest {
  reason: string;  // Required
}

export interface DeactivateAgentResponse {
  success: true;
  agent: {
    id: string;
    status: 'inactive';
    subdomain: string;
    deactivated_at: string;
  };
}

// Auto-Detection
export interface AutoDetectResponse {
  success: true;
  results: {
    scanned_properties: number;
    new_agents_created: number;
    agents: Array<{
      id: string;
      branch_id: string;
      branch_name: string | null;
      subdomain: string;
      property_count: number;
    }>;
  };
}
```

## Validation Rules

### Zod Schemas

```typescript
// Status validation
export const agentStatusSchema = z.enum([
  'draft',
  'pending_profile',
  'pending_admin',
  'active',
  'inactive',
  'suspended'
]);

// Activation request
export const activateAgentSchema = z.object({
  reason: z.string().optional(),
});

// Deactivation request
export const deactivateAgentSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

// Checklist update
export const updateChecklistSchema = z.object({
  field: z.enum(['user_created', 'welcome_email_sent', 'admin_approved']),
  value: z.boolean(),
});
```

## Error Codes

| Code | HTTP Status | Message | When |
|------|-------------|---------|------|
| `AGENT_NOT_FOUND` | 404 | Agent not found | Invalid agent ID |
| `AGENT_NOT_READY` | 400 | Agent profile incomplete | Activation attempted before profile done |
| `AGENT_ALREADY_ACTIVE` | 409 | Agent already activated | Duplicate activation |
| `INVALID_STATUS_TRANSITION` | 400 | Cannot transition from X to Y | Invalid status change |
| `MISSING_DEACTIVATION_REASON` | 400 | Reason required for deactivation | No reason provided |
| `UNAUTHORIZED` | 401 | Authentication required | No session |
| `FORBIDDEN` | 403 | Admin access required | Not an admin |

## Rate Limiting

**Activation/Deactivation:**
- Part of standard API rate limit: 100 req/min
- Low frequency expected (<10/day)

**Auto-Detection:**
- Part of standard API rate limit: 100 req/min
- Manual trigger only (infrequent)

**Webhook Handler:**
- Existing webhook rate limit: 100/min
- Auto-detection adds negligible overhead (<100ms)
