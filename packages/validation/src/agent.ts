import { z } from 'zod';
import { emailSchema, passwordSchema } from './auth';

/**
 * Agent Validation Schemas
 */

// Social media links schema
export const socialMediaLinksSchema = z.object({
  facebook: z.string().url('Invalid Facebook URL').or(z.literal('')).optional(),
  twitter: z.string().url('Invalid Twitter URL').or(z.literal('')).optional(),
  linkedin: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  instagram: z.string().url('Invalid Instagram URL').or(z.literal('')).optional(),
}).optional();

export type SocialMediaLinksInput = z.infer<typeof socialMediaLinksSchema>;

// Subdomain validation (lowercase letters, numbers, hyphens only)
export const subdomainSchema = z
  .string()
  .min(3, 'Subdomain must be at least 3 characters')
  .max(63, 'Subdomain must be at most 63 characters')
  .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
  .regex(/^[a-z0-9]/, 'Subdomain must start with a letter or number')
  .regex(/[a-z0-9]$/, 'Subdomain must end with a letter or number');

// Create agent schema
export const createAgentSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phone: z.string().regex(/^[0-9\s\-\+\(\)]+$/, 'Invalid phone number format').optional(),
  subdomain: subdomainSchema,
  apex27_branch_id: z.string().optional(),
  bio: z.string().max(5000, 'Bio must be at most 5000 characters').optional(),
  qualifications: z.array(z.string()).default([]),
  social_media_links: socialMediaLinksSchema,
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

// Agent status schema (T009)
export const agentStatusSchema = z.enum([
  'draft',
  'pending_profile',
  'pending_admin',
  'active',
  'inactive',
  'suspended'
]);

export type AgentStatusType = z.infer<typeof agentStatusSchema>;

// Update agent schema
export const updateAgentSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^[0-9\s\-\+\(\)]+$/).optional(),
  bio: z.string().max(5000).optional(),
  qualifications: z.array(z.string()).optional(),
  social_media_links: socialMediaLinksSchema,
  status: agentStatusSchema.optional(),
});

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

// Agent profile update schema (agent self-editing)
export const updateAgentProfileSchema = z.object({
  phone: z.string().regex(/^[0-9\s\-\+\(\)]+$/).optional(),
  bio: z.string().max(5000).optional(),
  qualifications: z.array(z.string()).optional(),
  social_media_links: socialMediaLinksSchema,
  avatar_url: z.string().url().optional(),
});

export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;

// Activation request schema (T010)
export const activateAgentSchema = z.object({
  reason: z.string().optional(),
});

export type ActivateAgentInput = z.infer<typeof activateAgentSchema>;

// Deactivation request schema (T010)
export const deactivateAgentSchema = z.object({
  reason: z.string().min(10, 'Deactivation reason must be at least 10 characters'),
});

export type DeactivateAgentInput = z.infer<typeof deactivateAgentSchema>;

// Checklist update schema (T011)
export const updateChecklistSchema = z.object({
  field: z.enum(['user_created', 'welcome_email_sent', 'admin_approved']),
  value: z.boolean(),
});

export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
