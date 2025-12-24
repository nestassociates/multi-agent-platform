# Phase 0 Research: Nest Associates Main Website

**Feature Branch**: `009-main-website`
**Research Date**: 2025-12-18
**Status**: Complete

## Research Topics

### 1. Apex27 CRM Integration

#### Overview
Apex27 is a UK-based estate agent CRM platform. The existing dashboard already integrates with Apex27 for property data (inbound). The main website needs **outbound** integration to submit form data.

#### Existing Integration (Reference)
The dashboard already has Apex27 client at `apps/dashboard/lib/apex27/client.ts` with:
- Property listings (GET)
- Contact creation (POST `/contacts`)
- Lead creation (POST `/leads`)
- Viewing requests

#### API Endpoints for Main Website Forms

Based on existing implementation in `apps/dashboard/lib/apex27/`:

| Form Type | Apex27 Endpoint | Method | Notes |
|-----------|-----------------|--------|-------|
| Seller/Landlord Lead | `/contacts` + `/leads` | POST | Create contact, then lead with `requestValuation: true` |
| General Contact | `/contacts` + `/leads` | POST | Create contact, then lead with notes |
| Agent Contact | `/contacts` + `/leads` | POST | Include specific `branchId` for agent |
| Buyer Registration | `/contacts` + `/leads` | POST | Store preferences in notes or custom fields |
| Join Application | `/contacts` + `/leads` | POST | Lead type for recruitment |

#### Authentication
```typescript
headers: {
  'X-Api-Key': process.env.APEX27_API_KEY,
  'Content-Type': 'application/json',
}
```

#### Contact Creation Flow
1. Check if contact exists by email (`GET /contacts?email=...`)
2. If not found, create contact (`POST /contacts`)
3. Create lead with `contactId` (`POST /leads`)

#### Lead Types for Different Forms

```typescript
// Seller/Landlord Valuation Request
const valuationLead: Apex27LeadInput = {
  branchId: number,      // Main office branch ID
  contactId: number,     // From step 1-2
  source: 'Main Website',
  howDidYouHear: 'Website',
  requestValuation: true,
  requestViewing: false,
  requestListingDetails: false,
  notes: 'Property address: ..., Additional details: ...',
};

// General Contact
const generalLead: Apex27LeadInput = {
  branchId: number,
  contactId: number,
  source: 'Main Website',
  howDidYouHear: 'Website',
  requestValuation: false,
  requestViewing: false,
  requestListingDetails: false,
  notes: 'Enquiry: ...',
};

// Buyer Registration
const buyerLead: Apex27LeadInput = {
  branchId: number,
  contactId: number,
  source: 'Main Website - Buyer Registration',
  howDidYouHear: 'Website',
  requestListingDetails: true,
  notes: 'Preferences: Location: X, Budget: Y, Bedrooms: Z',
};
```

#### Recommended Implementation
Reuse existing `apps/dashboard/lib/apex27/client.ts` by moving to shared package or duplicating minimal client in main-site.

---

### 2. Google Analytics 4 Consent Mode v2

#### Overview
GA4 must only load after user consent for GDPR compliance. Google Consent Mode v2 provides a framework for this.

#### Key Parameters
| Parameter | Purpose |
|-----------|---------|
| `analytics_storage` | Controls GA4 data collection |
| `ad_storage` | Controls advertising cookies |
| `ad_user_data` | Controls data sharing for ads |
| `ad_personalization` | Controls personalized ads |

#### Implementation Strategy: Default Deny

```javascript
// In <head> BEFORE gtag.js loads
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Set default consent state to denied
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500,  // Wait for consent banner
});

// Load gtag.js
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');
```

#### On User Consent

```javascript
// When user clicks "Accept" on cookie banner
gtag('consent', 'update', {
  'analytics_storage': 'granted',
  'ad_storage': 'granted',  // If using Google Ads
  'ad_user_data': 'granted',
  'ad_personalization': 'granted',
});
```

#### Cookie Banner Requirements
- Must appear on first visit
- Must allow granular consent (analytics vs marketing)
- Must store consent choice (localStorage or cookie)
- Must allow changing consent later

#### Recommended Library
- **@cookieyes/cookieconsent** - Lightweight React component
- Or custom implementation with localStorage

#### Next.js Implementation Pattern

```tsx
// app/components/CookieConsent.tsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export function Analytics() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    if (stored) {
      setConsent(stored === 'true');
    }
  }, []);

  // Only load GA4 if consent given
  if (consent !== true) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'update', {
            'analytics_storage': 'granted',
          });
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
    </>
  );
}
```

---

### 3. Payload CMS 3.0 with PostgreSQL

#### Overview
Payload CMS 3.0 is designed to install directly into Next.js 15 apps. It uses Drizzle ORM for database access.

#### PostgreSQL Adapter

```typescript
// payload.config.ts
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    schemaName: 'payload', // Separate schema from main app
  }),
  // ...
});
```

#### Shared Database Strategy

Since we're using Supabase PostgreSQL shared with the dashboard:

1. **Use separate schema**: `payload` schema for CMS tables
2. **Connection string**: Same Supabase connection string
3. **Migrations**: Payload auto-manages within its schema
4. **No conflicts**: Dashboard uses `public` schema, Payload uses `payload` schema

#### Schema Configuration

```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL,
  },
  schemaName: 'payload',  // Critical: isolates CMS tables
  migrationTableName: 'payload_migrations',
}),
```

#### Collections Needed

| Collection | Purpose | Fields |
|------------|---------|--------|
| Posts | Blog articles | title, slug, content, featuredImage, category, author, publishedAt, status |
| Reviews | Customer testimonials | rating, text, reviewer, source, agentId (optional), publishedAt |
| Media | Image uploads | Standard Payload media collection |
| Users | CMS admins | Standard Payload auth, role field |

#### Admin Authentication
Payload provides built-in auth. For Supabase integration later:
- Start with Payload's built-in auth
- Can integrate Supabase Auth later if needed for SSO

#### Rich Text Editor
Payload 3.0 uses Lexical by default:

```typescript
import { lexicalEditor } from '@payloadcms/richtext-lexical';

export default buildConfig({
  editor: lexicalEditor({}),
  // ...
});
```

---

### 4. Dashboard API Integration

#### Existing Public Endpoints

From `apps/dashboard/app/api/public/`:

**Properties** (`GET /api/public/properties`)
```typescript
// Query params
transaction_type?: 'sale' | 'rental'
min_price?: number
max_price?: number
bedrooms?: number
property_type?: string
location?: string
page?: number
per_page?: number
sort?: 'price_asc' | 'price_desc' | 'newest'

// Response includes: id, price, bedrooms, bathrooms, address, images, agent info
```

**Agents** (`GET /api/public/agents`)
```typescript
// Returns active agents with:
id, name, email, phone, bio, avatar_url, microsite_url, territories
```

**Agent Properties** (`GET /api/public/agents/[id]/properties`)
```typescript
// Returns properties for specific agent
```

#### CORS Configuration
Dashboard already configured CORS for public API:
- Allows cross-origin requests
- 5-minute cache headers for CDN

#### Integration Pattern

```typescript
// apps/main-site/src/lib/api/dashboard.ts

const DASHBOARD_API = process.env.DASHBOARD_API_URL || 'https://dashboard.nestassociates.co.uk';

export async function getProperties(params: PropertySearchParams) {
  const searchParams = new URLSearchParams();
  // ... build params

  const response = await fetch(
    `${DASHBOARD_API}/api/public/properties?${searchParams}`,
    { next: { revalidate: 300 } }  // 5-minute cache
  );

  if (!response.ok) throw new Error('Failed to fetch properties');
  return response.json();
}

export async function getAgents() {
  const response = await fetch(
    `${DASHBOARD_API}/api/public/agents`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) throw new Error('Failed to fetch agents');
  return response.json();
}
```

---

### 5. SEO Implementation

#### XML Sitemap
Use Next.js `sitemap.ts` convention:

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  const agents = await getAgents();
  const posts = await getPosts();

  return [
    { url: 'https://nestassociates.co.uk', lastModified: new Date() },
    { url: 'https://nestassociates.co.uk/buy' },
    { url: 'https://nestassociates.co.uk/rent' },
    // Static pages...
    ...properties.map(p => ({
      url: `https://nestassociates.co.uk/property/${p.slug}`,
      lastModified: new Date(p.updatedAt),
    })),
    ...agents.map(a => ({
      url: `https://nestassociates.co.uk/agent/${a.id}`,
    })),
    ...posts.map(post => ({
      url: `https://nestassociates.co.uk/journal/${post.slug}`,
      lastModified: new Date(post.publishedAt),
    })),
  ];
}
```

#### Schema.org Structured Data

**Property (RealEstateListing)**
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "3 Bedroom House in Manchester",
  "description": "...",
  "datePosted": "2024-01-15",
  "image": ["https://..."],
  "offers": {
    "@type": "Offer",
    "price": 250000,
    "priceCurrency": "GBP"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "Manchester",
    "postalCode": "M1 1AA",
    "addressCountry": "UK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 53.4808,
    "longitude": -2.2426
  },
  "numberOfRooms": 3,
  "numberOfBathroomsTotal": 2
}
```

**Agent (RealEstateAgent)**
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "John Smith",
  "image": "https://...",
  "telephone": "+44...",
  "email": "john@...",
  "areaServed": {
    "@type": "GeoCircle",
    "geoMidpoint": { ... }
  }
}
```

**Breadcrumbs**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://..." },
    { "@type": "ListItem", "position": 2, "name": "Buy", "item": "https://..." },
    { "@type": "ListItem", "position": 3, "name": "Property Name" }
  ]
}
```

---

## Key Findings Summary

| Topic | Finding | Action |
|-------|---------|--------|
| Apex27 CRM | Existing client supports contacts/leads | Extend or reuse for form submissions |
| GA4 Consent | Consent Mode v2 with default deny | Implement custom cookie banner |
| Payload CMS | PostgreSQL adapter with schema isolation | Use `payload` schema in Supabase |
| Dashboard API | Public endpoints ready with CORS | Direct fetch with revalidation |
| SEO | Next.js native sitemap + JSON-LD | Implement per-page structured data |

## Environment Variables Required

```bash
# Apex27 CRM
APEX27_API_KEY=xxx

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Database (Supabase)
DATABASE_URL=postgresql://...

# Dashboard API
DASHBOARD_API_URL=https://dashboard.nestassociates.co.uk

# Payload
PAYLOAD_SECRET=xxx
```

## References

- [Apex27 CRM](https://apex27.co.uk/) - UK Estate Agent Software
- [GA4 Consent Mode](https://developers.google.com/tag-platform/security/guides/consent) - Google Developers
- [Payload CMS PostgreSQL](https://payloadcms.com/docs/database/postgres) - Official Documentation
- [Schema.org RealEstateListing](https://schema.org/RealEstateListing) - Structured Data
