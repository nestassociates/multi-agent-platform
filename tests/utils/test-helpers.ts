/**
 * Test Helper Utilities
 */

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random subdomain for testing
 */
export function generateTestSubdomain(): string {
  return `test-agent-${Date.now()}`;
}

/**
 * Wait for condition to be true (polling)
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 5000;
  const interval = options.interval || 100;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Create test property data
 */
export function createTestProperty(overrides: Partial<any> = {}) {
  return {
    apex27_id: `PROP-${Date.now()}`,
    transaction_type: 'sale',
    title: 'Test Property',
    description: 'A test property listing',
    price: 450000,
    bedrooms: 3,
    bathrooms: 2,
    property_type: 'terraced',
    address: {
      line1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
    postcode: 'SW1A 1AA',
    latitude: 51.5074,
    longitude: -0.1278,
    ...overrides,
  };
}

/**
 * Clean up test data (use in afterEach/afterAll)
 */
export async function cleanupTestData(supabase: any, tableName: string, ids: string[]) {
  if (ids.length === 0) return;

  await supabase
    .from(tableName)
    .delete()
    .in('id', ids);
}
