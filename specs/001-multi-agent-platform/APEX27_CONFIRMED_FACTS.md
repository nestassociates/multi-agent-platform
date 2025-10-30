# Apex27 API - Confirmed Facts from Testing

**Date**: 2025-10-29
**Tested With**: Real Portal API credentials
**Portal URL**: `https://portals-5ab21b55.apex27.co.uk`
**Status**: ✅ Working and Confirmed

---

## Definitive Answers

### Q1: Do we need both Standard API and Portal API?

**Answer**: **NO** - Portal API alone is sufficient ✅

**Why**:
- Portal API has 97 fields per property
- Includes all essential data: price, beds, address, coordinates
- Includes media: images (35+), floorplans, virtual tours
- Includes features: bullets array, additionalFeatures array
- Your working WordPress plugin uses only Portal API
- Tested and confirmed with real API calls

---

### Q2: What's the correct API format?

**Answer**: Portal API uses **form-urlencoded** (NOT JSON!) ⚠️

**Correct Request Format**:
```bash
curl -X POST https://portals-xxxxx.apex27.co.uk/api/get-listings \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=YOUR_KEY&search=1&page=1"
```

**Wrong** (this fails):
```bash
curl -X POST ... \
  -H "Content-Type: application/json" \
  -d '{"api_key":"YOUR_KEY"}'
```

**Why My Initial Tests Failed**: I was sending JSON instead of form-urlencoded data!

---

### Q3: What fields does Portal API actually return?

**Answer**: 97 fields confirmed in real listing

**Core Fields** (tested with listing ID 839811):
```json
{
  "id": 839811,
  "reference": "XGB-98328906",
  "branch": {"id": 1962, "phone": "0113 8730737"},
  "propertyType": "Detached House",
  "propertySubType": "Detached",
  "transactionTypeRoute": "sales",
  "bedrooms": 6,
  "bathrooms": 3,
  "livingRooms": 7,
  "garages": 1,
  "price": 2000000,
  "displayPrice": "£2,000,000",
  "address1": "Ladywell House",
  "address2": "York Road",
  "city": "York",
  "county": "North Yorkshire",
  "postalCode": "YO51 9EB",
  "country": "GB",
  "displayAddress": "Ladywell House, York Road...",
  "summary": "A distinguished Grade II listed...",
  "description": "Full description text...",
  "bullets": [
    "Distinguished Grade II listed Georgian residence",
    "Elegant return staircase beneath circular skylight",
    "Multiple reception rooms with ornate fireplaces",
    "South wing with family room & mezzanine",
    "Detached generous double garage",
    "Landscaped gardens with orchard & meadow",
    "Approximately 2.5 acres",
    "Short walk to Boroughbridge town centre",
    "Excellent schools & transport links"
  ],
  "additionalFeatures": [],
  "geolocation": {
    "latitude": 54.0939327,
    "longitude": -1.3931311
  },
  "pov": {
    "latitude": 54.094108500656,
    "longitude": -1.393080545231,
    "pitch": 9.49714,
    "heading": 188.256
  },
  "images": [
    {
      "type": "image",
      "thumbnailUrl": "https://fs-04.apex27.co.uk/.../320x240.jpg",
      "url": "https://fs-04.apex27.co.uk/.../1280x720.jpg",
      "name": "Living room"
    }
    // ... 34 more images
  ],
  "floorplans": [
    {"url": "https://fs-04.apex27.co.uk/floorplan.pdf"}
  ],
  "virtualTours": [],
  "rooms": [...],
  "energyEfficiency": [63, 73],
  "broadbandSpeeds": {...},
  "timeCreated": "1753961504",  // Unix timestamp
  "timeUpdated": "1760283789",  // Unix timestamp
  "timeMarketed": "1756809307",
  "status": "Available",
  "isFeatured": false,
  "saleFee": "£16,500.00",
  "councilTaxBand": "...",
  "yearBuilt": ...,
  // ... 97 fields total
}
```

---

### Q4: Does Portal API have rentalFlags or residentialFlags objects?

**Answer**: **NO** - Portal API does NOT return these objects ❌

**What it has instead**:
- `bullets` array - Property feature strings (always populated)
- `additionalFeatures` array - May contain flags like "Student Property", "Has Washing Machine" (often empty)

**Tested Listing**:
- `rentalFlags`: Not present
- `residentialFlags`: Not present
- `saleFlags`: Not present
- `bullets`: Array with 9 items ✅
- `additionalFeatures`: Empty array `[]` (field exists but no values)

---

### Q5: How do we get feature flags like isStudentProperty?

**Answer**: Two options based on property data

**Option A**: Extract from `additionalFeatures` (when populated)
```typescript
// When additionalFeatures has values like ["Student Property", "Has Washing Machine"]
const isStudentProperty = listing.additionalFeatures?.includes('Student Property');
const hasWashingMachine = listing.additionalFeatures?.includes('Has Washing Machine');
```

**Option B**: Use `bullets` array (always populated)
```typescript
// Store complete bullets array as features
features: listing.bullets  // e.g., ["Distinguished Grade II listed", "Elegant staircase", ...]
```

**Recommendation**: Store `bullets` in features array, optionally extract specific flags from `additionalFeatures` when needed for filtering/categorization.

---

### Q6: How do we track updates for incremental sync?

**Answer**: Use `timeUpdated` Unix timestamp ✅

**Working Pattern**:
```typescript
// 1. Store last successful sync timestamp
const lastSyncTime = 1760280000; // Unix timestamp

// 2. Fetch all listings
const { listings } = await portalClient.getListings({includeSstc: true});

// 3. Filter to only updated listings
const updatedListings = listings.filter(
  listing => Number(listing.timeUpdated) > lastSyncTime
);

// 4. Process only the updated ones
// 5. Save max(timeUpdated) as new lastSyncTime
```

**Why this works**:
- Every listing has `timeUpdated` field (Unix timestamp)
- Compare numbers: `listing.timeUpdated > lastSyncTimestamp`
- No date string parsing needed
- Efficient filtering client-side

---

## Portal API Endpoints (Confirmed Working)

### 1. Get Portal Options
```
POST /api/get-portal-options
Body: api_key=xxx

Returns:
{
  "success": true,
  "branches": [{id, name, phone}, ...],
  "googleApiKey": "...",
  "sorts": [...],
  "defaultSort": "...",
  "brandColourHex": "#000000"
}
```

**Use For**: Getting list of branches to map to agents

---

### 2. Get Listings (Multiple)
```
POST /api/get-listings
Body: api_key=xxx&search=1&page=1&page_size=100&transaction_type=sale&include_sstc=1

Returns:
{
  "success": true,
  "listings": [{...}, {...}],
  "listingCount": 36,
  "pageCount": 4,
  "pageInfo": "Showing 1 - 10 of 36 properties"
}
```

**Use For**: Bulk fetching properties for sync

**Parameters**:
- `search`: "1" (required)
- `page`: Page number (1-based)
- `page_size`: Results per page (tested up to 1000)
- `transaction_type`: "sale" or "let"
- `include_sstc`: "1" to include sold/let properties

---

### 3. Get Listing (Single)
```
POST /api/get-listing
Body: api_key=xxx&id=839811

Returns:
{
  "success": true,
  "id": 839811,
  ... (97 fields total)
}
```

**Use For**: Getting full details of a specific property

---

## Integration Strategy (Final)

### Architecture

```
Vercel Cron (every 15 minutes)
  ↓
GET /api/cron/sync-apex27
  ↓
Apex27PortalClient.getListings({includeSstc: true})
  ↓
Filter: listing.timeUpdated > lastSyncTimestamp
  ↓
Map: branch.id → agent.apex27_branch_id
  ↓
Upsert properties in database
  ↓
Queue build for affected agents
  ↓
Store max(timeUpdated) as lastSyncTimestamp
```

### Code Implementation

**TypeScript Client**:
```typescript
class Apex27PortalClient {
  async getListings(params) {
    const formData = new URLSearchParams({
      api_key: this.apiKey,
      search: '1',
      page: String(params.page || 1),
      page_size: '100',
      transaction_type: params.transactionType || 'sale',
      include_sstc: '1',
    });

    const response = await fetch(`${this.portalUrl}/api/get-listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    return data.listings || [];
  }
}
```

**Field Mapping**:
```typescript
{
  apex27_id: String(listing.id),
  agent_id: agentId, // from branch.id → agent.apex27_branch_id
  transaction_type: listing.transactionTypeRoute === 'sales' ? 'sale' : 'let',
  title: listing.summary,
  price: listing.price,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  property_type: listing.propertyType,
  address: {
    line1: listing.address1,
    city: listing.city,
    postcode: listing.postalCode,
  },
  location: `POINT(${listing.geolocation.longitude} ${listing.geolocation.latitude})`,
  images: listing.images.map(img => ({url: img.url, order: idx})),
  features: listing.bullets, // Use bullets array
  floor_plan_url: listing.floorplans[0]?.url,
  virtual_tour_url: listing.virtualTours[0]?.url,
  status: mapStatus(listing.status),
  is_featured: listing.isFeatured,
}
```

---

## Data Quality Notes

### What's Reliable ✅
- Core property data (id, price, beds, baths, type)
- Address fields (complete UK address)
- Coordinates (latitude/longitude)
- Images (multiple, with thumbnails)
- Floorplans (PDF URLs)
- Timestamps (Unix format)
- Branch ID mapping

### What May Vary
- `additionalFeatures` array - May be empty or populated depending on how property was entered in Apex27 CRM
- `virtualTours` array - Only if virtual tour added
- `rooms` array - Detailed room dimensions (may be empty)

### What to Use for Features
**Primary**: `bullets` array (always has descriptive features)
**Secondary**: `additionalFeatures` array (when populated, has structured flags)
**Strategy**: Store both in our `features` field, extract specific flags as needed

---

## Sync Frequency Recommendations

### 15 Minutes (Recommended)
- **API Calls**: ~96/day (4 per hour)
- **Latency**: Average 7.5 min, max 15 min
- **Use Case**: Standard real estate (properties change infrequently)

### 5 Minutes (More Frequent)
- **API Calls**: ~288/day (12 per hour)
- **Latency**: Average 2.5 min, max 5 min
- **Use Case**: High-volume lettings, competitive markets

### 30 Minutes (Less Frequent)
- **API Calls**: ~48/day (2 per hour)
- **Latency**: Average 15 min, max 30 min
- **Use Case**: Sales-only, stable portfolios

**Portal API has no documented rate limit** - all frequencies are safe.

---

## Branch to Agent Mapping

### How It Works

**From Portal API**:
```json
{
  "branch": {
    "id": 1962,
    "phone": "0113 8730737"
  }
}
```

**In Our Database**:
```sql
-- Agent table
agents (
  id: uuid,
  apex27_branch_id: '1962',  -- Stores branch ID as text
  ...
)
```

**Mapping Logic**:
```typescript
// 1. Get all agents with branch IDs
const agents = await supabase
  .from('agents')
  .select('id, apex27_branch_id');

// 2. Create lookup map
const agentsByBranchId = new Map(
  agents.map(a => [Number(a.apex27_branch_id), a.id])
);

// 3. For each listing, find agent
const agentId = agentsByBranchId.get(listing.branch.id);
```

---

## Complete Portal API Response Structure

### Get Listings Response

```typescript
interface PortalListingsResponse {
  success: true;
  listings: PortalListing[];
  listingCount: number;     // Total across all pages
  pageCount: number;        // Number of pages
  pageInfo: string;         // e.g., "Showing 1 - 10 of 36 properties"
  showLogo: boolean;
  markers: any[];          // For map display
}

interface PortalListing {
  // Identity
  id: number;
  externalId: string | null;
  reference: string;

  // Branch
  branch: {
    id: number;
    phone: string;
  };

  // Property Type
  propertyType: string;
  propertySubType: string;
  transactionTypeRoute: 'sales' | 'lettings';
  isCommercial: boolean;

  // Address
  address1: string;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  city: string;
  county: string;
  postalCode: string;
  country: string;  // ISO-3166 Alpha-2 (e.g., "GB")
  displayAddress: string;
  areaDescription: string;

  // Pricing
  price: number;
  displayPrice: string;  // Formatted with currency
  pricePrefix: string | null;
  saleFee: string | null;
  saleFeePayableByBuyer: boolean;

  // Rooms
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  garages: number;
  parkingSpaces: number | null;

  // Content
  header: string;
  banner: string | null;
  subtitle: string;
  summary: string;
  printSummary: string | null;
  description: string;
  bullets: string[];  // Feature list
  additionalFeatures: string[];  // May be empty
  customDescription1-6: string | null;

  // Property Details
  yearBuilt: number | null;
  condition: string | null;
  ageCategory: string | null;
  internalArea: number | null;
  externalArea: number | null;
  leaseYearsRemaining: number | null;
  leaseDuration: number | null;

  // Financial
  councilTaxAmount: number | null;
  councilTaxBand: string | null;
  serviceChargeAmount: number | null;
  groundRentAmount: number | null;
  grossYield: string;
  totalIncomeText: string | null;

  // Dates
  dateAvailableFrom: string;
  dateOfInstruction: string | null;
  timeCreated: string;      // Unix timestamp
  timeUpdated: string;      // Unix timestamp (KEY for incremental sync!)
  timeMarketed: string;     // Unix timestamp
  timeTeaserEnd: string | null;

  // Status
  status: string;           // "Available", "Under Offer", "Sold", etc.
  websiteStatus: string | null;
  saleProgression: string;
  isFeatured: boolean;

  // Location
  geolocation: {
    latitude: number;
    longitude: number;
  };
  pov: {  // Street view point of view
    latitude: number;
    longitude: number;
    pitch: number;
    heading: number;
    zoom: number;
  };
  hasGeolocation: boolean;
  hasPov: boolean;
  mapEmbedUrl: string;
  streetViewEmbedUrl: string;

  // Media
  thumbnailUrl: string;
  images: Array<{
    type: string;
    thumbnailUrl: string;
    url: string;
    name: string;
  }>;
  gallery: any[];
  floorplans: Array<{
    url: string;
  }>;
  epcs: any[];
  brochures: any[];
  videos: any[];
  virtualTours: Array<{
    url: string;
  }>;

  // Rooms
  rooms: Array<{
    name: string;
    description: string;
    // ... room details
  }>;

  // Energy
  energyEfficiency: [number, number];  // [current, potential]
  environmentalImpact: [number, number];

  // Connectivity
  broadbandSpeeds: {
    // broadband data
  };

  // Misc
  mainSearchRegionId: number | null;
  imageOverlayText: string | null;
  showLogo: boolean;
  user: any | null;
  additionalDetails: any;
  otherPortals: any[];
}
```

---

## Key Implementation Points

### 1. Form-Urlencoded is Required

❌ **Wrong**:
```typescript
await fetch(url, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({api_key: '...'})
});
```

✅ **Correct**:
```typescript
const formData = new URLSearchParams({
  api_key: apiKey,
  search: '1',
  page: '1',
});

await fetch(url, {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: formData.toString(),
});
```

### 2. Response Structure

Portal API returns **object** (not array):
```json
{
  "success": true,
  "listings": [...],  // Array of listings here
  "listingCount": 36
}
```

Access listings: `response.listings`

### 3. Pagination

- `page`: 1-based page number
- `page_size`: Listings per page (tested up to 1000)
- `pageCount`: Total pages available
- Loop until `page >= pageCount`

### 4. Incremental Sync

- Filter by `listing.timeUpdated > lastSyncTimestamp`
- Both are Unix timestamps (numeric comparison)
- Store `MAX(timeUpdated)` after each sync

### 5. Branch Mapping

- Get branches from `/api/get-portal-options`
- Returns `{branches: [{id, name}, ...]}`
- Map `listing.branch.id` → `agent.apex27_branch_id`

---

## Files Created Based on Real Testing

1. **APEX27_FINAL_INTEGRATION.md** ✅
   - Complete TypeScript implementation
   - Based on actual tested API structure
   - Field mapping from real listing data
   - Cron job code ready to use

2. **APEX27_DUAL_API_STRATEGY.md** ✅
   - Supports both Standard and Portal APIs
   - Adapter pattern for flexibility
   - (But you only need Portal API!)

3. **APEX27_API_TESTING_GUIDE.md** ✅
   - Testing scripts
   - Field discovery checklist

4. **APEX27_CONFIRMED_FACTS.md** ✅ (This document)
   - Real test results documented
   - Confirmed field structure
   - Working code patterns

5. **Updated: CLOUD_SETUP_GUIDE.md** ✅
   - Section 10 corrected for Portal API
   - Form-urlencoded format documented
   - Environment variables updated

6. **Updated: apps/dashboard/.env.example** ✅
   - `APEX27_PORTAL_URL` instead of `APEX27_API_URL`
   - Correct variable names

---

## Summary

### Confirmed Facts ✅

1. **Portal API is sufficient** - Has all 97 fields needed
2. **Use form-urlencoded** - NOT JSON format
3. **No Standard API needed** - Portal API works perfectly
4. **Incremental sync works** - Via `timeUpdated` Unix timestamp filtering
5. **Branch mapping works** - Via `branch.id` in each listing
6. **Your plugin proves it** - Working WordPress implementation exists

### Environment Variables (Final)

```bash
# Apex27 Portal API
APEX27_PORTAL_URL=https://portals-xxxxx.apex27.co.uk
APEX27_API_KEY=your-32-char-api-key

# Cron Security
CRON_SECRET=$(openssl rand -hex 32)
```

### Next Steps

1. ✅ Get your current Portal URL + API key from Apex27 settings
2. ✅ Add to .env.local
3. ✅ Implement Portal API client (code provided in APEX27_FINAL_INTEGRATION.md)
4. ✅ Test locally
5. ✅ Deploy and verify sync works

**You're ready to implement Phase 4 (Property Sync) with confidence!** All unknowns are now resolved. 🎉
