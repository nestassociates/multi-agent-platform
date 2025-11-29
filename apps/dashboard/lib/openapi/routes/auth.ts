/**
 * OpenAPI Route Definitions: Auth API
 * T016: Define Auth API routes (/api/auth/*)
 */

import { registry } from '../registry';
import { z } from 'zod';

// POST /api/auth/login
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Authentication'],
  summary: 'Login with email and password',
  description: 'Authenticate user and return JWT tokens. Rate limited: 5 attempts per 15 minutes per email.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
            user: z.object({
              user_id: z.string().uuid(),
              email: z.string().email(),
              first_name: z.string(),
              last_name: z.string(),
              role: z.enum(['admin', 'agent']),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('INVALID_CREDENTIALS'),
              message: z.string(),
            }),
          }),
        },
      },
    },
    429: {
      description: 'Rate limited',
      headers: z.object({
        'X-RateLimit-Remaining': z.string(),
        'X-RateLimit-Reset': z.string(),
      }),
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('RATE_LIMITED'),
              message: z.string(),
              remaining: z.number(),
              resetAt: z.number(),
            }),
          }),
        },
      },
    },
  },
});

// POST /api/auth/logout
registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Authentication'],
  summary: 'Logout current user',
  description: 'Invalidate current session and clear auth cookies',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
});

// POST /api/auth/change-password
registry.registerPath({
  method: 'post',
  path: '/api/auth/change-password',
  tags: ['Authentication'],
  summary: 'Change password',
  description: 'Change password for authenticated user',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            currentPassword: z.string(),
            newPassword: z.string().min(12),
            confirmPassword: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password changed successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Current password incorrect',
    },
  },
});

// POST /api/auth/reset
registry.registerPath({
  method: 'post',
  path: '/api/auth/reset',
  tags: ['Authentication'],
  summary: 'Request password reset',
  description: 'Send password reset email to user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reset email sent (returns success regardless of email existence)',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

export {};
