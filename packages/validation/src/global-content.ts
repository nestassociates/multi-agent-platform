import { z } from 'zod';

/**
 * Navigation link schema (used in header and footer)
 */
const navigationLinkSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be at most 50 characters'),
  href: z.string().min(1, 'Href is required'),
});

/**
 * Header content validation schema
 */
export const headerContentSchema = z.object({
  logo: z.object({
    url: z.string().url('Must be a valid URL'),
    alt: z.string().min(1, 'Alt text is required').max(100, 'Alt text must be at most 100 characters'),
  }),
  navigation: z.array(navigationLinkSchema).max(10, 'Maximum 10 navigation items'),
  cta: z.object({
    label: z.string().min(1, 'CTA label is required').max(30, 'CTA label must be at most 30 characters'),
    href: z.string().min(1, 'CTA href is required'),
  }).nullable(),
});

export type HeaderContent = z.infer<typeof headerContentSchema>;

/**
 * Footer column schema
 */
const footerColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title must be at most 50 characters'),
  links: z.array(navigationLinkSchema).max(10, 'Maximum 10 links per column'),
});

/**
 * Social media platform enum
 */
const socialPlatformSchema = z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube']);

/**
 * Social media link schema
 */
const socialLinkSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().url('Must be a valid URL'),
});

/**
 * Footer content validation schema
 */
export const footerContentSchema = z.object({
  columns: z.array(footerColumnSchema).max(4, 'Maximum 4 footer columns'),
  contact: z.object({
    email: z.string().email('Must be a valid email').optional(),
    phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
    address: z.string().max(200, 'Address must be at most 200 characters').optional(),
  }),
  social: z.array(socialLinkSchema).max(6, 'Maximum 6 social links'),
  copyright: z.string().min(1, 'Copyright text is required').max(200, 'Copyright must be at most 200 characters'),
});

export type FooterContent = z.infer<typeof footerContentSchema>;

/**
 * Legal page content validation schema (privacy, terms, cookies)
 */
export const legalContentSchema = z.object({
  html: z.string().min(1, 'Content is required'),
});

export type LegalContent = z.infer<typeof legalContentSchema>;

/**
 * Valid global content types
 */
export const globalContentTypes = [
  'header',
  'footer',
  'privacy_policy',
  'terms_of_service',
  'cookie_policy',
] as const;

export type GlobalContentType = typeof globalContentTypes[number];

/**
 * Global content type schema
 */
export const globalContentTypeSchema = z.enum(globalContentTypes);

/**
 * Get the appropriate schema for a content type
 */
export function getContentSchema(type: GlobalContentType): z.ZodSchema {
  switch (type) {
    case 'header':
      return headerContentSchema;
    case 'footer':
      return footerContentSchema;
    case 'privacy_policy':
    case 'terms_of_service':
    case 'cookie_policy':
      return legalContentSchema;
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
}

/**
 * Update global content request schema
 */
export const updateGlobalContentSchema = z.object({
  content: z.unknown(), // Validated separately based on content type
});

export type UpdateGlobalContentInput = z.infer<typeof updateGlobalContentSchema>;
