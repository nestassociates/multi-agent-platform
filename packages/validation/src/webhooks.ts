import { z } from 'zod';
import { transactionTypeSchema, propertyAddressSchema, propertyImageSchema } from './property';

/**
 * Webhook Validation Schemas
 */

// Apex27 webhook event types
export const apex27EventSchema = z.enum(['property.created', 'property.updated', 'property.deleted']);

// Apex27 property payload
export const apex27PropertySchema = z.object({
  id: z.string().min(1, 'Property ID is required'),
  transaction_type: transactionTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  property_type: z.string().optional(),
  address: propertyAddressSchema,
  postcode: z.string(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  images: z.array(
    z.object({
      url: z.string().url(),
      order: z.number().int().positive().optional(),
      alt: z.string().optional(),
    })
  ).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  floor_plan_url: z.string().url().optional(),
  virtual_tour_url: z.string().url().optional(),
  status: z.enum(['available', 'under_offer', 'sold', 'let', 'withdrawn']).optional().default('available'),
  is_featured: z.boolean().optional().default(false),
});

export type Apex27PropertyPayload = z.infer<typeof apex27PropertySchema>;

// Apex27 webhook payload
export const apex27WebhookSchema = z.object({
  event: apex27EventSchema,
  timestamp: z.string().datetime('Invalid ISO 8601 timestamp'),
  branch_id: z.string().min(1, 'Branch ID is required'),
  property: apex27PropertySchema,
});

export type Apex27WebhookPayload = z.infer<typeof apex27WebhookSchema>;

// Webhook signature validation
export const webhookSignatureSchema = z.object({
  signature: z.string().min(1, 'Webhook signature is required'),
  payload: z.string().min(1, 'Payload is required'),
  secret: z.string().min(1, 'Secret is required'),
});

export type WebhookSignatureInput = z.infer<typeof webhookSignatureSchema>;
