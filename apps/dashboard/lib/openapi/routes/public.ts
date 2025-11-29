/**
 * OpenAPI Route Definitions: Public API
 * T022: Define Public routes (/api/public/*)
 */

import { registry, propertyResponseSchema, propertyListResponseSchema, contactSuccessSchema } from '../registry';
import { z } from 'zod';

// GET /api/public/agents
registry.registerPath({
  method: 'get',
  path: '/api/public/agents',
  tags: ['Public'],
  summary: 'List active agents',
  description: 'Get list of all active agents (public directory)',
  responses: {
    200: {
      description: 'List of agents',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({
              id: z.string().uuid(),
              subdomain: z.string(),
              first_name: z.string(),
              last_name: z.string(),
              avatar_url: z.string().nullable(),
              bio: z.string().nullable(),
            })),
          }),
        },
      },
    },
  },
});

// GET /api/public/agents/{id}/info
registry.registerPath({
  method: 'get',
  path: '/api/public/agents/{id}/info',
  tags: ['Public'],
  summary: 'Get agent public info',
  description: 'Get public profile information for an agent',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Agent public info',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            subdomain: z.string(),
            first_name: z.string(),
            last_name: z.string(),
            avatar_url: z.string().nullable(),
            bio: z.string().nullable(),
            qualifications: z.array(z.string()),
            social_media_links: z.record(z.string()).nullable(),
          }),
        },
      },
    },
    404: {
      description: 'Agent not found or inactive',
    },
  },
});

// GET /api/public/agents/{id}/properties
registry.registerPath({
  method: 'get',
  path: '/api/public/agents/{id}/properties',
  tags: ['Public'],
  summary: 'Get agent properties',
  description: 'Get all properties for an agent (public listing)',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    query: z.object({
      transaction_type: z.enum(['sale', 'let', 'commercial']).optional(),
      status: z.enum(['available', 'under_offer', 'sold', 'let']).optional(),
      min_price: z.string().optional(),
      max_price: z.string().optional(),
      bedrooms: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of properties',
      content: {
        'application/json': {
          schema: propertyListResponseSchema,
        },
      },
    },
    404: {
      description: 'Agent not found or inactive',
    },
  },
});

// GET /api/public/properties
registry.registerPath({
  method: 'get',
  path: '/api/public/properties',
  tags: ['Public'],
  summary: 'Search all properties',
  description: 'Search properties across all agents',
  request: {
    query: z.object({
      transaction_type: z.enum(['sale', 'let', 'commercial']).optional(),
      status: z.enum(['available', 'under_offer', 'sold', 'let']).optional(),
      min_price: z.string().optional(),
      max_price: z.string().optional(),
      bedrooms: z.string().optional(),
      postcode: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of properties',
      content: {
        'application/json': {
          schema: propertyListResponseSchema,
        },
      },
    },
  },
});

// POST /api/public/contact
registry.registerPath({
  method: 'post',
  path: '/api/public/contact',
  tags: ['Public'],
  summary: 'Submit contact form',
  description: 'Submit a contact form from agent microsite. Rate limited: 5 requests per IP per hour.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            agentId: z.string().uuid(),
            propertyId: z.string().uuid().optional(),
            name: z.string().min(2).max(100),
            email: z.string().email(),
            phone: z.string().max(20).optional(),
            message: z.string().min(10).max(2000),
            honeypot: z.string().optional().describe('Hidden field for bot detection'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Contact form submitted',
      headers: z.object({
        'Access-Control-Allow-Origin': z.string(),
        'X-RateLimit-Remaining': z.string(),
        'X-RateLimit-Reset': z.string(),
      }),
      content: {
        'application/json': {
          schema: contactSuccessSchema,
        },
      },
    },
    400: {
      description: 'Validation error or honeypot triggered',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(false),
            error: z.object({
              code: z.enum(['VALIDATION_ERROR', 'INVALID_SUBMISSION']),
              message: z.string(),
              details: z.object({
                field: z.string(),
                reason: z.string(),
              }).optional(),
            }),
          }),
        },
      },
    },
    403: {
      description: 'Invalid CORS origin',
    },
    404: {
      description: 'Agent not found or inactive',
    },
    429: {
      description: 'Rate limited',
      headers: z.object({
        'Retry-After': z.string(),
        'X-RateLimit-Remaining': z.string(),
        'X-RateLimit-Reset': z.string(),
      }),
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(false),
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

// OPTIONS /api/public/contact (CORS preflight)
registry.registerPath({
  method: 'options',
  path: '/api/public/contact',
  tags: ['Public'],
  summary: 'CORS preflight for contact form',
  description: 'Handle CORS preflight request for contact form',
  responses: {
    200: {
      description: 'CORS headers',
      headers: z.object({
        'Access-Control-Allow-Origin': z.string(),
        'Access-Control-Allow-Methods': z.string(),
        'Access-Control-Allow-Headers': z.string(),
        'Access-Control-Max-Age': z.string(),
      }),
    },
    403: {
      description: 'Invalid origin',
    },
  },
});

export {};
