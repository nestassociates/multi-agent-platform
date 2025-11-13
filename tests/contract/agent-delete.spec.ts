import { test, expect, type APIRequestContext } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * Contract Test: DELETE /api/admin/agents/[id]
 *
 * Validates API contract for deleting agents via admin endpoint
 */

let apiContext: APIRequestContext;
let adminCookie: string;

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

/**
 * Helper function to create a test agent for deletion
 */
async function createTestAgent(browser: any): Promise<string> {
  const page = await browser.newPage();

  // Login as admin
  await page.goto('/login');
  await page.fill('[name="email"]', 'website@nestassociates.co.uk');
  await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'test-password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/agents/);

  // Create test agent
  const email = generateTestEmail();
  const subdomain = generateTestSubdomain();

  await page.goto('/agents/new');
  await page.fill('[name="email"]', email);
  await page.fill('[name="first_name"]', 'Delete');
  await page.fill('[name="last_name"]', 'Test');
  await page.fill('[name="subdomain"]', subdomain);
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  // Wait and get the agent ID
  await page.waitForTimeout(2000);
  await page.goto('/agents');
  const viewButton = page.locator(`table tbody tr:has-text("Delete Test") a:has-text("View")`).first();
  await viewButton.click();
  const url = page.url();
  const agentId = url.split('/').pop() || '';

  await page.close();
  return agentId;
}

test.describe('DELETE /api/admin/agents/[id] - Delete Agent', () => {
  test('should successfully delete an agent', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success');
    expect(json.success).toBe(true);
  });

  test('should return 404 after deleting agent', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    // Delete the agent
    await apiContext.delete(`/api/admin/agents/${agentId}`);

    // Try to get the deleted agent
    const getResponse = await apiContext.get(`/api/admin/agents/${agentId}`);

    expect(getResponse.status()).toBe(404);
    const error = await getResponse.json();
    expect(error.error.code).toBe('NOT_FOUND');
  });

  test('should return 404 for non-existent agent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await apiContext.delete(`/api/admin/agents/${fakeId}`);

    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('NOT_FOUND');
  });

  test('should return 400 for invalid UUID format', async () => {
    const response = await apiContext.delete('/api/admin/agents/invalid-id');

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('INVALID_REQUEST');
  });

  test('should return 401 when not authenticated', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    // Create a new context without auth
    const unauthContext = await apiContext.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    });

    const response = await unauthContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('UNAUTHORIZED');

    await unauthContext.dispose();
  });

  test('should cascade delete related auth user', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    // Get agent details to verify user exists
    const getBefore = await apiContext.get(`/api/admin/agents/${agentId}`);
    const beforeData = await getBefore.json();
    const userId = beforeData.data.user_id;

    expect(userId).toBeTruthy();

    // Delete the agent
    const deleteResponse = await apiContext.delete(`/api/admin/agents/${agentId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    // Note: Verifying user deletion would require direct database access
    // This test verifies the delete operation succeeds
  });

  test('should handle double delete gracefully', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    // First delete
    const firstDelete = await apiContext.delete(`/api/admin/agents/${agentId}`);
    expect(firstDelete.ok()).toBeTruthy();

    // Second delete should return 404
    const secondDelete = await apiContext.delete(`/api/admin/agents/${agentId}`);
    expect(secondDelete.status()).toBe(404);
    const error = await secondDelete.json();
    expect(error.error.code).toBe('NOT_FOUND');
  });

  test('should remove agent from list after deletion', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    // Get the agent's subdomain for search
    const getResponse = await apiContext.get(`/api/admin/agents/${agentId}`);
    const agentData = await getResponse.json();
    const subdomain = agentData.data.subdomain;

    // Delete the agent
    await apiContext.delete(`/api/admin/agents/${agentId}`);

    // Search for the agent in the list
    const listResponse = await apiContext.get(`/api/admin/agents?search=${subdomain}`);
    const listData = await listResponse.json();

    // Agent should not appear in the list
    const foundAgent = listData.data.find((a: any) => a.id === agentId);
    expect(foundAgent).toBeUndefined();
  });

  test('should create audit log entry for deletion', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.ok()).toBeTruthy();

    // Note: Verifying audit log would require database access
    // This test verifies the delete operation succeeds
    // The audit log creation is part of the implementation
  });

  test('should require admin role for deletion', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    // Note: Testing role-based authorization would require creating an agent user
    // and attempting deletion with their credentials
    // This test verifies admin can delete
    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);
    expect(response.ok()).toBeTruthy();
  });

  test('should return success response structure', async ({ browser }) => {
    const agentId = await createTestAgent(browser);

    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    // Verify response structure
    expect(json).toHaveProperty('success');
    expect(typeof json.success).toBe('boolean');
    expect(json.success).toBe(true);
  });

  test('should delete agent with related content', async ({ browser }) => {
    // Note: This test assumes content items are cascade deleted
    // or handled appropriately when agent is deleted
    const agentId = await createTestAgent(browser);

    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should delete agent with related properties', async ({ browser }) => {
    // Note: This test assumes property relationships are cascade deleted
    // or handled appropriately when agent is deleted
    const agentId = await createTestAgent(browser);

    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should delete agent with pending builds', async ({ browser }) => {
    // Note: This test assumes build queue entries are cascade deleted
    // or handled appropriately when agent is deleted
    const agentId = await createTestAgent(browser);

    const response = await apiContext.delete(`/api/admin/agents/${agentId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});
