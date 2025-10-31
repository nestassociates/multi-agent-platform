# Implementation Plan: Multi-Agent Real Estate Platform

**Branch**: `001-multi-agent-platform` | **Date**: 2025-10-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-multi-agent-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a JAMstack multi-agent real estate platform enabling a central admin team to manage 1,000+ independent real estate agents, each with their own branded microsite. The platform features centralized content moderation, real-time property synchronization from Apex27 CRM, visual territory management with market intelligence, and automated static site builds deployed to subdomains.

**Core User Flows**:
1. Admin creates agent accounts → Agents receive credentials → Log in and update profiles
2. Apex27 sends property webhooks → System validates and stores → Properties appear on agent sites
3. Agents create content → Submit for review → Admin approves → Content queued for build
4. Build system processes queue → Generates Astro static sites → Deploys to subdomains

## Technical Context

**Language/Version**: TypeScript 5.3+ / JavaScript ES2023
**Primary Dependencies**:
- **Monorepo**: Turborepo for managing multiple packages
- **Backend/API**: Next.js 14 App Router (admin/agent dashboards)
- **Database**: Supabase (PostgreSQL 15 with PostGIS extension)
- **Authentication**: Supabase Auth (JWT-based with 2FA support)
- **Storage**: Supabase Storage (S3-compatible)
- **Static Sites**: Astro 4.x for agent microsites
- **UI Framework**: React 18, Tailwind CSS 3.4+, shadcn/ui
- **Maps**: Mapbox GL JS 3.x for territory visualization
- **External APIs**: Apex27 CRM webhooks, OS Data Hub Features API
- **Rich Text**: Tiptap (ProseMirror-based editor)

**Storage**:
- **Primary**: Supabase PostgreSQL with PostGIS for geospatial data (territories, property locations)
- **File Storage**: Supabase Storage for images, documents, media files
- **Caching**: Built-in Next.js caching, optional Redis for public API endpoints

**Testing**:
- **Unit**: Jest + React Testing Library for components and utilities
- **Integration**: Playwright for API endpoint testing
- **E2E**: Playwright for critical user journeys across dashboards
- **Contract**: OpenAPI schema validation for API contracts
- **Accessibility**: axe-core automated testing + manual screen reader verification

**Target Platform**:
- **Hosting**: Vercel (serverless edge functions, automatic scaling)
- **Browsers**: Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- **Devices**: Desktop (primary), tablet, mobile (responsive)
- **Region**: UK-focused (Supabase UK region for data residency)

**Project Type**: Monorepo with multiple web applications and packages

**Performance Goals**:
- Agent microsites: <1 second page load (p95) on 4G connection
- Dashboard applications: <2 seconds page load (p95)
- API endpoints: <200ms response time (p95)
- Static site builds: <30 seconds per agent (p95)
- Concurrent builds: Support 20 parallel builds without degradation
- Webhook processing: Handle 10 requests/second from Apex27

**Constraints**:
- Must support 1,000+ agent microsites simultaneously
- Must handle 100+ concurrent dashboard users
- 99.9% uptime requirement (max 43 minutes downtime/month)
- GDPR compliance (data export, right to erasure, audit logs)
- WCAG 2.1 AA accessibility compliance
- Lighthouse scores: 95+ (Performance, Accessibility, Best Practices, SEO)
- Build queue must prevent flooding (duplicate detection)
- Webhook security: HMAC-SHA256 signature validation required
- No service role key exposure client-side
- Row Level Security (RLS) enforced on all database tables

**Scale/Scope**:
- Initial launch: 16 agents
- Target: 1,000+ agents within 6 months
- Content types: 4 (blog posts, area guides, reviews, fee structures)
- Property types: 3 (sale, let, commercial)
- User roles: 3 (super_admin, admin, agent)
- Microsite pages: 11 page types per agent
- API endpoints: ~30 (public + authenticated)
- Database entities: 9 core tables + audit/logging tables
- Build priorities: 4 levels (P1-P4)
- Email templates: 7+ transactional emails

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No project constitution currently defined. Using industry best practices and project requirements.

Since the constitution file contains only template placeholders, the following principles will guide this implementation:

### Guiding Principles Applied

**1. Separation of Concerns**
- ✓ Dashboard and agent microsites are separate applications with distinct purposes
- ✓ Monorepo structure ensures shared code (types, utilities) while maintaining independence
- ✓ Clear API boundaries between Next.js dashboards and Astro static sites

**2. Security First**
- ✓ RLS policies enforce data isolation (agents can only access own data)
- ✓ Webhook signature validation prevents unauthorized property updates
- ✓ 2FA required for admin accounts
- ✓ Service role keys never exposed client-side
- ✓ Rate limiting on authentication and API endpoints

**3. Test-Driven Development**
- ✓ Test critical user journeys before implementation
- ✓ Contract tests for API endpoints
- ✓ Integration tests for webhook processing
- ✓ Accessibility tests for WCAG 2.1 AA compliance

**4. Observability & Monitoring**
- ✓ Vercel Analytics for real-time performance
- ✓ Sentry for error tracking
- ✓ Build queue monitoring in admin dashboard
- ✓ Audit logs for compliance
- ✓ Alert system for critical failures

**5. Scalability & Performance**
- ✓ Static site generation for agent microsites (ultra-fast, globally distributed)
- ✓ Build queue with priority system prevents resource exhaustion
- ✓ Parallel build processing (up to 20 concurrent)
- ✓ Caching for public API endpoints
- ✓ PostGIS for efficient geospatial queries

**6. Developer Experience**
- ✓ Turborepo for fast incremental builds
- ✓ TypeScript for type safety across entire codebase
- ✓ Shared UI components (shadcn/ui) for consistency
- ✓ OpenAPI contracts for API documentation
- ✓ Quickstart guide for onboarding

### Re-evaluation After Phase 1

Will verify:
- Data model aligns with RLS policies
- API contracts support all user flows
- No over-engineering (complexity justified)
- All security requirements have implementation plans

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-agent-platform/
├── spec.md              # Feature specification (already created)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - technology decisions and patterns
├── data-model.md        # Phase 1 output - database schema and relationships
├── quickstart.md        # Phase 1 output - developer onboarding guide
├── contracts/           # Phase 1 output - API contracts and schemas
│   ├── openapi.yaml     # OpenAPI 3.1 specification for all endpoints
│   ├── webhooks/        # Webhook payload schemas
│   │   └── apex27.json  # Apex27 webhook contract
│   └── types/           # TypeScript type definitions
│       ├── entities.ts  # Database entity types
│       └── api.ts       # API request/response types
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Requirements quality checklist (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a **Turborepo monorepo** with multiple applications and shared packages:

```text
# Monorepo root
├── apps/
│   ├── dashboard/           # Next.js 14 App Router - Admin & Agent dashboards
│   │   ├── app/
│   │   │   ├── (admin)/     # Admin-only routes
│   │   │   │   ├── agents/
│   │   │   │   ├── territories/
│   │   │   │   ├── content-moderation/
│   │   │   │   ├── build-queue/
│   │   │   │   ├── global-content/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── (agent)/     # Agent-only routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── profile/
│   │   │   │   ├── content/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── (auth)/      # Auth routes (login, reset, 2FA)
│   │   │   ├── api/         # API routes
│   │   │   │   ├── webhooks/
│   │   │   │   │   └── apex27/
│   │   │   │   ├── public/  # Public API endpoints
│   │   │   │   │   ├── agents/
│   │   │   │   │   └── properties/
│   │   │   │   ├── admin/   # Admin API endpoints
│   │   │   │   ├── agent/   # Agent API endpoints
│   │   │   │   └── build/   # Build system endpoints
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── agent/
│   │   │   ├── auth/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── supabase/
│   │   │   ├── validation.ts
│   │   │   └── utils.ts
│   │   ├── middleware.ts    # Role-based route protection
│   │   └── tests/
│   │       ├── e2e/
│   │       ├── integration/
│   │       └── unit/
│   │
│   └── agent-site/          # Astro 4.x - Agent microsite template
│       ├── src/
│       │   ├── pages/
│       │   │   ├── index.astro         # Homepage
│       │   │   ├── about.astro
│       │   │   ├── services.astro
│       │   │   ├── properties/
│       │   │   │   ├── index.astro     # Property grid
│       │   │   │   └── [slug].astro    # Property detail
│       │   │   ├── blog/
│       │   │   │   ├── index.astro     # Blog archive
│       │   │   │   └── [slug].astro    # Blog post
│       │   │   ├── areas/
│       │   │   │   ├── index.astro     # Area guides archive
│       │   │   │   └── [slug].astro    # Area guide detail
│       │   │   ├── reviews.astro
│       │   │   └── contact.astro
│       │   ├── components/
│       │   │   ├── Hero.astro
│       │   │   ├── PropertyCard.astro
│       │   │   ├── BlogCard.astro
│       │   │   ├── ContactForm.astro
│       │   │   └── Layout/
│       │   ├── layouts/
│       │   │   └── BaseLayout.astro
│       │   ├── styles/
│       │   │   └── global.css
│       │   └── data/             # Build-time data injection point
│       │       └── agent.json    # Generated by build system
│       └── public/
│           └── assets/
│
├── packages/
│   ├── shared-types/        # Shared TypeScript types
│   │   ├── entities.ts      # Database entities
│   │   ├── api.ts           # API contracts
│   │   └── webhooks.ts      # Webhook payloads
│   │
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   │   ├── components/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (all shadcn/ui components)
│   │   └── lib/
│   │       └── utils.ts
│   │
│   ├── database/            # Database utilities and migrations
│   │   ├── migrations/
│   │   │   └── *.sql
│   │   ├── seeds/
│   │   ├── rls-policies/
│   │   │   └── *.sql
│   │   └── lib/
│   │       ├── client.ts
│   │       └── queries.ts
│   │
│   ├── validation/          # Shared validation schemas (Zod)
│   │   ├── auth.ts
│   │   ├── agent.ts
│   │   ├── content.ts
│   │   ├── property.ts
│   │   └── territory.ts
│   │
│   ├── build-system/        # Build orchestration logic
│   │   ├── queue.ts         # Build queue management
│   │   ├── builder.ts       # Astro build trigger
│   │   ├── data-generator.ts # JSON generation for agent sites
│   │   └── deployment.ts    # Vercel API integration
│   │
│   └── email/               # Email templates and sending
│       ├── templates/
│       │   ├── welcome.tsx
│       │   ├── content-approved.tsx
│       │   ├── content-rejected.tsx
│       │   └── build-failed.tsx
│       └── lib/
│           └── sender.ts
│
├── supabase/                # Supabase configuration
│   ├── config.toml
│   ├── migrations/          # SQL migrations
│   └── seed.sql             # Initial data
│
├── tests/
│   ├── contract/            # API contract tests
│   ├── integration/         # Cross-package integration tests
│   └── e2e/                 # End-to-end user journey tests
│
├── .github/
│   └── workflows/
│       ├── ci.yml           # Run tests on PR
│       └── deploy.yml       # Deploy to Vercel
│
├── turbo.json               # Turborepo pipeline config
├── package.json             # Root package.json
└── tsconfig.json            # Root TypeScript config
```

**Structure Decision**:

Selected **Monorepo with multiple web applications** structure for the following reasons:

1. **Multiple distinct applications**:
   - Dashboard app serves both admin and agent users (different route groups)
   - Agent site template is completely separate (Astro vs Next.js)
   - Shared code (types, UI components, database client) justifies monorepo

2. **Turborepo benefits**:
   - Incremental builds (only rebuild changed packages)
   - Parallel task execution (tests, linting, builds)
   - Shared configuration (TypeScript, ESLint, Tailwind)
   - Dependency management between packages

3. **Separation of concerns**:
   - Dashboard handles all CRUD operations, authentication, real-time updates
   - Agent sites are pure static HTML/CSS/JS (no server runtime)
   - Build system package orchestrates the bridge between them

4. **Scalability**:
   - Easy to add new dashboard features without impacting agent sites
   - Can optimize agent site templates independently
   - Shared packages prevent code duplication across 1,000+ agent sites

5. **Testing**:
   - Unit tests live with each package
   - Integration tests at monorepo root test package interactions
   - E2E tests cover full user journeys across applications

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations to track. The architecture aligns with standard JAMstack patterns:
- Static site generation for performance and scale
- Centralized dashboard for admin/agent management
- Clear API boundaries and contracts
- Standard authentication and authorization patterns
- Well-established technology choices (Next.js, Astro, Supabase)

The complexity is inherent to the multi-tenant SaaS requirements (1,000+ independent sites) and is managed through:
- Build queue system (prevents resource exhaustion)
- RLS policies (automatic data isolation)
- Static generation (eliminates runtime overhead per agent)
- Monorepo structure (code reuse without tight coupling)
