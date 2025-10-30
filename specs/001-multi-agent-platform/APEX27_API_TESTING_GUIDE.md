# Apex27 API Testing Guide

**Date**: 2025-10-29
**Purpose**: Test actual Apex27 API responses to determine integration strategy

## Current Situation

You mentioned Apex27 **"always provides a portal URL and API key"**, which suggests:
- ✅ You get Portal API access by default
- ❓ Standard API access may require separate request
- ❓ Portal API might be the only option available

**This changes everything!** If you only have Portal API access, we'll use Portal API and implement the extraction patterns from your research.

---

## Step 1: Verify Your Current API Access

### What You Have

Portal URL: `https://portals-5ab21b55.apex27.co.uk`
API Key: `fe85bdfa8dba634650b91300f96b7567` (appears invalid/expired)

### Get Current Valid Credentials

**Option A**: Check your Apex27 account settings
- Log into Apex27 CRM
- Settings → Integrations → API
- Look for current Portal URL and API key

**Option B**: Contact your Apex27 account manager
- Request: "Current Portal API credentials for property sync"
- They should provide: Portal URL + API key

**Option C**: Check if you have Standard API access
- Ask: "Do we have Standard API access (api.apex27.co.uk) or only Portal API?"
- If available, request Standard API key

---

## Step 2: Test Portal API (Once You Have Valid Credentials)

### Test Script for Portal API

Save as `test-portal-api.sh`:

```bash
#!/bin/bash

# Portal API Test Script
# Usage: ./test-portal-api.sh PORTAL_URL API_KEY

PORTAL_URL=$1
API_KEY=$2

if [ -z "$PORTAL_URL" ] || [ -z "$API_KEY" ]; then
  echo "Usage: ./test-portal-api.sh PORTAL_URL API_KEY"
  echo "Example: ./test-portal-api.sh https://portals-xxxxx.apex27.co.uk your-api-key"
  exit 1
fi

echo "Testing Portal API: $PORTAL_URL"
echo "================================"

# Test 1: Get listings (sale)
echo -e "\n1. Testing get-listings (sale properties)..."
cat > /tmp/portal_request.json << EOF
{
  "api_key": "$API_KEY",
  "search": "1",
  "transaction_type": "sale",
  "page": "1"
}
EOF

curl -X POST "$PORTAL_URL/api/get-listings" \
  -H "Content-Type: application/json" \
  --data @/tmp/portal_request.json \
  -s > /tmp/portal_sale_response.json

# Check if response is valid JSON
if jq empty /tmp/portal_sale_response.json 2>/dev/null; then
  echo "✓ Valid JSON response received"

  # Check for success
  SUCCESS=$(cat /tmp/portal_sale_response.json | jq -r '.success // empty')
  if [ "$SUCCESS" = "false" ]; then
    echo "✗ API Error:"
    cat /tmp/portal_sale_response.json | jq '.message'
    exit 1
  fi

  # Get first listing
  echo -e "\nFirst sale listing structure:"
  cat /tmp/portal_sale_response.json | jq '.[0] | keys' | head -50

  # Save full response
  cat /tmp/portal_sale_response.json | jq '.[0]' > /tmp/portal_sale_listing.json
  echo "✓ Saved to /tmp/portal_sale_listing.json"
else
  echo "✗ Invalid JSON response (might be HTML error)"
  head -20 /tmp/portal_sale_response.json
  exit 1
fi

# Test 2: Get listings (rental)
echo -e "\n2. Testing get-listings (rental properties)..."
cat > /tmp/portal_request.json << EOF
{
  "api_key": "$API_KEY",
  "search": "1",
  "transaction_type": "let",
  "page": "1"
}
EOF

curl -X POST "$PORTAL_URL/api/get-listings" \
  -H "Content-Type: application/json" \
  --data @/tmp/portal_request.json \
  -s | jq '.[0]' > /tmp/portal_rental_listing.json

echo "✓ Saved to /tmp/portal_rental_listing.json"

# Test 3: Check for specific fields
echo -e "\n3. Checking field availability..."

echo "Basic fields:"
cat /tmp/portal_rental_listing.json | jq '{
  id,
  summary,
  price,
  bedrooms,
  bathrooms,
  propertyType,
  transactionType
}'

echo -e "\nFlag objects:"
echo "residentialFlags:"
cat /tmp/portal_rental_listing.json | jq '.residentialFlags // "NOT FOUND"'

echo -e "\nrentalFlags:"
cat /tmp/portal_rental_listing.json | jq '.rentalFlags // "NOT FOUND"'

echo -e "\nadditionalFeatures:"
cat /tmp/portal_rental_listing.json | jq '.additionalFeatures // "NOT FOUND"'

echo -e "\nrentFrequency:"
cat /tmp/portal_rental_listing.json | jq '.rentFrequency // "NOT FOUND"'

echo -e "\n================================"
echo "Test complete!"
echo -e "\nFiles created:"
echo "  - /tmp/portal_sale_listing.json (full sale listing)"
echo "  - /tmp/portal_rental_listing.json (full rental listing)"
echo -e "\nCheck these files for complete field structure."

# Test 4: Field comparison
echo -e "\n4. Available top-level fields:"
cat /tmp/portal_rental_listing.json | jq 'keys' | grep -E "(flags|Features|features)" || echo "No flag-related fields found at top level"

# Test 5: Check for specific fields we need
echo -e "\n5. Critical fields check:"
cat /tmp/portal_rental_listing.json | jq '{
  hasImages: (.images | length > 0),
  hasCoordinates: (.latitude != null and .longitude != null),
  hasAdditionalFeatures: (.additionalFeatures != null),
  hasRentalFlags: (.rentalFlags != null),
  rentFrequencyValue: .rentFrequency,
  displayPriceValue: .displayPrice
}'
```

Make it executable:
```bash
chmod +x test-portal-api.sh
```

### Run Test

```bash
./test-portal-api.sh https://portals-5ab21b55.apex27.co.uk fe85bdfa8dba634650b91300f96b7567
```

---

## Step 3: Document Your Findings

### Create Results Document

After testing, create `APEX27_API_TEST_RESULTS.md`:

```markdown
# Apex27 API Test Results

**Date**: [Test date]
**Portal URL**: https://portals-xxxxx.apex27.co.uk
**API Type**: Portal API

## Fields Available in Portal API

### Sale Listing Test

Tested with: [listing ID or first result]

**Top-level fields returned**:
- [ ] id
- [ ] summary / title
- [ ] description
- [ ] price
- [ ] bedrooms
- [ ] bathrooms
- [ ] propertyType
- [ ] address fields (address1, city, postalCode, etc.)
- [ ] latitude / longitude
- [ ] images array
- [ ] floorplans array
- [ ] virtualTours array

**Flag Objects** (boolean fields):
- [ ] residentialFlags object - YES / NO
  - If YES: What fields does it contain?
  - If NO: Continue below

- [ ] rentalFlags object - YES / NO
  - If YES: What fields does it contain?
  - If NO: Continue below

- [ ] saleFlags object - YES / NO

**Alternative Field Structures**:
- [ ] additionalFeatures array - YES / NO
  - If YES: Example values found:
  - [ ] "Student Property"
  - [ ] "Has Washing Machine"
  - [ ] "Parking - Off Street"
  - [ ] Other: ___________

- [ ] bullets array - YES / NO
  - If YES: Contains property features as strings

### Rental Listing Test

**rentFrequency field**:
- [ ] Populated with value (M, W, PPPW, etc.)
- [ ] Returns NULL
- [ ] Field doesn't exist

If NULL, can we extract from displayPrice?
- displayPrice example: "£1,200 PCM"
- Extracted frequency: "M" (monthly)

## Conclusion

Based on testing:

**Option 1: Portal API is Sufficient with Extraction**
- [ ] Portal API has all core fields (id, price, address, images, coordinates)
- [ ] additionalFeatures array contains property features as strings
- [ ] rentalFlags/residentialFlags NOT returned
- [ ] We'll extract boolean flags from additionalFeatures strings
- [ ] We'll extract rentFrequency from displayPrice string
- ✅ Use Portal API ONLY with extraction patterns

**Option 2: Portal API Missing Critical Data**
- [ ] Portal API lacks important fields we need
- [ ] Need to request Standard API access for complete data
- ❌ Need both APIs OR need Standard API instead

**Option 3: Portal API Has Flag Objects**
- [ ] Portal API returns rentalFlags, residentialFlags objects
- [ ] All boolean fields available directly
- [ ] No extraction needed
- ✅ Use Portal API ONLY - simple integration
```

---

## Step 4: Integration Decision Matrix

### Decision Tree

```
Do you have Portal API access?
├─ YES
│  └─ Does Portal API return rentalFlags/residentialFlags objects?
│     ├─ YES → Use Portal API only (simple, direct boolean fields)
│     └─ NO → Does it return additionalFeatures array?
│        ├─ YES → Use Portal API with extraction (your research patterns)
│        └─ NO → Request Standard API access
│
└─ NO
   └─ Request Portal API or Standard API access from Apex27
```

### Based on Your Research

Your `APEX27-API-DOCUMENTATION.md` says:

> "The Portal API provides a subset of Apex27 CRM data optimized for public-facing websites. While it lacks some fields available in the Standard API, most critical information can be extracted from alternative fields like `additionalFeatures` and `displayPrice`."

This strongly suggests:
- ✅ Portal API is what you have access to
- ✅ Portal API uses `additionalFeatures` array (not flag objects)
- ✅ Extraction patterns are needed
- ✅ Your research already documents these patterns!

---

## Recommended Implementation (High Confidence)

### Based on Your Research + Industry Patterns

**Most Likely Scenario**: Portal API with Feature Extraction

```typescript
// Portal API Client
export class Apex27PortalClient {
  private portalUrl: string;
  private apiKey: string;

  constructor(portalUrl: string, apiKey: string) {
    this.portalUrl = portalUrl;
    this.apiKey = apiKey;
  }

  async getListings(params: {
    transaction_type?: 'sale' | 'let';
    page?: number;
  } = {}) {
    const response = await fetch(`${this.portalUrl}/api/get-listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        search: '1',
        page: String(params.page || 1),
        transaction_type: params.transaction_type,
      }),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for error response
    if (data.success === false) {
      throw new Error(`Portal API error: ${data.message}`);
    }

    return data; // Array of listings
  }

  async getListing(listingId: number) {
    const response = await fetch(`${this.portalUrl}/api/get-listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        listing_id: listingId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    return response.json();
  }
}

// Field extractor (from your research)
export class PortalFieldExtractor {
  /**
   * Extract boolean flags from additionalFeatures array
   */
  static extractFlags(listing: any) {
    const features = listing.additionalFeatures || [];

    return {
      isStudentProperty: features.includes('Student Property'),
      isSharedAccommodation: features.includes('Shared Accommodation'),
      hasWashingMachine: features.includes('Has Washing Machine'),
      hasDishwasher: features.includes('Has Dishwasher'),
      hasBasement: features.includes('Has Basement'),
      hasConservatory: features.includes('Has Conservatory'),
      hasDoubleGlazing: features.includes('Has Double Glazing'),
      petsAllowed: features.includes('Pets Allowed'),
    };
  }

  /**
   * Extract rent frequency from displayPrice string
   */
  static extractRentFrequency(displayPrice: string): string | null {
    if (!displayPrice) return null;

    const priceUpper = displayPrice.toUpperCase();

    if (priceUpper.includes('PPPW')) return 'PPPW'; // Per Person Per Week
    if (priceUpper.includes('PCM') || priceUpper.includes('PM')) return 'M'; // Monthly
    if (priceUpper.includes('PW')) return 'W'; // Weekly
    if (priceUpper.includes('PA')) return 'A'; // Annually

    return null;
  }

  /**
   * Extract parking type from additionalFeatures
   */
  static extractParkingType(features: string[]): string | null {
    for (const feature of features) {
      if (feature.includes('Parking')) {
        if (feature.includes('On Street')) return 'on_street';
        if (feature.includes('Off Street')) return 'off_street';
        if (feature.includes('Garage')) return 'garage';
        if (feature.includes('Driveway')) return 'driveway';
      }
    }
    return null;
  }
}
```

---

## Step 5: Request Standard API Access (If Needed)

### Email to Apex27 Support

```
Subject: Request for Standard API Access

Hi [Account Manager Name / Apex27 Support],

We currently have Portal API access for our account (portal URL: https://portals-xxxxx.apex27.co.uk).

We're building an agent microsite network that requires comprehensive property data including detailed property flags (isStudentProperty, petsAllowed, hasWashingMachine, etc.).

Questions:
1. Do we have access to the Standard API (https://api.apex27.co.uk) in addition to Portal API?

2. If not, can we request Standard API access? Our use case:
   - Property synchronization for 16-1,000 agent microsites
   - Polling every 15 minutes using minDtsUpdated parameter
   - Need full property data including flag objects
   - Expected usage: 1-10 API calls every 15 minutes

3. If we only have Portal API access:
   - Does the Portal API response include residentialFlags, rentalFlags, saleFlags objects?
   - If not, should we extract this data from the additionalFeatures array as documented?
   - Is rentFrequency field populated, or should we extract from displayPrice?

Please advise on the best API for our use case.

Thank you!
```

---

## Recommended Approach (Based on Available Info)

### Start with Portal API (What You Have)

**Assumption**: Portal API is what Apex27 provides by default

**Strategy**: Use Portal API with extraction patterns from your research

### Implementation Plan

1. **Use Portal API Client**
   - POST to `/api/get-listings`
   - API key in request body
   - Fetch listings with pagination

2. **Extract Features from additionalFeatures Array**
   ```typescript
   const flags = PortalFieldExtractor.extractFlags(listing);
   const rentFreq = PortalFieldExtractor.extractRentFrequency(listing.displayPrice);
   ```

3. **Store Full Feature Array**
   ```typescript
   features: [
     ...(listing.bullets || []),
     ...(listing.additionalFeatures || []),
   ]
   ```

4. **Map to Database Schema**
   ```typescript
   const propertyData = {
     apex27_id: String(listing.id),
     // ... basic fields
     features: extractedFeatures,
     // Store extracted flags in metadata or separate fields if needed
     raw_data: listing, // Keep full response for debugging
   };
   ```

---

## Quick Answer to Your Question

**"Do we need both APIs?"**

### Current Assessment

**Most Likely Scenario** (Based on your statement "they always provide portal URL"):
- You have **Portal API access** by default
- You MAY NOT have **Standard API access** without requesting it
- Portal API is probably sufficient with feature extraction

**Recommendation**:
1. **Test Portal API first** (once you get valid credentials)
2. **If it has `additionalFeatures` array** → Use Portal API only with extraction
3. **Only request Standard API if** Portal API is missing critical data

### Why Portal API is Probably Sufficient

From your research:
> "The Portal API provides a subset of Apex27 CRM data optimized for public-facing websites. While it lacks some fields available in the Standard API, **most critical information can be extracted from alternative fields like additionalFeatures and displayPrice**."

This suggests:
- ✅ Portal API has all essential property data
- ✅ Feature flags available via string extraction
- ✅ Your research already documents the extraction patterns
- ✅ You've successfully used this approach before

---

## Action Plan

### Immediate Actions

1. **Get Valid Portal API Credentials**
   - Check Apex27 CRM settings
   - Or request from account manager
   - Verify portal URL and API key are current

2. **Run Test Script**
   - Use the `test-portal-api.sh` script above
   - Document what fields are returned
   - Save example responses

3. **Share Test Results**
   - Send me the output of the test script
   - Or share the JSON files: `/tmp/portal_sale_listing.json`, `/tmp/portal_rental_listing.json`

### Based on Test Results

**If Portal API has `additionalFeatures`**:
- ✅ Use Portal API only
- ✅ Implement extraction patterns (I'll provide code)
- ✅ No need for Standard API

**If Portal API is missing critical fields**:
- Request Standard API access
- Test Standard API
- Compare both APIs
- Implement best strategy (likely dual API)

---

## My Recommendation Right Now

**Based on your research and the fact that "they always provide portal URL"**:

1. **Get valid Portal API credentials** (current ones are invalid)
2. **Test Portal API** with the script above
3. **Portal API will likely be sufficient** using extraction patterns
4. **Only request Standard API** if Portal test shows missing data

**Confidence**: 85% that Portal API + extraction is the right approach

**Why?** Your research doc exists because you've already dealt with Portal API limitations and documented solutions. This suggests Portal API is what you normally work with and have made it work successfully.

---

## Next Steps

1. **You**: Get current valid Portal API credentials from Apex27
2. **You**: Run test script and share results
3. **Me**: Based on actual test data, I'll:
   - Confirm if Portal API alone is sufficient
   - Provide exact field mapping code
   - Update integration guide with real examples
   - Update Phase 4 implementation tasks

Once we see actual API responses, we'll have 100% clarity on the integration approach! 🎯