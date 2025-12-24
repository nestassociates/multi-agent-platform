# Data Model: Property Detail Page

**Feature**: Property Detail Page
**Date**: 2025-12-23
**Status**: Complete

## Overview

This document defines the data entities and relationships used by the property detail page. No new database tables are required - this feature uses existing tables.

## Entity Definitions

### Property (Existing Table: `properties`)

Primary entity representing a real estate listing.

```typescript
interface Property {
  // Identifiers
  id: string                    // UUID primary key
  apex27_id: string            // External Apex27 listing ID
  agent_id: string             // Foreign key to agents table

  // Core Details
  title: string                // Property headline
  description: string | null   // Full description text
  price: number                // Price in GBP
  transaction_type: 'sale' | 'let'
  status: 'available' | 'under_offer' | 'sold' | 'let' | 'withdrawn'
  property_type: string | null // Detached, Semi-detached, Flat, etc.

  // Specifications
  bedrooms: number | null
  bathrooms: number | null

  // Location
  address: PropertyAddress     // JSON structure
  postcode: string | null      // Extracted for filtering
  location: Point | null       // PostGIS Point(lng, lat)

  // Media
  images: PropertyImage[]      // JSON array
  floor_plan_url: string | null
  virtual_tour_url: string | null

  // Features
  features: string[] | null    // Array of feature strings
  is_featured: boolean
  is_hidden: boolean

  // Raw Data
  raw_data: Record<string, any> | null  // Full Apex27 response

  // Timestamps
  created_at: string
  updated_at: string
}

interface PropertyAddress {
  line1?: string
  line2?: string
  city?: string
  town?: string
  county?: string
  postcode?: string
}

interface PropertyImage {
  url: string
  alt?: string
  order: number
}
```

### Agent (Existing Table: `agents`)

Real estate agent/branch associated with properties.

```typescript
interface Agent {
  // Identifiers
  id: string                   // UUID primary key
  user_id: string | null       // Foreign key to profiles
  subdomain: string            // Unique microsite subdomain

  // Details
  status: 'pending' | 'active' | 'suspended' | 'deactivated'
  branch_name: string | null
  bio: string | null
  qualifications: string[] | null

  // External Links
  social_media_links: SocialMediaLinks | null
  google_place_id: string | null  // For GMB reviews

  // Apex27 Integration
  apex27_branch_id: string | null
  apex27_contact_data: Record<string, any> | null

  // Timestamps
  created_at: string
  updated_at: string
}

interface SocialMediaLinks {
  instagram?: string
  facebook?: string
  twitter?: string
  linkedin?: string
}
```

### Profile (Existing Table: `profiles`)

User profile data, linked to agents.

```typescript
interface Profile {
  user_id: string              // UUID (auth.users foreign key)
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'admin' | 'agent' | 'viewer'
  created_at: string
  updated_at: string
}
```

### ViewingRequest (Existing Table: `viewing_requests`)

Form submissions for property viewings.

```typescript
interface ViewingRequest {
  id: string
  agent_id: string
  property_id: string | null
  apex27_listing_id: string | null

  // Contact Info
  name: string
  email: string
  phone: string | null

  // Viewing Preferences
  preferred_date: string | null
  preferred_time: 'morning' | 'afternoon' | 'evening' | 'flexible'
  flexible_dates: boolean

  // Buyer Info
  buyer_status: string
  mortgage_status: string
  additional_notes: string | null

  // Tracking
  source_page: string | null

  // Apex27 Sync
  apex27_contact_id: string | null
  apex27_lead_id: string | null
  apex27_sync_status: 'pending' | 'synced' | 'failed'
  apex27_sync_error: string | null

  // Timestamps
  created_at: string
  updated_at: string
}
```

## Composite Types (API Response)

### PropertyDetailResponse

Enhanced property data returned by the single property API endpoint.

```typescript
interface PropertyDetailResponse {
  // Core Property Data
  id: string
  apex27_id: string
  title: string
  slug: string
  description: string | null
  price: number
  transaction_type: 'sale' | 'let'
  status: 'available' | 'under_offer' | 'sold' | 'let' | 'withdrawn'
  property_type: string | null

  // Specifications
  bedrooms: number | null
  bathrooms: number | null

  // Extended Specs (from raw_data if available)
  size_sqft: number | null
  tenure: string | null
  council_tax_band: string | null
  parking: string | null
  garden: string | null

  // Location
  address: {
    line1: string
    line2: string
    town: string
    county: string
    postcode: string
  }
  location: {
    latitude: number | null
    longitude: number | null
  }

  // Media
  images: PropertyImage[]
  featured_image_url: string | null
  floor_plan_url: string | null
  virtual_tour_url: string | null

  // Features
  features: string[]

  // EPC Data (from raw_data if available)
  epc: {
    current_rating: string | null
    potential_rating: string | null
    current_efficiency: number | null
    potential_efficiency: number | null
  } | null

  // Agent Info (denormalized for performance)
  agent: {
    id: string
    name: string
    email: string | null
    phone: string | null
    avatar_url: string | null
    subdomain: string
    microsite_url: string
    social_media: SocialMediaLinks | null
    google_place_id: string | null
  }

  // URLs
  property_url: string

  // Timestamps
  updated_at: string
}
```

### AgentOtherPropertiesResponse

Properties from the same agent (excluding current).

```typescript
interface AgentOtherPropertiesResponse {
  data: PropertyCard[]
  pagination: {
    total: number
    hasMore: boolean
  }
}

interface PropertyCard {
  id: string
  title: string
  slug: string
  price: number
  bedrooms: number | null
  bathrooms: number | null
  property_type: string | null
  status: string
  featured_image_url: string | null
  property_url: string
}
```

### ViewingRequestFormData

Simplified form data for main-site property detail page.

```typescript
interface ViewingRequestFormData {
  firstName: string           // Required
  surname: string             // Required
  email: string               // Required, valid email
  phone: string               // Required
  propertyToSell: 'yes' | 'no' | ''
  propertyToLet: 'yes' | 'no' | ''

  // Auto-populated
  agentId: string
  propertyId: string
  sourcePage: string
}
```

## Relationships

```
agents (1) ─────< properties (many)
   │
   └─────────────< viewing_requests (many)
   │
   └──────────── profiles (1)

properties (1) ──< viewing_requests (many)
```

## Data Flow

```
┌─────────────────┐      ┌──────────────────┐
│  Property Page  │      │   Dashboard API  │
│   (main-site)   │─────>│  /api/public/*   │
└─────────────────┘      └──────────────────┘
        │                         │
        │                         v
        │                 ┌──────────────┐
        │                 │   Supabase   │
        │                 │  PostgreSQL  │
        │                 └──────────────┘
        │
        v
┌─────────────────┐
│ Viewing Request │
│   Submission    │
└─────────────────┘
        │
        v
┌─────────────────┐
│    Dashboard    │──> Apex27 Sync
│      API        │──> Email Notification
└─────────────────┘
```

## Notes

1. **No schema changes required**: All data exists in current tables
2. **EPC/utilities data**: May be available in `raw_data` JSON from Apex27 import
3. **Reviews**: Not stored locally - fetched from Google My Business via Place ID
4. **Slug generation**: Derived from title at runtime (kebab-case)
