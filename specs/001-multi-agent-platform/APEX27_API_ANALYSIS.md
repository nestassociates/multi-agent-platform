# Apex27 API Analysis: Standard vs Portal API

**Date**: 2025-10-29
**Purpose**: Determine if we need both API types or if Standard API alone is sufficient

## Question

Do we need to call BOTH the Standard API and Portal API, or is the Standard API alone sufficient for all required property data?

---

## API Type Comparison

### Standard API (api.apex27.co.uk)

**Documentation**: Fully documented in `apex27.apib`
**Authentication**: `X-Api-Key` header
**Request Method**: GET
**Endpoint**: `/listings`

**Documented Fields in API Blueprint**:
- ✅ Complete address (address1-4, city, county, postalCode, country)
- ✅ Basic details (summary, description, price, bedrooms, bathrooms)
- ✅ Property type, transaction type, status
- ✅ Coordinates (latitude, longitude)
- ✅ Features arrays (parking, heating, accessibility, etc.)
- ✅ Images, floorplans, brochures, virtual tours
- ✅ Basic flags object (showPrice, exportable, featured, unlisted)
- ❓ **Detailed flag objects** (residentialFlags, rentalFlags, saleFlags) - **DEFINED but unclear if returned**

**Key Uncertainty**:
The API blueprint DEFINES these object types:
- `Listing Flags`
- `Listing Residential Flags` (includes `isSharedAccommodation`, `hasBasement`, etc.)
- `Listing Sale Flags` (includes `isChainFree`, `isNewHome`, etc.)
- `Listing Rental Flags` (includes `isStudentProperty`, `petsAllowed`, `hasWashingMachine`, etc.)

BUT these are not explicitly referenced in the `Listing Base` or `Listing Response Item` attributes, suggesting they may:
1. Be optional include parameters (like `includeFlags=1`)
2. Be embedded in the response but not shown in the blueprint excerpt
3. Be documentation of future features not yet implemented

### Portal API (portals-XXXXX.apex27.co.uk)

**Documentation**: NOT in `apex27.apib` - based on your research document
**Authentication**: `api_key` in POST body
**Request Method**: POST
**Endpoint**: `/api/get-listings`

**Known Limitations** (from your research):
- ❌ Does NOT return boolean flag fields (`isStudentProperty`, `isSharedAccommodation`, etc.)
- ❌ `rentFrequency` returns NULL even though field exists
- ✅ Returns `additionalFeatures` array with string values:
  ```json
  "additionalFeatures": [
    "Student Property",
    "Shared Accommodation",
    "Has Washing Machine",
    "Parking - Off Street"
  ]
  ```

**Data Extraction Required**:
- Parse `additionalFeatures` strings into boolean fields
- Extract `rentFrequency` from `displayPrice` string
- Map parking types from feature strings

---

## Critical Testing Needed

### Test 1: What Does Standard API Actually Return?

**You need to test this with a real API call:**

```bash
# Fetch a single listing with Standard API
curl -X GET "https://api.apex27.co.uk/listings/YOUR_LISTING_ID?includeImages=1" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Accept: application/json" > standard_api_response.json

# Check the response for flag objects
cat standard_api_response.json | jq keys
cat standard_api_response.json | jq '.flags'
cat standard_api_response.json | jq '.residentialFlags'
cat standard_api_response.json | jq '.rentalFlags'
cat standard_api_response.json | jq '.additionalFeatures'
```

**What to look for**:
1. Is there a `residentialFlags` object with `isStudentProperty`, `isSharedAccommodation`, etc.?
2. Is there a `rentalFlags` object with `petsAllowed`, `hasWashingMachine`, etc.?
3. Is there an `additionalFeatures` array like Portal API has?
4. Is `rentFrequency` populated or NULL?

---

## Three Possible Scenarios

### Scenario A: Standard API Has Everything ✅

**If Standard API returns**:
- ✅ `residentialFlags` object with all boolean fields
- ✅ `rentalFlags` object with `isStudentProperty`, `petsAllowed`, etc.
- ✅ `rentFrequency` populated correctly
- ✅ All detailed property flags

**Then**:
- **Use Standard API ONLY**
- No need for Portal API
- Simple integration
- All data available directly

**Implementation**:
```typescript
const listing = await apex27.getListing(id);
// Access flags directly
const isStudent = listing.rentalFlags?.isStudentProperty;
const hasWashingMachine = listing.rentalFlags?.hasWashingMachine;
```

### Scenario B: Standard API Returns additionalFeatures (Like Portal) ⚠️

**If Standard API returns**:
- ❌ NO `residentialFlags`, `rentalFlags` objects
- ✅ `additionalFeatures` array like Portal API
- ❌ `rentFrequency` is NULL
- ⚠️ Same structure as Portal API

**Then**:
- **Use Standard API ONLY**
- Implement extraction logic from `additionalFeatures`
- Use your existing research patterns
- No benefit to using both APIs

**Implementation**:
```typescript
const listing = await apex27.getListing(id);
// Extract from additionalFeatures
const isStudent = listing.additionalFeatures?.includes('Student Property');
const hasWashingMachine = listing.additionalFeatures?.includes('Has Washing Machine');
```

### Scenario C: Standard API Missing Some Fields 🤔

**If Standard API returns**:
- ✅ Some flags but not all
- ❌ Missing critical fields needed for your use case
- ⚠️ Different from both API blueprint and Portal API

**Then**:
- **Use BOTH APIs** with fallback strategy
- Primary: Standard API (more complete)
- Fallback: Portal API for missing fields
- More complex but gets all data

**Implementation**:
```typescript
// Dual API strategy
const standardData = await standardApi.getListing(id);
const portalData = await portalApi.getListing(id);

const mergedData = {
  ...standardData,
  // Fill missing fields from Portal API
  isStudentProperty: standardData.rentalFlags?.isStudentProperty ??
    portalData.additionalFeatures?.includes('Student Property'),
  rentFrequency: standardData.rentFrequency ??
    extractRentFrequencyFromPrice(portalData.displayPrice),
};
```

---

## Recommendation: Test First, Then Decide

### Step 1: Test Standard API Response

```bash
# 1. Request API access from Apex27 support
# Email: support@apex27.co.uk
# Request: "Standard API access" (not Portal API)

# 2. Once you have the API key, fetch a test listing
curl -X GET "https://api.apex27.co.uk/listings?pageSize=1&includeImages=1" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Accept: application/json" | jq '.[0]' > test_standard_api.json

# 3. Inspect the response
cat test_standard_api.json | jq 'keys' | sort

# 4. Check for specific fields
echo "Checking for flag objects..."
cat test_standard_api.json | jq '.flags'
cat test_standard_api.json | jq '.residentialFlags'
cat test_standard_api.json | jq '.rentalFlags'
cat test_standard_api.json | jq '.saleFlags'
cat test_standard_api.json | jq '.additionalFeatures'
cat test_standard_api.json | jq '.rentFrequency'

# 5. Check a rental property specifically
curl -X GET "https://api.apex27.co.uk/listings?transactionType=let&pageSize=1" \
  -H "X-Api-Key: YOUR_API_KEY" | jq '.[0].rentalFlags'
```

### Step 2: Document Findings

Create a file with actual field availability:

```markdown
# Standard API Test Results

Date: [when you test]
Listing ID: [test listing ID]
Transaction Type: [sale/let]

## Fields Returned

- [ ] flags object (basic)
- [ ] residentialFlags object
- [ ] rentalFlags object
- [ ] saleFlags object
- [ ] additionalFeatures array
- [ ] rentFrequency (populated or NULL?)
- [ ] isStudentProperty (in rentalFlags?)
- [ ] isSharedAccommodation (in residentialFlags?)
- [ ] hasWashingMachine (in rentalFlags?)

## Conclusion

Based on actual API response:
- [ ] Standard API is sufficient (has all flags)
- [ ] Need to extract from additionalFeatures (like Portal)
- [ ] Need both APIs (Standard + Portal for missing fields)
```

### Step 3: Choose Integration Strategy

Once you have test results, we'll know which approach to use.

---

## Likely Scenario (Based on Your Research)

Your research document suggests:

> "Portal API Limitations: Despite being documented in the main API specification, these fields are NOT returned by Portal API:
> - isSharedAccommodation
> - isStudentProperty
> - residentialFlags object
> - rentalFlags object"

This implies:
1. **Standard API probably DOES return these fields** (otherwise why mention Portal lacks them?)
2. **Portal API** uses `additionalFeatures` as a workaround
3. **You should use Standard API** and get all fields properly structured

---

## My Current Recommendation

### Use Standard API Only (Most Likely Sufficient)

**Reasoning**:
1. Your research doc implies Standard API has the full field set
2. Portal API is described as "limited subset" - used for public portals
3. API blueprint documents comprehensive flag objects
4. You have Standard API access request process

**If Standard API has all fields**:
- ✅ Single API to integrate
- ✅ All flags as boolean fields (no extraction needed)
- ✅ Simpler code
- ✅ Better data quality

**Only use Portal API if**:
- You can't get Standard API access
- Standard API is too expensive
- You discover Standard API also returns NULL for critical fields

---

## Testing Script for You

Save this as `test-apex27-api.sh`:

```bash
#!/bin/bash

# Test Apex27 Standard API
# Usage: ./test-apex27-api.sh YOUR_API_KEY

API_KEY=$1

if [ -z "$API_KEY" ]; then
  echo "Usage: ./test-apex27-api.sh YOUR_API_KEY"
  exit 1
fi

echo "Testing Apex27 Standard API..."
echo "================================"

# Test 1: Fetch branches
echo -e "\n1. Testing /branches endpoint..."
curl -X GET "https://api.apex27.co.uk/branches" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json" \
  -s | jq '.[0] | {id, name}'

# Test 2: Fetch sale listings
echo -e "\n2. Testing /listings (sale properties)..."
curl -X GET "https://api.apex27.co.uk/listings?transactionType=sale&pageSize=1&includeImages=1" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json" \
  -s > test_sale_listing.json

echo "Available top-level fields:"
cat test_sale_listing.json | jq '.[0] | keys' | grep -E "flags|Features|Flags"

# Test 3: Fetch rental listings
echo -e "\n3. Testing /listings (rental properties)..."
curl -X GET "https://api.apex27.co.uk/listings?transactionType=let&pageSize=1&includeImages=1" \
  -H "X-Api-Key: $API_KEY" \
  -H "Accept: application/json" \
  -s > test_rental_listing.json

# Test 4: Check for flag objects
echo -e "\n4. Checking for flag objects in rental listing..."
echo "Basic flags:"
cat test_rental_listing.json | jq '.[0].flags'

echo -e "\nResidential flags:"
cat test_rental_listing.json | jq '.[0].residentialFlags'

echo -e "\nRental flags:"
cat test_rental_listing.json | jq '.[0].rentalFlags'

echo -e "\nAdditional features:"
cat test_rental_listing.json | jq '.[0].additionalFeatures'

echo -e "\nRent frequency:"
cat test_rental_listing.json | jq '.[0].rentFrequency'

# Test 5: Check isStudentProperty specifically
echo -e "\n5. Checking for isStudentProperty field..."
cat test_rental_listing.json | jq '.[0] | {
  rentalFlags_isStudentProperty: .rentalFlags.isStudentProperty,
  additionalFeatures: .additionalFeatures,
  hasStudentInFeatures: (.additionalFeatures | if . then any(. == "Student Property") else false end)
}'

echo -e "\n================================"
echo "Test complete! Check the JSON files for full responses."
echo "Files created: test_sale_listing.json, test_rental_listing.json"
```

---

## Questions for Apex27 Support

When requesting API access, ask these specific questions:

### 1. Field Availability

"In the Standard API (`https://api.apex27.co.uk/listings`), are the following objects returned in the JSON response?"

- `residentialFlags` object with fields like `isSharedAccommodation`, `hasBasement`, `hasDoubleGlazing`?
- `rentalFlags` object with fields like `isStudentProperty`, `petsAllowed`, `hasWashingMachine`?
- `saleFlags` object with fields like `isChainFree`, `isNewHome`?

### 2. Alternative Field Structure

"If the above flag objects are NOT returned, is there an `additionalFeatures` array that contains this information as strings instead?"

Example: `["Student Property", "Has Washing Machine", "Parking - Off Street"]`

### 3. Rent Frequency

"For rental properties, is the `rentFrequency` field populated with values like 'M' (monthly), 'W' (weekly), 'PPPW' (per person per week), or does it return NULL?"

### 4. Portal API Access

"Do we have access to both Standard API AND Portal API, or just one? If both, which one should we prioritize for property data synchronization?"

---

## Provisional Implementation Strategy

### Strategy 1: Standard API Only (Start Here)

**Assumption**: Standard API returns all documented fields including flag objects

**Implementation**:
```typescript
// Simple, clean integration
const listings = await apex27.getListings({
  minDtsUpdated: lastSync,
  includeImages: 1,
  includeFloorplans: 1,
  includeVirtualTours: 1,
});

for (const listing of listings) {
  const propertyData = {
    // Direct field mapping
    apex27_id: String(listing.id),
    title: listing.summary,
    description: listing.description,
    // ... all basic fields

    // Feature flags from proper objects
    features: [
      ...(listing.bullets || []),
      // Add features based on boolean flags
      ...(listing.residentialFlags?.hasBasement ? ['Basement'] : []),
      ...(listing.residentialFlags?.hasDoubleGlazing ? ['Double Glazing'] : []),
      ...(listing.rentalFlags?.hasWashingMachine ? ['Washing Machine'] : []),
      // ... etc
    ],

    // Marketing flags
    is_student_property: listing.rentalFlags?.isStudentProperty || false,
    is_shared_accommodation: listing.residentialFlags?.isSharedAccommodation || false,
    pets_allowed: listing.rentalFlags?.petsAllowed || false,
  };
}
```

**Pros**:
- ✅ Single API to maintain
- ✅ Clean boolean fields
- ✅ Type-safe
- ✅ Simple code

**Cons**:
- ⚠️ Assumes Standard API returns flag objects (needs verification)

### Strategy 2: Standard API with Feature Extraction (If flags unavailable)

**Assumption**: Standard API also uses `additionalFeatures` array

**Implementation**:
```typescript
// Same as Portal API extraction
const listings = await apex27.getListings({ minDtsUpdated: lastSync });

for (const listing of listings) {
  const propertyData = {
    // Basic fields
    apex27_id: String(listing.id),
    // ... etc

    // Extract from additionalFeatures (if that's what Standard API uses)
    features: listing.additionalFeatures || listing.bullets || [],

    // Extract boolean flags from feature strings
    is_student_property: listing.additionalFeatures?.includes('Student Property') || false,
    is_shared_accommodation: listing.additionalFeatures?.includes('Shared Accommodation') || false,
    has_washing_machine: listing.additionalFeatures?.includes('Has Washing Machine') || false,

    // Extract rent frequency from displayPrice
    rent_frequency: listing.rentFrequency ||
      extractRentFrequency(listing.displayPrice),
  };
}
```

**Pros**:
- ✅ Works even if Standard API has same limitations as Portal
- ✅ Single API to maintain
- ✅ Proven extraction patterns from your research

**Cons**:
- ⚠️ Requires feature string parsing
- ⚠️ Less type-safe than boolean fields

### Strategy 3: Dual API (Standard + Portal) 🔄

**Assumption**: Neither API alone has complete data

**Use Case**:
- Standard API has better core data (coordinates, detailed pricing)
- Portal API has better feature data (`additionalFeatures`)
- Need to merge both for complete picture

**Implementation**:
```typescript
// Fetch from both APIs
const standardListings = await standardApi.getListings({ minDtsUpdated: lastSync });
const portalListings = await portalApi.getListings({ page: 1 });

// Merge by listing ID
for (const standardListing of standardListings) {
  const portalListing = portalListings.find(p => p.id === standardListing.id);

  const propertyData = {
    // Core data from Standard API (more reliable)
    apex27_id: String(standardListing.id),
    title: standardListing.summary,
    price: standardListing.price,
    coordinates: {
      lat: standardListing.latitude,
      lng: standardListing.longitude,
    },

    // Feature data from Portal API (has additionalFeatures)
    features: portalListing?.additionalFeatures || standardListing.bullets || [],

    // Extract flags from Portal's additionalFeatures
    is_student_property: portalListing?.additionalFeatures?.includes('Student Property'),

    // But also check Standard API in case it has them
    is_student_property_alt: standardListing.rentalFlags?.isStudentProperty,
  };
}
```

**Pros**:
- ✅ Most comprehensive data
- ✅ Redundancy (if one API fails, have other)
- ✅ Can cherry-pick best fields from each

**Cons**:
- ❌ 2x API calls (doubles usage)
- ❌ More complex code
- ❌ Harder to maintain
- ❌ Risk of data conflicts between APIs

---

## My Analysis & Recommendation

### Analysis

Based on the documentation:

1. **API Blueprint (.apib)** documents Standard API comprehensively
   - Shows detailed flag objects (Residential, Rental, Sale, Commercial)
   - Shows all field structures
   - Clear, well-documented

2. **Your Research Doc** says Portal API:
   - Does NOT return boolean flags
   - Uses `additionalFeatures` strings instead
   - Has `rentFrequency` as NULL
   - Limited field subset

3. **Logical Conclusion**:
   - If Portal API lacks these fields...
   - And Standard API is the "full" API...
   - Then Standard API **should** have the complete flag objects

### Recommendation

**Start with Standard API ONLY**:

1. **Request Standard API access** from Apex27 support
2. **Test with real data** using the script above
3. **Document what you find** in actual responses
4. **Only add Portal API** if Standard is insufficient

**Most Likely Outcome** (80% confidence):
- Standard API returns all flag objects as documented
- Portal API is for simpler use cases (public property search)
- You only need Standard API

**If Standard API also has limitations** (20% chance):
- We'll implement extraction logic from `additionalFeatures`
- Still only use Standard API (Portal has same issue)
- Use the patterns from your research doc

**Only use both APIs if**:
- Standard API is missing critical fields you need
- Portal API has those fields (unlikely based on your research)
- The complexity is justified by better data quality

---

## Action Items for You

### Before Implementing Property Sync

1. **Contact Apex27 Support**
   - Request: "Standard API access for property synchronization"
   - Ask the 4 questions listed above
   - Request test API key for development

2. **Run Test Script**
   - Use the provided `test-apex27-api.sh` script
   - Save responses: `test_sale_listing.json`, `test_rental_listing.json`
   - Document which fields are actually returned

3. **Share Results**
   - Show me the `jq 'keys'` output (list of all fields)
   - Show me what `rentalFlags` looks like
   - Tell me if `additionalFeatures` array exists

4. **I'll Update Integration Guide**
   - Based on your test results
   - Provide exact field mapping
   - Confirm if we need one or both APIs

---

## Current Status

**Phase 1 & 2 Foundation**: ✅ Complete (75 tasks)

**Property Sync Strategy**: ⏸️ Awaiting API test results

**What We Know**:
- ✅ Apex27 uses REST API polling (not webhooks)
- ✅ Standard API documented in apex27.apib
- ✅ Portal API has limitations (from your research)

**What We Need to Confirm**:
- ❓ Does Standard API return flag objects or additionalFeatures array?
- ❓ Is rentFrequency populated in Standard API?
- ❓ Do we need both APIs or just Standard?

---

## Summary

**Short Answer**: We likely only need **Standard API**, but you should test it first to confirm.

**Next Steps**:
1. Contact Apex27 → Get Standard API key
2. Run test script → Document actual response structure
3. Share findings with me → I'll update integration guide accordingly

Would you like me to create a specific test checklist or help you draft the email to Apex27 support?
