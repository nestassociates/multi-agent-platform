/**
 * OpenAPI Route Definitions: Admin Agent API
 * T017: Define Admin Agent routes (/api/admin/agents/*)
 */

import { registry, agentResponseSchema, agentListResponseSchema } from '../registry';
import { z } from 'zod';

// GET /api/admin/agents
registry.registerPath({
  method: 'get',
  path: '/api/admin/agents',
  tags: ['Admin - Agents'],
  summary: 'List all agents',
  description: 'Get paginated list of all agents with optional filtering',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(['draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended']).optional(),
      search: z.string().optional().describe('Search by name or email'),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of agents',
      content: {
        'application/json': {
          schema: agentListResponseSchema,
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

// POST /api/admin/agents
registry.registerPath({
  method: 'post',
  path: '/api/admin/agents',
  tags: ['Admin - Agents'],
  summary: 'Create new agent',
  description: 'Create a new agent account with profile and credentials',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(12),
            first_name: z.string(),
            last_name: z.string(),
            phone: z.string().optional(),
            subdomain: z.string().min(3).max(63),
            apex27_branch_id: z.string().optional(),
            bio: z.string().optional(),
            qualifications: z.array(z.string()).optional(),
            social_media_links: z.record(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Agent created',
      content: {
        'application/json': {
          schema: agentResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error or subdomain taken',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Admin access required',
    },
  },
});

// GET /api/admin/agents/{id}
registry.registerPath({
  method: 'get',
  path: '/api/admin/agents/{id}',
  tags: ['Admin - Agents'],
  summary: 'Get agent by ID',
  description: 'Get detailed information about a specific agent',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Agent details',
      content: {
        'application/json': {
          schema: agentResponseSchema,
        },
      },
    },
    404: {
      description: 'Agent not found',
    },
  },
});

// PATCH /api/admin/agents/{id}
registry.registerPath({
  method: 'patch',
  path: '/api/admin/agents/{id}',
  tags: ['Admin - Agents'],
  summary: 'Update agent',
  description: 'Update agent profile or status',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            phone: z.string().optional(),
            bio: z.string().optional(),
            qualifications: z.array(z.string()).optional(),
            social_media_links: z.record(z.string()).optional(),
            status: z.enum(['draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Agent updated',
      content: {
        'application/json': {
          schema: agentResponseSchema,
        },
      },
    },
    404: {
      description: 'Agent not found',
    },
  },
});

// POST /api/admin/agents/{id}/activate
registry.registerPath({
  method: 'post',
  path: '/api/admin/agents/{id}/activate',
  tags: ['Admin - Agents'],
  summary: 'Activate agent',
  description: 'Activate an agent account and trigger site build',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Agent activated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            agent: agentResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Agent not ready for activation',
    },
    404: {
      description: 'Agent not found',
    },
  },
});

// GET /api/admin/agents/{id}/checklist
registry.registerPath({
  method: 'get',
  path: '/api/admin/agents/{id}/checklist',
  tags: ['Admin - Agents'],
  summary: 'Get agent onboarding checklist',
  description: 'Get the onboarding checklist status for an agent',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Checklist status',
      content: {
        'application/json': {
          schema: z.object({
            user_created: z.boolean(),
            welcome_email_sent: z.boolean(),
            admin_approved: z.boolean(),
            created_at: z.string().datetime(),
            updated_at: z.string().datetime(),
          }),
        },
      },
    },
    404: {
      description: 'Agent not found',
    },
  },
});

// PATCH /api/admin/agents/{id}/checklist
registry.registerPath({
  method: 'patch',
  path: '/api/admin/agents/{id}/checklist',
  tags: ['Admin - Agents'],
  summary: 'Update agent checklist',
  description: 'Update a specific checklist item',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            field: z.enum(['user_created', 'welcome_email_sent', 'admin_approved']),
            value: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Checklist updated',
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

// POST /api/admin/agents/{id}/password
registry.registerPath({
  method: 'post',
  path: '/api/admin/agents/{id}/password',
  tags: ['Admin - Agents'],
  summary: 'Reset agent password',
  description: 'Admin reset of agent password',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            password: z.string().min(12),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset',
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

// GET /api/admin/agents/{id}/properties
registry.registerPath({
  method: 'get',
  path: '/api/admin/agents/{id}/properties',
  tags: ['Admin - Agents'],
  summary: 'Get agent properties',
  description: 'Get all properties for a specific agent',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    query: z.object({
      status: z.enum(['available', 'under_offer', 'sold', 'let']).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of properties',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
            pagination: z.object({
              nextCursor: z.string().nullable(),
              hasNextPage: z.boolean(),
            }).optional(),
          }),
        },
      },
    },
  },
});

// GET /api/admin/agents/{id}/content
registry.registerPath({
  method: 'get',
  path: '/api/admin/agents/{id}/content',
  tags: ['Admin - Agents'],
  summary: 'Get agent content',
  description: 'Get all content submissions for a specific agent',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    query: z.object({
      type: z.enum(['blog_post', 'area_guide']).optional(),
      status: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'published']).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of content',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
            pagination: z.object({
              nextCursor: z.string().nullable(),
              hasNextPage: z.boolean(),
            }).optional(),
          }),
        },
      },
    },
  },
});

// POST /api/admin/agents/auto-detect
registry.registerPath({
  method: 'post',
  path: '/api/admin/agents/auto-detect',
  tags: ['Admin - Agents'],
  summary: 'Auto-detect negotiators',
  description: 'Auto-detect new negotiators from Apex27 branches',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Detection results',
      content: {
        'application/json': {
          schema: z.object({
            detected: z.number(),
            negotiators: z.array(z.object({
              name: z.string(),
              email: z.string(),
              branch_id: z.string(),
            })),
          }),
        },
      },
    },
  },
});

export {};
