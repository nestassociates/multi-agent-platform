import { z } from 'zod';

/**
 * Fee Structure Validation Schemas
 * Feature: 005-separate-reviews-fees
 * Uses TipTap rich text editor for flexible fee presentation
 */

export const feeStructureSchema = z.object({
  content_body: z.string().min(1, 'Fee structure content is required'),
});

export type FeeStructure = z.infer<typeof feeStructureSchema>;
