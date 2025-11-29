/**
 * OpenAPI Route Definitions: Admin Global Content API
 * T019: Define Admin Global Content routes (/api/admin/global-content/*)
 */

import { registry, globalContentResponseSchema } from '../registry';
import { z } from 'zod';

// GET /api/admin/global-content
registry.registerPath({
  method: 'get',
  path: '/api/admin/global-content',
  tags: ['Admin - Global Content'],
  summary: 'List all global content',
  description: 'Get all global content items (header, footer, legal pages)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of global content',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(globalContentResponseSchema),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Admin access required',
    },
  },
});

// GET /api/admin/global-content/{type}
registry.registerPath({
  method: 'get',
  path: '/api/admin/global-content/{type}',
  tags: ['Admin - Global Content'],
  summary: 'Get global content by type',
  description: 'Get specific global content (header, footer, privacy_policy, terms_of_service, cookie_policy)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      type: z.enum(['header', 'footer', 'privacy_policy', 'terms_of_service', 'cookie_policy']),
    }),
  },
  responses: {
    200: {
      description: 'Global content',
      content: {
        'application/json': {
          schema: globalContentResponseSchema,
        },
      },
    },
    404: {
      description: 'Content type not found',
    },
  },
});

// PUT /api/admin/global-content/{type}
registry.registerPath({
  method: 'put',
  path: '/api/admin/global-content/{type}',
  tags: ['Admin - Global Content'],
  summary: 'Update global content',
  description: 'Update global content (creates draft version)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      type: z.enum(['header', 'footer', 'privacy_policy', 'terms_of_service', 'cookie_policy']),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.unknown().describe('Content structure varies by type'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Content updated',
      content: {
        'application/json': {
          schema: globalContentResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
});

// POST /api/admin/global-content/{type}/publish
registry.registerPath({
  method: 'post',
  path: '/api/admin/global-content/{type}/publish',
  tags: ['Admin - Global Content'],
  summary: 'Publish global content',
  description: 'Publish draft global content to all agent sites',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      type: z.enum(['header', 'footer', 'privacy_policy', 'terms_of_service', 'cookie_policy']),
    }),
  },
  responses: {
    200: {
      description: 'Content published',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            version: z.number(),
            rebuildsQueued: z.number(),
          }),
        },
      },
    },
    400: {
      description: 'No draft to publish',
    },
  },
});

export {};
