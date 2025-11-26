# Implementation Plan: Agent Lifecycle Management

**Branch**: `004-agent-lifecycle-management` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-agent-lifecycle-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement controlled agent onboarding and site deployment workflow with auto-detection from Apex27, onboarding checklist tracking, and admin-controlled site activation. Prevents incomplete agent sites from deploying while streamlining the process of onboarding 16+ agents from Apex27 property data.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Next.js 14 (App Router) / Astro 4.x
**Primary Dependencies**: @supabase/supabase-js, Zod, React Hook Form, Resend (email)
**Storage**: PostgreSQL (Supabase) - existing agents, profiles, properties, build_queue tables + NEW agent_onboarding_checklist table
**Testing**: Jest (unit), Playwright (E2E), contract tests for API endpoints
**Target Platform**: Vercel (Next.js dashboard), Vercel (Astro static sites)
**Project Type**: Web application (Turborepo monorepo with apps/dashboard + apps/agent-site)
**Performance Goals**: Auto-detection <2s, status changes immediate, build filtering <500ms
**Constraints**: Must not break existing agent records, must be idempotent, backwards compatible
**Scale/Scope**: 16+ agents currently, scaling to 50+ agents, ~20 status changes per day

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: PASS (No constitution defined for this project)

This feature builds on existing Nest platform architecture:
- ✅ Uses existing monorepo structure
- ✅ Follows established patterns from specs/001
- ✅ Extends existing tables (agents) with new status values
- ✅ Adds new checklist table following same conventions
- ✅ No new architectural complexity introduced

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

### Source Code (repository root)

**Turborepo Monorepo Structure** - This feature modifies existing apps/packages:

```text
apps/dashboard/                              # Next.js 14 admin dashboard
├── app/
│   ├── (admin)/agents/                     # MODIFY: Add status filters, onboarding tab
│   │   ├── page.tsx                        # MODIFY: Add status filter
│   │   ├── [id]/page.tsx                   # MODIFY: Add onboarding tab
│   │   └── [id]/activate/page.tsx          # NEW: Activation confirmation
│   └── api/
│       └── admin/
│           ├── agents/
│           │   ├── route.ts                # MODIFY: Add status filter
│           │   └── [id]/
│           │       ├── activate/route.ts   # NEW: Activation endpoint
│           │       └── deactivate/route.ts # NEW: Deactivation endpoint
│           └── agents/
│               └── auto-detect/route.ts    # NEW: Manual trigger
├── components/admin/
│   ├── agent-onboarding-checklist.tsx      # NEW: Checklist component
│   ├── agent-status-badge.tsx              # NEW: Status indicator
│   └── agent-auto-detect-banner.tsx        # NEW: Draft agents banner
├── lib/services/
│   ├── agent-detection.ts                  # NEW: Auto-detection service
│   └── agent-activation.ts                 # NEW: Activation workflow
└── scripts/
    └── migrate-existing-agents.ts          # NEW: Migration script

supabase/migrations/
├── 20251125000001_expand_agent_status.sql  # NEW: Expand status enum
├── 20251125000002_create_onboarding_checklist.sql  # NEW: Checklist table
└── 20251125000003_migrate_existing_agents.sql      # NEW: Data migration

packages/
├── shared-types/src/
│   └── entities.ts                         # MODIFY: Add new status types
├── validation/src/
│   └── agent.ts                            # MODIFY: Add status validation
└── email/templates/
    ├── agent-detected.tsx                  # NEW: Admin notification
    └── site-activated.tsx                  # NEW: Agent notification

packages/build-system/
└── builder.ts                              # MODIFY: Filter by agent.status='active'

tests/
├── integration/
│   ├── agent-auto-detection.spec.ts        # NEW: Auto-detection test
│   └── agent-activation.spec.ts            # NEW: Activation flow test
└── e2e/
    └── agent-lifecycle.spec.ts             # NEW: Full lifecycle E2E
```

**Structure Decision**: Turborepo monorepo with modifications to existing apps/dashboard and packages. No new apps/packages needed - extends current agent management system.

## Complexity Tracking

**Status**: N/A - No constitution violations. This feature extends existing architecture without adding new complexity.
