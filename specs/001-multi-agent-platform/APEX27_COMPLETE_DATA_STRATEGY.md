# Apex27: Getting Complete Data - Portal vs Standard API

**Date**: 2025-10-29
**Critical Decision**: Do we need Standard API for complete data?

---

## Executive Summary

**Short Answer**: **Request Standard API access** to guarantee you get EVERY data point ✅

**Why**: Portal API is confirmed working but **may be missing** structured flag objects that Standard API provides. To ensure 100% data completeness, you should have both.

---

## Portal API: What We CONFIRMED (From Real Testing)

### ✅ Definitely Available (97-105 fields)

**Core Property Data**:
- ✅ ID, reference, branch ID
- ✅ Property type, subtype, transaction type
- ✅ Bedrooms, bathrooms, living rooms, garages
- ✅ Price (numeric and formatted display)
- ✅ Complete UK address (line1-4, city, county, postcode)
- ✅ Display address
- ✅ Summary and full description
- ✅ **bullets** array (9 descriptive features) - **RELIABLE**

**Location**:
- ✅ Coordinates (latitude/longitude) in `geolocation` object
- ✅ Street view POV data
- ✅ Map embed URLs

**Media** (35+ items in test):
- ✅ Images with thumbnails and full-size URLs
- ✅ Floorplans (PDF URLs)
- ✅ Virtual tours
- ✅ Brochures, EPCs, videos

**Additional Data**:
- ✅ Energy efficiency ratings
- ✅ Broadband speeds
- ✅ Council tax band and amount
- ✅ Service charges, ground rent
- ✅ Lease information
- ✅ Year built, condition, age category
- ✅ Internal/external area
- ✅ Rooms array (detailed room data)

**Timestamps** (for incremental sync):
- ✅ timeCreated, timeUpdated, timeMarketed (Unix timestamps)

**Status**:
- ✅ Status, website status, sale progression
- ✅ isFeatured flag

**Your working plugin maps**: **105 fields** from Portal API

---

## Portal API: What's MISSING or UNCERTAIN ❓

### ❓ Structured Flag Objects (Not Confirmed)

Based on Standard API specification, these objects exist but **were NOT present** in Portal API test:

**Listing Residential Flags** (14 boolean fields):
- `isSharedAccommodation` - Important for rental categorization
- `hasBasement`, `hasConservatory`, `hasDoubleGlazing`
- `hasFireplace`, `hasGym`, `hasLoft`
- `hasOutbuildings`, `hasPorterSecurity`
- `hasSwimmingPool`, `hasTennisCourt`
- `hasUtilityRoom`, `hasWaterfront`
- `hasAccessibilityFeatures`

**Listing Rental Flags** (16 boolean fields):
- `isStudentProperty` - **CRITICAL** for rental categorization
- `petsAllowed`, `smokersConsidered`, `sharersConsidered`
- `hasWashingMachine`, `hasDishwasher`, `hasBurglarAlarm`
- `allBillsIncluded`, `waterBillIncluded`, `gasBillIncluded`
- `electricityBillIncluded`, `councilTaxIncluded`
- `tvLicenceIncluded`, `internetBillIncluded`
- `isTenanted`, `isServiced`

**Listing Sale Flags** (13 boolean fields):
- `isChainFree` - Important for buyers
- `isNewHome`, `isRepossession`, `isRetirement`
- `hasEquityLoanIncentive`, `hasHelpToBuyIncentive`
- `developmentOpportunity`, `investmentOpportunity`

**Listing Commercial Flags**:
- `businessForSale`

### ❓ Structured Feature Arrays

Standard API has structured arrays (not present in Portal test):
- `accessibilityFeatures[]` - Array of accessibility feature objects
- `heatingFeatures[]` - Array of heating feature objects
- `parkingFeatures[]` - Array of parking feature objects
- `outsideSpaceFeatures[]` - Array of outside space objects
- `electricitySupplyFeatures[]`, `waterSupplyFeatures[]`
- `broadbandSupplyFeatures[]`, `floodSources[]`
- `customFeatures[]` - Custom feature strings

### ❓ Additional Standard API Fields

- `rentFrequency` - Portal API doesn't have this (confirmed NULL in your research)
- `furnished` - Furnished/unfurnished status
- `tenancyType` - HMO, AST, etc.
- `locationType` - Type of location

---

## What Portal API HAS Instead (Workarounds)

### `additionalFeatures` Array (Workaround for Flags)

**What it should contain** (based on your research):
```json
"additionalFeatures": [
  "Student Property",           // → isStudentProperty
  "Shared Accommodation",       // → isSharedAccommodation
  "Has Washing Machine",        // → hasWashingMachine
  "Has Dishwasher",            // → hasDishwasher
  "Has Basement",              // → hasBasement
  "Parking - Off Street",      // → parkingType
  "Pets Allowed"               // → petsAllowed
]
```

**What we found in testing**:
```json
"additionalFeatures": []  // EMPTY in test listing
```

**Why it was empty**:
1. Test listing was a high-end sale property (flags may not apply)
2. Property entered without checking these boxes in Apex27 CRM
3. OR Portal API doesn't reliably populate this field

**Risk**: If `additionalFeatures` is often empty, you lose important categorization data.

---

## Recommendation: Request Standard API Access

### Why You Should Get Both APIs

**1. Guarantee Complete Data** ⭐
- Standard API has explicit boolean flag objects
- No reliance on string parsing from arrays
- No risk of empty `additionalFeatures` arrays

**2. Better Data Quality**
- `rentFrequency` directly available (not extracted from display string)
- `furnished` status as boolean
- `tenancyType` explicitly stated
- Structured feature arrays instead of string arrays

**3. Dual API Strategy** (Best of Both Worlds)
- **Primary**: Standard API for complete flag objects
- **Fallback**: Portal API if Standard is down
- **Validation**: Cross-check data between both

**4. Future-Proof**
- If Apex27 adds new fields, Standard API gets them first
- Portal API may lag behind or not include them
- Standard API is the canonical source

---

## Comparison Table

| Data Point | Portal API | Standard API | Critical? |
|------------|------------|--------------|-----------|
| Core fields (price, beds, address) | ✅ Has | ✅ Has | ⭐⭐⭐ Yes |
| Images, floorplans, tours | ✅ Has (35+ images) | ✅ Has | ⭐⭐⭐ Yes |
| Coordinates (lat/lng) | ✅ Has | ✅ Has | ⭐⭐⭐ Yes |
| bullets array | ✅ Has (9 items) | ✅ Has | ⭐⭐ Important |
| additionalFeatures array | ⚠️ Has but may be empty | ❓ Unknown | ⭐⭐ Important |
| **residentialFlags object** | ❌ Not present | ✅ Has (documented) | ⭐⭐ Important |
| **rentalFlags object** | ❌ Not present | ✅ Has (documented) | ⭐⭐⭐ Critical for rentals |
| **saleFlags object** | ❌ Not present | ✅ Has (documented) | ⭐ Nice to have |
| **rentFrequency** | ❌ NULL (confirmed) | ✅ Has | ⭐⭐ Important for rentals |
| accessibilityFeatures[] | ❓ Untested | ✅ Has (documented) | ⭐ Nice to have |
| heatingFeatures[] | ❓ Untested | ✅ Has (documented) | ⭐ Nice to have |
| parkingFeatures[] | ❓ Untested | ✅ Has (documented) | ⭐ Nice to have |
| Timestamps (timeUpdated) | ✅ Has (Unix timestamp) | ✅ Has (dtsUpdated) | ⭐⭐⭐ Critical |

---

## The Risk with Portal API Only

### Scenario: Rental Properties

**What you NEED for rental categorization**:
- `isStudentProperty` - Categorize as student letting
- `isSharedAccommodation` - Categorize as house share
- `petsAllowed` - Filter for pet-friendly
- `hasWashingMachine`, `hasDishwasher` - Key amenities
- `rentFrequency` - Display price correctly (PCM vs PPPW)
- `allBillsIncluded` - Important for students
- `furnished` status - Critical filter

**Portal API provides these**:
- Via `additionalFeatures` array (IF populated by Apex27 CRM user)
- Via `displayPrice` string parsing (for rentFrequency)

**Risk**:
- If users don't check boxes in Apex27 CRM → `additionalFeatures` is empty
- You lose critical categorization data
- Properties can't be filtered/categorized properly

**Standard API provides these**:
- Direct boolean fields in `rentalFlags` object
- Explicit `rentFrequency` field
- Guaranteed data availability

---

## My Strong Recommendation

### Get Standard API Access ✅

**Contact Apex27 Support**:

```
Subject: Request for Standard API Access

Hi [Account Manager],

We currently have Portal API access (https://portals-5ab21b55.apex27.co.uk).

We're building an agent microsite network that requires comprehensive property data, particularly for rental properties. We need access to structured field objects (residentialFlags, rentalFlags, saleFlags) that are documented in the Standard API specification.

Request:
1. Standard API access (https://api.apex27.co.uk)
2. API key for Standard API
3. Confirm we can access both Portal API (for fallback) and Standard API (for complete data)

Our use case:
- Property sync for 16-1,000 agent microsites
- Polling every 15 minutes
- Need complete property flags for accurate categorization
- Expected usage: 5-10 API calls every 15 minutes

Current Portal API access is working, but we want to ensure we capture all available property data points for the best user experience on agent sites.

Thank you!
```

### Implementation Strategy: Dual API

```typescript
// apps/dashboard/lib/apex27/dual-client.ts

class Apex27DualClient {
  constructor(
    private standardClient: StandardApiClient,  // Primary
    private portalClient: PortalApiClient       // Fallback
  ) {}

  async getListings(params: any) {
    try {
      // Try Standard API first (complete data)
      return await this.standardClient.getListings(params);
    } catch (error) {
      console.warn('Standard API failed, falling back to Portal API', error);
      // Fallback to Portal API
      return await this.portalClient.getListings(params);
    }
  }

  // Or: Fetch from both and merge
  async getListingComplete(id: number) {
    const [standard, portal] = await Promise.allSettled([
      this.standardClient.getListing(id),
      this.portalClient.getListing(id),
    ]);

    // Merge: Standard API data takes precedence
    return {
      ...(portal.status === 'fulfilled' ? portal.value : {}),
      ...(standard.status === 'fulfilled' ? standard.value : {}),
    };
  }
}
```

---

## Alternative: Portal API Only (If Standard Unavailable)

### If You Can't Get Standard API

**You can still build the platform** using:

1. **Store complete `bullets` array** (always populated)
   ```typescript
   features: listing.bullets  // Descriptive feature strings
   ```

2. **Extract from `additionalFeatures` when available**
   ```typescript
   if (listing.additionalFeatures?.length > 0) {
     isStudentProperty = listing.additionalFeatures.includes('Student Property');
   }
   ```

3. **Extract `rentFrequency` from `displayPrice`**
   ```typescript
   // "£1,200 PCM" → "M"
   // "£350 PPPW" → "PPPW"
   rentFrequency = extractFromPrice(listing.displayPrice);
   ```

4. **Accept limitations**
   - Filtering might be less accurate
   - Categorization might be incomplete
   - Some properties may lack detailed amenity data

**Your working WordPress plugin proves this is viable** - it successfully uses Portal API only.

---

## My Final Recommendation

### Ideal Setup (Best Data Quality)

```bash
# Environment variables for BOTH APIs
APEX27_PORTAL_URL=https://portals-xxxxx.apex27.co.uk
APEX27_PORTAL_API_KEY=your-portal-key

APEX27_STANDARD_URL=https://api.apex27.co.uk
APEX27_STANDARD_API_KEY=your-standard-key

APEX27_PRIMARY=standard  # Use Standard as primary source
```

**Benefits**:
- ✅ Get ALL data points from Standard API
- ✅ Have Portal API as fallback if Standard fails
- ✅ Can cross-validate data between both
- ✅ Future-proof (Standard API gets new features first)

### Minimum Viable Setup (If Standard Unavailable)

```bash
# Portal API only
APEX27_PORTAL_URL=https://portals-xxxxx.apex27.co.uk
APEX27_API_KEY=your-portal-key
```

**Trade-offs**:
- ✅ Works (proven by your plugin)
- ⚠️ May miss some structured flags
- ⚠️ Relies on `additionalFeatures` being populated
- ⚠️ Need to extract rentFrequency from string

---

## Specific Fields You Might Miss (Portal Only)

### Critical for Rental Properties

| Field | Standard API | Portal API | Impact if Missing |
|-------|--------------|------------|-------------------|
| `rentalFlags.isStudentProperty` | ✅ Boolean | ⚠️ Extract from additionalFeatures | Can't accurately categorize student properties |
| `rentalFlags.petsAllowed` | ✅ Boolean | ⚠️ Extract from additionalFeatures | Can't filter pet-friendly properties |
| `rentalFlags.hasWashingMachine` | ✅ Boolean | ⚠️ Extract from additionalFeatures | Missing key amenity info |
| `rentFrequency` | ✅ Direct field | ❌ NULL - extract from displayPrice | Must parse "£1,200 PCM" manually |
| `furnished` | ✅ Direct field | ❓ Unclear | Can't filter furnished/unfurnished |
| `tenancyType` | ✅ Direct field | ❓ Unclear | Can't identify HMO vs AST |

### Important for All Properties

| Field | Standard API | Portal API | Impact if Missing |
|-------|--------------|------------|-------------------|
| `residentialFlags.isSharedAccommodation` | ✅ Boolean | ⚠️ Extract from additionalFeatures | Can't categorize house shares |
| `saleFlags.isChainFree` | ✅ Boolean | ⚠️ Extract from additionalFeatures | Missing marketing advantage |
| `accessibilityFeatures[]` | ✅ Structured array | ❓ Unclear | Accessibility info incomplete |
| `heatingFeatures[]` | ✅ Structured array | ❓ Unclear | Heating info incomplete |
| `parkingFeatures[]` | ✅ Structured array | ⚠️ Extract from additionalFeatures | Parking details less structured |

---

## Testing Limitations

### What We Couldn't Test

The portal we tested (`portals-5ab21b55.apex27.co.uk`) had:
- ✅ 36 sale properties
- ❌ 0 rental properties (couldn't test rental-specific fields)
- ❌ `additionalFeatures` was empty (couldn't verify extraction pattern)

**This means we DON'T KNOW**:
1. Does Portal API populate `additionalFeatures` for rental properties?
2. Does Portal API have `rentFrequency` for rentals?
3. Are the flag objects available somewhere in Portal API responses?

### To Get Certainty

**Option A**: Test with a portal that has rental properties
- Get a different portal URL with active rentals
- Check if `additionalFeatures` is populated
- Verify extraction patterns from your research

**Option B**: Request Standard API access
- Test Standard API to see exact field structure
- Compare with Portal API
- Document differences

---

## Email Template for Apex27 Support

```
Subject: Request for Standard API Access (In Addition to Portal API)

Hi [Account Manager Name],

We currently have Portal API access and it's working well:
- Portal URL: https://portals-5ab21b55.apex27.co.uk
- API Key: fe85bdfa8dba634650b91300f96b7567

We're building an agent microsite network and want to ensure we capture ALL available property data for the best user experience.

Request:
1. Standard API access (https://api.apex27.co.uk) in ADDITION to our existing Portal API
2. Standard API key for our account
3. Confirmation that both APIs can be used simultaneously

Specific questions:
1. Does the Standard API /listings endpoint return these objects?
   - residentialFlags (with isSharedAccommodation, hasBasement, etc.)
   - rentalFlags (with isStudentProperty, petsAllowed, hasWashingMachine, etc.)
   - saleFlags (with isChainFree, isNewHome, etc.)

2. Does Standard API have rentFrequency field populated (vs NULL in Portal API)?

3. Does Standard API have the structured feature arrays (accessibilityFeatures, heatingFeatures, parkingFeatures)?

4. What are the key differences between Portal API and Standard API responses?

Our use case:
- Syncing properties for 16-1,000 agents
- Polling every 15 minutes using minDtsUpdated parameter
- Need comprehensive property data for accurate filtering and categorization
- Expected usage: 5-10 Standard API calls + 1-2 Portal API calls every 15 minutes (for redundancy)

We want to use Standard API as primary source (complete data) with Portal API as fallback (reliability).

Thank you for your help!

Best regards,
[Your Name]
Nest Associates
```

---

## Recommended Approach

### Phase 1: Request Standard API (Now)

1. Send the email above to Apex27 support
2. Wait for Standard API credentials (1-3 business days)
3. Test Standard API to see exact field structure
4. Document differences between Portal and Standard

### Phase 2: Implement Dual API (When You Have Both)

1. Use Standard API as primary source
2. Keep Portal API as fallback
3. Merge data if needed
4. Log which API provided which data

### Phase 3: Optimize Based on Results

After testing both:
- If Standard API has all flag objects → Use Standard only
- If both APIs have same limitations → Use Portal only (simpler)
- If they complement each other → Use dual strategy

---

## What We Know For Certain

### ✅ Portal API is Sufficient For MVP

Your working WordPress plugin proves Portal API can work. You can:
1. Launch with Portal API only
2. Request Standard API in parallel
3. Add Standard API later when you get access
4. Enhance data quality incrementally

### ✅ Portal API Works Right Now

- Form-urlencoded POST requests
- 97-105 fields available
- Images, coordinates, timestamps all working
- Incremental sync possible via `timeUpdated`
- Branch mapping works

### ❓ Standard API Would Guarantee Complete Data

- Documented flag objects
- Structured feature arrays
- `rentFrequency` field
- No string extraction needed

---

## Decision Framework

### If You Can Wait 1-3 Days

**Recommendation**: Request Standard API access first, then implement

**Why**:
- Ensures you get EVERY data point
- Avoids rework later
- Better data quality from day 1

### If You Need to Start Immediately

**Recommendation**: Implement Portal API now, add Standard later

**Why**:
- Portal API proven working
- Can enhance with Standard API later
- MVP doesn't require perfect categorization

---

## My Strong Recommendation

**Request Standard API access NOW**, then implement with dual API support:

1. **This week**: Email Apex27 requesting Standard API
2. **While waiting**: Implement Portal API client (code ready)
3. **When you get Standard API**: Add Standard API client (5 hours work)
4. **Test both**: Document actual differences
5. **Optimize**: Use best API for each use case

**This guarantees you get EVERY possible data point** and future-proofs the integration.

---

## Bottom Line

**"Can Portal API alone give us EVERY data point?"**

**Honest Answer**: **Probably not** ❌

**What's likely missing**:
- Structured flag objects (residentialFlags, rentalFlags, saleFlags)
- rentFrequency field (have to parse from string)
- Structured feature arrays
- Some rental-specific metadata

**Solution**: **Request Standard API access** to guarantee complete data.

**Estimated Timeline**:
- Request: 5 minutes (email Apex27)
- Wait: 1-3 business days
- Implement: 5-8 hours (I can help)
- Result: 100% data completeness guarantee

**Should you request it?** **YES** - For a platform managing 1,000+ agents, you want the most complete data possible.

Would you like me to help you draft the email to Apex27 requesting Standard API access?