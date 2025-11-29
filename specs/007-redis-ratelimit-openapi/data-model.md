# Data Model: Redis Rate Limiting & OpenAPI Documentation

**Feature**: 007-redis-ratelimit-openapi
**Date**: 2025-11-29

## Rate Limit Data (Redis)

### Rate Limit Record

No database schema required - data stored in Upstash Redis with TTL-based expiration.

**Key Pattern**: `ratelimit:{type}:{identifier}`

| Type | Identifier | TTL | Max Requests |
|------|------------|-----|--------------|
| login | email address | 15 minutes | 5 |
| contact | IP address | 1 hour | 5 |

**Value Structure** (managed by @upstash/ratelimit):
```
{
  "requests": number,      // Current count in window
  "windowStart": number,   // Unix timestamp
}
```

---

## OpenAPI Documentation Data

No database storage - generated at runtime from Zod schemas.

### API Endpoint Metadata

| Field | Type | Description |
|-------|------|-------------|
| path | string | URL path (e.g., `/api/auth/login`) |
| method | enum | HTTP method (GET, POST, PATCH, DELETE) |
| tags | string[] | Category tags (Auth, Admin, Agent, Public, Webhooks) |
| summary | string | Short description |
| description | string | Detailed description |
| requestBody | object | Zod schema reference for request |
| responses | object | Response schemas by status code |
| security | object[] | Auth requirements |

### Schema Registry

Existing Zod schemas to register:

| Package | Schema | Used By |
|---------|--------|---------|
| @nest/validation | loginSchema | /api/auth/login |
| @nest/validation | passwordResetSchema | /api/auth/reset |
| @nest/validation | changePasswordSchema | /api/auth/change-password |
| @nest/validation | createAgentSchema | /api/admin/agents |
| @nest/validation | updateAgentSchema | /api/admin/agents/[id] |
| @nest/validation | updateAgentProfileSchema | /api/agent/profile |
| @nest/validation | contentSubmissionSchema | /api/agent/content |
| @nest/validation | updateContentSchema | /api/agent/content/[id] |
| @nest/validation | feeStructureSchema | /api/agent/fees |
| @nest/validation | contactFormSchema | /api/public/contact |
| @nest/validation | globalContentSchema | /api/admin/global-content |
| @nest/validation | apex27WebhookPayloadSchema | /api/webhooks/apex27 |
| @nest/validation | postcodeAssignmentSchema | /api/admin/territories |

---

## State Transitions

### Rate Limit States

```
[Initial] → [Tracking] → [Limited] → [Reset]
    ↓           ↓            ↓          ↓
  First     Count<Max    Count>=Max   TTL expired
  request   (allowed)    (blocked)   (back to Initial)
```

### API Documentation Flow

```
[Zod Schemas] → [Registry] → [OpenAPI Spec] → [Swagger UI]
      ↓              ↓              ↓              ↓
  packages/     Register      Generate at     Render
  validation    with meta     request time    interactive UI
```

---

## Validation Rules

### Rate Limit Configuration

| Config | Login | Contact |
|--------|-------|---------|
| maxAttempts | 5 | 5 |
| windowDuration | 15 minutes | 1 hour |
| identifier | email (lowercase) | IP address |
| resetBehavior | Auto-expire | Auto-expire |

### OpenAPI Validation

| Rule | Enforcement |
|------|-------------|
| All schemas must have descriptions | Build-time check |
| All endpoints must have at least one response | Build-time check |
| Required fields must be marked | Inherited from Zod |
| Examples should be provided | Optional enhancement |
