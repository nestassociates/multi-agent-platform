import { z } from 'zod';

/**
 * Content Validation Schemas
 */

// Content type enum
export const contentTypeSchema = z.enum(['blog_post', 'area_guide', 'review', 'fee_structure']);

// Content status enum
export const contentStatusSchema = z.enum(['draft', 'pending_review', 'approved', 'rejected', 'published']);

// Slug generation (URL-friendly)
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug too long')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// Create content schema
export const createContentSchema = z.object({
  content_type: contentTypeSchema,
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  slug: slugSchema.optional(), // Auto-generated if not provided
  content_body: z.string().min(1, 'Content body is required'),
  excerpt: z.string().max(250, 'Excerpt must be at most 250 characters').optional(),
  featured_image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  seo_meta_title: z.string().max(60, 'SEO title must be at most 60 characters').optional(),
  seo_meta_description: z.string().max(160, 'SEO description must be at most 160 characters').optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;

// Update content schema
export const updateContentSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  slug: slugSchema.optional(),
  content_body: z.string().min(1).optional(),
  excerpt: z.string().max(250).optional(),
  featured_image_url: z.string().url().optional(),
  seo_meta_title: z.string().max(60).optional(),
  seo_meta_description: z.string().max(160).optional(),
  status: z.enum(['draft', 'pending_review']).optional(), // Agents can only set these statuses
});

export type UpdateContentInput = z.infer<typeof updateContentSchema>;

// Reject content schema
export const rejectContentSchema = z.object({
  rejection_reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500, 'Rejection reason too long'),
});

export type RejectContentInput = z.infer<typeof rejectContentSchema>;

// Bulk approve content schema
export const bulkApproveContentSchema = z.object({
  content_ids: z.array(z.string().uuid('Invalid content ID')).min(1, 'At least one content ID required'),
});

export type BulkApproveContentInput = z.infer<typeof bulkApproveContentSchema>;

// Image upload validation schema
export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  bucket: z.enum(['content-images', 'avatars']).default('content-images'),
  content_type: z.enum(['blog-posts', 'area-guides', 'reviews', 'fee-structures']).optional(),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;

// Validate featured_image_url is from Supabase Storage
export const contentImageUrlSchema = z.string().url().refine(
  (url) => {
    // Allow empty string or valid Supabase Storage URL
    if (!url) return true;
    return url.includes('supabase.co/storage/v1/object/public/content-images/') ||
           url.includes('supabase.co/storage/v1/object/public/avatars/');
  },
  { message: 'Image must be hosted in Supabase Storage (content-images or avatars bucket)' }
).optional();

export type ContentImageUrl = z.infer<typeof contentImageUrlSchema>;
