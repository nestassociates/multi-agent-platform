import { z } from 'zod';

/**
 * Property Validation Schemas
 */

// Transaction type enum
export const transactionTypeSchema = z.enum(['sale', 'let', 'commercial']);

// Property status enum
export const propertyStatusSchema = z.enum(['available', 'under_offer', 'sold', 'let']);

// UK postcode validation
export const postcodeSchema = z
  .string()
  .regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, 'Invalid UK postcode format')
  .transform((val) => val.toUpperCase());

// Property address schema
export const propertyAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  county: z.string().optional(),
  postcode: postcodeSchema,
  country: z.string().default('United Kingdom'),
});

export type PropertyAddressInput = z.infer<typeof propertyAddressSchema>;

// Property image schema
export const propertyImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().optional(),
  order: z.number().int().positive(),
});

export type PropertyImageInput = z.infer<typeof propertyImageSchema>;

// Property upsert schema (from Apex27 webhook)
export const upsertPropertySchema = z.object({
  apex27_id: z.string().min(1, 'Apex27 ID is required'),
  agent_id: z.string().uuid('Invalid agent ID'),
  transaction_type: transactionTypeSchema,
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  property_type: z.string().optional(),
  address: propertyAddressSchema,
  postcode: postcodeSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  images: z.array(propertyImageSchema).default([]),
  features: z.array(z.string()).default([]),
  floor_plan_url: z.string().url().optional(),
  virtual_tour_url: z.string().url().optional(),
  status: propertyStatusSchema.default('available'),
  is_featured: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  raw_data: z.record(z.any()).optional(),
});

export type UpsertPropertyInput = z.infer<typeof upsertPropertySchema>;

// Property search/filter schema
export const searchPropertiesSchema = z.object({
  transaction_type: transactionTypeSchema.optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  postcode: postcodeSchema.optional(),
  agent_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
