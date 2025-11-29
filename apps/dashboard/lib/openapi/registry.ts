/**
 * OpenAPI Registry
 * Registers Zod schemas for OpenAPI spec generation
 *
 * T014: Create OpenAPI registry with Zod schema registration
 * T015: Register all validation schemas from @nest/validation
 */

import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

// Import all schemas from @nest/validation
import {
  // Auth schemas
  loginSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  // Agent schemas
  createAgentSchema,
  updateAgentSchema,
  updateAgentProfileSchema,
  activateAgentSchema,
  deactivateAgentSchema,
  updateChecklistSchema,
  agentStatusSchema,
  // Content schemas
  createContentSchema,
  updateContentSchema,
  rejectContentSchema,
  contentTypeSchema,
  contentStatusSchema,
  // Contact schema
  contactFormSchema,
  // Fees schema
  feeStructureSchema,
  // Property schemas
  propertyStatusSchema,
  transactionTypeSchema,
  searchPropertiesSchema,
  // Territory schemas
  createTerritorySchema,
  updateTerritorySchema,
  // Global content schemas
  headerContentSchema,
  footerContentSchema,
  legalContentSchema,
  globalContentTypeSchema,
  // Webhook schemas
  apex27WebhookSchema,
} from '@nest/validation';

// Create the registry
export const registry = new OpenAPIRegistry();

// ============================================================
// COMMON RESPONSE SCHEMAS
// ============================================================

// Error response schema
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Human-readable error message'),
    details: z.record(z.any()).optional().describe('Additional error details'),
  }),
});

registry.register('ErrorResponse', errorResponseSchema);

// Pagination response schema
export const paginationSchema = z.object({
  nextCursor: z.string().nullable().describe('Cursor for next page'),
  hasNextPage: z.boolean().describe('Whether more results exist'),
  total: z.number().optional().describe('Total count if available'),
});

registry.register('Pagination', paginationSchema);

// Rate limit response schema
export const rateLimitResponseSchema = z.object({
  error: z.object({
    code: z.literal('RATE_LIMITED'),
    message: z.string(),
    remaining: z.number().describe('Remaining requests'),
    resetAt: z.number().describe('Unix timestamp when limit resets'),
  }),
});

registry.register('RateLimitResponse', rateLimitResponseSchema);

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

registry.register('SuccessResponse', successResponseSchema);

// ============================================================
// AUTH SCHEMAS
// ============================================================

registry.register('LoginInput', loginSchema);
registry.register('PasswordChangeInput', passwordChangeSchema);
registry.register('PasswordResetRequestInput', passwordResetRequestSchema);
registry.register('PasswordResetConfirmInput', passwordResetConfirmSchema);

// Login success response
export const loginSuccessSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: z.object({
    user_id: z.string().uuid(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    role: z.enum(['admin', 'agent']),
  }),
});

registry.register('LoginSuccess', loginSuccessSchema);

// ============================================================
// AGENT SCHEMAS
// ============================================================

registry.register('CreateAgentInput', createAgentSchema);
registry.register('UpdateAgentInput', updateAgentSchema);
registry.register('UpdateAgentProfileInput', updateAgentProfileSchema);
registry.register('ActivateAgentInput', activateAgentSchema);
registry.register('DeactivateAgentInput', deactivateAgentSchema);
registry.register('UpdateChecklistInput', updateChecklistSchema);
registry.register('AgentStatus', agentStatusSchema);

// Agent response schema
export const agentResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subdomain: z.string(),
  status: agentStatusSchema,
  apex27_branch_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  profile: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    bio: z.string().nullable(),
    avatar_url: z.string().nullable(),
    qualifications: z.array(z.string()),
    social_media_links: z.record(z.string()).nullable(),
  }).optional(),
});

registry.register('AgentResponse', agentResponseSchema);

// Agent list response
export const agentListResponseSchema = z.object({
  data: z.array(agentResponseSchema),
  pagination: paginationSchema.optional(),
});

registry.register('AgentListResponse', agentListResponseSchema);

// ============================================================
// CONTENT SCHEMAS
// ============================================================

registry.register('CreateContentInput', createContentSchema);
registry.register('UpdateContentInput', updateContentSchema);
registry.register('RejectContentInput', rejectContentSchema);
registry.register('ContentType', contentTypeSchema);
registry.register('ContentStatus', contentStatusSchema);

// Content response schema
export const contentResponseSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  content_type: contentTypeSchema,
  title: z.string(),
  slug: z.string(),
  content_body: z.string(),
  excerpt: z.string().nullable(),
  featured_image_url: z.string().nullable(),
  status: contentStatusSchema,
  rejection_reason: z.string().nullable(),
  seo_meta_title: z.string().nullable(),
  seo_meta_description: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

registry.register('ContentResponse', contentResponseSchema);

// Content list response
export const contentListResponseSchema = z.object({
  data: z.array(contentResponseSchema),
  pagination: paginationSchema.optional(),
});

registry.register('ContentListResponse', contentListResponseSchema);

// ============================================================
// CONTACT SCHEMAS
// ============================================================

registry.register('ContactFormInput', contactFormSchema);

// Contact success response
export const contactSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

registry.register('ContactSuccess', contactSuccessSchema);

// ============================================================
// FEES SCHEMAS
// ============================================================

registry.register('FeeStructureInput', feeStructureSchema);

// Fee structure response
export const feeStructureResponseSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  content_body: z.string(),
  updated_at: z.string().datetime(),
});

registry.register('FeeStructureResponse', feeStructureResponseSchema);

// ============================================================
// PROPERTY SCHEMAS
// ============================================================

registry.register('PropertyStatus', propertyStatusSchema);
registry.register('TransactionType', transactionTypeSchema);
registry.register('SearchPropertiesInput', searchPropertiesSchema);

// Property response schema
export const propertyResponseSchema = z.object({
  id: z.string().uuid(),
  apex27_id: z.string(),
  agent_id: z.string().uuid(),
  transaction_type: transactionTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  property_type: z.string().nullable(),
  address_line_1: z.string(),
  address_line_2: z.string().nullable(),
  town: z.string(),
  county: z.string().nullable(),
  postcode: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().nullable(),
    order: z.number(),
  })),
  features: z.array(z.string()),
  floor_plan_url: z.string().nullable(),
  virtual_tour_url: z.string().nullable(),
  status: propertyStatusSchema,
  is_featured: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

registry.register('PropertyResponse', propertyResponseSchema);

// Property list response
export const propertyListResponseSchema = z.object({
  data: z.array(propertyResponseSchema),
  pagination: paginationSchema.optional(),
});

registry.register('PropertyListResponse', propertyListResponseSchema);

// ============================================================
// TERRITORY SCHEMAS
// ============================================================

registry.register('CreateTerritoryInput', createTerritorySchema);
registry.register('UpdateTerritoryInput', updateTerritorySchema);

// Territory response schema
export const territoryResponseSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  name: z.string(),
  boundary: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

registry.register('TerritoryResponse', territoryResponseSchema);

// ============================================================
// GLOBAL CONTENT SCHEMAS
// ============================================================

registry.register('HeaderContent', headerContentSchema);
registry.register('FooterContent', footerContentSchema);
registry.register('LegalContent', legalContentSchema);
registry.register('GlobalContentType', globalContentTypeSchema);

// Global content response
export const globalContentResponseSchema = z.object({
  id: z.string().uuid(),
  content_type: globalContentTypeSchema,
  content: z.unknown(),
  version: z.number(),
  is_published: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

registry.register('GlobalContentResponse', globalContentResponseSchema);

// ============================================================
// WEBHOOK SCHEMAS
// ============================================================

registry.register('Apex27WebhookPayload', apex27WebhookSchema);

// Webhook response
export const webhookResponseSchema = z.object({
  received: z.boolean(),
  processed: z.boolean(),
  message: z.string().optional(),
});

registry.register('WebhookResponse', webhookResponseSchema);

// ============================================================
// SECURITY SCHEMES
// ============================================================

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase JWT access token',
});

registry.registerComponent('securitySchemes', 'webhookSignature', {
  type: 'apiKey',
  in: 'header',
  name: 'X-Webhook-Signature',
  description: 'HMAC-SHA256 signature for webhook verification',
});
