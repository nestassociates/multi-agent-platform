# Implementation Plan: Astro Agent Microsite Deployment System

**Branch**: `006-astro-microsite-deployment` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-astro-microsite-deployment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build the static site generation and deployment pipeline for agent microsites. Each agent gets their own Astro static site at a subdomain. Properties are fetched client-side (always fresh). Blog posts, area guides, fees, and profile are baked at build time. Sections hide entirely if agent has no content. Global content (header, footer, legal pages) is admin-controlled and triggers all-site rebuilds when published. Build queue processes rebuilds triggered by content approval, profile updates, or global content changes.

## Technical Context

**Language/Version**: TypeScript 5.3+ / JavaScript ES2023
**Primary Dependencies**: Next.js 14 App Router (dashboard), Astro 4.x (agent sites), React 18, Supabase JS Client, Zod, Vercel SDK
**Storage**: PostgreSQL (Supabase) - existing tables: agents, profiles, properties, content_submissions, build_queue, global_content
**Testing**: Jest (unit), Playwright (E2E)
**Target Platform**: Vercel (both dashboard and agent site deployments)
**Project Type**: Monorepo web application (Turborepo) with static site generation
**Performance Goals**: <2s page load (3G mobile), <45s build time, <5min content freshness for properties
**Constraints**: Global content changes must rebuild ALL agents (<30 min for 100+ agents), 20 concurrent builds max, Figma designs required for Astro templates (BLOCKED)
**Scale/Scope**: Multi-tenant (100+ agents), ~10 Astro pages per agent, 3 new API routes, 1 admin UI section, enhanced data generator

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
specs/006-astro-microsite-deployment/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Turborepo Monorepo)

```text
apps/dashboard/                        # Next.js admin/agent dashboard
├── app/
│   ├── (admin)/
│   │   └── global-content/           # NEW - Global content admin UI
│   │       ├── page.tsx              # List all content types
│   │       └── [type]/
│   │           └── page.tsx          # Edit specific content type
│   └── api/
│       ├── admin/
│       │   └── global-content/       # NEW - Global content CRUD + publish
│       │       ├── route.ts          # List/create
│       │       └── [type]/
│       │           ├── route.ts      # Get/update
│       │           └── publish/
│       │               └── route.ts  # Publish & trigger rebuilds
│       └── public/
│           └── agents/
│               └── [id]/
│                   ├── properties/
│                   │   └── route.ts  # NEW - Public properties endpoint
│                   └── info/
│                       └── route.ts  # NEW - Basic agent info
│           └── contact/
│               └── route.ts          # NEW - Contact form handler
├── components/
│   └── admin/
│       ├── global-content-list.tsx   # NEW
│       └── global-content-editor.tsx # NEW

apps/agent-site/                       # Astro static site (⏸️ TEMPLATES BLOCKED ON FIGMA)
├── src/
│   ├── data/
│   │   └── site-data.json            # Generated at build time
│   ├── lib/
│   │   └── data.ts                   # Site data loader + types
│   ├── components/
│   │   ├── GlobalHeader.astro        # Uses global.header
│   │   ├── GlobalFooter.astro        # Uses global.footer
│   │   ├── Navigation.astro          # Conditional nav links
│   │   └── PropertyList.tsx          # React client-side property fetch
│   ├── layouts/
│   │   └── BaseLayout.astro          # Includes header/footer
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── services.astro
│       ├── contact.astro
│       ├── properties/
│       │   └── index.astro           # Client-side property loading
│       ├── blog/
│       │   ├── index.astro           # Only if has posts
│       │   └── [slug].astro
│       ├── areas/
│       │   ├── index.astro           # Only if has guides
│       │   └── [slug].astro
│       ├── reviews.astro             # Only if has GMB ID
│       ├── fees.astro                # Only if has fees
│       ├── privacy.astro
│       ├── terms.astro
│       └── cookies.astro

packages/build-system/src/
├── data-generator.ts                 # MODIFY - Add section visibility flags
├── queue.ts                          # MODIFY - Add global content rebuild trigger
└── types.ts                          # MODIFY - Add AgentSiteConfig interface

packages/validation/src/
├── webhooks.ts                       # MODIFY - Add contact form validation
└── index.ts                          # MODIFY - Export new schemas
```

**Structure Decision**: Turborepo monorepo with existing apps/packages. Feature spans dashboard app (admin UI, public API), agent-site app (Astro templates), build-system package (data generator, queue). New public API routes under `/api/public/` namespace for unauthenticated access.

## Complexity Tracking

No constitution violations. Feature follows existing patterns:
- Build queue already exists with priority ordering
- Data generator already fetches agent/content/global data
- Global content table already exists with draft/published states

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                  │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  STATIC AT BUILD │  DYNAMIC RUNTIME │  ADMIN-CONTROLLED             │
│  (baked into HTML)│  (JS fetch)      │  (triggers all-site rebuild) │
├──────────────────┼──────────────────┼───────────────────────────────┤
│  • Agent profile │  • Properties    │  • Header template            │
│  • Blog posts    │  • GMB reviews   │  • Footer template            │
│  • Area guides   │                  │  • Privacy policy             │
│  • Fee structure │                  │  • Terms of service           │
│  • Nav structure │                  │  • Cookie policy              │
│  (which sections │                  │  • Service descriptions       │
│   to show)       │                  │  • Default CTAs               │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

## Rebuild Trigger Matrix

| Event | Triggers Rebuild? | Scope |
|-------|-------------------|-------|
| Blog post approved | ✅ Yes | Single agent |
| Area guide approved | ✅ Yes | Single agent |
| Agent profile updated | ✅ Yes | Single agent |
| Agent fees updated | ✅ Yes | Single agent |
| Property synced from Apex27 | ❌ No | N/A (runtime fetch) |
| Global content published | ✅ Yes | **ALL agents** |
| Agent activated | ✅ Yes | Single agent |
| Agent deactivated | ✅ Yes (remove site) | Single agent |

## Implementation Phases

### Phase 0: Research ✅ Complete
See [research.md](./research.md) for detailed research findings and technology decisions.

### Phase 1: Design Artifacts ✅ Complete
- **Data Model**: [data-model.md](./data-model.md) - Section visibility, enhanced data generator
- **API Contracts**:
  - [contracts/api-public-properties.md](./contracts/api-public-properties.md) - Public properties endpoint
  - [contracts/api-public-contact.md](./contracts/api-public-contact.md) - Contact form handler
  - [contracts/api-global-content.md](./contracts/api-global-content.md) - Admin global content CRUD
- **Quickstart Guide**: [quickstart.md](./quickstart.md) - Implementation checklist

### Phase 2: Backend Implementation (CAN PROCEED)
1. Public API endpoints (no Figma dependency)
2. Global content admin UI (no Figma dependency)
3. Data generator enhancements (no Figma dependency)

### Phase 3: Astro Templates (⏸️ BLOCKED ON FIGMA)
1. Astro page templates
2. Component styling
3. Responsive layouts
4. Final integration

## API Endpoints Summary

### Public (No Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/public/agents/[id]/properties` | Agent's property listings |
| GET | `/api/public/agents/[id]/info` | Basic agent info for forms |
| POST | `/api/public/contact` | Contact form submission |

### Admin (Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/global-content` | List all global content |
| GET | `/api/admin/global-content/[type]` | Get specific content |
| PUT | `/api/admin/global-content/[type]` | Update content |
| POST | `/api/admin/global-content/[type]/publish` | Publish & trigger rebuilds |

## Next Steps

Run `/speckit.tasks` to generate actionable implementation tasks from this plan.
