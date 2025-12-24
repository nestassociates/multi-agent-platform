# Implementation Plan: Nest Associates Main Website

**Branch**: `009-main-website` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-main-website/spec.md`

## Summary

Build the public-facing Nest Associates website (nestassociates.co.uk) using Next.js 15 with Payload CMS 3.0 for content management. The site will fetch property and agent data from the existing dashboard API, integrate all forms with Apex27 CRM, and provide a CMS for blog posts and reviews management. Follows Figma designs with full responsive support.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Next.js 15 (App Router)
**Primary Dependencies**: Payload CMS 3.0, React 19, Tailwind CSS 3.x, Zod, React Hook Form
**Storage**: Supabase PostgreSQL (shared database, Payload uses `payload` schema)
**Testing**: Playwright (E2E), Jest (unit), React Testing Library
**Target Platform**: Web (Vercel deployment), responsive 320px-2560px
**Project Type**: Web application (monorepo app)
**Performance Goals**: Page loads < 3 seconds, API responses < 2 seconds, Core Web Vitals pass
**Constraints**: GDPR compliant, SEO optimized, Apex27 CRM integration required
**Scale/Scope**: ~15 page types, 1000+ property listings, 50+ agents, public traffic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template has not been customized for this project. Proceeding with standard best practices:

| Gate | Status | Notes |
|------|--------|-------|
| Test coverage required | PASS | Playwright E2E + Jest unit tests planned |
| No unnecessary complexity | PASS | Single app, no microservices |
| Dependencies justified | PASS | Payload CMS for content, existing APIs for data |
| Security considered | PASS | GDPR compliance, cookie consent, admin-only CMS |

## Project Structure

### Documentation (this feature)

```text
specs/009-main-website/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── openapi.yaml     # Internal API contracts
│   └── apex27.md        # Apex27 integration spec
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/main-site/
├── src/
│   ├── app/
│   │   ├── (frontend)/           # Public pages
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── buy/              # Property listings (sale)
│   │   │   ├── rent/             # Property listings (let)
│   │   │   ├── property/[slug]/  # Property detail
│   │   │   ├── sell/             # Lead gen - sellers
│   │   │   ├── landlords/        # Lead gen - landlords
│   │   │   ├── agents/           # Agent directory
│   │   │   ├── agent/[id]/       # Agent profile
│   │   │   ├── join/             # Agent recruitment
│   │   │   ├── journal/          # Blog listing
│   │   │   ├── journal/[slug]/   # Blog article
│   │   │   ├── about/            # About page
│   │   │   ├── reviews/          # Reviews page
│   │   │   ├── contact/          # Contact page
│   │   │   ├── register/         # Buyer registration
│   │   │   └── policies/         # Legal pages
│   │   ├── (payload)/            # CMS admin
│   │   │   ├── admin/[[...segments]]/
│   │   │   └── api/              # Payload API routes
│   │   ├── api/                  # Custom API routes
│   │   │   ├── forms/            # Form submission handlers
│   │   │   └── sitemap/          # Dynamic sitemap
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/               # Header, Footer, Nav
│   │   ├── property/             # Property cards, gallery, filters
│   │   ├── agent/                # Agent cards, profile
│   │   ├── forms/                # Contact, lead, registration forms
│   │   ├── blog/                 # Blog cards, article
│   │   ├── reviews/              # Review cards, carousel
│   │   └── ui/                   # Shared UI components
│   ├── collections/              # Payload CMS collections
│   │   ├── Posts.ts
│   │   ├── Reviews.ts
│   │   ├── Users.ts
│   │   └── Media.ts
│   ├── lib/
│   │   ├── api/                  # Dashboard API client
│   │   ├── apex27/               # Apex27 CRM client
│   │   ├── supabase/             # Supabase client
│   │   └── utils/                # Helpers
│   └── payload.config.ts
├── public/
│   ├── media/                    # CMS uploads
│   └── images/                   # Static assets
├── tests/
│   ├── e2e/                      # Playwright tests
│   └── unit/                     # Jest tests
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

**Structure Decision**: Monorepo app at `apps/main-site/` following existing pattern. Next.js App Router with route groups: `(frontend)` for public pages, `(payload)` for CMS admin. Payload CMS embedded (not separate).

## Key Technical Decisions

### 1. Next.js 15 + Payload CMS 3.0

**Decision**: Use Next.js 15 with embedded Payload CMS 3.0
**Rationale**: Payload 3.0 is built on Next.js, provides excellent DX for content management, and eliminates need for separate CMS deployment. React 19 compatibility.
**Alternatives Rejected**:
- Strapi: Requires separate deployment, more complex
- Contentful: SaaS cost, less control
- Sanity: Good but Payload's Next.js integration is tighter

### 2. Shared Supabase Database

**Decision**: Use existing Supabase PostgreSQL instance with Payload in separate `payload` schema
**Rationale**: Simplifies infrastructure, enables future shared auth, reduces costs
**Alternatives Rejected**:
- Separate database: Unnecessary complexity and cost
- SQLite: Not suitable for production CMS

### 3. Dashboard API for Properties/Agents

**Decision**: Fetch property and agent data from existing dashboard API (`/api/public/*`)
**Rationale**: Single source of truth, APIs already exist with CORS support, 5-minute caching
**Alternatives Rejected**:
- Direct Supabase queries: Would duplicate logic, bypass business rules
- Data replication: Unnecessary complexity

### 4. Apex27 CRM Integration

**Decision**: All forms submit directly to Apex27 CRM via API
**Rationale**: Centralized lead management, existing CRM system, no local lead storage needed
**Alternatives Rejected**:
- Local database + email: Would create data silos, manual export needed
- Multiple CRM integrations: Unnecessary complexity

### 5. Cookie Consent + GA4

**Decision**: Implement cookie consent banner with GA4 only loading after consent
**Rationale**: GDPR compliance requirement, standard practice for UK sites
**Implementation**: Use consent-mode v2 for GA4

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Dashboard API | REST (read) | Property & agent data |
| Apex27 CRM | REST (write) | Form submissions |
| Supabase Auth | SDK | CMS admin authentication |
| Supabase Storage | SDK | CMS media uploads |
| Google Analytics 4 | Script | Visitor analytics |
| Vercel | Platform | Hosting & deployment |

## Complexity Tracking

No constitution violations requiring justification.

## Phase Dependencies

```
Phase 0: Research
    └── research.md (Apex27 API, GA4 consent mode)

Phase 1: Design
    ├── data-model.md (Payload collections)
    ├── contracts/openapi.yaml (form APIs)
    ├── contracts/apex27.md (CRM integration)
    └── quickstart.md (developer setup)

Phase 2: Tasks (via /speckit.tasks)
    └── tasks.md (implementation tasks)
```
