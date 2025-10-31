# Apex27 API Integration Guide

**Feature**: Multi-Agent Real Estate Platform
**Date**: 2025-10-29
**API Type**: REST API (Polling, not Webhooks)

## Overview

Apex27 provides a **REST API** that must be **polled periodically** to sync property listings. There is NO webhook system - we must fetch updates on a scheduled basis using the `minDtsUpdated` parameter to get only changed listings.

---

## API Types Available

### 1. Standard API (Recommended)

**Base URL**: `https://api.apex27.co.uk`
**Authentication**: `X-Api-Key` header
**Access**: Full field access as per API specification
**Best For**: Complete data synchronization

```bash
curl -X GET "https://api.apex27.co.uk/listings?branchId=123&minDtsUpdated=2025-10-29%2010:00:00" \
  -H "X-Api-Key: YOUR_API_KEY"
```

### 2. Portal API (Limited)

**Base URL**: `https://portals-XXXXX.apex27.co.uk` (XXXXX is unique portal ID)
**Authentication**: `api_key` in POST body
**Access**: Limited subset of fields
**Best For**: Public-facing portals only

```bash
curl -X POST "https://portals-6d2c7f86.apex27.co.uk/api/get-listings" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "YOUR_API_KEY", "search": "1", "page": "1"}'
```

**⚠️ Recommendation**: Use **Standard API** for this project to access all fields.

---

## Architecture Change: Polling Strategy

### Original Plan (Incorrect)
- ❌ Webhook endpoint receiving push notifications
- ❌ Real-time property sync on CRM updates

### Corrected Architecture (Polling)
- ✅ Cron job polling Apex27 API every 5-15 minutes
- ✅ Use `minDtsUpdated` parameter to get incremental updates
- ✅ Store `last_sync_timestamp` per branch
- ✅ Rate limit: 100 requests/minute (sufficient for 1,000+ agents)

---

## Implementation Strategy

### 1. Sync Frequency Options

**Option A: Global Sync** (Recommended for <100 agents)
- Single cron job fetches all listings every 15 minutes
- Uses `minDtsUpdated` to get only updated listings since last sync
- Simple, efficient, uses minimal API calls

**Option B: Per-Branch Sync** (Recommended for 100+ agents)
- Separate sync per branch (agent)
- Can prioritize active agents
- Better error isolation (one failed branch doesn't block others)

**Option C: Hybrid** (Recommended for 1,000+ agents)
- Global sync for initial load
- Per-branch sync for active agents (with properties updated recently)
- Reduces API calls for inactive agents

### 2. Polling Flow

```typescript
// Cron job runs every 15 minutes
async function syncApex27Properties() {
  // 1. Get all agents with apex27_branch_id
  const agents = await getAgentsWithApex27BranchId();

  // 2. Get last sync timestamp from database
  const lastSync = await getLastSyncTimestamp();

  // 3. Fetch updated listings from Apex27
  const updatedListings = await apex27Client.getListings({
    minDtsUpdated: lastSync, // e.g., "2025-10-29 10:00:00"
    includeImages: 1,
    includeFloorplans: 1,
    includeVirtualTours: 1,
  });

  // 4. Map listings to agents by branchId
  for (const listing of updatedListings) {
    const agent = agents.find(a => a.apex27_branch_id === String(listing.branch.id));

    if (agent) {
      // 5. Upsert property in database
      await upsertProperty({
        agent_id: agent.id,
        apex27_id: String(listing.id),
        // ... map all fields
      });

      // 6. Queue site rebuild for agent
      await queueBuild(agent.id, 'property_sync');
    }
  }

  // 7. Update last sync timestamp
  await updateLastSyncTimestamp(new Date());
}
```

---

## Field Mapping: Apex27 Listing → Our Property

### Apex27 Listing Structure

Based on actual API responses (from your research):

```json
{
  "id": 123456,
  "branch": {
    "id": 1,
    "name": "London Branch"
  },
  "transactionType": "sale",  // "sale", "let", "commercial"
  "reference": "ABC123",
  "address1": "123 High Street",
  "address2": "Flat 2",
  "city": "London",
  "county": "Greater London",
  "postalCode": "SW1A 1AA",
  "displayAddress": "High Street, London SW1A",
  "summary": "Beautiful 3 bed house",
  "description": "Full description...",
  "bullets": ["Feature 1", "Feature 2"],
  "price": 450000,
  "displayPrice": "£450,000",
  "bedrooms": 3,
  "bathrooms": 2,
  "propertyType": "terraced",
  "status": "active",
  "websiteStatus": "live",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "images": [
    {
      "id": 1,
      "url": "https://fs.apex27.co.uk/data_0000/123_0001.jpg",
      "thumbnail": "https://fs.apex27.co.uk/data_0000/123_0001_320_240.jpg",
      "order": 1
    }
  ],
  "additionalFeatures": [
    "Garden",
    "Parking - Off Street",
    "Central Heating",
    "Double Glazing"
  ],
  "virtualTours": [
    {
      "url": "https://my.matterport.com/show/?m=abc123"
    }
  ],
  "floorplans": [
    {
      "url": "https://fs.apex27.co.uk/floorplan.pdf"
    }
  ],
  "dtsCreated": "2025-10-15 10:30:00",
  "dtsUpdated": "2025-10-29 14:20:00",
  "dtsMarketed": "2025-10-16 09:00:00"
}
```

### Mapping to Our Database Schema

```typescript
{
  // Direct mappings
  apex27_id: String(listing.id),
  agent_id: agent.id, // Mapped via listing.branch.id → agent.apex27_branch_id
  transaction_type: listing.transactionType, // "sale", "let", "commercial"
  title: listing.summary || `${listing.bedrooms} bed ${listing.propertyType} in ${listing.city}`,
  description: listing.description,
  price: Number(listing.price),
  bedrooms: Number(listing.bedrooms),
  bathrooms: Number(listing.bathrooms),
  property_type: listing.propertyType,

  // Address object
  address: {
    line1: listing.address1,
    line2: listing.address2,
    city: listing.city,
    county: listing.county,
    postcode: listing.postalCode,
    country: listing.country === 'GB' ? 'United Kingdom' : listing.country,
  },

  postcode: listing.postalCode,

  // PostGIS location point
  location: listing.latitude && listing.longitude
    ? `POINT(${listing.longitude} ${listing.latitude})`
    : null,

  // Images array
  images: (listing.images || []).map(img => ({
    url: img.url,
    alt: `${listing.summary} - Image ${img.order}`,
    order: img.order,
  })),

  // Features array (from bullets + additionalFeatures)
  features: [
    ...(listing.bullets || []),
    ...(listing.additionalFeatures || []),
  ],

  // Media URLs
  floor_plan_url: listing.floorplans?.[0]?.url || null,
  virtual_tour_url: listing.virtualTours?.[0]?.url || null,

  // Status mapping
  status: mapApex27StatusToOurs(listing.status),

  // Flags
  is_featured: listing.websiteStatus === 'featured',
  is_hidden: listing.websiteStatus === 'hidden' || listing.archived,

  // Raw data for debugging
  raw_data: listing,
}
```

### Status Mapping

```typescript
function mapApex27StatusToOurs(apex27Status: string): PropertyStatus {
  const statusMap: Record<string, PropertyStatus> = {
    'active': 'available',
    'Under Offer': 'under_offer',
    'Sold': 'sold',
    'Let': 'let',
    'Exchanged': 'under_offer',
    'Completed': 'sold',
    'Withdrawn': 'available', // Or mark as hidden
  };

  return statusMap[apex27Status] || 'available';
}
```

---

## Cron Job Implementation

### Database Table for Sync Tracking

```sql
CREATE TABLE apex27_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated_timestamp TIMESTAMPTZ, -- minDtsUpdated value used
  listings_fetched INTEGER,
  listings_created INTEGER,
  listings_updated INTEGER,
  listings_deleted INTEGER,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apex27_sync_status ON apex27_sync_log(status);
CREATE INDEX idx_apex27_sync_completed_at ON apex27_sync_log(completed_at);
```

### Vercel Cron Job Endpoint

```typescript
// apps/dashboard/app/api/cron/sync-apex27/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  try {
    // 1. Get last successful sync timestamp
    const { data: lastSync } = await supabase
      .from('apex27_sync_log')
      .select('last_updated_timestamp')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const minDtsUpdated = lastSync?.last_updated_timestamp || '2025-01-01 00:00:00';

    // 2. Create new sync log entry
    const { data: syncLog } = await supabase
      .from('apex27_sync_log')
      .insert({
        sync_type: 'incremental',
        last_updated_timestamp: minDtsUpdated,
      })
      .select()
      .single();

    // 3. Fetch updated listings from Apex27
    const apex27Client = new Apex27Client(process.env.APEX27_API_KEY!);

    const listings = await apex27Client.getListings({
      minDtsUpdated,
      includeImages: 1,
      includeFloorplans: 1,
      includeVirtualTours: 1,
    });

    // 4. Get all agents with branch IDs
    const { data: agents } = await supabase
      .from('agents')
      .select('id, apex27_branch_id')
      .not('apex27_branch_id', 'is', null);

    const agentsByBranchId = new Map(
      agents?.map(a => [a.apex27_branch_id, a.id]) || []
    );

    // 5. Process each listing
    let created = 0;
    let updated = 0;

    for (const listing of listings) {
      const agentId = agentsByBranchId.get(String(listing.branch.id));

      if (!agentId) {
        console.warn(`No agent found for branch ID: ${listing.branch.id}`);
        continue;
      }

      // Map Apex27 listing to our property format
      const propertyData = mapApex27ListingToProperty(listing, agentId);

      // Upsert property
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId)
        .eq('apex27_id', propertyData.apex27_id)
        .single();

      if (existing) {
        await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('properties').insert(propertyData);
        created++;
      }

      // Queue site rebuild for agent (priority P2)
      await supabase.from('build_queue').insert({
        agent_id: agentId,
        priority: 2,
        trigger_reason: 'property_sync',
      });
    }

    // 6. Update sync log
    await supabase
      .from('apex27_sync_log')
      .update({
        completed_at: new Date().toISOString(),
        listings_fetched: listings.length,
        listings_created: created,
        listings_updated: updated,
        status: 'completed',
      })
      .eq('id', syncLog.id);

    return NextResponse.json({
      success: true,
      fetched: listings.length,
      created,
      updated,
    });

  } catch (error: any) {
    console.error('Apex27 sync error:', error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Configure Vercel Cron

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

This runs every 15 minutes (can adjust to 5, 10, 30, or 60 minutes based on needs).

---

## Apex27 API Client

### TypeScript Client Implementation

```typescript
// apps/dashboard/lib/apex27-client.ts
import type { Apex27Listing, Apex27GetListingsParams } from './apex27-types';

export class Apex27Client {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.apex27.co.uk') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Get listings with optional filters
   * Uses minDtsUpdated for incremental sync
   */
  async getListings(params: Apex27GetListingsParams = {}): Promise<Apex27Listing[]> {
    const query = new URLSearchParams();

    if (params.branchId) query.append('branchId', String(params.branchId));
    if (params.minDtsUpdated) query.append('minDtsUpdated', params.minDtsUpdated);
    if (params.transactionType) query.append('transactionType', params.transactionType);
    if (params.archived !== undefined) query.append('archived', String(params.archived));
    if (params.includeImages) query.append('includeImages', '1');
    if (params.includeFloorplans) query.append('includeFloorplans', '1');
    if (params.includeVirtualTours) query.append('includeVirtualTours', '1');
    if (params.page) query.append('page', String(params.page));
    if (params.pageSize) query.append('pageSize', String(params.pageSize));

    const url = `${this.baseUrl}/listings?${query.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Apex27 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Returns array of listings
  }

  /**
   * Get single listing by ID with all related data
   */
  async getListing(id: number): Promise<Apex27Listing> {
    const url = `${this.baseUrl}/listings/${id}?includeImages=1&includeFloorplans=1&includeVirtualTours=1`;

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Apex27 API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get branches (to map branch IDs to agents)
   */
  async getBranches(): Promise<Apex27Branch[]> {
    const url = `${this.baseUrl}/branches`;

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Apex27 API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Type definitions
export interface Apex27GetListingsParams {
  branchId?: number;
  minDtsUpdated?: string; // "YYYY-MM-DD HH:MM:SS"
  minDtsCreatedUpdated?: string;
  transactionType?: 'sale' | 'let' | 'commercial';
  archived?: number; // 0 or 1
  minBeds?: number;
  maxPrice?: number;
  city?: string;
  includeImages?: number; // 0 or 1
  includeFloorplans?: number;
  includeVirtualTours?: number;
  page?: number;
  pageSize?: number; // 25-250
}

export interface Apex27Branch {
  id: number;
  name: string;
  address1: string;
  city: string;
  postalCode: string;
}

export interface Apex27Listing {
  id: number;
  branch: {
    id: number;
    name: string;
  };
  reference: string;
  address1: string;
  address2?: string;
  address3?: string;
  address4?: string;
  city: string;
  county?: string;
  postalCode: string;
  displayAddress: string;
  summary?: string;
  description?: string;
  bullets?: string[];
  price: number;
  displayPrice: string;
  transactionType: 'sale' | 'let' | 'commercial';
  status: string;
  websiteStatus?: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  receptions?: number;
  latitude?: number;
  longitude?: number;
  images?: Array<{
    id: number;
    url: string;
    thumbnail: string;
    order: number;
  }>;
  additionalFeatures?: string[];
  virtualTours?: Array<{
    id: number;
    url: string;
  }>;
  floorplans?: Array<{
    id: number;
    url: string;
  }>;
  dtsCreated: string;
  dtsUpdated?: string;
  dtsMarketed?: string;
  archived: boolean;
}
```

---

## Rate Limiting Strategy

### Apex27 Limits
- **100 requests per minute** per API key
- **Pagination**: 25-250 results per page (default: 25)

### Our Strategy

**Scenario 1: 16 agents (launch)**
- 16 agents × 1 request per agent = 16 requests
- Or 1 global request with all listings
- Well under 100/min limit

**Scenario 2: 100 agents**
- Option A: 1 global request (all branches) = 1 request
- Option B: 100 individual branch requests (if needed for isolation)
- Still under 100/min limit if run sequentially

**Scenario 3: 1,000 agents**
- Cannot query all branches individually in 1 minute
- Solution: Batch sync over 15-minute window
  - Minute 1-5: Sync branches 1-500
  - Minute 6-10: Sync branches 501-1000
  - Or use global query (1 request) if Apex27 returns all

**Recommendation**: Start with **global sync** (1 API call every 15 minutes), only switch to per-branch if needed.

---

## Environment Variables Required

### Updated .env.local

```bash
# Apex27 API (Standard API)
APEX27_API_KEY=your-api-key-from-apex27
APEX27_API_URL=https://api.apex27.co.uk
APEX27_SYNC_INTERVAL_MINUTES=15  # How often to poll

# OR if using Portal API
APEX27_API_KEY=your-portal-api-key
APEX27_API_URL=https://portals-XXXXX.apex27.co.uk
APEX27_API_TYPE=portal  # "standard" or "portal"

# Cron secret (for securing cron endpoints)
CRON_SECRET=generate-random-32-char-string
```

### Generate Cron Secret

```bash
# Generate random secret for cron authentication
openssl rand -hex 32
```

---

## Getting Your Apex27 API Key

### Steps

1. **Contact Apex27 Support**
   - Email: support@apex27.co.uk
   - Request: "API access for property synchronization"
   - Specify: "Standard API" (not Portal API) for full field access

2. **Provide Your Use Case**
   - Building agent microsite network
   - Need read-only access to listings
   - Sync frequency: Every 15 minutes
   - Expected volume: ~1,000 agents

3. **Receive API Credentials**
   - They'll provide: API Key
   - They'll confirm: Which branches you have access to
   - They'll provide: API documentation (you already have this!)

4. **Test API Access**
   ```bash
   curl -X GET "https://api.apex27.co.uk/branches" \
     -H "X-Api-Key: YOUR_API_KEY"
   ```

5. **Get Branch IDs**
   ```bash
   curl -X GET "https://api.apex27.co.uk/branches" \
     -H "X-Api-Key: YOUR_API_KEY"
   # Returns list of branches with IDs - you'll assign these to agents
   ```

---

## Testing Apex27 Integration Locally

### 1. Manual API Test

```bash
# Test fetching listings
curl -X GET "https://api.apex27.co.uk/listings?branchId=YOUR_BRANCH_ID&pageSize=5&includeImages=1" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Accept: application/json" | jq

# Test incremental sync
curl -X GET "https://api.apex27.co.uk/listings?minDtsUpdated=2025-10-28%2000:00:00" \
  -H "X-Api-Key: YOUR_API_KEY" | jq
```

### 2. Test Cron Endpoint Locally

```bash
# Trigger sync manually
curl -X GET "http://localhost:3000/api/cron/sync-apex27" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Verify Database Updates

```sql
-- Check if properties were synced
SELECT id, apex27_id, title, agent_id, created_at
FROM properties
ORDER BY created_at DESC
LIMIT 10;

-- Check sync log
SELECT * FROM apex27_sync_log
ORDER BY created_at DESC
LIMIT 5;
```

---

## Production Sync Schedule

### Recommended Schedule

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-apex27",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/process-builds",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

- **Apex27 sync**: Every 15 minutes (balances freshness vs API load)
- **Build processing**: Every 2 minutes (handles builds triggered by property sync)

### Alternative Schedules

**More Frequent** (for very active markets):
- Every 5 minutes: `*/5 * * * *`
- Trade-off: More API calls, fresher data

**Less Frequent** (for stable portfolios):
- Every 30 minutes: `*/30 * * * *`
- Every hour: `0 * * * *`
- Trade-off: Fewer API calls, data up to 1 hour old

---

## Handling Deleted Listings

Apex27 API doesn't provide a "deleted" event. Strategies:

### Strategy 1: Mark as Archived

```typescript
// After fetching current listings
const currentApex27Ids = listings.map(l => String(l.id));

// Find our properties not in current list
const { data: ourProperties } = await supabase
  .from('properties')
  .select('id, apex27_id, agent_id')
  .eq('agent_id', agentId);

const ourApex27Ids = ourProperties.map(p => p.apex27_id);
const deletedIds = ourApex27Ids.filter(id => !currentApex27Ids.includes(id));

// Mark as hidden (soft delete)
if (deletedIds.length > 0) {
  await supabase
    .from('properties')
    .update({ is_hidden: true })
    .in('apex27_id', deletedIds);
}
```

### Strategy 2: Check Archived Flag

Apex27 listings have `archived` field. Update our status:

```typescript
if (listing.archived === true) {
  propertyData.is_hidden = true;
  propertyData.status = 'sold'; // or 'let' based on transactionType
}
```

---

## Error Handling

### Common Errors

**1. Rate Limit Exceeded (429)**
```typescript
if (response.status === 429) {
  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  return this.getListings(params);
}
```

**2. Invalid Branch ID**
```typescript
// Log warning but continue with other branches
if (!agentId) {
  console.warn(`No agent found for Apex27 branch ID: ${listing.branch.id}`);
  // Store in orphaned_properties table for admin review
  continue;
}
```

**3. API Key Invalid (401)**
```typescript
if (response.status === 401) {
  // Alert admin immediately - API key expired or invalid
  await sendAdminAlert('Apex27 API key invalid - sync stopped');
  throw new Error('Invalid Apex27 API key');
}
```

---

## Monitoring & Alerts

### Sync Health Dashboard

Display in admin dashboard:

```typescript
// GET /api/admin/apex27/sync-status

{
  "lastSyncAt": "2025-10-29T14:45:00Z",
  "lastSyncStatus": "completed",
  "lastSyncDuration": "12.5 seconds",
  "listingsFetched": 145,
  "listingsCreated": 3,
  "listingsUpdated": 12,
  "nextSyncAt": "2025-10-29T15:00:00Z",
  "syncHistory": [
    { "timestamp": "2025-10-29T14:45:00Z", "status": "completed", "fetched": 145 },
    { "timestamp": "2025-10-29T14:30:00Z", "status": "completed", "fetched": 142 },
    { "timestamp": "2025-10-29T14:15:00Z", "status": "failed", "error": "Rate limit exceeded" }
  ]
}
```

### Alert Conditions

**Critical Alerts** (email + SMS):
- Apex27 sync failed 3 times in a row
- API key returns 401 Unauthorized
- Zero listings returned (possible API issue)

**Warning Alerts** (email):
- Sync taking >5 minutes to complete
- >10 listings with unmapped branch IDs
- Rate limit hit (429 response)

---

## Initial Setup Checklist

### Before First Sync

- [ ] Apex27 API key obtained from Apex27 support
- [ ] API key added to Vercel environment variables
- [ ] Cron secret generated and added to environment variables
- [ ] `apex27_sync_log` table created in database (add migration)
- [ ] All agents have `apex27_branch_id` populated
- [ ] Apex27 client implemented in `apps/dashboard/lib/apex27-client.ts`
- [ ] Cron endpoint created at `/api/cron/sync-apex27`
- [ ] Vercel cron configured in `vercel.json`
- [ ] Test sync run locally and verified properties created

### After First Sync

- [ ] Verify listings synced to correct agents
- [ ] Check property images are accessible
- [ ] Verify PostGIS location points created correctly
- [ ] Check build queue triggered for agents with new properties
- [ ] Monitor sync logs for errors
- [ ] Set up alerts for sync failures

---

## Migration: Add Sync Log Table

**Create**: `supabase/migrations/20241029000020_create_apex27_sync_log.sql`

```sql
-- Create apex27_sync_log table
-- Tracks property sync operations for monitoring and debugging

CREATE TABLE apex27_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated_timestamp TIMESTAMPTZ, -- minDtsUpdated value used
  listings_fetched INTEGER DEFAULT 0,
  listings_created INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  listings_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_apex27_sync_status ON apex27_sync_log(status);
CREATE INDEX idx_apex27_sync_completed_at ON apex27_sync_log(completed_at);

-- Comments
COMMENT ON TABLE apex27_sync_log IS 'Log of Apex27 property sync operations';
COMMENT ON COLUMN apex27_sync_log.last_updated_timestamp IS 'Value of minDtsUpdated parameter used in this sync';
```

---

## Comparison: Original Plan vs Actual Implementation

| Aspect | Original (Webhooks) | Actual (Polling) |
|--------|---------------------|------------------|
| **Trigger** | Apex27 pushes updates | We poll every 15 min |
| **Endpoint** | POST /api/webhooks/apex27 | GET /api/cron/sync-apex27 |
| **Auth** | HMAC-SHA256 signature | X-Api-Key header |
| **Latency** | Real-time (<1 second) | Up to 15 minutes |
| **API Calls** | 0 (they call us) | 96 per day (every 15 min) |
| **Security** | Signature validation | Cron secret + API key |
| **Reliability** | Depends on Apex27 | We control retry logic |
| **Data** | Only changes pushed | We fetch based on timestamp |

**Impact**: Properties appear on agent sites within 15 minutes instead of real-time. This is acceptable for real estate (properties don't change that frequently).

---

## Code Updates Needed

### Files to Create/Update

1. **Create**: `apps/dashboard/lib/apex27-client.ts`
2. **Create**: `apps/dashboard/lib/apex27-types.ts`
3. **Create**: `apps/dashboard/app/api/cron/sync-apex27/route.ts`
4. **Create**: `supabase/migrations/20241029000020_create_apex27_sync_log.sql`
5. **Update**: `apps/dashboard/lib/services/property-service.ts` (remove webhook logic, add sync logic)
6. **Update**: `packages/validation/src/webhooks.ts` → rename to `apex27.ts` with API validation
7. **Update**: `vercel.json` - Add cron configuration
8. **Update**: Root `.env.example` - Replace webhook secret with API key

### Tasks File Updates

**Remove**:
- T104: "Create HMAC-SHA256 signature validation" (not needed)
- T106: "Implement signature verification" (not needed)

**Add**:
- T104a: "Create Apex27 REST API client in apps/dashboard/lib/apex27-client.ts"
- T105a: "Create cron endpoint for polling Apex27 in /api/cron/sync-apex27/route.ts"
- T106a: "Implement incremental sync with minDtsUpdated parameter"
- T106b: "Create apex27_sync_log table migration"
- T106c: "Add sync monitoring dashboard for admins"

---

## FAQ

**Q: Can we get real-time updates?**
A: No, Apex27 doesn't provide webhooks. 15-minute polling is the best we can do. This is standard for real estate - properties don't update that frequently.

**Q: What if we hit rate limits?**
A: 100 requests/min is generous. Even with 1,000 agents, a single global query fetches all. If doing per-agent queries, batch them over the 15-minute window.

**Q: How do we handle new branches?**
A: Admin creates agent with `apex27_branch_id`. Next sync will automatically pick up listings for that branch.

**Q: What about Portal API?**
A: Only use if Standard API is unavailable. Portal API has limited fields and requires extracting data from `additionalFeatures` array (your research doc explains this well).

**Q: Can we trigger sync manually?**
A: Yes! Admin dashboard can call `POST /api/admin/apex27/sync` which internally calls the same sync logic. Useful for testing or urgent updates.

---

## Next Steps

1. **Get Apex27 API Key** - Contact Apex27 support
2. **Test API Locally** - Use curl to fetch listings
3. **Implement Apex27 Client** - Create `apex27-client.ts`
4. **Implement Cron Endpoint** - Create `/api/cron/sync-apex27`
5. **Add Sync Log Table** - Create migration
6. **Deploy and Test** - Verify sync works in production
7. **Monitor** - Watch sync logs and alert on failures

This polling approach is actually **more reliable** than webhooks (we control retries, can replay failed syncs) and perfectly acceptable for real estate data freshness requirements.
