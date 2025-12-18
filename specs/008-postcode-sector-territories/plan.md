# Implementation Plan: Postcode Sector Territory Subdivision

**Branch**: `008-postcode-sector-territories` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-postcode-sector-territories/spec.md`

## Summary

Add postcode sector subdivision to the territory management system, enabling agents to be assigned to finer-grained geographic areas (sectors like TA1 1, TA1 2) rather than just districts (TA1). This extends the existing postcode-based territory system with a hierarchical drill-down capability while maintaining backward compatibility with existing district assignments.

**Technical Approach**:
- Add new `postcode_sectors` table linked to existing `postcodes` (districts)
- Extend `agent_postcodes` junction table to support sector-level assignments
- Add drill-down UI interaction in the existing postcode map component
- Import ~12,000 sector boundaries from Edinburgh DataShare (Geolytix 2012 open data)

## Technical Context

**Language/Version**: TypeScript 5.3+ / Next.js 14 (App Router)
**Primary Dependencies**: @supabase/supabase-js, Mapbox GL JS, Zod, React Hook Form
**Storage**: PostgreSQL (Supabase) with PostGIS extension
**Testing**: Jest (unit), Playwright (E2E)
**Target Platform**: Web (Admin Dashboard)
**Project Type**: Turborepo monorepo (apps/dashboard, packages/*)
**Performance Goals**: 3 second map load, 30 second sector assignment workflow
**Constraints**: ~12,000 sector polygons loaded on-demand, backward compatible
**Scale/Scope**: 16 agents, 2,727 districts → ~12,400 sectors

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Simplicity | ✅ PASS | Extends existing pattern (postcodes table + agent_postcodes) |
| Test-First | ✅ PASS | Will include migration tests, API tests, E2E tests |
| Backward Compatibility | ✅ PASS | Existing district assignments unchanged |
| No Over-Engineering | ✅ PASS | Uses existing UI patterns, minimal new components |

**No constitution violations detected.**

## Project Structure

### Documentation (this feature)

```text
specs/008-postcode-sector-territories/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Data source research
├── data-model.md        # Phase 1: Database schema design
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: API contracts
│   ├── sectors-api.yaml # OpenAPI spec for sector endpoints
│   └── types.ts         # TypeScript type definitions
└── tasks.md             # Phase 2: Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/dashboard/
├── app/
│   └── api/admin/
│       ├── postcodes/
│       │   └── list/route.ts        # MODIFY: Add sector support
│       └── sectors/                  # NEW: Sector-specific endpoints
│           ├── list/route.ts         # GET sectors by district
│           └── [code]/
│               └── count/route.ts    # GET property count for sector
├── components/admin/
│   ├── postcode-page-client.tsx     # MODIFY: Add drill-down state
│   └── postcode-map.tsx             # MODIFY: Add sector layer rendering
└── lib/
    └── supabase/
        └── types.ts                 # MODIFY: Add sector types

supabase/migrations/
└── 2025XXXX_add_postcode_sectors.sql  # NEW: Schema migration

scripts/
└── import-sectors.ts                   # NEW: Data import script
```

**Structure Decision**: Extends existing Turborepo monorepo structure. All changes in `apps/dashboard` and `supabase/migrations`. No new packages needed.

## Complexity Tracking

> No complexity violations. Feature follows existing patterns.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| Data Model | Separate `postcode_sectors` table | Matches existing `postcodes` pattern |
| Assignment | Extend `agent_postcodes` with nullable `sector_code` | Backward compatible |
| UI | Drill-down in existing map | No new pages needed |
| Import | One-time script | Not production-critical path |
