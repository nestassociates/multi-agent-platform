import { test, expect, type APIRequestContext } from '@playwright/test';
import { generateTestEmail, generateTestSubdomain } from '../utils/test-helpers';

/**
 * Contract Test: POST /api/admin/agents
 * 
 * Validates API contract matches OpenAPI specification
 */

let apiContext: APIRequestContext;
let adminToken: string;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  });

  // Get admin auth token
  const loginResponse = await apiContext.post('/api/auth/login', {
    data: {
      email: 'website@nestassociates.co.uk',
      password: process.env.ADMIN_PASSWORD || 'test-password',
    },
  });

  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();
  adminToken = loginData.access_token;
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test.describe('POST /api/admin/agents - Create Agent', () => {
  test('should create agent with valid data', async () => {
    const testEmail = generateTestEmail();
    const testSubdomain = generateTestSubdomain();

    const response = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: testEmail,
        password: 'TempPassword123!',
        first_name: 'John',
        last_name: 'Smith',
        phone: '07700 900000',
        subdomain: testSubdomain,
        apex27_branch_id: '1962',
        bio: 'Experienced real estate agent',
        qualifications: ['ARLA', 'NAEA'],
        social_media_links: {
          facebook: 'https://facebook.com/johnsmith',
          twitter: 'https://twitter.com/johnsmith',
        },
      },
    });

    // Verify status code
    expect(response.status()).toBe(201);

    // Verify response structure
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data.subdomain).toBe(testSubdomain);
    expect(data.status).toBe('active');

    // Cleanup: Delete created agent
    // (Would need DELETE endpoint or direct database cleanup)
  });

  test('should reject agent with invalid email', async () => {
    const response = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: 'invalid-email', // Invalid format
        password: 'TempPassword123!',
        first_name: 'Test',
        last_name: 'Agent',
        subdomain: generateTestSubdomain(),
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
    expect(error.error.message).toContain('email');
  });

  test('should reject agent with weak password', async () => {
    const response = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: generateTestEmail(),
        password: 'weak', // Doesn't meet requirements
        first_name: 'Test',
        last_name: 'Agent',
        subdomain: generateTestSubdomain(),
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
    expect(error.error.details).toBeDefined();
  });

  test('should reject agent with invalid subdomain format', async () => {
    const response = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: generateTestEmail(),
        password: 'TempPassword123!',
        first_name: 'Test',
        last_name: 'Agent',
        subdomain: 'Invalid Subdomain!', // Spaces and caps not allowed
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject duplicate email', async () => {
    const testEmail = generateTestEmail();
    const subdomain1 = generateTestSubdomain();
    const subdomain2 = generateTestSubdomain();

    // Create first agent
    const firstResponse = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: testEmail,
        password: 'TempPassword123!',
        first_name: 'First',
        last_name: 'Agent',
        subdomain: subdomain1,
      },
    });

    expect(firstResponse.status()).toBe(201);

    // Try to create second agent with same email
    const secondResponse = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: testEmail, // Duplicate!
        password: 'TempPassword123!',
        first_name: 'Second',
        last_name: 'Agent',
        subdomain: subdomain2,
      },
    });

    expect(secondResponse.status()).toBe(409); // Conflict
    const error = await secondResponse.json();
    expect(error.error.code).toBe('ALREADY_EXISTS');
  });

  test('should reject duplicate subdomain', async () => {
    const email1 = generateTestEmail();
    const email2 = generateTestEmail();
    const testSubdomain = generateTestSubdomain();

    // Create first agent
    const firstResponse = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: email1,
        password: 'TempPassword123!',
        first_name: 'First',
        last_name: 'Agent',
        subdomain: testSubdomain,
      },
    });

    expect(firstResponse.status()).toBe(201);

    // Try to create second agent with same subdomain
    const secondResponse = await apiContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: {
        email: email2,
        password: 'TempPassword123!',
        first_name: 'Second',
        last_name: 'Agent',
        subdomain: testSubdomain, // Duplicate!
      },
    });

    expect(secondResponse.status()).toBe(409);
    const error = await secondResponse.json();
    expect(error.error.code).toBe('ALREADY_EXISTS');
  });

  test('should require authentication', async () => {
    const response = await apiContext.post('/api/admin/agents', {
      // No Authorization header
      data: {
        email: generateTestEmail(),
        password: 'TempPassword123!',
        first_name: 'Test',
        last_name: 'Agent',
        subdomain: generateTestSubdomain(),
      },
    });

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error.error.code).toBe('UNAUTHORIZED');
  });

  test('should reject non-admin users', async ({ playwright }) => {
    // Login as agent (not admin)
    const agentContext = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    });

    const agentLogin = await agentContext.post('/api/auth/login', {
      data: {
        email: process.env.TEST_AGENT_EMAIL || 'test-agent@example.com',
        password: process.env.TEST_AGENT_PASSWORD || 'AgentPass123!',
      },
    });

    const agentData = await agentLogin.json();
    const agentToken = agentData.access_token;

    // Try to create agent as agent user
    const response = await agentContext.post('/api/admin/agents', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        email: generateTestEmail(),
        password: 'TempPassword123!',
        first_name: 'Test',
        last_name: 'Agent',
        subdomain: generateTestSubdomain(),
      },
    });

    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error.code).toBe('FORBIDDEN');

    await agentContext.dispose();
  });
});
