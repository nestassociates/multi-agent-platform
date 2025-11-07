import { test, expect, type APIRequestContext } from '@playwright/test';
import type { Apex27Listing, Apex27WebhookPayload } from '../../apps/dashboard/lib/apex27/types';

/**
 * Integration Test: Apex27 Webhook Handler
 * Tests: T099 - Integration test for Apex27 webhook (no signature validation - per James)
 *
 * Verifies webhook processing WITHOUT signature validation
 * Tests all three webhook actions: create, update, delete
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
 * Helper: Create mock Apex27 listing data
 */
function createMockListing(overrides: Partial<Apex27Listing> = {}): Apex27Listing {
  return {
    id: Date.now(),
    externalId: null,
    branch: {
      id: 1962,
      name: 'Test Branch',
      code: 'TB01',
      address1: '123 Office Street',
      address2: null,
      city: 'London',
      county: 'Greater London',
      postalCode: 'EC1A 1BB',
      country: 'United Kingdom',
      phone: '020 7123 4567',
      fax: null,
      email: 'test@branch.com',
      hasSales: true,
      hasLettings: true,
      hasNewHomes: false,
      hasLand: false,
      hasAuctions: false,
      hasParkHomes: false,
      hasCommercialSales: false,
      hasCommercialLettings: false,
      dtsUpdated: new Date().toISOString(),
      updateMd5Hash: 'hash123',
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
      updateMd5Hash: 'hash456',
    },
    archived: false,
    reference: 'TEST001',
    fullReference: 'TB01-TEST001',
    address1: '123 Test Street',
    address2: null,
    address3: null,
    address4: null,
    city: 'London',
    county: 'Greater London',
    postalCode: 'SW1A 1AA',
    country: 'United Kingdom',
    displayAddress: '123 Test Street, London SW1A 1AA',
    locationType: 'residential',
    summary: 'Beautiful 3 bedroom house',
    printSummary: null,
    incomeDescription: null,
    description: 'A stunning property in the heart of London',
    customDescription1: null,
    customDescription2: null,
    customDescription3: null,
    customDescription4: null,
    customDescription5: null,
    customDescription6: null,
    bullets: ['Modern kitchen', 'Large garden', 'Off-street parking'],
    priceCurrency: 'GBP',
    price: '450000',
    pricePrefix: 'Offers in excess of',
    tenure: 'Freehold',
    rentFrequency: null,
    minimumTermMonths: null,
    transactionType: 'sale',
    status: 'Available',
    websiteStatus: 'Available',
    mainSearchRegionId: 1,
    saleProgression: null,
    propertyType: 'terraced',
    displayPropertyType: 'Terraced House',
    propertySubType: null,
    tenancyType: null,
    bedrooms: 3,
    bathrooms: 2,
    receptions: 2,
    ensuites: 1,
    toilets: 3,
    kitchens: 1,
    diningRooms: 1,
    garages: 0,
    parkingSpaces: 2,
    yearBuilt: 2010,
    condition: 'excellent',
    ageCategory: 'modern',
    furnished: 'unfurnished',
    commercialUseClasses: [],
    accessibilityFeatures: ['Step-free access'],
    heatingFeatures: ['Gas central heating'],
    parkingFeatures: ['Driveway', 'Garage'],
    outsideSpaceFeatures: ['Private garden'],
    waterSupplyFeatures: ['Mains water'],
    electricitySupplyFeatures: ['Mains electricity'],
    sewerageSupplyFeatures: ['Mains sewerage'],
    broadbandSupplyFeatures: ['Fibre'],
    floodSources: [],
    customFeatures: [],
    internalArea: 1200,
    internalAreaUnit: 'sqft',
    externalArea: 500,
    externalAreaUnit: 'sqft',
    floors: 2,
    entranceFloor: 0,
    floorNumber: null,
    levelsOccupied: 2,
    latitude: 51.5074,
    longitude: -0.1278,
    uprn: '100023336956',
    grossYield: null,
    totalIncomeText: null,
    featured: false,
    unlisted: false,
    rentService: null,
    saleFee: 0,
    saleFeeType: 0,
    saleFeePayableBy: 0,
    saleFeeNotes: null,
    councilTaxAmount: 1500,
    councilTaxBand: 'D',
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
    dateOfInstruction: new Date().toISOString(),
    dateAvailableFrom: null,
    feeType: null,
    lettingFees: null,
    epcExempt: false,
    epcEeCurrent: 75,
    epcEePotential: 85,
    epcEiCurrent: 70,
    epcEiPotential: 80,
    epcArCurrent: null,
    dtsEpcExpiry: '2030-01-01T00:00:00Z',
    epcReference: 'EPC123456',
    epcNotes: null,
    showPrice: true,
    exportable: true,
    matchable: true,
    dtsCreated: new Date().toISOString(),
    dtsUpdated: new Date().toISOString(),
    dtsWithdrawn: null,
    dtsArchived: null,
    dtsGoLive: new Date().toISOString(),
    dtsMarketed: new Date().toISOString(),
    dtsRemarketed: null,
    updateMd5Hash: 'hash789',
    flags: {
      hasElectricity: true,
      hasFibreOptic: true,
      hasGas: true,
      hasSatelliteCableTv: false,
      hasTelephone: true,
      hasWater: true,
      isAuction: false,
      isArticle4Area: false,
      isListed: false,
      hasRestrictions: false,
      hasRequiredAccess: false,
      hasRightsOfWay: false,
      hasFloodedInLastFiveYears: false,
      hasFloodDefenses: false,
    },
    residentialFlags: {
      hasAccessibilityFeatures: true,
      hasBasement: false,
      hasConservatory: false,
      hasDoubleGlazing: true,
      hasFireplace: true,
      hasGym: false,
      hasLoft: false,
      hasOutbuildings: true,
      hasPorterSecurity: false,
      hasSwimmingPool: false,
      hasTennisCourt: false,
      hasUtilityRoom: true,
      hasWaterfront: false,
      hasWoodFloors: true,
      isSharedAccommodation: false,
    },
    saleFlags: {
      isChainFree: true,
      isNewHome: false,
      isRepossession: false,
      isRetirement: false,
      hasEquityLoanIncentive: false,
      hasHelpToBuyIncentive: false,
      hasMiNewHomeIncentive: false,
      hasNewBuyIncentive: false,
      hasPartBuyPartRentIncentive: false,
      hasSharedEquityIncentive: false,
      hasSharedOwnershipIncentive: false,
      developmentOpportunity: false,
      investmentOpportunity: false,
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
    ...overrides,
  };
}

test.describe('Apex27 Webhook Handler - No Signature Validation', () => {
  test('should accept webhook without signature (per James @ Apex27)', async () => {
    const listing = createMockListing();
    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      // NO signature header - this is intentional per James's guidance
      data: payload,
    });

    // Should succeed without signature
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });

  test('should log webhook action and listing ID', async () => {
    const listing = createMockListing({ id: 999888 });
    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify response includes listing ID
    expect(data.listingId).toBe(999888);
  });

  test('should return 200 even on processing errors (prevents retries)', async () => {
    const invalidListing = createMockListing({
      // Invalid branch ID that won't match any agent
      branch: {
        ...createMockListing().branch,
        id: 999999, // Non-existent branch
      },
    });

    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing: invalidListing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    // Should still return 200 (prevents webhook retries)
    expect(response.status()).toBe(200);

    const data = await response.json();
    // But indicates property was skipped
    expect(data.success).toBe(true);
    expect(data.message).toContain('skipped');
  });

  test('should handle unknown webhook action gracefully', async () => {
    const listing = createMockListing();
    const payload = {
      action: 'unknown_action', // Invalid action
      listing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unknown action type');
  });

  test('should handle malformed webhook payload', async () => {
    const response = await apiContext.post('/api/webhooks/apex27', {
      data: {
        // Missing required fields
        action: 'create',
        // No listing property
      },
    });

    // Should return 200 with error to prevent retries
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });
});
