import { test, expect, type APIRequestContext } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * Contract Test: PATCH /api/admin/agents/[id]
 *
 * Validates API contract for updating agent details via admin endpoint
 */

let apiContext: APIRequestContext;
let adminCookie: string;
let testAgentId: string;
let testAgentEmail: string;
let testSubdomain: string;

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

  // Create a test agent for edit testing
  testAgentEmail = generateTestEmail();
  testSubdomain = generateTestSubdomain();

  await page.goto('/agents/new');
  await page.fill('[name="email"]', testAgentEmail);
  await page.fill('[name="first_name"]', 'Contract');
  await page.fill('[name="last_name"]', 'Edit');
  await page.fill('[name="subdomain"]', testSubdomain);
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.fill('[name="phone"]', '07700 900200');
  await page.fill('[name="bio"]', 'Original bio for editing.');
  await page.click('button[type="submit"]');

  // Wait and get the agent ID
  await page.waitForTimeout(2000);
  await page.goto('/agents');
  const viewButton = page.locator(`table tbody tr:has-text("Contract Edit") a:has-text("View")`).first();
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

test.describe('PATCH /api/admin/agents/[id] - Update Agent', () => {
  test('should update agent phone number', async () => {
    const newPhone = '07700 900201';
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        phone: newPhone,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    const agent = json.data;

    expect(agent.profile.phone).toBe(newPhone);
  });

  test('should update agent bio', async () => {
    const newBio = 'Updated bio text for contract test validation.';
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        bio: newBio,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    const agent = json.data;

    expect(agent.bio).toBe(newBio);
  });

  test('should update agent status', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        status: 'inactive',
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    const agent = json.data;

    expect(agent.status).toBe('inactive');

    // Reset to active
    await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: { status: 'active' },
    });
  });

  test('should update apex27_branch_id', async () => {
    const newBranchId = '8888';
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        apex27_branch_id: newBranchId,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    const agent = json.data;

    expect(agent.apex27_branch_id).toBe(newBranchId);
  });

  test('should reject email change attempts', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        email: 'newemail@example.com',
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('VALIDATION_ERROR');
    expect(error.error.message).toMatch(/email.*cannot be changed/i);
  });

  test('should reject subdomain change attempts', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        subdomain: 'newsubdomain',
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('VALIDATION_ERROR');
    expect(error.error.message).toMatch(/subdomain.*cannot be changed/i);
  });

  test('should reject bio longer than 500 characters', async () => {
    const longBio = 'x'.repeat(501);
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        bio: longBio,
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject invalid status values', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        status: 'invalid_status',
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('should handle multiple field updates in single request', async () => {
    const updates = {
      phone: '07700 900202',
      bio: 'Multi-field update test bio.',
      apex27_branch_id: '7777',
    };

    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: updates,
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    const agent = json.data;

    expect(agent.profile.phone).toBe(updates.phone);
    expect(agent.bio).toBe(updates.bio);
    expect(agent.apex27_branch_id).toBe(updates.apex27_branch_id);
  });

  test('should return 404 for non-existent agent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await apiContext.patch(`/api/admin/agents/${fakeId}`, {
      data: {
        phone: '07700 900999',
      },
    });

    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('NOT_FOUND');
  });

  test('should return 400 for invalid UUID format', async () => {
    const response = await apiContext.patch('/api/admin/agents/invalid-id', {
      data: {
        phone: '07700 900999',
      },
    });

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

    const response = await unauthContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        phone: '07700 900999',
      },
    });

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error.code).toBe('UNAUTHORIZED');

    await unauthContext.dispose();
  });

  test('should return updated agent data in response', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        phone: '07700 900203',
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    // Verify response structure
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('id');
    expect(json.data).toHaveProperty('profile');
    expect(json.data).toHaveProperty('bio');
    expect(json.data).toHaveProperty('status');
    expect(json.data).toHaveProperty('subdomain');
  });

  test('should trigger build queue when bio or status changes', async () => {
    // Update bio (should trigger build)
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        bio: 'Bio change should trigger rebuild.',
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Note: Actual build queue verification would require database access
    // This test just verifies the API returns success
  });

  test('should handle empty update request', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {},
    });

    // Should either succeed with no changes or return validation error
    expect([200, 400]).toContain(response.status());
  });

  test('should preserve unchanged fields', async () => {
    // Get current state
    const getResponse = await apiContext.get(`/api/admin/agents/${testAgentId}`);
    const beforeUpdate = await getResponse.json();
    const originalBio = beforeUpdate.data.bio;

    // Update only phone
    await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        phone: '07700 900204',
      },
    });

    // Get updated state
    const afterResponse = await apiContext.get(`/api/admin/agents/${testAgentId}`);
    const afterUpdate = await afterResponse.json();

    // Bio should remain unchanged
    expect(afterUpdate.data.bio).toBe(originalBio);
  });

  test('should allow clearing apex27_branch_id', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        apex27_branch_id: null,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.data.apex27_branch_id).toBeNull();
  });

  test('should validate phone number format', async () => {
    const response = await apiContext.patch(`/api/admin/agents/${testAgentId}`, {
      data: {
        phone: 'invalid-phone-number',
      },
    });

    // Should return validation error
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });
});
