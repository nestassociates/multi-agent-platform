# Implementation Plan: Separate Reviews & Fees from Content System

**Branch**: `005-separate-reviews-fees` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-separate-reviews-fees/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the content submission system to restrict content types to blog_post and area_guide only. Remove review and fee_structure from the unified content system and replace with: (1) Google My Business reviews integration using embedded Maps widget, (2) dedicated fee structure management with agent_fees table. Archive existing deprecated content using soft delete (is_archived flag).

## Technical Context

**Language/Version**: TypeScript 5.3+ / JavaScript ES2023
**Primary Dependencies**: Next.js 14 App Router, React 18, Supabase JS Client, Zod, React Hook Form
**Storage**: PostgreSQL (Supabase) - existing tables: content_submissions, agents, profiles
**Testing**: Jest (unit), Playwright (E2E)
**Target Platform**: Web (Next.js SSR + Client Components)
**Project Type**: Monorepo web application (Turborepo)
**Performance Goals**: <500ms page load for fee/review pages, <200ms API response for fee updates
**Constraints**: Must preserve existing content data (soft delete only), maintain backwards compatibility with blog_post/area_guide workflows, use single Google Maps API key (free tier: 25k loads/month)
**Scale/Scope**: Multi-tenant (100+ agents), 3 new pages, 2 new API routes, 3 database migrations, 6 new components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution found. Proceeding with standard best practices:
- Follow existing codebase patterns
- Maintain test coverage for new features
- Use existing validation and security patterns
- Document API contracts

✅ **PASS** - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Turborepo Monorepo)

```text
apps/dashboard/                    # Next.js admin/agent dashboard
├── app/
│   ├── (agent)/
│   │   ├── content/              # Existing - update to filter archived
│   │   ├── fees/                 # NEW - Fee structure management
│   │   └── reviews/              # NEW - GMB reviews display
│   └── api/
│       ├── agent/
│       │   ├── content/          # Existing - add archived filter
│       │   ├── fees/             # NEW - Fee CRUD API
│       │   └── profile/          # Existing - add google_place_id support
│       └── admin/
│           └── content/          # Existing - already handles filtering
├── components/
│   └── agent/
│       ├── content-form.tsx      # Existing - remove deprecated types
│       ├── fee-structure-form.tsx  # NEW
│       ├── gmb-place-id-form.tsx   # NEW
│       └── gmb-reviews-widget.tsx  # NEW
└── lib/
    └── sanitize.server.ts        # Existing - no changes

packages/validation/src/
├── content.ts                    # Existing - update enum
├── fees.ts                       # NEW - fee validation schemas
└── index.ts                      # Existing - export fees

packages/shared-types/src/
└── entities.ts                   # Existing - update ContentType, add AgentFee

supabase/migrations/
├── 20251126000001_archive_old_content_types.sql     # NEW
├── 20251126000002_create_agent_fees.sql             # NEW
└── 20251126000003_add_google_place_id.sql           # NEW
```

**Structure Decision**: Turborepo monorepo with apps/packages. Feature spans dashboard app (UI/API), validation package (schemas), and shared-types package (interfaces). Database changes via Supabase migrations.

## Complexity Tracking

No constitution violations. Feature follows existing patterns and introduces minimal new complexity.

## Phase 0: Research (Complete)

See [research.md](./research.md) for detailed research findings and technology decisions.

## Phase 1: Design Artifacts (Complete)

- **Data Model**: [data-model.md](./data-model.md) - Database schema changes and entity relationships
- **API Contracts**:
  - [contracts/api-fees.md](./contracts/api-fees.md) - Fee structure CRUD API
  - [contracts/api-profile-update.md](./contracts/api-profile-update.md) - google_place_id updates
- **Quickstart Guide**: [quickstart.md](./quickstart.md) - Implementation checklist and testing scenarios

## Next Steps

Run `/speckit.tasks` to generate actionable implementation tasks from this plan.
