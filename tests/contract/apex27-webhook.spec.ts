import { test, expect, type APIRequestContext } from '@playwright/test';
import type { Apex27WebhookPayload } from '../../apps/dashboard/lib/apex27/types';

/**
 * Contract Test: POST /api/webhooks/apex27
 * Tests: T103 - Contract test for POST /api/webhooks/apex27
 *
 * Validates API contract for Apex27 webhook endpoint
 * - Request payload structure
 * - Response format
 * - HTTP status codes
 * - Error handling
 */

let apiContext: APIRequestContext;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

/**
 * Helper: Create minimal valid webhook payload
 */
function createMinimalPayload(
  action: 'create' | 'update' | 'delete' = 'create'
): Apex27WebhookPayload {
  return {
    action,
    listing: {
      id: Date.now(),
      externalId: null,
      branch: {
        id: 1962,
        name: 'Test Branch',
        code: 'TB01',
        address1: '123 Street',
        address2: null,
        city: 'London',
        county: 'London',
        postalCode: 'EC1A 1BB',
        country: 'UK',
        phone: '020 7123 4567',
        fax: null,
        email: 'test@test.com',
        hasSales: true,
        hasLettings: false,
        hasNewHomes: false,
        hasLand: false,
        hasAuctions: false,
        hasParkHomes: false,
        hasCommercialSales: false,
        hasCommercialLettings: false,
        dtsUpdated: new Date().toISOString(),
        updateMd5Hash: 'hash',
      },
      user: {
        id: 1,
        email: 'agent@test.com',
        title: 'Mr',
        firstName: 'Test',
        lastName: 'Agent',
        isActive: true,
        isCallRecordingsEnabled: false,
        isCallTranscriptionsEnabled: false,
        dtsUpdated: new Date().toISOString(),
        updateMd5Hash: 'hash',
      },
      archived: false,
      reference: 'TEST001',
      fullReference: 'TB01-TEST001',
      address1: '1 Test St',
      address2: null,
      address3: null,
      address4: null,
      city: 'London',
      county: 'London',
      postalCode: 'SW1A 1AA',
      country: 'UK',
      displayAddress: '1 Test St, London',
      locationType: null,
      summary: null,
      printSummary: null,
      incomeDescription: null,
      description: 'Test property',
      customDescription1: null,
      customDescription2: null,
      customDescription3: null,
      customDescription4: null,
      customDescription5: null,
      customDescription6: null,
      bullets: [],
      priceCurrency: 'GBP',
      price: '300000',
      pricePrefix: null,
      tenure: 'Freehold',
      rentFrequency: null,
      minimumTermMonths: null,
      transactionType: 'sale',
      status: 'Available',
      websiteStatus: null,
      mainSearchRegionId: null,
      saleProgression: null,
      propertyType: 'house',
      displayPropertyType: null,
      propertySubType: null,
      tenancyType: null,
      bedrooms: 3,
      bathrooms: 2,
      receptions: null,
      ensuites: null,
      toilets: null,
      kitchens: null,
      diningRooms: null,
      garages: null,
      parkingSpaces: null,
      yearBuilt: null,
      condition: null,
      ageCategory: null,
      furnished: null,
      commercialUseClasses: [],
      accessibilityFeatures: [],
      heatingFeatures: [],
      parkingFeatures: [],
      outsideSpaceFeatures: [],
      waterSupplyFeatures: [],
      electricitySupplyFeatures: [],
      sewerageSupplyFeatures: [],
      broadbandSupplyFeatures: [],
      floodSources: [],
      customFeatures: [],
      internalArea: null,
      internalAreaUnit: 'sqft',
      externalArea: null,
      externalAreaUnit: 'sqft',
      floors: null,
      entranceFloor: null,
      floorNumber: null,
      levelsOccupied: null,
      latitude: null,
      longitude: null,
      uprn: null,
      grossYield: null,
      totalIncomeText: null,
      featured: false,
      unlisted: false,
      rentService: null,
      saleFee: 0,
      saleFeeType: 0,
      saleFeePayableBy: 0,
      saleFeeNotes: null,
      councilTaxAmount: null,
      councilTaxBand: null,
      domesticRatesAmount: null,
      serviceChargeAmount: null,
      serviceChargeDescription: null,
      groundRentAmount: null,
      groundRentDescription: null,
      groundRentReviewPeriod: null,
      groundRentPercentageIncrease: null,
      insuranceDescription: null,
      termsOfBusiness: null,
      dateLeaseStart: null,
      leaseYearsRemaining: null,
      leaseDuration: null,
      dateOfInstruction: null,
      dateAvailableFrom: null,
      feeType: null,
      lettingFees: null,
      epcExempt: false,
      epcEeCurrent: null,
      epcEePotential: null,
      epcEiCurrent: null,
      epcEiPotential: null,
      epcArCurrent: null,
      dtsEpcExpiry: null,
      epcReference: null,
      epcNotes: null,
      showPrice: true,
      exportable: true,
      matchable: true,
      dtsCreated: new Date().toISOString(),
      dtsUpdated: new Date().toISOString(),
      dtsWithdrawn: null,
      dtsArchived: null,
      dtsGoLive: null,
      dtsMarketed: null,
      dtsRemarketed: null,
      updateMd5Hash: 'hash',
      flags: {
        hasElectricity: null,
        hasFibreOptic: null,
        hasGas: null,
        hasSatelliteCableTv: null,
        hasTelephone: null,
        hasWater: null,
        isAuction: null,
        isArticle4Area: null,
        isListed: null,
        hasRestrictions: null,
        hasRequiredAccess: null,
        hasRightsOfWay: null,
        hasFloodedInLastFiveYears: null,
        hasFloodDefenses: null,
      },
      residentialFlags: {
        hasAccessibilityFeatures: null,
        hasBasement: null,
        hasConservatory: null,
        hasDoubleGlazing: null,
        hasFireplace: null,
        hasGym: null,
        hasLoft: null,
        hasOutbuildings: null,
        hasPorterSecurity: null,
        hasSwimmingPool: null,
        hasTennisCourt: null,
        hasUtilityRoom: null,
        hasWaterfront: null,
        hasWoodFloors: null,
        isSharedAccommodation: null,
      },
      saleFlags: {
        isChainFree: null,
        isNewHome: null,
        isRepossession: null,
        isRetirement: null,
        hasEquityLoanIncentive: null,
        hasHelpToBuyIncentive: null,
        hasMiNewHomeIncentive: null,
        hasNewBuyIncentive: null,
        hasPartBuyPartRentIncentive: null,
        hasSharedEquityIncentive: null,
        hasSharedOwnershipIncentive: null,
        developmentOpportunity: null,
        investmentOpportunity: null,
      },
      rentalFlags: {
        petsAllowed: null,
        smokersConsidered: null,
        sharersConsidered: null,
        hasBurglarAlarm: null,
        hasWashingMachine: null,
        hasDishwasher: null,
        allBillsIncluded: null,
        waterBillIncluded: null,
        gasBillIncluded: null,
        electricityBillIncluded: null,
        oilBillIncluded: null,
        councilTaxIncluded: null,
        councilTaxExempt: null,
        tvLicenceIncluded: null,
        satelliteCableTvBillIncluded: null,
        internetBillIncluded: null,
        telephoneBillIncluded: null,
        isTenanted: null,
        isServiced: null,
        isStudentProperty: null,
      },
      commercialFlags: {
        businessForSale: null,
      },
      sale: null,
      upsellNames: [],
      matchingSearchRegions: [],
      metadata: [],
    },
  };
}

test.describe('POST /api/webhooks/apex27 - Contract Validation', () => {
  test('should accept valid create webhook payload', async () => {
    const payload = createMinimalPayload('create');

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('message');
    expect(data.success).toBe(true);
  });

  test('should accept valid update webhook payload', async () => {
    const payload = createMinimalPayload('update');

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('updated');
  });

  test('should accept valid delete webhook payload', async () => {
    const payload = createMinimalPayload('delete');

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted');
  });

  test('should return proper response structure on success', async () => {
    const payload = createMinimalPayload('create');

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    const data = await response.json();

    // Verify response contract
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('listingId');
    expect(typeof data.success).toBe('boolean');
    expect(typeof data.message).toBe('string');
    expect(typeof data.listingId).toBe('number');
  });

  test('should return 400 for unknown action type', async () => {
    const payload = {
      action: 'invalid_action',
      listing: createMinimalPayload().listing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unknown action type');
  });

  test('should return error structure for processing failures', async () => {
    const payload = {
      action: 'create',
      // Missing listing object
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    const data = await response.json();

    // Error response contract
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('error');
    expect(data.success).toBe(false);
    expect(typeof data.error).toBe('string');
  });

  test('should not require authentication (public webhook endpoint)', async () => {
    const payload = createMinimalPayload();

    // Request without any auth headers
    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    // Should succeed (no auth required)
    expect(response.status()).toBe(200);
  });

  test('should accept Content-Type application/json', async () => {
    const payload = createMinimalPayload();

    const response = await apiContext.post('/api/webhooks/apex27', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    expect(response.status()).toBe(200);
  });

  test('should handle missing required fields gracefully', async () => {
    const invalidPayload = {
      action: 'create',
      listing: {
        // Missing many required fields
        id: 12345,
        branch: { id: 1962 },
      },
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: invalidPayload,
    });

    // Should return 200 with error (prevents retries)
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('should return consistent timestamp format in responses', async () => {
    const payload = createMinimalPayload();

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    const data = await response.json();

    // Verify no timestamps in basic response
    // (timestamps only in property records, not webhook response)
    expect(data).not.toHaveProperty('timestamp');
    expect(data).not.toHaveProperty('created_at');
  });

  test('should support HTTP POST method only', async () => {
    const payload = createMinimalPayload();

    // Try GET (should fail)
    const getResponse = await apiContext.get('/api/webhooks/apex27');
    expect(getResponse.status()).toBe(405); // Method Not Allowed

    // POST should work
    const postResponse = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });
    expect(postResponse.status()).toBe(200);
  });

  test('should handle large payloads (full listing data)', async () => {
    const payload = createMinimalPayload();

    // Add large arrays to simulate real Apex27 payload
    payload.listing.bullets = Array(50)
      .fill(null)
      .map((_, i) => `Feature ${i + 1}`);
    payload.listing.heatingFeatures = Array(20)
      .fill(null)
      .map((_, i) => `Heating ${i + 1}`);

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should return proper error message for property without matching agent', async () => {
    const payload = createMinimalPayload();
    // Use non-existent branch ID
    payload.listing.branch.id = 999999;

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('skipped');
    expect(data).toHaveProperty('branchId', 999999);
  });
});
