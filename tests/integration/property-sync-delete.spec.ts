import { test, expect, type APIRequestContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Apex27Listing, Apex27WebhookPayload } from '../../apps/dashboard/lib/apex27/types';

/**
 * Integration Test: Property Delete Event
 * Tests: T102 - Integration test for property delete event
 *
 * Verifies that webhook delete events properly mark properties as sold/deleted
 * Note: We don't hard delete - we mark as "sold" status to preserve history
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
      subdomain: `test-agent-delete-${Date.now()}`,
      apex27_branch_id: '1962',
      bio: 'Test agent for delete webhook tests',
      status: 'active',
    })
    .select('id')
    .single();

  if (agentError || !agent) {
    throw new Error('Failed to create test agent');
  }

  testAgentId = agent.id;
});

test.afterAll(async () => {
  // Cleanup: Hard delete test property and agent
  if (testPropertyId) {
    await supabase.from('properties').delete().eq('id', testPropertyId);
  }

  if (testAgentId) {
    await supabase.from('agents').delete().eq('id', testAgentId);
  }

  await apiContext.dispose();
});

/**
 * Helper: Create test property for deletion
 */
async function createTestProperty() {
  testApex27Id = `${Date.now()}-DELETE`;

  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      agent_id: testAgentId,
      apex27_id: testApex27Id,
      transaction_type: 'sale',
      title: 'Property to Delete',
      description: 'This property will be deleted',
      price: 500000,
      bedrooms: 4,
      bathrooms: 3,
      property_type: 'detached',
      postcode: 'SW1A 1AA',
      status: 'available',
      is_featured: false,
      address: {
        line1: '1 Delete Street',
        city: 'London',
        postcode: 'SW1A 1AA',
      },
      raw_data: { test: true },
    })
    .select('id')
    .single();

  if (error || !property) {
    throw new Error('Failed to create test property for deletion');
  }

  testPropertyId = property.id;
}

/**
 * Helper: Create minimal listing for delete webhook
 */
function createDeleteListing(): Apex27Listing {
  return {
    id: parseInt(testApex27Id.split('-')[0]),
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
    archived: true,
    reference: 'DELETE001',
    fullReference: 'TB01-DELETE001',
    address1: '1 Delete Street',
    address2: null,
    address3: null,
    address4: null,
    city: 'London',
    county: 'Greater London',
    postalCode: 'SW1A 1AA',
    country: 'United Kingdom',
    displayAddress: '1 Delete Street, London SW1A 1AA',
    locationType: 'residential',
    summary: 'Deleted property',
    printSummary: null,
    incomeDescription: null,
    description: 'This property has been deleted',
    customDescription1: null,
    customDescription2: null,
    customDescription3: null,
    customDescription4: null,
    customDescription5: null,
    customDescription6: null,
    bullets: [],
    priceCurrency: 'GBP',
    price: '500000',
    pricePrefix: null,
    tenure: 'Freehold',
    rentFrequency: null,
    minimumTermMonths: null,
    transactionType: 'sale',
    status: 'Sold',
    websiteStatus: 'Sold',
    mainSearchRegionId: 1,
    saleProgression: 'Completed',
    propertyType: 'detached',
    displayPropertyType: 'Detached House',
    propertySubType: null,
    tenancyType: null,
    bedrooms: 4,
    bathrooms: 3,
    receptions: 2,
    ensuites: 2,
    toilets: 4,
    kitchens: 1,
    diningRooms: 1,
    garages: 2,
    parkingSpaces: 3,
    yearBuilt: 2000,
    condition: 'good',
    ageCategory: 'modern',
    furnished: 'unfurnished',
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
    internalArea: 2000,
    internalAreaUnit: 'sqft',
    externalArea: 1000,
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
    unlisted: true,
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
    dateOfInstruction: new Date().toISOString(),
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
    showPrice: false,
    exportable: false,
    matchable: false,
    dtsCreated: new Date().toISOString(),
    dtsUpdated: new Date().toISOString(),
    dtsWithdrawn: new Date().toISOString(),
    dtsArchived: new Date().toISOString(),
    dtsGoLive: null,
    dtsMarketed: null,
    dtsRemarketed: null,
    updateMd5Hash: 'hash-deleted',
    flags: {
      hasElectricity: true,
      hasFibreOptic: false,
      hasGas: true,
      hasSatelliteCableTv: false,
      hasTelephone: false,
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
      hasDoubleGlazing: false,
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
  };
}

test.describe('Property Delete Event', () => {
  test('should mark property as sold (soft delete)', async () => {
    // Create property to delete
    await createTestProperty();

    const listing = createDeleteListing();
    const payload: Apex27WebhookPayload = {
      action: 'delete',
      listing,
    };

    // Send delete webhook
    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(response.status()).toBe(200);
    const webhookData = await response.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toContain('deleted');

    // Verify property still exists but marked as sold
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', testPropertyId)
      .single();

    expect(property).toBeDefined();
    expect(property!.status).toBe('sold');
  });

  test('should preserve all property data after soft delete', async () => {
    // Create property to delete
    await createTestProperty();

    const listing = createDeleteListing();
    const payload: Apex27WebhookPayload = {
      action: 'delete',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify all original data preserved
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', testPropertyId)
      .single();

    expect(property!.title).toBe('Property to Delete');
    expect(property!.price).toBe(500000);
    expect(property!.bedrooms).toBe(4);
    expect(property!.bathrooms).toBe(3);
    expect(property!.agent_id).toBe(testAgentId);
  });

  test('should update updated_at timestamp on delete', async () => {
    // Create property to delete
    await createTestProperty();

    // Get initial timestamp
    const { data: beforeDelete } = await supabase
      .from('properties')
      .select('updated_at')
      .eq('id', testPropertyId)
      .single();

    const initialTimestamp = beforeDelete!.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const listing = createDeleteListing();
    const payload: Apex27WebhookPayload = {
      action: 'delete',
      listing,
    };

    await apiContext.post('/api/webhooks/apex27', { data: payload });

    // Verify timestamp updated
    const { data: afterDelete } = await supabase
      .from('properties')
      .select('updated_at')
      .eq('id', testPropertyId)
      .single();

    expect(afterDelete!.updated_at).not.toBe(initialTimestamp);
  });

  test('should handle delete for non-existent property gracefully', async () => {
    const listing = createDeleteListing();
    // Use non-existent apex27_id
    listing.id = 999999999;

    const payload: Apex27WebhookPayload = {
      action: 'delete',
      listing,
    };

    const response = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    // Should still return success (idempotent)
    expect(response.status()).toBe(200);
    const webhookData = await response.json();
    expect(webhookData.success).toBe(true);
  });

  test('should allow multiple delete webhooks for same property (idempotent)', async () => {
    // Create property to delete
    await createTestProperty();

    const listing = createDeleteListing();
    const payload: Apex27WebhookPayload = {
      action: 'delete',
      listing,
    };

    // Send delete webhook twice
    const firstResponse = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    expect(firstResponse.status()).toBe(200);

    const secondResponse = await apiContext.post('/api/webhooks/apex27', {
      data: payload,
    });

    // Second delete should also succeed (idempotent)
    expect(secondResponse.status()).toBe(200);

    // Verify property still in sold state
    const { data: property } = await supabase
      .from('properties')
      .select('status')
      .eq('id', testPropertyId)
      .single();

    expect(property!.status).toBe('sold');
  });
});
