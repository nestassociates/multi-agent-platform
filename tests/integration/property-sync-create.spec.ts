import { test, expect, type APIRequestContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Apex27Listing, Apex27WebhookPayload } from '../../apps/dashboard/lib/apex27/types';

/**
 * Integration Test: Property Create Event
 * Tests: T100 - Integration test for property create event
 *
 * Verifies that webhook create events properly insert properties into database
 */

let apiContext: APIRequestContext;
let supabase: ReturnType<typeof createClient>;
let testAgentId: string;
let createdPropertyIds: string[] = [];

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  });

  // Initialize Supabase client for direct database verification
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create a test agent with known branch ID
  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Mock user ID
      subdomain: `test-agent-${Date.now()}`,
      apex27_branch_id: '1962',
      bio: 'Test agent for webhook integration tests',
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !agent) {
    throw new Error('Failed to create test agent');
  }

  testAgentId = agent.id;
});

test.afterAll(async () => {
  // Cleanup: Delete created properties
  if (createdPropertyIds.length > 0) {
    await supabase
      .from('properties')
      .delete()
      .in('id', createdPropertyIds);
  }

  // Cleanup: Delete test agent
  if (testAgentId) {
    await supabase
      .from('agents')
      .delete()
      .eq('id', testAgentId);
  }

  await apiContext.dispose();
});

/**
 * Helper: Create mock listing
 */
function createMockListing(overrides: Partial<Apex27Listing> = {}): Apex27Listing {
  const baseId = Date.now() + Math.floor(Math.random() * 1000);

  return {
    id: baseId,
    externalId: null,
    branch: {
      id: 1962, // Matches test agent's apex27_branch_id
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
    reference: `TEST${baseId}`,
    fullReference: `TB01-TEST${baseId}`,
    address1: `${baseId} Test Street`,
    address2: null,
    address3: null,
    address4: null,
    city: 'London',
    county: 'Greater London',
    postalCode: 'SW1A 1AA',
    country: 'United Kingdom',
    displayAddress: `${baseId} Test Street, London SW1A 1AA`,
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
    bullets: ['Modern kitchen', 'Large garden'],
    priceCurrency: 'GBP',
    price: '450000',
    pricePrefix: null,
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
    accessibilityFeatures: [],
    heatingFeatures: ['Gas central heating'],
    parkingFeatures: ['Driveway'],
    outsideSpaceFeatures: ['Private garden'],
    waterSupplyFeatures: [],
    electricitySupplyFeatures: [],
    sewerageSupplyFeatures: [],
    broadbandSupplyFeatures: [],
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
      hasAccessibilityFeatures: false,
      hasBasement: false,
      hasConservatory: false,
      hasDoubleGlazing: true,
      hasFireplace: false,
      hasGym: false,
      hasLoft: false,
      hasOutbuildings: false,
      hasPorterSecurity: false,
      hasSwimmingPool: false,
      hasTennisCourt: false,
      hasUtilityRoom: false,
      hasWaterfront: false,
      hasWoodFloors: false,
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

test.describe('Property Create Event', () => {
  test('should create new property from webhook', async () => {
    const listing = createMockListing();
    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing,
    };

    // Send webhook
    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const webhookData = await response.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toContain('created');

    // Verify property was created in database
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('apex27_id', listing.id.toString())
      .eq('agent_id', testAgentId)
      .single();

    expect(error).toBeNull();
    expect(property).toBeDefined();
    expect(property!.title).toBe(listing.displayAddress);
    expect(property!.price).toBe(parseFloat(listing.price));
    expect(property!.bedrooms).toBe(listing.bedrooms);
    expect(property!.bathrooms).toBe(listing.bathrooms);
    expect(property!.transaction_type).toBe('sale');
    expect(property!.status).toBe('available');

    // Store for cleanup
    createdPropertyIds.push(property!.id);
  });

  test('should map Apex27 fields correctly', async () => {
    const listing = createMockListing({
      transactionType: 'rental',
      status: 'Available',
      price: '2500',
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'flat',
    });

    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify field mapping
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('apex27_id', listing.id.toString())
      .single();

    expect(property!.transaction_type).toBe('let'); // 'rental' -> 'let'
    expect(property!.price).toBe(2500);
    expect(property!.bedrooms).toBe(2);
    expect(property!.bathrooms).toBe(1);
    expect(property!.property_type).toBe('flat');

    createdPropertyIds.push(property!.id);
  });

  test('should create PostGIS location point from coordinates', async () => {
    const listing = createMockListing({
      latitude: 51.5074,
      longitude: -0.1278,
    });

    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify PostGIS point was created
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('apex27_id', listing.id.toString())
      .single();

    expect(property!.location).toBeDefined();
    // PostGIS stores as WKT: POINT(longitude latitude)
    // We can't easily verify the exact format, but it should exist

    createdPropertyIds.push(property!.id);
  });

  test('should skip property if no matching agent for branch', async () => {
    const listing = createMockListing({
      branch: {
        ...createMockListing().branch,
        id: 999999, // Non-existent branch
      },
    });

    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const webhookData = await response.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toContain('skipped');

    // Verify property was NOT created
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('apex27_id', listing.id.toString())
      .single();

    expect(property).toBeNull();
  });

  test('should store full Apex27 response in raw_data field', async () => {
    const listing = createMockListing();
    const payload: Apex27WebhookPayload = {
      action: 'create',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify raw_data contains full listing
    const { data: property } = await supabase
      .from('properties')
      .select('raw_data')
      .eq('apex27_id', listing.id.toString())
      .single();

    expect(property!.raw_data).toBeDefined();
    expect(property!.raw_data.id).toBe(listing.id);
    expect(property!.raw_data.reference).toBe(listing.reference);

    // Cleanup
    const { data: fullProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('apex27_id', listing.id.toString())
      .single();

    if (fullProperty) {
      createdPropertyIds.push(fullProperty.id);
    }
  });
});
