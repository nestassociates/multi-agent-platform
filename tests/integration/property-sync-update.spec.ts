import { test, expect, type APIRequestContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Apex27Listing, Apex27WebhookPayload } from '../../apps/dashboard/lib/apex27/types';

/**
 * Integration Test: Property Update Event
 * Tests: T101 - Integration test for property update event
 *
 * Verifies that webhook update events properly modify existing properties
 */

let apiContext: APIRequestContext;
let supabase: ReturnType<typeof createClient>;
let testAgentId: string;
let testPropertyId: string;
let testApex27Id: string;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  });

  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create test agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      subdomain: `test-agent-update-${Date.now()}`,
      apex27_branch_id: '1962',
      bio: 'Test agent for update webhook tests',
      status: 'active',
    })
    .select('id')
    .single();

  if (agentError || !agent) {
    throw new Error('Failed to create test agent');
  }

  testAgentId = agent.id;

  // Create initial property for update tests
  testApex27Id = `${Date.now()}-UPDATE`;

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert({
      agent_id: testAgentId,
      apex27_id: testApex27Id,
      transaction_type: 'sale',
      title: 'Original Title',
      description: 'Original Description',
      price: 300000,
      bedrooms: 2,
      bathrooms: 1,
      property_type: 'flat',
      postcode: 'SW1A 1AA',
      status: 'available',
      is_featured: false,
      address: {
        line1: '1 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
      },
      raw_data: { original: true },
    })
    .select('id')
    .single();

  if (propertyError || !property) {
    throw new Error('Failed to create test property');
  }

  testPropertyId = property.id;
});

test.afterAll(async () => {
  // Cleanup
  if (testPropertyId) {
    await supabase.from('properties').delete().eq('id', testPropertyId);
  }

  if (testAgentId) {
    await supabase.from('agents').delete().eq('id', testAgentId);
  }

  await apiContext.dispose();
});

/**
 * Helper: Create mock listing for updates
 */
function createUpdateListing(overrides: Partial<Apex27Listing> = {}): Apex27Listing {
  return {
    id: parseInt(testApex27Id.split('-')[0]), // Use numeric part of testApex27Id
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
    reference: 'UPDATE001',
    fullReference: 'TB01-UPDATE001',
    address1: '1 Updated Street',
    address2: null,
    address3: null,
    address4: null,
    city: 'London',
    county: 'Greater London',
    postalCode: 'SW1A 2BB',
    country: 'United Kingdom',
    displayAddress: '1 Updated Street, London SW1A 2BB',
    locationType: 'residential',
    summary: 'Updated summary',
    printSummary: null,
    incomeDescription: null,
    description: 'Updated description of the property',
    customDescription1: null,
    customDescription2: null,
    customDescription3: null,
    customDescription4: null,
    customDescription5: null,
    customDescription6: null,
    bullets: ['Updated feature 1', 'Updated feature 2'],
    priceCurrency: 'GBP',
    price: '350000',
    pricePrefix: null,
    tenure: 'Freehold',
    rentFrequency: null,
    minimumTermMonths: null,
    transactionType: 'sale',
    status: 'Available',
    websiteStatus: 'Available',
    mainSearchRegionId: 1,
    saleProgression: null,
    propertyType: 'flat',
    displayPropertyType: 'Flat',
    propertySubType: null,
    tenancyType: null,
    bedrooms: 3,
    bathrooms: 2,
    receptions: 1,
    ensuites: 1,
    toilets: 2,
    kitchens: 1,
    diningRooms: 0,
    garages: 0,
    parkingSpaces: 1,
    yearBuilt: 2015,
    condition: 'excellent',
    ageCategory: 'modern',
    furnished: 'furnished',
    commercialUseClasses: [],
    accessibilityFeatures: [],
    heatingFeatures: ['Gas central heating'],
    parkingFeatures: ['Off-street parking'],
    outsideSpaceFeatures: [],
    waterSupplyFeatures: [],
    electricitySupplyFeatures: [],
    sewerageSupplyFeatures: [],
    broadbandSupplyFeatures: [],
    floodSources: [],
    customFeatures: [],
    internalArea: 950,
    internalAreaUnit: 'sqft',
    externalArea: 0,
    externalAreaUnit: 'sqft',
    floors: 1,
    entranceFloor: 2,
    floorNumber: 2,
    levelsOccupied: 1,
    latitude: 51.5074,
    longitude: -0.1278,
    uprn: null,
    grossYield: null,
    totalIncomeText: null,
    featured: true,
    unlisted: false,
    rentService: null,
    saleFee: 0,
    saleFeeType: 0,
    saleFeePayableBy: 0,
    saleFeeNotes: null,
    councilTaxAmount: 1800,
    councilTaxBand: 'E',
    domesticRatesAmount: null,
    serviceChargeAmount: 2000,
    serviceChargeDescription: 'Annual service charge',
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
    epcEeCurrent: 82,
    epcEePotential: 90,
    epcEiCurrent: 78,
    epcEiPotential: 85,
    epcArCurrent: null,
    dtsEpcExpiry: '2031-01-01T00:00:00Z',
    epcReference: 'EPC987654',
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
    updateMd5Hash: 'hash-updated',
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
      hasAccessibilityFeatures: false,
      hasBasement: false,
      hasConservatory: false,
      hasDoubleGlazing: true,
      hasFireplace: true,
      hasGym: false,
      hasLoft: false,
      hasOutbuildings: false,
      hasPorterSecurity: true,
      hasSwimmingPool: false,
      hasTennisCourt: false,
      hasUtilityRoom: false,
      hasWaterfront: false,
      hasWoodFloors: true,
      isSharedAccommodation: false,
    },
    saleFlags: {
      isChainFree: false,
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

test.describe('Property Update Event', () => {
  test('should update existing property from webhook', async () => {
    const listing = createUpdateListing();
    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    // Send update webhook
    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const webhookData = await response.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toContain('updated');

    // Verify property was updated
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', testPropertyId)
      .single();

    expect(property!.title).toBe(listing.displayAddress);
    expect(property!.description).toBe(listing.description);
    expect(property!.price).toBe(350000);
    expect(property!.bedrooms).toBe(3);
    expect(property!.bathrooms).toBe(2);
    expect(property!.is_featured).toBe(true);
  });

  test('should preserve agent_id during update', async () => {
    const listing = createUpdateListing();
    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify agent_id unchanged
    const { data: property } = await supabase
      .from('properties')
      .select('agent_id')
      .eq('id', testPropertyId)
      .single();

    expect(property!.agent_id).toBe(testAgentId);
  });

  test('should update raw_data with new listing data', async () => {
    const listing = createUpdateListing();
    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify raw_data updated
    const { data: property } = await supabase
      .from('properties')
      .select('raw_data')
      .eq('id', testPropertyId)
      .single();

    expect(property!.raw_data.reference).toBe(listing.reference);
    expect(property!.raw_data.updateMd5Hash).toBe('hash-updated');
  });

  test('should handle status changes from Available to Under Offer', async () => {
    const listing = createUpdateListing({
      status: 'Under Offer',
      saleProgression: 'SSTC',
    });

    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify status changed
    const { data: property } = await supabase
      .from('properties')
      .select('status')
      .eq('id', testPropertyId)
      .single();

    expect(property!.status).toBe('under_offer');
  });

  test('should handle price changes', async () => {
    const listing = createUpdateListing({
      price: '400000',
    });

    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify price updated
    const { data: property } = await supabase
      .from('properties')
      .select('price')
      .eq('id', testPropertyId)
      .single();

    expect(property!.price).toBe(400000);
  });

  test('should update PostGIS location if coordinates change', async () => {
    const listing = createUpdateListing({
      latitude: 51.5000,
      longitude: -0.2000,
    });

    const payload: Apex27WebhookPayload = {
      action: 'update',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify location updated (existence check)
    const { data: property } = await supabase
      .from('properties')
      .select('location')
      .eq('id', testPropertyId)
      .single();

    expect(property!.location).toBeDefined();
  });
});
