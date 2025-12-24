# Quickstart: Property Detail Page

**Feature**: Property Detail Page
**Date**: 2025-12-23

## Overview

This guide covers implementing the enhanced property detail page for the main-site. The page displays comprehensive property information with an image gallery, agent info, viewing request form, and related content.

## Prerequisites

- Node.js 18+
- pnpm 8+
- Mapbox API token (for property map)
- Dashboard API running (port 3000)
- Main-site running (port 3001)

## Quick Start

```bash
# 1. Start dashboard API (provides property data)
cd apps/dashboard
pnpm dev

# 2. Start main-site
cd apps/main-site
pnpm dev

# 3. Visit a property page
open http://localhost:3001/property/example-property-slug
```

## Environment Variables

Add to `apps/main-site/.env.local`:

```env
# Dashboard API
DASHBOARD_API_URL=http://localhost:3000

# Mapbox (for property map)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token
```

## Key Files

### Page Component
```
apps/main-site/src/app/(frontend)/property/[slug]/page.tsx
```
Server component that fetches property data and renders the detail page.

### Property Components
```
apps/main-site/src/components/property/
├── PropertyGallery.tsx       # Image carousel with thumbnails
├── PropertyStats.tsx         # Stats grid (beds, baths, size, etc.)
├── PropertyDescription.tsx   # Expandable description
├── PropertyDetails.tsx       # Details grid (council tax, parking, etc.)
├── PropertyAccordions.tsx    # Floor plan, utilities, EPC accordions
├── PropertyMap.tsx           # Greyscale Mapbox map
├── ViewingRequestForm.tsx    # Form with validation
├── AgentOtherProperties.tsx  # Agent's other properties carousel
├── AgentReviews.tsx          # Reviews section
└── ShareDropdown.tsx         # Share functionality
```

### API Client
```
apps/main-site/src/lib/api/dashboard.ts
```
Functions: `getPropertyBySlug()`, `getAgentProperties()`

### Types
```
apps/main-site/src/lib/api/types.ts
```
TypeScript interfaces for Property, Agent, etc.

## Component Architecture

```
PropertyPage (Server Component)
├── PropertyGallery (Client)      # Interactive carousel
├── PropertyStats (Server)        # Static grid
├── Agent Card (Server)           # Desktop sidebar
├── PropertyDescription (Client)  # Expandable text
├── PropertyDetails (Server)      # Static grid
├── PropertyAccordions (Client)   # Interactive accordions
├── PropertyMap (Client)          # Mapbox GL
├── ViewingRequestForm (Client)   # Form with React Hook Form
├── AgentOtherProperties (Client) # Carousel with fetch
└── AgentReviews (Server/Client)  # GMB link/embed
```

## Data Flow

```
1. User visits /property/[slug]
2. Page fetches property from dashboard API
3. Property data includes agent info
4. Page renders with SSR for SEO
5. Client components hydrate for interactivity
6. User submits viewing request → POST to API
7. API stores request, syncs to Apex27, sends email
```

## API Endpoints

### Get Property Detail
```
GET /api/public/properties/:slug
Response: PropertyDetailResponse
```

### Submit Viewing Request
```
POST /api/public/viewing-request
Body: ViewingRequestAPIBody
Response: { success: true, message: string }
```

### Get Agent's Other Properties
```
GET /api/public/agents/:id/properties?exclude=:propertyId&limit=6
Response: AgentPropertiesResponse
```

## Form Validation

Using Zod + React Hook Form:

```typescript
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone number is required'),
  propertyToSell: z.enum(['yes', 'no', '']).optional(),
  propertyToLet: z.enum(['yes', 'no', '']).optional(),
})
```

## Responsive Breakpoints

- **Mobile**: `< 768px` - Single column, stacked layout
- **Tablet**: `768px - 1024px` - Two column gallery
- **Desktop**: `> 1024px` - Full layout with sidebar

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm e2e

# Manual testing checklist
- [ ] Property loads with all data
- [ ] Gallery carousel syncs with thumbnails
- [ ] SOLD badge shows on sold properties
- [ ] Description expands/collapses
- [ ] Accordions open/close
- [ ] Map displays property location
- [ ] Form validates inputs
- [ ] Form submits successfully
- [ ] Agent's other properties loads
- [ ] Page is responsive on all devices
```

## Common Issues

### Property Not Found
- Check dashboard API is running
- Verify property exists in database
- Check slug matches property title

### Map Not Loading
- Verify NEXT_PUBLIC_MAPBOX_TOKEN is set
- Check property has location coordinates
- Ensure Mapbox GL CSS is imported

### Form Submission Fails
- Check CORS origin is allowed
- Verify agent is active
- Check rate limiting (5/hour/IP)

## Related Documentation

- [Spec](./spec.md) - Feature requirements
- [Research](./research.md) - Technical investigation
- [Data Model](./data-model.md) - Entity definitions
- [Contracts](./contracts/) - API contracts
