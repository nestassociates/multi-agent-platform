# Implementation Plan: Redis Rate Limiting & OpenAPI Documentation

**Branch**: `007-redis-ratelimit-openapi` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-redis-ratelimit-openapi/spec.md`

## Summary

Migrate the platform's rate limiting from in-memory Map storage to Upstash Redis for distributed persistence, and add interactive API documentation via OpenAPI 3.0 spec with Swagger UI. This addresses two Priority 1 improvements from the system review: production-ready rate limiting and developer experience through API docs.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Next.js 14 (App Router)
**Primary Dependencies**: @upstash/ratelimit, @upstash/redis, @asteasolutions/zod-to-openapi, swagger-ui-react
**Storage**: Upstash Redis (rate limits), PostgreSQL/Supabase (existing data)
**Testing**: Jest (unit), Playwright (e2e)
**Target Platform**: Vercel (serverless)
**Project Type**: Turborepo monorepo (apps/dashboard + packages/*)
**Performance Goals**: <100ms rate limit checks, <2s API docs page load
**Constraints**: Serverless-compatible (no persistent connections), fail-open on Redis unavailability
**Scale/Scope**: 39 API endpoints to document, 2 rate-limited endpoints (login, contact)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is template-only (no project-specific rules defined). Default gates applied:
- ✅ No new packages/projects required (uses existing dashboard app)
- ✅ Standard patterns (REST API docs, Redis rate limiting)
- ✅ No breaking changes to existing interfaces

## Project Structure

### Documentation (this feature)

```text
specs/007-redis-ratelimit-openapi/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI spec)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/dashboard/
├── app/
│   ├── api/                    # 39 existing API routes
│   │   ├── admin/              # Admin endpoints (12 routes)
│   │   ├── agent/              # Agent endpoints (5 routes)
│   │   ├── auth/               # Auth endpoints (4 routes) - rate limited
│   │   ├── cron/               # Cron endpoints (2 routes)
│   │   ├── public/             # Public endpoints (5 routes) - contact rate limited
│   │   ├── upload/             # Upload endpoints (1 route)
│   │   └── webhooks/           # Webhook endpoints (1 route)
│   └── api-docs/               # NEW: Swagger UI page
│       └── page.tsx
├── lib/
│   ├── rate-limiter.ts         # MODIFY: Replace Map with Upstash Redis
│   ├── redis.ts                # NEW: Upstash Redis client
│   └── openapi/                # NEW: OpenAPI generation
│       ├── registry.ts         # Zod schema registry
│       ├── routes.ts           # Endpoint definitions
│       └── spec.ts             # OpenAPI document generator
└── components/
    └── swagger-ui.tsx          # NEW: Dynamic Swagger UI component

packages/validation/src/
├── auth.ts                     # Existing Zod schemas (login)
├── agent.ts                    # Existing Zod schemas
├── content.ts                  # Existing Zod schemas
├── contact.ts                  # Existing Zod schemas
├── fees.ts                     # Existing Zod schemas
├── global-content.ts           # Existing Zod schemas
├── property.ts                 # Existing Zod schemas
├── territory.ts                # Existing Zod schemas
└── webhooks.ts                 # Existing Zod schemas
```

**Structure Decision**: All changes within existing `apps/dashboard` - no new packages required. OpenAPI generation modules go in `lib/openapi/` to keep organized. Swagger UI served from `/api-docs` route.

## Complexity Tracking

No constitution violations - complexity is justified by existing technical requirements.
