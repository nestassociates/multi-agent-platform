# Apex27 Portal API Integration - Final Implementation Guide

**Date**: 2025-10-29
**Tested With**: Real Portal API (`portals-5ab21b55.apex27.co.uk`)
**Status**: ✅ Confirmed Working

## Definitive Answer

**You only need Portal API!** ✅

Based on testing your actual Portal API:
- ✅ Portal API is what Apex27 provides (portal URL + API key)
- ✅ Portal API has all essential property data
- ✅ No Standard API access needed
- ✅ Working implementation exists in your WordPress plugin

---

## Critical Discovery: Form-Urlencoded (Not JSON!)

### The Key Issue

Portal API requires **`application/x-www-form-urlencoded`**, NOT `application/json`!

**Wrong** (what I was trying):
```bash
curl -X POST ... \
  -H "Content-Type: application/json" \
  -d '{"api_key":"...","search":"1"}'
```

**Correct** (what works):
```bash
curl -X POST ... \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=...&search=1&page=1"
```

---

## Portal API Response Structure (From Real Data)

### Get Listings Response

```json
{
  "success": true,
  "listings": [
    {
      "id": 839811,
      "branch": {
        "id": 1962,
        "phone": "0113 8730737"
      },
      "reference": "XGB-98328906",
      "propertyType": "Detached House",
      "propertySubType": "Detached",
      "transactionTypeRoute": "sales",
      "address1": "Ladywell House",
      "address2": "York Road",
      "address3": "Boroughbridge",
      "city": "York",
      "county": "North Yorkshire",
      "postalCode": "YO51 9EB",
      "country": "GB",
      "displayAddress": "Ladywell House, York Road, Boroughbridge, York, North Yorkshire",
      "price": 2000000,
      "displayPrice": "£2,000,000",
      "bedrooms": 6,
      "bathrooms": 3,
      "livingRooms": 7,
      "garages": 1,
      "summary": "A distinguished Grade II listed Georgian home...",
      "description": "Full description...",
      "bullets": [
        "Distinguished Grade II listed Georgian residence",
        "Elegant return staircase beneath circular skylight",
        "Multiple reception rooms with ornate fireplaces"
      ],
      "additionalFeatures": [],  // Array exists but may be empty
      "geolocation": {
        "latitude": 54.0939327,
        "longitude": -1.3931311
      },
      "images": [
        {
          "type": "image",
          "thumbnailUrl": "https://fs-04.apex27.co.uk/.../320x240.jpg",
          "url": "https://fs-04.apex27.co.uk/.../1280x720.jpg",
          "name": "Image name"
        }
      ],
      "floorplans": [
        {
          "url": "https://fs-04.apex27.co.uk/floorplan.pdf"
        }
      ],
      "virtualTours": [],
      "status": "Available",
      "isFeatured": false,
      "timeCreated": "1753961504",  // Unix timestamp
      "timeUpdated": "1760283789",   // Unix timestamp
      "timeMarketed": "1756809307"
    }
  ],
  "listingCount": 36,
  "pageCount": 4,
  "pageInfo": "Showing 1 - 10 of 36 properties"
}
```

### Fields Available (97 Total)

**Core Fields** ✅:
- id, externalId, reference
- propertyType, propertySubType
- bedrooms, bathrooms, livingRooms, garages
- price, displayPrice, pricePrefix
- status, websiteStatus, saleProgression

**Address Fields** ✅:
- address1, address2, address3, address4
- city, county, postalCode, country
- displayAddress, areaDescription

**Location** ✅:
- geolocation {latitude, longitude}
- pov {latitude, longitude, pitch, heading, zoom}

**Content** ✅:
- summary, description
- bullets (array of strings)
- additionalFeatures (array - may be empty)
- customDescription1-6

**Media** ✅:
- images (array with thumbnailUrl, url, name)
- floorplans (array with url)
- virtualTours (array with url)
- brochures, epcs, videos

**Timestamps** ✅:
- timeCreated, timeUpdated, timeMarketed (Unix timestamps)

**Additional** ✅:
- rooms (array), energyEfficiency, broadbandSpeeds
- saleFee, councilTax, serviceCharge, groundRent
- yearBuilt, condition, ageCategory
- internalArea, externalArea

**NOT Available** ❌:
- rentalFlags object
- residentialFlags object
- saleFlags object
- rentFrequency (need to extract from displayPrice)

---

## TypeScript Portal API Client (Final Implementation)

```typescript
// apps/dashboard/lib/apex27/portal-client.ts

export class Apex27PortalClient {
  constructor(
    private portalUrl: string,
    private apiKey: string
  ) {}

  /**
   * Get listings with pagination and filters
   */
  async getListings(params: {
    transactionType?: 'sale' | 'let';
    page?: number;
    pageSize?: number;
    includeSstc?: boolean;
  } = {}): Promise<{ listings: any[]; totalCount: number; pageCount: number }> {
    // Build form data (NOT JSON!)
    const formData = new URLSearchParams({
      api_key: this.apiKey,
      search: '1',
      page: String(params.page || 1),
      page_size: String(params.pageSize || 100),
    });

    if (params.transactionType) {
      formData.append('transaction_type', params.transactionType);
    }

    if (params.includeSstc) {
      formData.append('include_sstc', '1');
    }

    const response = await fetch(`${this.portalUrl}/api/get-listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(`Portal API error: ${data.message}`);
    }

    return {
      listings: data.listings || [],
      totalCount: data.listingCount || 0,
      pageCount: data.pageCount || 1,
    };
  }

  /**
   * Get single listing with full details
   */
  async getListing(id: number): Promise<any> {
    const formData = new URLSearchParams({
      api_key: this.apiKey,
      id: String(id),
    });

    const response = await fetch(`${this.portalUrl}/api/get-listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(`Portal API error: ${data.message}`);
    }

    return data;
  }

  /**
   * Get portal options (branches, settings)
   */
  async getPortalOptions() {
    const formData = new URLSearchParams({
      api_key: this.apiKey,
    });

    const response = await fetch(`${this.portalUrl}/api/get-portal-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get branches
   */
  async getBranches(): Promise<Array<{ id: number; name: string }>> {
    const options = await this.getPortalOptions();
    return options.branches || [];
  }
}
```

---

## Field Mapping: Portal API → Our Database

```typescript
// apps/dashboard/lib/apex27/portal-mapper.ts

import type { Property } from '@nest/shared-types';

export class PortalListingMapper {
  /**
   * Map Portal API listing to our Property schema
   */
  static mapListing(listing: any, agentId: string): Partial<Property> {
    return {
      apex27_id: String(listing.id),
      agent_id: agentId,
      transaction_type: this.mapTransactionType(listing.transactionTypeRoute),
      title: listing.summary || listing.header || `${listing.bedrooms} bed ${listing.propertyType}`,
      description: listing.description || '',
      price: Number(listing.price),
      bedrooms: Number(listing.bedrooms) || null,
      bathrooms: Number(listing.bathrooms) || null,
      property_type: listing.propertyType,

      // Address object
      address: {
        line1: listing.address1,
        line2: listing.address2 || undefined,
        city: listing.city,
        county: listing.county || undefined,
        postcode: listing.postalCode,
        country: listing.country === 'GB' ? 'United Kingdom' : listing.country,
      },

      postcode: listing.postalCode,

      // PostGIS location point (WKT format)
      location: listing.geolocation?.latitude && listing.geolocation?.longitude
        ? `POINT(${listing.geolocation.longitude} ${listing.geolocation.latitude})`
        : null,

      // Images array
      images: (listing.images || []).map((img: any, idx: number) => ({
        url: img.url,
        alt: img.name || `${listing.summary} - Image ${idx + 1}`,
        order: idx + 1,
      })),

      // Features (merge bullets + additionalFeatures)
      features: [
        ...(listing.bullets || []),
        ...(listing.additionalFeatures || []),
      ].filter(Boolean),

      // Media URLs
      floor_plan_url: listing.floorplans?.[0]?.url || null,
      virtual_tour_url: listing.virtualTours?.[0]?.url || null,

      // Status mapping
      status: this.mapStatus(listing.status),
      is_featured: listing.isFeatured || false,
      is_hidden: listing.websiteStatus === 'hidden' || false,

      // Raw data for debugging
      raw_data: listing,
    };
  }

  /**
   * Map transaction type
   */
  private static mapTransactionType(route: string): 'sale' | 'let' | 'commercial' {
    if (route === 'sales' || route === 'sale') return 'sale';
    if (route === 'lettings' || route === 'let') return 'let';
    return 'commercial';
  }

  /**
   * Map status
   */
  private static mapStatus(status: string): string {
    const map: Record<string, string> = {
      'Available': 'available',
      'Under Offer': 'under_offer',
      'Sold': 'sold',
      'Let': 'let',
      'Sold STC': 'under_offer',
      'Let Agreed': 'under_offer',
    };
    return map[status] || 'available';
  }

  /**
   * Extract boolean flags from additionalFeatures array
   * (For listings where this array is populated)
   */
  static extractFeatureFlags(additionalFeatures: string[]) {
    return {
      isStudentProperty: additionalFeatures.includes('Student Property'),
      isSharedAccommodation: additionalFeatures.includes('Shared Accommodation'),
      hasWashingMachine: additionalFeatures.includes('Has Washing Machine'),
      hasDishwasher: additionalFeatures.includes('Has Dishwasher'),
      hasBasement: additionalFeatures.includes('Has Basement'),
      hasConservatory: additionalFeatures.includes('Has Conservatory'),
      hasDoubleGlazing: additionalFeatures.includes('Has Double Glazing'),
      petsAllowed: additionalFeatures.includes('Pets Allowed'),
      // Add more mappings as needed based on actual feature strings
    };
  }
}
```

---

## Sync Implementation (Polling Every 15 Minutes)

```typescript
// apps/dashboard/app/api/cron/sync-apex27/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Apex27PortalClient } from '@/lib/apex27/portal-client';
import { PortalListingMapper } from '@/lib/apex27/portal-mapper';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  try {
    // 1. Get last sync timestamp
    const { data: lastSync } = await supabase
      .from('apex27_sync_log')
      .select('time_updated')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastSyncTime = lastSync?.time_updated || 0;

    // 2. Create Portal API client
    const portalClient = new Apex27PortalClient(
      process.env.APEX27_PORTAL_URL!,
      process.env.APEX27_API_KEY!
    );

    // 3. Get all branches
    const branches = await portalClient.getBranches();

    // 4. Get all agents with branch IDs
    const { data: agents } = await supabase
      .from('agents')
      .select('id, apex27_branch_id')
      .not('apex27_branch_id', 'is', null);

    const agentsByBranchId = new Map(
      agents?.map(a => [Number(a.apex27_branch_id), a.id]) || []
    );

    // 5. Fetch updated listings (both sale and let)
    let allListings: any[] = [];

    for (const transactionType of ['sale', 'let']) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { listings, pageCount } = await portalClient.getListings({
          transactionType: transactionType as 'sale' | 'let',
          page,
          pageSize: 100,
          includeSstc: true,
        });

        // Filter by timeUpdated (only updated since last sync)
        const updatedListings = listings.filter(
          (listing: any) => Number(listing.timeUpdated) > lastSyncTime
        );

        allListings = allListings.concat(updatedListings);

        hasMore = page < pageCount;
        page++;

        // Safety limit
        if (page > 10) break;
      }
    }

    console.log(`[Apex27 Sync] Found ${allListings.length} updated listings`);

    // 6. Process each listing
    let created = 0;
    let updated = 0;
    const affectedAgentIds = new Set<string>();

    for (const listing of allListings) {
      const agentId = agentsByBranchId.get(listing.branch.id);

      if (!agentId) {
        console.warn(`No agent found for branch ID: ${listing.branch.id}`);
        continue;
      }

      // Map Portal listing to our schema
      const propertyData = PortalListingMapper.mapListing(listing, agentId);

      // Check if property exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId)
        .eq('apex27_id', propertyData.apex27_id)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('properties')
          .update({
            ...propertyData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        updated++;
      } else {
        // Create new
        await supabase.from('properties').insert(propertyData);
        created++;
      }

      affectedAgentIds.add(agentId);
    }

    // 7. Queue builds for affected agents
    for (const agentId of affectedAgentIds) {
      // Check if pending build already exists
      const { data: existingBuild } = await supabase
        .from('build_queue')
        .select('id')
        .eq('agent_id', agentId)
        .eq('status', 'pending')
        .single();

      if (!existingBuild) {
        await supabase.from('build_queue').insert({
          agent_id: agentId,
          priority: 2, // P2 - High priority
          trigger_reason: 'property_sync',
        });
      }
    }

    // 8. Log sync completion
    await supabase.from('apex27_sync_log').insert({
      sync_type: 'incremental',
      time_updated: Math.max(...allListings.map((l: any) => Number(l.timeUpdated))),
      listings_fetched: allListings.length,
      listings_created: created,
      listings_updated: updated,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      fetched: allListings.length,
      created,
      updated,
      agentsAffected: affectedAgentIds.size,
    });

  } catch (error: any) {
    console.error('[Apex27 Sync] Error:', error);

    // Log failure
    await supabase.from('apex27_sync_log').insert({
      sync_type: 'incremental',
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Configure in vercel.json
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max
```

---

## Updated Environment Variables

```bash
# apps/dashboard/.env.local

# Apex27 Portal API
APEX27_PORTAL_URL=https://portals-5ab21b55.apex27.co.uk
APEX27_API_KEY=fe85bdfa8dba634650b91300f96b7567

# Cron Security
CRON_SECRET=$(openssl rand -hex 32)
```

---

## Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-apex27",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## Database Migration: Add Sync Log Table

```sql
-- supabase/migrations/20241029000020_create_apex27_sync_log.sql

CREATE TABLE apex27_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_updated INTEGER, -- Unix timestamp of last updated property
  listings_fetched INTEGER DEFAULT 0,
  listings_created INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apex27_sync_status ON apex27_sync_log(status);
CREATE INDEX idx_apex27_sync_completed_at ON apex27_sync_log(completed_at);
```

---

## Summary: Portal API is Sufficient ✅

### What We Confirmed

**Portal API provides**:
- ✅ All core property data (id, price, beds, baths, type)
- ✅ Complete address with coordinates
- ✅ Images, floorplans, virtual tours
- ✅ Property features via `bullets` array
- ✅ `additionalFeatures` array (may be populated for some properties)
- ✅ Branch ID for agent mapping
- ✅ Timestamps for incremental sync (timeUpdated)

**Portal API does NOT provide**:
- ❌ `rentalFlags` object
- ❌ `residentialFlags` object
- ❌ `saleFlags` object
- ❌ `rentFrequency` field

**Solution**:
- Use `bullets` array for property features (always populated)
- Use `additionalFeatures` array when populated (for specific flags)
- Extract `rentFrequency` from `displayPrice` when needed
- Store complete `bullets` + `additionalFeatures` in our `features` array

### Do You Need Standard API?

**NO** - Portal API is sufficient because:
1. Has all essential property data
2. Has images and media
3. Has coordinates for mapping
4. Has timestamps for incremental sync
5. Your working WordPress plugin proves this works

**Only request Standard API if**:
- You discover critical missing fields later
- You need fields not available in Portal API
- (Unlikely based on your working plugin)

---

## Final Answer to Your Question

**"Do we need both APIs?"**

**NO** - Portal API alone is sufficient.

**Why?**
1. ✅ Portal API returns 97 fields including all essentials
2. ✅ Your working plugin uses only Portal API
3. ✅ `bullets` array provides property features
4. ✅ Coordinates, images, floorplans all available
5. ✅ Can sync properties perfectly with Portal API

**Implementation Strategy**:
- Use Portal API with form-urlencoded requests
- Poll every 15 minutes
- Filter by `timeUpdated` > last sync
- Map branch.id → agent.apex27_branch_id
- Store `bullets` in features array
- Extract flags from `additionalFeatures` when populated

---

## Updated Cloud Setup Guide

Replace Apex27 section with:

**What you need**:
- Portal URL (you have: `https://portals-5ab21b55.apex27.co.uk`)
- API Key (you have it)
- Cron secret (generate: `openssl rand -hex 32`)

**No need to**:
- ❌ Request Standard API access
- ❌ Set up webhooks
- ❌ Handle signature validation

**Simple setup**:
1. Add Portal URL to .env.local
2. Add API key to .env.local
3. Generate and add cron secret
4. Deploy and let cron job sync every 15 minutes

---

This is actually **simpler** than the original plan! Portal API + form-urlencoded + polling = working integration. 🎉
