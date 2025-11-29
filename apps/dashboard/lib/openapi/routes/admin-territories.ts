/**
 * OpenAPI Route Definitions: Admin Territories API
 * T020: Define Admin Territory routes (/api/admin/territories/*)
 */

import { registry, territoryResponseSchema } from '../registry';
import { z } from 'zod';

// GET /api/admin/territories
registry.registerPath({
  method: 'get',
  path: '/api/admin/territories',
  tags: ['Admin - Territories'],
  summary: 'List all territories',
  description: 'Get all territory assignments',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      agent_id: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of territories',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(territoryResponseSchema),
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

// POST /api/admin/territories
registry.registerPath({
  method: 'post',
  path: '/api/admin/territories',
  tags: ['Admin - Territories'],
  summary: 'Create territory',
  description: 'Create a new territory with GeoJSON polygon boundary',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            agent_id: z.string().uuid(),
            name: z.string().min(1).max(200),
            boundary: z.object({
              type: z.literal('Polygon'),
              coordinates: z.array(z.array(z.array(z.number()))),
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Territory created',
      content: {
        'application/json': {
          schema: territoryResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error or territory overlap',
    },
  },
});

// GET /api/admin/territories/{id}
registry.registerPath({
  method: 'get',
  path: '/api/admin/territories/{id}',
  tags: ['Admin - Territories'],
  summary: 'Get territory by ID',
  description: 'Get detailed territory information',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Territory details',
      content: {
        'application/json': {
          schema: territoryResponseSchema,
        },
      },
    },
    404: {
      description: 'Territory not found',
    },
  },
});

// PATCH /api/admin/territories/{id}
registry.registerPath({
  method: 'patch',
  path: '/api/admin/territories/{id}',
  tags: ['Admin - Territories'],
  summary: 'Update territory',
  description: 'Update territory name, boundary, or reassign to another agent',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(200).optional(),
            boundary: z.object({
              type: z.literal('Polygon'),
              coordinates: z.array(z.array(z.array(z.number()))),
            }).optional(),
            agent_id: z.string().uuid().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Territory updated',
      content: {
        'application/json': {
          schema: territoryResponseSchema,
        },
      },
    },
    404: {
      description: 'Territory not found',
    },
  },
});

// DELETE /api/admin/territories/{id}
registry.registerPath({
  method: 'delete',
  path: '/api/admin/territories/{id}',
  tags: ['Admin - Territories'],
  summary: 'Delete territory',
  description: 'Delete a territory assignment',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Territory deleted',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    404: {
      description: 'Territory not found',
    },
  },
});

// POST /api/admin/territories/count-properties
registry.registerPath({
  method: 'post',
  path: '/api/admin/territories/count-properties',
  tags: ['Admin - Territories'],
  summary: 'Count properties in territory',
  description: 'Count properties within a polygon boundary',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            boundary: z.object({
              type: z.literal('Polygon'),
              coordinates: z.array(z.array(z.array(z.number()))),
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Property count',
      content: {
        'application/json': {
          schema: z.object({
            count: z.number(),
          }),
        },
      },
    },
  },
});

// Postcode routes
// GET /api/admin/postcodes/list
registry.registerPath({
  method: 'get',
  path: '/api/admin/postcodes/list',
  tags: ['Admin - Territories'],
  summary: 'List postcode districts',
  description: 'Get list of UK postcode districts with optional filtering',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      search: z.string().optional(),
      assigned: z.enum(['true', 'false']).optional(),
      agent_id: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of postcode districts',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({
              code: z.string(),
              name: z.string(),
              region: z.string(),
              agent_id: z.string().uuid().nullable(),
            })),
          }),
        },
      },
    },
  },
});

// GET /api/admin/postcodes/{code}/count
registry.registerPath({
  method: 'get',
  path: '/api/admin/postcodes/{code}/count',
  tags: ['Admin - Territories'],
  summary: 'Count properties in postcode',
  description: 'Count properties within a specific postcode district',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      code: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Property count',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            count: z.number(),
          }),
        },
      },
    },
  },
});

export {};
