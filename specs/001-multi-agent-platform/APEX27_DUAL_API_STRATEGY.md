# Apex27 Dual API Integration Strategy

**Date**: 2025-10-29
**Purpose**: Support both Standard API and Portal API based on available access

## Overview

Since Apex27 API access varies by account, we'll implement **flexible integration** that works with:
- **Standard API** (`api.apex27.co.uk`) - If available, use for complete data
- **Portal API** (`portals-xxxxx.apex27.co.uk`) - If that's what you have, use with extraction
- **Both APIs** (Hybrid) - If you have both, use Standard as primary, Portal as fallback

---

## Implementation: Apex27 API Adapter Pattern

### 1. Abstract API Interface

```typescript
// apps/dashboard/lib/apex27/types.ts

export interface Apex27Listing {
  id: number;
  branchId: number;
  transactionType: 'sale' | 'let' | 'commercial';
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: Array<{
    url: string;
    thumbnail?: string;
    order: number;
  }>;
  features: string[];
  floorPlanUrl?: string;
  virtualTourUrl?: string;
  status: string;
  isFeatured: boolean;
  isHidden: boolean;
  // Extracted/computed fields
  isStudentProperty?: boolean;
  isSharedAccommodation?: boolean;
  hasWashingMachine?: boolean;
  rentFrequency?: string;
  dtsCreated: string;
  dtsUpdated?: string;
}

export interface Apex27ApiClient {
  getListings(params: {
    minDtsUpdated?: string;
    branchId?: number;
    transactionType?: 'sale' | 'let' | 'commercial';
    page?: number;
  }): Promise<Apex27Listing[]>;

  getListing(id: number): Promise<Apex27Listing>;

  getBranches(): Promise<Array<{ id: number; name: string }>>;
}
```

### 2. Standard API Implementation

```typescript
// apps/dashboard/lib/apex27/standard-api-client.ts

import type { Apex27ApiClient, Apex27Listing } from './types';

export class StandardApiClient implements Apex27ApiClient {
  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://api.apex27.co.uk'
  ) {}

  async getListings(params: any = {}): Promise<Apex27Listing[]> {
    const queryParams = new URLSearchParams();

    if (params.minDtsUpdated) {
      queryParams.append('minDtsUpdated', params.minDtsUpdated);
    }
    if (params.branchId) {
      queryParams.append('branchId', String(params.branchId));
    }
    if (params.transactionType) {
      queryParams.append('transactionType', params.transactionType);
    }
    queryParams.append('includeImages', '1');
    queryParams.append('includeFloorplans', '1');
    queryParams.append('includeVirtualTours', '1');

    const url = `${this.baseUrl}/listings?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Standard API error: ${response.status} ${response.statusText}`);
    }

    const rawListings = await response.json();

    // Map Standard API response to our unified format
    return rawListings.map((listing: any) => this.mapStandardListing(listing));
  }

  async getListing(id: number): Promise<Apex27Listing> {
    const response = await fetch(
      `${this.baseUrl}/listings/${id}?includeImages=1&includeFloorplans=1&includeVirtualTours=1`,
      {
        headers: {
          'X-Api-Key': this.apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Standard API error: ${response.status}`);
    }

    const listing = await response.json();
    return this.mapStandardListing(listing);
  }

  async getBranches() {
    const response = await fetch(`${this.baseUrl}/branches`, {
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Standard API error: ${response.status}`);
    }

    return response.json();
  }

  private mapStandardListing(listing: any): Apex27Listing {
    return {
      id: listing.id,
      branchId: listing.branch?.id || listing.branchId,
      transactionType: listing.transactionType,
      title: listing.summary || `${listing.bedrooms} bed ${listing.propertyType}`,
      description: listing.description || '',
      price: listing.price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      propertyType: listing.propertyType,
      address: {
        line1: listing.address1,
        line2: listing.address2,
        city: listing.city,
        county: listing.county,
        postcode: listing.postalCode,
        country: listing.country === 'GB' ? 'United Kingdom' : listing.country,
      },
      coordinates: listing.latitude && listing.longitude ? {
        latitude: listing.latitude,
        longitude: listing.longitude,
      } : undefined,
      images: (listing.images || []).map((img: any, idx: number) => ({
        url: img.url,
        thumbnail: img.thumbnailUrl || img.thumbnail,
        order: img.order ?? idx + 1,
      })),
      features: [
        ...(listing.bullets || []),
        // If Standard API has flag objects, extract features from them
        ...(this.extractFeaturesFromFlags(listing)),
      ].filter(Boolean),
      floorPlanUrl: listing.floorplans?.[0]?.url || null,
      virtualTourUrl: listing.virtualTours?.[0]?.url || null,
      status: this.mapStatus(listing.status),
      isFeatured: listing.flags?.featured || listing.websiteStatus === 'featured',
      isHidden: listing.flags?.unlisted || listing.archived || false,
      // Extract boolean flags (if available)
      isStudentProperty: listing.rentalFlags?.isStudentProperty || false,
      isSharedAccommodation: listing.residentialFlags?.isSharedAccommodation || false,
      hasWashingMachine: listing.rentalFlags?.hasWashingMachine || false,
      rentFrequency: listing.rentFrequency || null,
      dtsCreated: listing.dtsCreated,
      dtsUpdated: listing.dtsUpdated,
    };
  }

  private extractFeaturesFromFlags(listing: any): string[] {
    const features: string[] = [];

    // If rentalFlags exist, extract to strings
    if (listing.rentalFlags) {
      if (listing.rentalFlags.hasWashingMachine) features.push('Washing Machine');
      if (listing.rentalFlags.hasDishwasher) features.push('Dishwasher');
      if (listing.rentalFlags.petsAllowed) features.push('Pets Allowed');
      // ... add more as needed
    }

    if (listing.residentialFlags) {
      if (listing.residentialFlags.hasBasement) features.push('Basement');
      if (listing.residentialFlags.hasDoubleGlazing) features.push('Double Glazing');
      if (listing.residentialFlags.hasConservatory) features.push('Conservatory');
      // ... add more as needed
    }

    return features;
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      'active': 'available',
      'Under Offer': 'under_offer',
      'Sold': 'sold',
      'Let': 'let',
      'Exchanged': 'under_offer',
      'Completed': 'sold',
    };
    return map[status] || 'available';
  }
}
```

### 3. Portal API Implementation

```typescript
// apps/dashboard/lib/apex27/portal-api-client.ts

import type { Apex27ApiClient, Apex27Listing } from './types';

export class PortalApiClient implements Apex27ApiClient {
  constructor(
    private apiKey: string,
    private portalUrl: string // e.g., https://portals-xxxxx.apex27.co.uk
  ) {}

  async getListings(params: any = {}): Promise<Apex27Listing[]> {
    const requestBody: any = {
      api_key: this.apiKey,
      search: '1',
      page: String(params.page || 1),
    };

    if (params.transactionType) {
      requestBody.transaction_type = params.transactionType;
    }

    const response = await fetch(`${this.portalUrl}/api/get-listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for error response
    if (data.success === false) {
      throw new Error(`Portal API error: ${data.message}`);
    }

    // Portal API returns array directly
    const rawListings = Array.isArray(data) ? data : data.listings || [];

    // Map Portal API response to our unified format
    return rawListings.map((listing: any) => this.mapPortalListing(listing));
  }

  async getListing(id: number): Promise<Apex27Listing> {
    const response = await fetch(`${this.portalUrl}/api/get-listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        listing_id: id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(`Portal API error: ${data.message}`);
    }

    return this.mapPortalListing(data);
  }

  async getBranches() {
    // Portal API may not have a branches endpoint
    // Extract unique branches from listings instead
    const listings = await this.getListings({ page: 1 });

    const branchMap = new Map();
    for (const listing of listings) {
      if (listing.branchId) {
        branchMap.set(listing.branchId, {
          id: listing.branchId,
          name: `Branch ${listing.branchId}`, // Portal may not provide branch name
        });
      }
    }

    return Array.from(branchMap.values());
  }

  private mapPortalListing(listing: any): Apex27Listing {
    // Extract features from additionalFeatures array
    const extractedFlags = this.extractFeaturesFromArray(
      listing.additionalFeatures || []
    );

    // Extract rent frequency from displayPrice
    const rentFrequency = listing.rentFrequency ||
      this.extractRentFrequency(listing.displayPrice);

    return {
      id: listing.id,
      branchId: listing.branch?.id || listing.branchId,
      transactionType: listing.transactionType || listing.transaction_type,
      title: listing.summary || listing.title || `${listing.bedrooms} bed ${listing.propertyType}`,
      description: listing.description || '',
      price: listing.price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      propertyType: listing.propertyType || listing.property_type,
      address: {
        line1: listing.address1,
        line2: listing.address2,
        city: listing.city,
        county: listing.county,
        postcode: listing.postalCode || listing.postal_code || listing.postcode,
        country: listing.country === 'GB' ? 'United Kingdom' : listing.country || 'United Kingdom',
      },
      coordinates: listing.latitude && listing.longitude ? {
        latitude: listing.latitude,
        longitude: listing.longitude,
      } : undefined,
      images: (listing.images || []).map((img: any, idx: number) => ({
        url: img.url,
        thumbnail: img.thumbnailUrl || img.thumbnail,
        order: img.order ?? idx + 1,
      })),
      features: [
        ...(listing.bullets || []),
        ...(listing.additionalFeatures || []),
      ].filter(Boolean),
      floorPlanUrl: listing.floorplans?.[0]?.url || listing.floorplan_url || null,
      virtualTourUrl: listing.virtualTours?.[0]?.url || listing.virtual_tour_url || null,
      status: this.mapStatus(listing.status),
      isFeatured: listing.websiteStatus === 'featured' || listing.is_featured || false,
      isHidden: listing.websiteStatus === 'hidden' || listing.archived || listing.is_hidden || false,
      // Extracted flags from additionalFeatures
      ...extractedFlags,
      rentFrequency,
      dtsCreated: listing.dtsCreated || listing.dts_created,
      dtsUpdated: listing.dtsUpdated || listing.dts_updated,
    };
  }

  private extractFeaturesFromArray(features: string[]) {
    return {
      isStudentProperty: features.includes('Student Property'),
      isSharedAccommodation: features.includes('Shared Accommodation'),
      hasWashingMachine: features.includes('Has Washing Machine'),
      hasDishwasher: features.includes('Has Dishwasher'),
      hasBasement: features.includes('Has Basement'),
      hasConservatory: features.includes('Has Conservatory'),
      hasDoubleGlazing: features.includes('Has Double Glazing'),
      hasFireplace: features.includes('Has Fireplace'),
      hasGarage: features.some(f => f.toLowerCase().includes('garage')),
      hasGarden: features.some(f => f.toLowerCase().includes('garden')),
      petsAllowed: features.includes('Pets Allowed'),
    };
  }

  private extractRentFrequency(displayPrice: string): string | null {
    if (!displayPrice) return null;

    const priceUpper = displayPrice.toUpperCase();

    if (priceUpper.includes('PPPW')) return 'PPPW';
    if (priceUpper.includes('PCM') || priceUpper.includes('PM')) return 'M';
    if (priceUpper.includes('PW')) return 'W';
    if (priceUpper.includes('PA')) return 'A';

    return null;
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      'active': 'available',
      'Under Offer': 'under_offer',
      'Sold': 'sold',
      'Let': 'let',
    };
    return map[status] || 'available';
  }
}
```

### 4. Factory Pattern (Auto-detect API Type)

```typescript
// apps/dashboard/lib/apex27/client-factory.ts

import { StandardApiClient } from './standard-api-client';
import { PortalApiClient } from './portal-api-client';
import type { Apex27ApiClient } from './types';

export function createApex27Client(): Apex27ApiClient {
  const apiType = process.env.APEX27_API_TYPE || 'portal';
  const apiKey = process.env.APEX27_API_KEY!;

  if (apiType === 'standard') {
    const apiUrl = process.env.APEX27_API_URL || 'https://api.apex27.co.uk';
    return new StandardApiClient(apiKey, apiUrl);
  } else {
    const portalUrl = process.env.APEX27_PORTAL_URL!;
    return new PortalApiClient(apiKey, portalUrl);
  }
}

// Usage in cron job
const apex27 = createApex27Client();
const listings = await apex27.getListings({ minDtsUpdated: lastSync });
```

---

## Environment Variables (Supports Both)

### Standard API Configuration

```bash
APEX27_API_TYPE=standard
APEX27_API_KEY=your-standard-api-key
APEX27_API_URL=https://api.apex27.co.uk
```

### Portal API Configuration

```bash
APEX27_API_TYPE=portal
APEX27_API_KEY=fe85bdfa8dba634650b91300f96b7567
APEX27_PORTAL_URL=https://portals-5ab21b55.apex27.co.uk
```

### Hybrid (If You Have Both)

```bash
APEX27_API_TYPE=hybrid
APEX27_STANDARD_API_KEY=your-standard-key
APEX27_PORTAL_API_KEY=your-portal-key
APEX27_API_URL=https://api.apex27.co.uk
APEX27_PORTAL_URL=https://portals-xxxxx.apex27.co.uk
```

---

## Testing Your Current Portal API Access

Since you say you're actively using these credentials, let me understand **how** you're calling it:

### Questions for You

1. **What application are you using?**
   - WordPress plugin?
   - Custom PHP script?
   - Postman/API client?
   - Other?

2. **What exact endpoint are you calling?**
   - `/api/get-listings`?
   - `/api/listings`?
   - Something else?

3. **What does your working request look like?**
   - Can you share the working code snippet?
   - Or screenshot of working API call?

4. **What response do you get?**
   - Can you share an example property JSON?
   - Even just the field names would help

### Alternative Test Methods

If you have working code in WordPress/PHP, we can:

```php
// If this is what works for you
$response = wp_remote_post('https://portals-5ab21b55.apex27.co.uk/api/get-listings', array(
    'body' => array(
        'api_key' => 'fe85bdfa8dba634650b91300f96b7567',
        'search' => '1',
        'page' => '1'
    )
));

$listings = json_decode(wp_remote_retrieve_body($response), true);

// Can you run this and show me the output?
print_r(array_keys($listings[0]));
```

Or if you have a working curl command:

```bash
# What curl command works for you?
# Share the exact command and I'll convert it to our TypeScript implementation
```

---

## Pragmatic Path Forward

### Option 1: You Share Working Example

- Share how you currently call the API successfully
- I'll adapt that exact pattern to TypeScript
- We'll know exactly what fields are returned

### Option 2: Assume Portal API + Extraction

Based on your research document, I'll:
- Implement Portal API client with `additionalFeatures` extraction
- Use the patterns from your research doc (which you know work)
- We can test and adjust when you deploy

### Option 3: Get Fresh Credentials

- Get current valid Portal credentials from Apex27
- I'll test immediately
- We'll see exact response structure

---

## My Recommendation

**Let's use your working code as the blueprint!**

If you can share:
- The working API call (PHP, JavaScript, curl, whatever format)
- Or an example JSON response from a successful call
- Or the field names from a successful listing fetch

Then I can:
- Build the exact TypeScript client that matches your working implementation
- Map the exact fields you're already getting
- Ensure it works the same way

**This is the fastest path to certainty!** What format is your working code in?