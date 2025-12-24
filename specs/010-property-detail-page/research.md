# Research: Property Detail Page

**Feature**: Property Detail Page
**Date**: 2025-12-23
**Status**: Complete

## Executive Summary

This research resolves unknowns for the property detail page enhancement. The existing codebase has a basic property detail page structure, property gallery component, dashboard API, and viewing request system. Key findings: reviews come from Google My Business (GMB), Mapbox is available in the dashboard, and the viewing request API is fully functional.

## Research Findings

### RES-001: Property Detail Page Structure

**Question**: What does the existing property detail page include?

**Answer**: The page at `apps/main-site/src/app/(frontend)/property/[slug]/page.tsx` already includes:
- Basic image gallery (main + 2 thumbnails)
- Status badge (SOLD, UNDER OFFER, LET, LET AGREED)
- Price and location display
- Property stats grid (5 columns)
- Share icon (placeholder)
- Mobile agent info section
- About the property (key features + description)
- Two collapsible accordions (Utilities, EPC - placeholders)
- Map placeholder
- Desktop sidebar with agent card
- Request Viewing button
- Viewing request form section (basic HTML form - not functional)
- Agent's other properties section (placeholder)

**Gaps to address**:
1. Gallery needs carousel sync with thumbnails
2. Description needs Read More/Less toggle
3. Accordions need real data (floor plan, utilities, EPC)
4. Map needs Mapbox integration
5. Viewing request form needs validation & API integration
6. Agent's other properties needs carousel with real data
7. Agent reviews section missing entirely
8. Share dropdown functionality missing
9. Video tour icon missing
10. Floor plan accordion missing

### RES-002: API Endpoints

**Question**: What API endpoints exist vs need creation?

**Existing endpoints**:
- `GET /api/public/properties` - List properties with filters
- `GET /api/public/agents` - List agents
- `GET /api/public/agents/[id]/info` - Agent details
- `GET /api/public/agents/[id]/properties` - Agent's properties
- `POST /api/public/viewing-request` - Submit viewing request (fully functional)
- `POST /api/public/contact` - Contact form

**New endpoints needed**:
- `GET /api/public/properties/[slug]` - Single property by slug (currently getPropertyBySlug tries this but route doesn't exist)

**No new endpoints needed for reviews** - Reviews come from GMB iframe embed

### RES-003: Reviews System

**Question**: Where do agent reviews come from?

**Answer**: Reviews use Google My Business via the `google_place_id` stored in the `agents` table. The existing implementation:
1. Agents set their GMB Place ID in dashboard (`/reviews` page)
2. Reviews display via Google Maps iframe embed
3. No separate reviews database table exists

**For property detail page**: Display GMB embed or link to agent's GMB profile. Consider extracting reviews via Google Places API for more control over display, but this requires additional API key setup.

**Recommendation**: For MVP, link to agent's Google reviews or show GMB widget. Full carousel of individual reviews would require Google Places API.

### RES-004: Map Integration

**Question**: Is Mapbox available for the property map?

**Answer**: Yes, Mapbox is used in the dashboard for postcode territory maps:
- Package: `mapbox-gl` installed in dashboard
- Environment variable: `NEXT_PUBLIC_MAPBOX_TOKEN`
- Component pattern: `apps/dashboard/components/admin/postcode-map.tsx`

**For main-site**: Need to:
1. Add mapbox-gl to main-site package.json
2. Add Mapbox token to main-site environment
3. Create greyscale style map component
4. Properties have `location` field (PostGIS Point) with coordinates

### RES-005: Property Data Structure

**Question**: What property data is available for display?

**From database `properties` table**:
- `id`, `apex27_id`, `title`, `description`
- `price`, `bedrooms`, `bathrooms`, `property_type`
- `transaction_type` (sale/let), `status` (available/sold/under_offer/let/withdrawn)
- `features` (string array)
- `address` (JSON: line1, line2, city, town, county, postcode)
- `location` (PostGIS Point with coordinates)
- `images` (JSON array: url, alt, order)
- `floor_plan_url`, `virtual_tour_url`
- `is_featured`, `is_hidden`
- `raw_data` (full Apex27 property data)

**Missing in DB schema**:
- EPC data (current/potential ratings)
- Utilities data (electricity, heating, broadband, mobile)
- Tenure, size_sqft, council_tax_band, parking, garden, accessibility

**Recommendation**: Check if raw_data contains these fields from Apex27, otherwise make them optional with graceful degradation.

### RES-006: Viewing Request Form

**Question**: How should the viewing request form integrate?

**Answer**: Full API exists at `/api/public/viewing-request` with:
- Rate limiting (5 per IP/hour via Upstash Redis)
- Honeypot bot detection
- Zod validation (`viewingRequestSchema` from `@nest/validation`)
- Database storage in `viewing_requests` table
- Apex27 lead sync
- Email notification to agent

**Form fields from schema**:
- `name` (required)
- `email` (required)
- `phone` (optional)
- `agentId` (required)
- `propertyId` (optional)
- `apex27ListingId` (optional)
- `preferredDate` (optional)
- `preferredTime` (required - morning/afternoon/evening/flexible)
- `flexibleDates` (boolean)
- `buyerStatus` (required)
- `mortgageStatus` (required)
- `additionalNotes` (optional)
- `sourcePage` (optional)
- `honeypot` (honeypot field)

**Recommendation**: Use simplified form for main-site property page (name, surname, email, phone, property_to_sell, property_to_let dropdowns) - different from agent microsite form.

### RES-007: Existing Components

**Question**: What reusable components exist?

**From `apps/main-site/src/components/property/`**:
- `PropertyGallery.tsx` - Has carousel + lightbox, needs thumbnail sync enhancement
- `PropertyCard.tsx` - Card for grid display
- `PropertyGrid.tsx` - Grid layout
- `PropertyStatusBadge.tsx` - Status badges
- `PropertyAgentCard.tsx` - Agent display card
- `PropertyFeatures.tsx` - Features list
- `PropertyFilters.tsx` - Filter UI
- `PropertySearchBar.tsx` - Search bar
- `NoResults.tsx` - Empty state

**From `apps/main-site/src/components/ui/`**:
- `button.tsx`, `skeleton.tsx` - Standard UI components
- Need to add: `accordion.tsx`, carousel component

### RES-008: Agent Data

**Question**: What agent data is available?

**From `agents` table**:
- `id`, `subdomain`, `status`
- `bio`, `qualifications` (array)
- `social_media_links` (JSON)
- `google_place_id` (for reviews)
- `apex27_branch_id`, `apex27_contact_data`

**From `profiles` table (via join)**:
- `first_name`, `last_name`, `email`, `phone`
- `avatar_url`

**Agent's other properties**: Use existing `/api/public/agents/[id]/properties` endpoint

## Dependencies Identified

### External
- **Mapbox GL JS**: For property location map - add to main-site
- **react-hook-form + zod**: Already in main-site for form validation
- **@nest/validation**: Viewing request schema available

### Internal
- Dashboard public API (properties, agents endpoints)
- Existing component library (property components, UI components)
- Viewing request API

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing property data (EPC, utilities) | P2 features degraded | Hide sections when data unavailable |
| GMB reviews API complexity | P3 reviews delayed | Use simple GMB link/embed for MVP |
| Mapbox token exposure | Security | Use public token with domain restriction |
| Image gallery sync complexity | P1 feature delayed | Keep existing gallery, enhance incrementally |

## Recommendations

1. **Phased approach**:
   - Phase A: Core P1 features (gallery sync, form validation, API integration)
   - Phase B: P2 features (map, accordions, agent properties carousel)
   - Phase C: P3 features (reviews, share, video)

2. **API strategy**: Create single property endpoint `/api/public/properties/[slug]` returning enhanced data

3. **Reviews approach**: For MVP, link to agent's Google Business profile. Full review carousel as future enhancement.

4. **Form simplification**: Use simpler form fields for main-site (different from microsite) - just first name, surname, email, phone, and yes/no dropdowns for property to sell/let

## Action Items

- [x] Research property data structure
- [x] Research API endpoints
- [x] Research reviews system
- [x] Research map integration
- [x] Research form validation
- [x] Identify component reuse opportunities
