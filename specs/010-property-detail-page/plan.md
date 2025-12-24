# Implementation Plan: Property Detail Page

**Branch**: `010-property-detail-page` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-property-detail-page/spec.md`

## Summary

Enhance the existing property detail page at `apps/main-site/src/app/(frontend)/property/[slug]/page.tsx` with a comprehensive, responsive layout featuring: synchronized image gallery carousel with stacked thumbnails, SOLD badge overlay, property stats grid with icons, dynamic agent card, expandable description, property details grid, collapsible accordions (floor plan, utilities, EPC), greyscale Mapbox map with custom marker, viewing request form with validation, agent's other properties carousel, and agent reviews carousel.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Next.js 15 (App Router)
**Primary Dependencies**: React 19, Tailwind CSS 3.x, Zod, React Hook Form, Mapbox GL JS, Lucide React
**Storage**: Supabase PostgreSQL (via dashboard API)
**Testing**: Jest (unit), Playwright (e2e)
**Target Platform**: Web (responsive: mobile, tablet, desktop)
**Project Type**: Monorepo (apps/main-site is Next.js 15 frontend)
**Performance Goals**: Page load <3s, interaction response <200ms, Lighthouse score >90
**Constraints**: SSR for SEO, progressive enhancement, accessibility (WCAG 2.1 AA)
**Scale/Scope**: Single property detail page template serving all properties

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Extends existing main-site application (no new apps)
- [x] Uses existing UI component library patterns
- [x] Follows established API patterns (dashboard public API)
- [x] No new databases or services required
- [x] All dependencies already in package.json (except Mapbox if needed)

## Project Structure

### Documentation (this feature)

```text
specs/010-property-detail-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/main-site/
├── src/
│   ├── app/
│   │   └── (frontend)/
│   │       └── property/
│   │           └── [slug]/
│   │               └── page.tsx          # Property detail page (ENHANCE)
│   ├── components/
│   │   ├── property/
│   │   │   ├── PropertyGallery.tsx       # Image gallery (ENHANCE with sync)
│   │   │   ├── PropertyStats.tsx         # Stats grid (NEW)
│   │   │   ├── PropertyDescription.tsx   # Expandable description (NEW)
│   │   │   ├── PropertyDetails.tsx       # Details grid (NEW)
│   │   │   ├── PropertyAccordions.tsx    # Floor plan, utilities, EPC (NEW)
│   │   │   ├── PropertyMap.tsx           # Greyscale Mapbox map (NEW)
│   │   │   ├── ViewingRequestForm.tsx    # Form with validation (NEW)
│   │   │   ├── AgentOtherProperties.tsx  # Carousel (NEW)
│   │   │   ├── AgentReviews.tsx          # Reviews carousel (NEW)
│   │   │   └── ShareDropdown.tsx         # Share functionality (NEW)
│   │   └── ui/
│   │       ├── accordion.tsx             # shadcn accordion (ADD if missing)
│   │       └── carousel.tsx              # Carousel component (NEW or ADD)
│   └── lib/
│       └── api/
│           ├── dashboard.ts              # Existing API client (EXTEND)
│           └── types.ts                  # Types (EXTEND)
│
apps/dashboard/
├── app/
│   └── api/
│       └── public/
│           ├── properties/
│           │   └── [slug]/
│           │       └── route.ts          # Single property endpoint (NEW)
│           └── agents/
│               └── [id]/
│                   ├── properties/
│                   │   └── route.ts      # Agent properties (EXISTS)
│                   └── reviews/
│                       └── route.ts      # Agent reviews (NEW)
```

**Structure Decision**: Extend existing main-site app and dashboard API. Create new components in property/ folder following established patterns.

## Complexity Tracking

No violations - all work fits within existing architecture.
