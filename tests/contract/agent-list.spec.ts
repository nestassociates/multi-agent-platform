import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Contract Test: GET /api/admin/agents (T223)
 *
 * Validates API contract for agent list endpoint with search, filters, and pagination
 */

let apiContext: APIRequestContext;
let adminCookie: string;

test.beforeAll(async ({ playwright, browser }) => {
  // We need to get a valid session cookie by logging in through the browser
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

test.describe('GET /api/admin/agents - List Agents', () => {
  test('should return agents list with correct structure', async () => {
    const response = await apiContext.get('/api/admin/agents');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBeTruthy();

    // Verify pagination structure
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('limit');
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('total_pages');

    expect(typeof data.pagination.page).toBe('number');
    expect(typeof data.pagination.limit).toBe('number');
    expect(typeof data.pagination.total).toBe('number');
    expect(typeof data.pagination.total_pages).toBe('number');
  });

  test('should return agents with correct fields', async () => {
    const response = await apiContext.get('/api/admin/agents');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.data.length > 0) {
      const agent = data.data[0];

      // Verify agent structure
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('subdomain');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('created_at');
      expect(agent).toHaveProperty('apex27_branch_id');

      // Verify profile nested object
      expect(agent).toHaveProperty('profile');
      expect(agent.profile).toHaveProperty('first_name');
      expect(agent.profile).toHaveProperty('last_name');
      expect(agent.profile).toHaveProperty('email');

      // Verify field types
      expect(typeof agent.id).toBe('string');
      expect(typeof agent.subdomain).toBe('string');
      expect(typeof agent.status).toBe('string');
      expect(typeof agent.created_at).toBe('string');
    }
  });

  test('should support search parameter', async () => {
    const response = await apiContext.get('/api/admin/agents?search=test');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
  });

  test('should support status filter parameter', async () => {
    const response = await apiContext.get('/api/admin/agents?status=active');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');

    // All returned agents should have 'active' status
    if (data.data.length > 0) {
      data.data.forEach((agent: any) => {
        expect(agent.status).toBe('active');
      });
    }
  });

  test('should support pagination parameters', async () => {
    // Get first page
    const page1Response = await apiContext.get('/api/admin/agents?page=1&limit=2');
    expect(page1Response.ok()).toBeTruthy();

    const page1Data = await page1Response.json();
    expect(page1Data.pagination.page).toBe(1);
    expect(page1Data.pagination.limit).toBe(2);
    expect(page1Data.data.length).toBeLessThanOrEqual(2);

    // Get second page
    const page2Response = await apiContext.get('/api/admin/agents?page=2&limit=2');
    expect(page2Response.ok()).toBeTruthy();

    const page2Data = await page2Response.json();
    expect(page2Data.pagination.page).toBe(2);
    expect(page2Data.pagination.limit).toBe(2);

    // If both pages have data, ensure they're different
    if (page1Data.data.length > 0 && page2Data.data.length > 0) {
      expect(page1Data.data[0].id).not.toBe(page2Data.data[0].id);
    }
  });

  test('should support combined search and filter', async () => {
    const response = await apiContext.get('/api/admin/agents?search=smith&status=active');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');

    // All returned agents should have 'active' status
    if (data.data.length > 0) {
      data.data.forEach((agent: any) => {
        expect(agent.status).toBe('active');
      });
    }
  });

  test('should return empty array when no matches found', async () => {
    const response = await apiContext.get('/api/admin/agents?search=nonexistent12345xyz');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.data).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  test('should default to page 1 and limit 50', async () => {
    const response = await apiContext.get('/api/admin/agents');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(50);
  });

  test('should handle invalid status gracefully', async () => {
    const response = await apiContext.get('/api/admin/agents?status=invalid_status');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should return empty results since no agents have this status
    expect(data.data).toEqual([]);
  });

  test('should return 401 when not authenticated', async () => {
    // Create a new context without auth
    const unauthContext = await apiContext.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    });

    const response = await unauthContext.get('/api/admin/agents');

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error.code).toBe('UNAUTHORIZED');

    await unauthContext.dispose();
  });

  test('should sort agents by created_at descending', async () => {
    const response = await apiContext.get('/api/admin/agents?limit=10');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.data.length > 1) {
      // Verify that agents are sorted by created_at descending (newest first)
      for (let i = 0; i < data.data.length - 1; i++) {
        const current = new Date(data.data[i].created_at);
        const next = new Date(data.data[i + 1].created_at);
        expect(current >= next).toBeTruthy();
      }
    }
  });

  test('should calculate total_pages correctly', async () => {
    const response = await apiContext.get('/api/admin/agents?limit=5');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    const expectedPages = Math.ceil(data.pagination.total / data.pagination.limit);
    expect(data.pagination.total_pages).toBe(expectedPages);
  });

  test('should search across name, email, and subdomain', async () => {
    // First, get an agent to test with
    const listResponse = await apiContext.get('/api/admin/agents?limit=1');
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      const agent = listData.data[0];

      // Search by first name
      if (agent.profile?.first_name) {
        const nameResponse = await apiContext.get(`/api/admin/agents?search=${agent.profile.first_name}`);
        const nameData = await nameResponse.json();
        expect(nameData.data.length).toBeGreaterThan(0);
        expect(nameData.data.some((a: any) => a.id === agent.id)).toBeTruthy();
      }

      // Search by email
      if (agent.profile?.email) {
        const emailPart = agent.profile.email.split('@')[0];
        const emailResponse = await apiContext.get(`/api/admin/agents?search=${emailPart}`);
        const emailData = await emailResponse.json();
        expect(emailData.data.length).toBeGreaterThan(0);
      }

      // Search by subdomain
      if (agent.subdomain) {
        const subdomainResponse = await apiContext.get(`/api/admin/agents?search=${agent.subdomain}`);
        const subdomainData = await subdomainResponse.json();
        expect(subdomainData.data.length).toBeGreaterThan(0);
        expect(subdomainData.data.some((a: any) => a.id === agent.id)).toBeTruthy();
      }
    }
  });
});
