/**
 * OpenAPI Route Definitions: Agent API
 * T021: Define Agent routes (/api/agent/*)
 */

import { registry, contentResponseSchema, contentListResponseSchema, propertyListResponseSchema, feeStructureResponseSchema } from '../registry';
import { z } from 'zod';

// GET /api/agent/profile
registry.registerPath({
  method: 'get',
  path: '/api/agent/profile',
  tags: ['Agent'],
  summary: 'Get current agent profile',
  description: 'Get the authenticated agent\'s profile information',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Agent profile',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            user_id: z.string().uuid(),
            subdomain: z.string(),
            status: z.enum(['draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended']),
            profile: z.object({
              first_name: z.string(),
              last_name: z.string(),
              email: z.string().email(),
              phone: z.string().nullable(),
              bio: z.string().nullable(),
              avatar_url: z.string().nullable(),
              qualifications: z.array(z.string()),
              social_media_links: z.record(z.string()).nullable(),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Agent access required',
    },
  },
});

// PATCH /api/agent/profile
registry.registerPath({
  method: 'patch',
  path: '/api/agent/profile',
  tags: ['Agent'],
  summary: 'Update agent profile',
  description: 'Update the authenticated agent\'s profile',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            phone: z.string().optional(),
            bio: z.string().max(5000).optional(),
            qualifications: z.array(z.string()).optional(),
            social_media_links: z.record(z.string()).optional(),
            avatar_url: z.string().url().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Profile updated',
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
  },
});

// GET /api/agent/properties
registry.registerPath({
  method: 'get',
  path: '/api/agent/properties',
  tags: ['Agent'],
  summary: 'Get agent properties',
  description: 'Get all properties for the authenticated agent',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(['available', 'under_offer', 'sold', 'let']).optional(),
      transaction_type: z.enum(['sale', 'let', 'commercial']).optional(),
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

// GET /api/agent/content
registry.registerPath({
  method: 'get',
  path: '/api/agent/content',
  tags: ['Agent'],
  summary: 'Get agent content',
  description: 'Get all content submissions for the authenticated agent',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      type: z.enum(['blog_post', 'area_guide']).optional(),
      status: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'published']).optional(),
      cursor: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of content',
      content: {
        'application/json': {
          schema: contentListResponseSchema,
        },
      },
    },
  },
});

// POST /api/agent/content
registry.registerPath({
  method: 'post',
  path: '/api/agent/content',
  tags: ['Agent'],
  summary: 'Create content',
  description: 'Create a new content submission (blog post or area guide)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content_type: z.enum(['blog_post', 'area_guide']),
            title: z.string().min(1).max(100),
            slug: z.string().optional(),
            content_body: z.string().min(1),
            excerpt: z.string().max(250).optional(),
            featured_image_url: z.string().url().optional(),
            seo_meta_title: z.string().max(60).optional(),
            seo_meta_description: z.string().max(160).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Content created',
      content: {
        'application/json': {
          schema: contentResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
});

// GET /api/agent/content/{id}
registry.registerPath({
  method: 'get',
  path: '/api/agent/content/{id}',
  tags: ['Agent'],
  summary: 'Get content by ID',
  description: 'Get specific content submission',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Content details',
      content: {
        'application/json': {
          schema: contentResponseSchema,
        },
      },
    },
    403: {
      description: 'Content belongs to another agent',
    },
    404: {
      description: 'Content not found',
    },
  },
});

// PATCH /api/agent/content/{id}
registry.registerPath({
  method: 'patch',
  path: '/api/agent/content/{id}',
  tags: ['Agent'],
  summary: 'Update content',
  description: 'Update content (only draft or rejected content can be edited)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(100).optional(),
            slug: z.string().optional(),
            content_body: z.string().min(1).optional(),
            excerpt: z.string().max(250).optional(),
            featured_image_url: z.string().url().optional(),
            seo_meta_title: z.string().max(60).optional(),
            seo_meta_description: z.string().max(160).optional(),
            status: z.enum(['draft', 'pending_review']).optional(),
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
          schema: contentResponseSchema,
        },
      },
    },
    400: {
      description: 'Cannot edit content in current status',
    },
    403: {
      description: 'Content belongs to another agent',
    },
    404: {
      description: 'Content not found',
    },
  },
});

// DELETE /api/agent/content/{id}
registry.registerPath({
  method: 'delete',
  path: '/api/agent/content/{id}',
  tags: ['Agent'],
  summary: 'Delete content',
  description: 'Delete content (only draft or rejected content can be deleted)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Content deleted',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: 'Cannot delete content in current status',
    },
    403: {
      description: 'Content belongs to another agent',
    },
    404: {
      description: 'Content not found',
    },
  },
});

// GET /api/agent/fees
registry.registerPath({
  method: 'get',
  path: '/api/agent/fees',
  tags: ['Agent'],
  summary: 'Get fee structure',
  description: 'Get the authenticated agent\'s fee structure',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Fee structure',
      content: {
        'application/json': {
          schema: feeStructureResponseSchema.nullable(),
        },
      },
    },
  },
});

// PUT /api/agent/fees
registry.registerPath({
  method: 'put',
  path: '/api/agent/fees',
  tags: ['Agent'],
  summary: 'Update fee structure',
  description: 'Update the authenticated agent\'s fee structure (rich text)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content_body: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Fee structure updated',
      content: {
        'application/json': {
          schema: feeStructureResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
});

export {};
