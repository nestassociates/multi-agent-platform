/**
 * OpenAPI Route Definitions: Webhook API
 * T023: Define Webhook routes (/api/webhooks/*)
 */

import { registry, webhookResponseSchema } from '../registry';
import { z } from 'zod';

// POST /api/webhooks/apex27
registry.registerPath({
  method: 'post',
  path: '/api/webhooks/apex27',
  tags: ['Webhooks'],
  summary: 'Apex27 property webhook',
  description: 'Receive property updates from Apex27. Validates HMAC-SHA256 signature.',
  security: [{ webhookSignature: [] }],
  request: {
    headers: z.object({
      'x-webhook-signature': z.string().describe('HMAC-SHA256 signature of payload'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            event: z.enum(['property.created', 'property.updated', 'property.deleted']),
            timestamp: z.string().datetime(),
            branch_id: z.string(),
            property: z.object({
              id: z.string(),
              transaction_type: z.enum(['sale', 'let', 'commercial']),
              title: z.string(),
              description: z.string().optional(),
              price: z.number(),
              bedrooms: z.number().optional(),
              bathrooms: z.number().optional(),
              property_type: z.string().optional(),
              address: z.object({
                line1: z.string(),
                line2: z.string().optional(),
                city: z.string(),
                county: z.string().optional(),
                postcode: z.string(),
              }),
              postcode: z.string(),
              latitude: z.number().optional(),
              longitude: z.number().optional(),
              images: z.array(z.object({
                url: z.string().url(),
                order: z.number().optional(),
                alt: z.string().optional(),
              })).optional(),
              features: z.array(z.string()).optional(),
              floor_plan_url: z.string().url().optional(),
              virtual_tour_url: z.string().url().optional(),
              status: z.enum(['available', 'under_offer', 'sold', 'let', 'withdrawn']).optional(),
              is_featured: z.boolean().optional(),
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Webhook processed',
      content: {
        'application/json': {
          schema: webhookResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid payload',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('INVALID_PAYLOAD'),
              message: z.string(),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Invalid signature',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('INVALID_SIGNATURE'),
              message: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'No agent found for branch_id',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.literal('AGENT_NOT_FOUND'),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
});

export {};
