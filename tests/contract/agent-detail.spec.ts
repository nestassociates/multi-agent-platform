import { test, expect, type APIRequestContext } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * Contract Test: GET /api/admin/agents/[id]
 *
 * Validates API contract for retrieving a single agent's details
 */

let apiContext: APIRequestContext;
let adminCookie: string;
let testAgentId: string;

test.beforeAll(async ({ playwright, browser }) => {
  // Login as admin through browser to get session cookie
  const page = await browser.newPage();
  await page.goto('/login');
  await page.fill('[name="email"]', 'website@nestassociates.co.uk');
  await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/agents/);

  // Extract cookies
  const cookies = await page.context().cookies();
  adminCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  // Create a test agent for detail testing
  const email = generateTestEmail();
  const subdomain = generateTestSubdomain();

  await page.goto('/agents/new');
  await page.fill('[name="email"]', email);
  await page.fill('[name="first_name"]', 'Contract');
  await page.fill('[name="last_name"]', 'Detail');
  await page.fill('[name="subdomain"]', subdomain);
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.fill('[name="phone"]', '07700 900100');
  await page.fill('[name="bio"]', 'This is a test bio for contract testing.');
  await page.click('button[type="submit"]');

  // Wait and get the agent ID
  await page.waitForTimeout(2000);
  await page.goto('/agents');
  const viewButton = page.locator(`table tbody tr:has-text("Contract Detail") a:has-text("View")`).first();
  await viewButton.click();
  const url = page.url();
  testAgentId = url.split('/').pop() || '';

  await page.close();

  apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      Cookie: adminCookie,
    },
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test.describe('GET /api/admin/agents/[id] - Get Agent Detail', () => {
  test('should return agent with complete structure', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    const agent = json.data;

    // Verify top-level structure
    expect(agent).toHaveProperty('id');
    expect(agent).toHaveProperty('user_id');
    expect(agent).toHaveProperty('subdomain');
    expect(agent).toHaveProperty('status');
    expect(agent).toHaveProperty('created_at');
    expect(agent).toHaveProperty('bio');
    expect(agent).toHaveProperty('qualifications');
    expect(agent).toHaveProperty('social_media_links');
    expect(agent).toHaveProperty('apex27_branch_id');

    // Verify field types
    expect(typeof agent.id).toBe('string');
    expect(typeof agent.user_id).toBe('string');
    expect(typeof agent.subdomain).toBe('string');
    expect(typeof agent.status).toBe('string');
    expect(typeof agent.created_at).toBe('string');
  });

  test('should include profile information', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify profile nested object
    expect(agent).toHaveProperty('profile');
    expect(agent.profile).toHaveProperty('first_name');
    expect(agent.profile).toHaveProperty('last_name');
    expect(agent.profile).toHaveProperty('email');
    expect(agent.profile).toHaveProperty('phone');
    expect(agent.profile).toHaveProperty('avatar_url');
    expect(agent.profile).toHaveProperty('role');

    // Verify profile field types
    expect(typeof agent.profile.first_name).toBe('string');
    expect(typeof agent.profile.last_name).toBe('string');
    expect(typeof agent.profile.email).toBe('string');
    expect(agent.profile.role).toBe('agent');
  });

  test('should include content count', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify content_count is present
    expect(agent).toHaveProperty('content_count');
    expect(typeof agent.content_count).toBe('number');
    expect(agent.content_count).toBeGreaterThanOrEqual(0);
  });

  test('should include properties count', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify properties_count is present
    expect(agent).toHaveProperty('properties_count');
    expect(typeof agent.properties_count).toBe('number');
    expect(agent.properties_count).toBeGreaterThanOrEqual(0);
  });

  test('should include last build information', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify last_build is present (can be null if no builds yet)
    expect(agent).toHaveProperty('last_build');

    // If last_build exists, verify its structure
    if (agent.last_build) {
      expect(agent.last_build).toHaveProperty('status');
      expect(agent.last_build).toHaveProperty('created_at');
      expect(typeof agent.last_build.status).toBe('string');
      expect(typeof agent.last_build.created_at).toBe('string');
    }
  });

  test('should return 404 for non-existent agent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await apiContext.get(`/api/admin/agents/${fakeId}`);

    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('NOT_FOUND');
  });

  test('should return 400 for invalid UUID format', async () => {
    const response = await apiContext.get('/api/admin/agents/invalid-id');

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('INVALID_REQUEST');
  });

  test('should return 401 when not authenticated', async () => {
    // Create a new context without auth
    const unauthContext = await apiContext.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    });

    const response = await unauthContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('UNAUTHORIZED');

    await unauthContext.dispose();
  });

  test('should include bio text', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify bio is present and matches what we set
    expect(agent.bio).toBe('This is a test bio for contract testing.');
  });

  test('should handle qualifications array', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify qualifications is an array (can be empty)
    expect(Array.isArray(agent.qualifications)).toBeTruthy();
  });

  test('should handle social_media_links object', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify social_media_links is present (can be null or object)
    expect(agent).toHaveProperty('social_media_links');

    if (agent.social_media_links !== null) {
      expect(typeof agent.social_media_links).toBe('object');
    }
  });

  test('should validate status values', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Status should be one of the valid values
    expect(['active', 'inactive', 'suspended']).toContain(agent.status);
  });

  test('should include apex27_branch_id', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // apex27_branch_id can be null or string
    expect(agent).toHaveProperty('apex27_branch_id');

    if (agent.apex27_branch_id !== null) {
      expect(typeof agent.apex27_branch_id).toBe('string');
    }
  });

  test('should return correct agent by ID', async () => {
    const response = await apiContext.get(`/api/admin/agents/${testAgentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    const agent = json.data;

    // Verify the returned agent has the correct ID
    expect(agent.id).toBe(testAgentId);
    expect(agent.profile.first_name).toBe('Contract');
    expect(agent.profile.last_name).toBe('Detail');
  });
});
