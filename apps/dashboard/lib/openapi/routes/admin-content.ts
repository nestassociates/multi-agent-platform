/**
 * OpenAPI Route Definitions: Admin Content API
 * T018: Define Admin Content routes (/api/admin/content/*)
 */

import { registry, contentResponseSchema, contentListResponseSchema } from '../registry';
import { z } from 'zod';

// GET /api/admin/content/moderation
registry.registerPath({
  method: 'get',
  path: '/api/admin/content/moderation',
  tags: ['Admin - Content'],
  summary: 'Get content moderation queue',
  description: 'Get paginated list of content pending moderation with filtering options',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      type: z.enum(['blog_post', 'area_guide']).optional(),
      status: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'published']).optional(),
      agent_id: z.string().uuid().optional(),
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of content items',
      content: {
        'application/json': {
          schema: contentListResponseSchema,
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

// POST /api/admin/content/{id}/approve
registry.registerPath({
  method: 'post',
  path: '/api/admin/content/{id}/approve',
  tags: ['Admin - Content'],
  summary: 'Approve content',
  description: 'Approve content for publication and trigger site rebuild',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Content approved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            content: contentResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Content not in pending_review status',
    },
    404: {
      description: 'Content not found',
    },
  },
});

// POST /api/admin/content/{id}/reject
registry.registerPath({
  method: 'post',
  path: '/api/admin/content/{id}/reject',
  tags: ['Admin - Content'],
  summary: 'Reject content',
  description: 'Reject content with a reason',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            rejection_reason: z.string().min(10).max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Content rejected',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            content: contentResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Content not in pending_review status',
    },
    404: {
      description: 'Content not found',
    },
  },
});

export {};
