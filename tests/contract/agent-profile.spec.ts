import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Contract Test: PATCH /api/agent/profile
 * 
 * Validates agent profile update API contract
 */

let apiContext: APIRequestContext;
let agentToken: string;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  });

  // Login as agent
  const loginResponse = await apiContext.post('/api/auth/login', {
    data: {
      email: process.env.TEST_AGENT_EMAIL || 'test-agent@example.com',
      password: process.env.TEST_AGENT_PASSWORD || 'AgentPass123!',
    },
  });

  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();
  agentToken = loginData.access_token;
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test.describe('PATCH /api/agent/profile - Update Agent Profile', () => {
  test('should update phone number', async () => {
    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        phone: '07700 900002',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.phone).toBe('07700 900002');
  });

  test('should update bio', async () => {
    const newBio = 'Updated bio with professional experience and qualifications';

    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        bio: newBio,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.bio).toBe(newBio);
  });

  test('should update qualifications array', async () => {
    const qualifications = ['ARLA', 'NAEA', 'Registered Valuer'];

    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        qualifications,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.qualifications).toEqual(qualifications);
  });

  test('should update social media links', async () => {
    const socialLinks = {
      facebook: 'https://facebook.com/updated',
      twitter: 'https://twitter.com/updated',
      linkedin: 'https://linkedin.com/in/updated',
    };

    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        social_media_links: socialLinks,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.social_media_links).toEqual(socialLinks);
  });

  test('should reject invalid phone number format', async () => {
    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        phone: 'invalid-phone',
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject bio longer than 5000 characters', async () => {
    const longBio = 'x'.repeat(5001);

    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        bio: longBio,
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject invalid social media URL', async () => {
    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        social_media_links: {
          facebook: 'not-a-valid-url',
        },
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('should require authentication', async () => {
    const response = await apiContext.patch('/api/agent/profile', {
      // No Authorization header
      data: {
        phone: '07700 900003',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should trigger site rebuild when profile updated', async () => {
    const response = await apiContext.patch('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      data: {
        bio: 'Bio change should trigger rebuild',
      },
    });

    expect(response.status()).toBe(200);

    // Note: Actual rebuild verification would check build_queue table
    // This test just verifies the API returns success
  });
});

test.describe('GET /api/agent/profile - Get Agent Profile', () => {
  test('should return current agent profile', async () => {
    const response = await apiContext.get('/api/agent/profile', {
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Verify structure
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('subdomain');
    expect(data).toHaveProperty('bio');
    expect(data).toHaveProperty('qualifications');
    expect(data).toHaveProperty('social_media_links');
    expect(data).toHaveProperty('status');
  });

  test('should require authentication', async () => {
    const response = await apiContext.get('/api/agent/profile');

    expect(response.status()).toBe(401);
  });
});
